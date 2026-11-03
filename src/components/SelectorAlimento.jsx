import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { fmt, macrosPorcion } from '../lib/nutricion'
import Modal from './Modal'
import AlimentoModal from './AlimentoModal'

// Busca en el catálogo (global + propio) y pide los gramos de la porción.
export default function SelectorAlimento({ onClose, onSelect, titulo = 'Seleccionar Alimento' }) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [elegido, setElegido] = useState(null)
  const [gramos, setGramos] = useState('100')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      setBuscando(true)
      let consulta = supabase.from('alimentos').select('*').order('name').limit(40)
      const texto = q.trim()
      if (texto) consulta = consulta.ilike('name', `%${texto.replace(/[%_]/g, '\\$&')}%`)
      const { data, error } = await consulta
      if (error) console.error(error)
      setResultados(data ?? [])
      setBuscando(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  function confirmar(e) {
    e.preventDefault()
    if (!elegido || !(Number(gramos) > 0)) return
    onSelect(elegido, Number(gramos))
  }

  const porcion = elegido ? macrosPorcion(elegido, gramos) : null

  if (creando) {
    return (
      <AlimentoModal
        onClose={() => setCreando(false)}
        onGuardado={(a) => {
          setElegido(a)
          setGramos(String(a.total_weight || 100))
        }}
      />
    )
  }

  return (
    <Modal titulo={titulo} onClose={onClose}>
      {!elegido ? (
        <>
          <input
            className="buscador"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar alimento…"
          />
          <ul className="lista-busqueda">
            {resultados.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setElegido(a)
                    setGramos(String(a.total_weight || 100))
                  }}
                >
                  <span>
                    {a.name}
                    {a.user_id && <span className="etiqueta">propio</span>}
                  </span>
                  <small>
                    {fmt(macrosPorcion(a, 100).kcal, 0)} kcal/100 g
                  </small>
                </button>
              </li>
            ))}
            {!buscando && resultados.length === 0 && <li className="vacio">Sin resultados.</li>}
          </ul>
          <button type="button" className="btn btn-verde-claro" onClick={() => setCreando(true)}>
            ⊕ Crear alimento nuevo
          </button>
        </>
      ) : (
        <form onSubmit={confirmar}>
          <p>
            <b>{elegido.name}</b>{' '}
            <button type="button" className="link" onClick={() => setElegido(null)}>
              cambiar
            </button>
          </p>
          <label className="campo">
            <span>Cantidad</span>
            <div className="input-sufijo">
              <input autoFocus type="number" step="any" min="0" value={gramos} onChange={(e) => setGramos(e.target.value)} />
              <span>gr</span>
            </div>
          </label>
          <p className="resumen-porcion">
            {fmt(porcion.kcal, 0)} kcal · P {fmt(porcion.proteina, 1)} g · C {fmt(porcion.carbohidratos, 1)} g · G{' '}
            {fmt(porcion.grasa, 1)} g
          </p>
          <div className="acciones-derecha">
            <button className="btn btn-verde">⊕ Añadir</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
