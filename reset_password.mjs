import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Leer .env.local manualmente
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1]?.trim();
    }
    if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceRoleKey = trimmed.split('=')[1]?.trim();
    }
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log(`
🔑 USO DEL SCRIPT DE RESTABLECIMIENTO DE CONTRASEÑA:
node reset_password.mjs <correo> <nueva_contraseña>

Ejemplo:
node reset_password.mjs usuario@correo.com MiNuevaClave123!
`);
  process.exit(0);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log(`📡 URL Supabase activa: ${supabaseUrl}`);
  console.log(`🔍 Buscando cuenta asociada a: ${email}...`);
  
  try {
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error al conectar con Supabase Auth:', listError.message);
      process.exit(1);
    }

    const targetUser = usersData?.users?.find(u => u.email?.toLowerCase() === email);

    if (!targetUser) {
      console.error(`❌ No se encontró ninguna cuenta con el correo: ${email}`);
      process.exit(1);
    }

    console.log(`🔄 Restableciendo contraseña para usuario ID: ${targetUser.id}...`);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
      password: newPassword,
      email_confirm: true
    });

    if (updateError) {
      console.error('❌ Error al actualizar contraseña:', updateError.message);
      process.exit(1);
    }

    console.log(`✅ ¡ÉXITO! La contraseña para ${email} ha sido actualizada correctamente.`);
    console.log(`🔑 Ahora puedes iniciar sesión con tu nueva contraseña.`);
  } catch (err) {
    console.error('❌ Error de red / Fetch Failed:', err);
  }
}

run();
