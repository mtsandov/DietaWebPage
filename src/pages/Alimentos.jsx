import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/auth'
import { fmt, macrosPorcion } from '../lib/nutricion'
import { useConsulta } from '../lib/useConsulta'
import AlimentoModal from '../components/AlimentoModal'

const consultaAlimentos = () => supabase.from('alimentos').select('*').order('name')

export default function Alimentos() {
  const { user } = useAuth()
  const { data: lista, recargar: cargar } = useConsulta(consultaAlimentos)
  const [filtro, setFiltro] = useState('')
  const [soloPropios, setSoloPropios] = useState(true)
  const [editando, setEditando] = useState(null) // null | 'nuevo' | alimento
  const [error, setError] = useState('')

  async function eliminar(a) {
    if (!window.confirm(`¿Eliminar «${a.name}»? También se borrará de tus registros diarios y menús.`)) return
    const { error: err } = await supabase.from('alimentos').delete().eq('id', a.id)
    if (err) setError(err.message)
    cargar()
  }

  const texto = filtro.trim().toLowerCase()
  const visibles = (lista ?? []).filter(
    (a) => (!soloPropios || a.user_id === user.id) && (!texto || a.name.toLowerCase().includes(texto)),
  )

  return (
    <div className="tarjeta">
      <div className="cabecera-pagina">
        <h2>{soloPropios ? 'Mis Productos' : 'Catálogo de alimentos'}</h2>
        <button className="btn btn-verde" onClick={() => setEditando('nuevo')}>
          ⊕ Alimento Nuevo
        </button>
      </div>
      <div className="filtros">
        <input className="buscador" placeholder="Buscar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={soloPropios} onChange={(e) => setSoloPropios(e.target.checked)} /> Solo los míos
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      {lista === null ? (
        <p className="cargando">Cargando…</p>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Kcal</th>
                <th>Proteína</th>
                <th>Carbohidratos</th>
                <th>Grasa</th>
                <th>Kcal / 100 g</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibles.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.name}
                    {a.comments && <div className="ayuda">{a.comments}</div>}
                  </td>
                  <td>{fmt(a.total_weight, 0)} gr</td>
                  <td>{fmt(a.calories, 1)}</td>
                  <td>{fmt(a.protein, 1)}</td>
                  <td>{fmt(a.carb, 1)}</td>
                  <td>{fmt(a.fat, 1)}</td>
                  <td>{fmt(macrosPorcion(a, 100).kcal, 0)}</td>
                  <td className="celda-acciones">
                    {a.user_id === user.id ? (
                      <>
                        <button className="btn-circulo" onClick={() => setEditando(a)} aria-label="Editar">
                          ✎
                        </button>
                        <button className="btn-circulo rojo" onClick={() => eliminar(a)} aria-label="Eliminar">
                          🗑
                        </button>
                      </>
                    ) : (
                      <span className="etiqueta">global</span>
                    )}
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan="8" className="vacio">
                    {soloPropios ? 'Todavía no has creado alimentos propios.' : 'Sin resultados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {editando && (
        <AlimentoModal alimento={editando === 'nuevo' ? null : editando} onClose={() => setEditando(null)} onGuardado={cargar} />
      )}
    </div>
  )
}
