'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fallback temporal en memoria por si el usuario aún no corre el script SQL
let mockConnectionState: {
  connected: boolean;
  rfc: string;
  method: 'ciec' | 'efirma';
  lastSync: string | null;
} = {
  connected: false,
  rfc: '',
  method: 'ciec',
  lastSync: null
};

/**
 * Obtiene el estado actual de la conexión al SAT.
 */
export async function getSATConnection() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado', data: null };
    }

    const { data, error } = await supabase
      .from('sat_connections' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      // Si la tabla no existe en la BD (error 42P01), caemos en el fallback en memoria para desarrollo
      if (error.code === '42P01') {
        console.warn('La tabla sat_connections no existe. Usando fallback en memoria.');
        return { 
          success: true, 
          data: mockConnectionState.connected ? {
            rfc: mockConnectionState.rfc,
            method: mockConnectionState.method,
            last_sync: mockConnectionState.lastSync,
            status: 'connected',
            needs_migration: true
          } : null
        };
      }
      throw error;
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error al obtener conexión del SAT:', err);
    return { success: false, error: err.message || 'Error al obtener el estado de conexión' };
  }
}

/**
 * Conecta al SAT usando CIEC o e.firma (Simulado)
 */
export async function connectSAT(data: {
  rfc: string;
  method: 'ciec' | 'efirma';
  password?: string;
  cerName?: string;
  keyName?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const rfcUpper = data.rfc.trim().toUpperCase();

    // 1. Guardar el RFC en el perfil del usuario para clasificar las facturas correctamente
    await (supabaseAdmin.from('users') as any)
      .update({ rfc: rfcUpper })
      .eq('id', user.id);

    // 2. Intentar guardar en la tabla sat_connections de la BD
    const { error } = await (supabase.from('sat_connections' as any) as any)
      .upsert({
        user_id: user.id,
        rfc: rfcUpper,
        method: data.method,
        status: 'connected',
        last_sync: null
      });

    if (error) {
      // Fallback si la tabla no existe en desarrollo
      if (error.code === '42P01') {
        mockConnectionState = {
          connected: true,
          rfc: rfcUpper,
          method: data.method,
          lastSync: null
        };
        
        // Trigger de sincronización inicial en memoria
        await syncSAT();
        
        revalidatePath('/settings');
        revalidatePath('/');
        return { 
          success: true, 
          message: 'Conectado con éxito (modo desarrollo sin migración de BD)',
          needs_migration: true
        };
      }
      throw error;
    }

    // 3. Lanzar sincronización inicial para descargar facturas de prueba
    await syncSAT();

    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true, message: 'Conexión establecida con éxito e importación inicial completada' };
  } catch (err: any) {
    console.error('Error al conectar SAT:', err);
    return { success: false, error: err.message || 'Error al establecer conexión con el SAT' };
  }
}

/**
 * Desconecta al SAT y remueve las credenciales.
 */
export async function disconnectSAT() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { error } = await (supabase.from('sat_connections' as any) as any)
      .delete()
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '42P01') {
        mockConnectionState = {
          connected: false,
          rfc: '',
          method: 'ciec',
          lastSync: null
        };
        revalidatePath('/settings');
        revalidatePath('/');
        return { success: true };
      }
      throw error;
    }

    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error al desconectar SAT:', err);
    return { success: false, error: err.message || 'Error al desconectar del SAT' };
  }
}

/**
 * Sincroniza y descarga facturas simuladas del SAT para poblar la aplicación.
 */
