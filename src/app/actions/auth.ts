'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: (formData.get('email') as string)?.trim(),
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    redirect('/login?error=' + encodeURIComponent('Por favor ingresa tu correo y contraseña.'))
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Error al iniciar sesión:', error.message)
    redirect('/login?error=' + encodeURIComponent(error.message || 'Credenciales incorrectas'))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/register?error=' + encodeURIComponent('Por favor ingresa tu correo y contraseña.'))
  }

  // 1. Intentar el registro estándar con Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    console.warn('Registro estándar falló o requiere SMTP, intentando vía Admin:', signUpError.message)
    
    // 2. Si falla (por ejemplo, Supabase en VPS sin servidor de correo SMTP para confirmación),
    // creamos el usuario directamente como auto-confirmado usando el Service Role
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (adminError) {
      console.error('Error al crear usuario vía Admin:', adminError.message)
      redirect('/register?error=' + encodeURIComponent(adminError.message || signUpError.message))
    }

    // 3. Iniciar sesión inmediatamente con las credenciales recién creadas
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      redirect('/login?message=' + encodeURIComponent('Cuenta creada con éxito. Inicia sesión con tus datos.'))
    }
  } else {
    // Si la cuenta se creó pero no se inició sesión automáticamente (ej. requiere confirmación email)
    if (!signUpData.session && signUpData.user?.id) {
      // Confirmamos el email vía admin para VPS sin SMTP y logueamos
      try {
        await supabaseAdmin.auth.admin.updateUserById(signUpData.user.id, {
          email_confirm: true,
        })
        await supabase.auth.signInWithPassword({ email, password })
      } catch (err) {
        console.warn('No se pudo autoconfirmar el usuario:', err)
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
