import { useCallback, useEffect, useState } from 'react'

// Ejecuta una consulta de Supabase (función memoizada que devuelve { data, error })
// cada vez que cambia o se llama a recargar(). Ignora respuestas de consultas antiguas.
export function useConsulta(consulta) {
  const [estado, setEstado] = useState({ consulta: null, data: null, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!consulta) return
    let activo = true
    Promise.resolve(consulta()).then(({ data, error }) => {
      if (error) console.error(error)
      if (activo) setEstado({ consulta, data: data ?? null, error: error ?? null })
    })
    return () => {
      activo = false
    }
  }, [consulta, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const vigente = !!consulta && estado.consulta === consulta
  return { data: vigente ? estado.data : null, error: vigente ? estado.error : null, listo: vigente, recargar }
}