export async function syncSAT() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // --- LIMPIEZA DE DUPLICADOS EXISTENTES ---
    const { data: userInvoices } = await supabase
      .from('invoices')
      .select('id, rfc_emisor, fecha, total')
      .eq('user_id', user.id);

    if (userInvoices && userInvoices.length > 0) {
      const groups: { [key: string]: string[] } = {};
      userInvoices.forEach((inv: any) => {
        const fechaStr = new Date(inv.fecha).toISOString();
        const key = `${inv.rfc_emisor}_${fechaStr}_${inv.total}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(inv.id);
      });

      for (const key of Object.keys(groups)) {
        const ids = groups[key];
        if (ids.length > 1) {
          const idsToDelete = ids.slice(1);
          await supabaseAdmin
            .from('invoices')
            .delete()
            .in('id', idsToDelete);
        }
      }
    }

    // Obtener el RFC conectado
    let rfc = '';
    let isDbConnection = true;

    const { data: conn, error: connError } = await supabase
      .from('sat_connections' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (connError && connError.code === '42P01') {
      rfc = mockConnectionState.rfc || 'RFC123456789';
      isDbConnection = false;
    } else if (conn) {
      rfc = (conn as any).rfc;
    } else {
      // No conectado
      return { success: false, error: 'No hay ninguna conexión al SAT activa' };
    }

    // 1. Obtener IDs de categorías para asignar facturas realistas
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('*');

    const getCategoryId = (name: string) => {
      return (categories as any[])?.find((c: any) => c.name === name)?.id || null;
    };

    // 2. Generar facturas de prueba (simulando CFDI 4.0 descargados del SAT)
    const mockInvoicesList = [
      {
        rfc_emisor: 'CFE3708145D0',
        nombre_emisor: 'CFE SUMINISTRADOR DE SERVICIOS BASICOS',
        rfc_receptor: rfc,
        nombre_receptor: 'USUARIO FACTURACONTROL',
        invoice_type: 'egreso',
        fecha: '2026-06-10T14:30:00Z',
        total: 1254.00,
        subtotal: 1081.03,
        iva: 172.97,
        category_id: getCategoryId('Servicios (Luz, Agua, Internet)'),
        items: [{ descripcion: 'CONSUMO DE ENERGIA ELECTRICA PERIODO ACTUAL', cantidad: 1, valor_unitario: 1081.03, importe: 1081.03 }],
        status: 'Vigente'
      },
      {
        rfc_emisor: 'SHE900214MX2',
        nombre_emisor: 'SERVICIOS HIDROCARBUROS DE MEXICO S.A. DE C.V.',
        rfc_receptor: rfc,
        nombre_receptor: 'USUARIO FACTURACONTROL',
        invoice_type: 'egreso',
        fecha: '2026-06-12T09:15:00Z',
        total: 850.00,
        subtotal: 735.30,
        iva: 114.70,
        category_id: getCategoryId('Gasolina y Transporte'),
        items: [{ descripcion: 'MAGNA SIN ADITIVOS DISPENSARIO 4', cantidad: 35.5, valor_unitario: 20.71, importe: 735.30 }],
        status: 'Vigente'
      },
      {
        rfc_emisor: 'EMP980112S88',
        nombre_emisor: 'EMPLEADORES TECNOLOGICOS DE MEXICO S.A. DE C.V.',
        rfc_receptor: rfc,
        nombre_receptor: 'USUARIO FACTURACONTROL',
        invoice_type: 'nomina',
        fecha: '2026-06-08T08:00:00Z',
        total: 24500.00,
        subtotal: 24500.00,
        iva: 0.00,
        category_id: null,
        items: [{ descripcion: 'PAGO DE NOMINA QUINCENAL CORRESPONDIENTE', cantidad: 1, valor_unitario: 24500.00, importe: 24500.00 }],
        status: 'Vigente'
      }
    ];

    // Insertar cada factura si no existe ya en la BD del usuario
    for (const inv of mockInvoicesList) {
      // Comprobar si ya existe
      const { data: existing } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .eq('rfc_emisor', inv.rfc_emisor)
        .eq('fecha', inv.fecha)
        .eq('total', inv.total)
        .maybeSingle();

      if (!existing) {
        await supabaseAdmin
          .from('invoices')
          .insert({
            user_id: user.id,
            ...inv
          } as any);
      }
    }

    // 3. Actualizar la última fecha de sincronización
    const nowString = new Date().toISOString();
    if (isDbConnection) {
      await (supabase.from('sat_connections' as any) as any)
        .update({ last_sync: nowString })
        .eq('user_id', user.id);
    } else {
      mockConnectionState.lastSync = nowString;
    }

    revalidatePath('/settings');
    revalidatePath('/wallets');
    revalidatePath('/invoices');
    revalidatePath('/');

    return { success: true, lastSync: nowString };
  } catch (err: any) {
    console.error('Error al sincronizar SAT:', err);
    return { success: false, error: err.message || 'Error al descargar facturas del SAT' };
  }
}
