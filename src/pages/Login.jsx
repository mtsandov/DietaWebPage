import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setMensaje(null)
    setCargando(true)
    const { data, error } =
      modo === 'entrar'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.href.split('#')[0] },
          })
    setCargando(false)
    if (error) return setMensaje({ tipo: 'error', texto: error.message })
    if (modo === 'registro' && !data.session) {
      setMensaje({ tipo: 'ok', texto: 'Revisa tu correo para confirmar la cuenta.' })
    }
  }

  return (
    <div className="login">
      <form className="tarjeta login-caja" onSubmit={enviar}>
        <h1>Dieta</h1>
        <p className="ayuda">Calculadora de macros y registro nutricional</p>
        <div className="pestanas">
          <button type="button" className={modo === 'entrar' ? 'activa' : ''} onClick={() => setModo('entrar')}>
            Entrar
          </button>
          <button type="button" className={modo === 'registro' ? 'activa' : ''} onClick={() => setModo('registro')}>
            Crear cuenta
          </button>
        </div>
        <label className="campo">
          <span>Correo</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mensaje && <div className={mensaje.tipo === 'error' ? 'error' : 'exito'}>{mensaje.texto}</div>}
        <button className="btn btn-morado ancho" disabled={cargando}>
          {cargando ? '…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
