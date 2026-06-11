"use server"

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database';
import { XMLParser } from 'fast-xml-parser';

// Usamos el Service Role en el servidor temporalmente para saltar el RLS
const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadXML(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo." };
    }

    if (!file.name.toLowerCase().endsWith('.xml')) {
      return { success: false, error: "El archivo debe ser un XML válido." };
    }

    // 1. Leer y Parsear el XML
    const xmlText = await file.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const xmlObj = parser.parse(xmlText);
    
    // Validar que sea un CFDI
    const comprobante = xmlObj['cfdi:Comprobante'];
    if (!comprobante) {
      return { success: false, error: "El archivo no tiene el formato CFDI válido." };
    }

    const emisor = comprobante['cfdi:Emisor'];
    if (!emisor) {
      return { success: false, error: "El CFDI no contiene nodo de Emisor." };
    }

    const rfc_emisor = emisor['@_Rfc'] || 'DESCONOCIDO';
    const nombre_emisor = emisor['@_Nombre'] || 'Proveedor Desconocido';
    const fecha = comprobante['@_Fecha'] || new Date().toISOString();
    const total = parseFloat(comprobante['@_Total'] || '0');
    const subtotal = parseFloat(comprobante['@_SubTotal'] || '0');
    
    let iva = 0;
    if (comprobante['cfdi:Impuestos'] && comprobante['cfdi:Impuestos']['@_TotalImpuestosTrasladados']) {
      iva = parseFloat(comprobante['cfdi:Impuestos']['@_TotalImpuestosTrasladados']);
    }

    // EXTRAER CONCEPTOS (PRODUCTOS/SERVICIOS)
    let invoiceItems: any[] = [];
    if (comprobante['cfdi:Conceptos'] && comprobante['cfdi:Conceptos']['cfdi:Concepto']) {
      const conceptos = comprobante['cfdi:Conceptos']['cfdi:Concepto'];
      const conceptosArray = Array.isArray(conceptos) ? conceptos : [conceptos];
      
      invoiceItems = conceptosArray.map((c: any) => ({
        descripcion: c['@_Descripcion'] || 'Sin descripción',
        cantidad: parseFloat(c['@_Cantidad'] || '1'),
        valor_unitario: parseFloat(c['@_ValorUnitario'] || '0'),
        importe: parseFloat(c['@_Importe'] || '0')
      }));
    }

    // 2. Subir al Storage de Supabase
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: storageError } = await supabaseAdmin
      .storage
      .from('facturas')
      .upload(fileName, file, {
        contentType: 'application/xml',
        upsert: false
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      return { success: false, error: "Error al subir el archivo al servidor." };
    }

    // 3. Determinar categoría automáticamente
    let categoryName = 'Otros';
    const lowerName = nombre_emisor.toLowerCase();
    
    if (lowerName.includes('wal') || lowerName.includes('soriana') || lowerName.includes('chedraui') || lowerName.includes('costco') || lowerName.includes('oxxo') || lowerName.includes('super')) {
      categoryName = 'Súper y Despensa';
    } else if (lowerName.includes('gas') || lowerName.includes('estacion') || lowerName.includes('pemex') || lowerName.includes('bp') || lowerName.includes('servicio')) {
      categoryName = 'Gasolina y Transporte';
    } else if (lowerName.includes('cfe') || lowerName.includes('telmex') || lowerName.includes('agua') || lowerName.includes('internet') || lowerName.includes('att') || lowerName.includes('telcel')) {
      categoryName = 'Servicios (Luz, Agua, Internet)';
    } else if (lowerName.includes('farmacia') || lowerName.includes('hospital') || lowerName.includes('salud') || lowerName.includes('medico')) {
      categoryName = 'Salud y Farmacia';
    } else if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('starbucks') || lowerName.includes('pizza') || lowerName.includes('taco')) {
      categoryName = 'Restaurantes y Comida';
    }

    // Buscar el ID de la categoría
    const { data: categoryData } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    const category_id = (categoryData as any)?.id || null;

    // 4. Insertar registro real en la base de datos ligado al usuario autenticado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }
    
    const userId = user.id;
    
    // EVITAR DUPLICADOS: Buscar si ya existe una factura idéntica
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('rfc_emisor', rfc_emisor)
      .eq('fecha', fecha)
      .eq('total', total)
      .single();

    if (existingInvoice) {
      return { success: true, message: 'Esta factura ya había sido registrada anteriormente.' };
    }

    const { error: dbError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        rfc_emisor, 
        nombre_emisor,
        fecha,
        total,
        subtotal,
        iva,
        category_id,
        items: invoiceItems,
        status: 'Vigente'
      } as any);

    if (dbError) {
      console.error("Database Error:", dbError);
      return { success: false, error: "El archivo se subió pero falló el registro en base de datos." };
    }

    return { success: true, message: 'Factura procesada con éxito.' };

  } catch (error: any) {
    console.error('Action Error:', error);
    return { success: false, error: 'Ocurrió un error inesperado al procesar el archivo.' };
  }
}
