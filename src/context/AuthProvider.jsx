import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { calcularMetas } from '../lib/nutricion'
import { useConsulta } from '../lib/useConsulta'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  // undefined = todavía comprobando la sesión
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null
  const userId = user?.id ?? null

  const consultaPerfil = useCallback(
    () => supabase.from('perfiles').select('*').eq('id', userId).maybeSingle(),
    [userId],
  )
  const { data: perfil, listo: perfilCargado, recargar: cargarPerfil } = useConsulta(userId ? consultaPerfil : null)

  const valor = useMemo(
    () => ({
      session,
      user,
      perfil,
      perfilCargado,
      metas: perfil ? calcularMetas(perfil) : null,
      cargarPerfil,
      salir: () => supabase.auth.signOut(),
    }),
    [session, user, perfil, perfilCargado, cargarPerfil],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
