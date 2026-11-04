import { useCallback, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/auth'
import { fmt } from '../lib/nutricion'
import { useConsulta } from '../lib/useConsulta'
import Modal from './Modal'

const VASO_POR_DEFECTO = 250
const BOTELLA_ML = 500

function leerVaso() {
  try {
    return Number(localStorage.getItem('dieta.vasoMl')) || VASO_POR_DEFECTO
  } catch {
    return VASO_POR_DEFECTO
  }
}

function guardarVaso(ml) {
  try {
    localStorage.setItem('dieta.vasoMl', String(ml))
  } catch {
    // sin almacenamiento local: se usa el valor por defecto la próxima vez
  }
}

const litros = (ml) => fmt(ml / 1000, 2)

export default function AguaCard({ fecha, metas }) {
  const { user } = useAuth()
  const [vasoMl, setVasoMl] = useState(leerVaso)
  const [modal, setModal] = useState(false)
  const [verTomas, setVerTomas] = useState(false)
  const [error, setError] = useState('')

  const consulta = useCallback(
    () => supabase.from('registro_agua').select('*').eq('user_id', user.id).eq('fecha', fecha).order('created_at'),
    [fecha, user.id],
  )
  const { data, error: errorCarga, recargar } = useConsulta(consulta)
  const tomas = data ?? []

  const consumido = tomas.reduce((t, r) => t + Number(r.ml), 0)
  const meta = metas?.agua ?? 0
  const pct = meta > 0 ? (consumido / meta) * 100 : 0

  async function ejecutar(promesa) {
    const { error: err } = await promesa
    setError(err ? err.message : '')
    recargar()
  }

  const anadir = (ml) => ejecutar(supabase.from('registro_agua').insert({ user_id: user.id, fecha, ml }))
  const quitar = (id) => ejecutar(supabase.from('registro_agua').delete().eq('id', id))

  const mensajeError = error || errorCarga?.message
  const faltaTabla = /registro_agua/.test(mensajeError ?? '')

  return (
    <section className="tarjeta agua">
      <div className="agua-cabecera">
        <h3>💧 Agua</h3>
        {metas && (
          <span className="ayuda" title="Meta = el mayor entre 1 ml por kcal objetivo y 35 ml por kg de peso">
            Meta según {metas.aguaCriterio === 'kcal' ? 'tus calorías objetivo (1 ml/kcal)' : 'tu peso (35 ml/kg)'}
          </span>
        )}
      </div>

      <div className="agua-cuerpo">
        <div className="agua-vaso" aria-hidden="true">
          <div className="agua-nivel" style={{ height: `${Math.min(pct, 100)}%` }} />
          <span>{pct >= 100 ? '✓' : `${fmt(pct, 0)}%`}</span>
        </div>

        <div className="agua-datos">
          <div className="agua-cifra">
            <b>{litros(consumido)}</b> / {meta ? litros(meta) : '—'} L
          </div>
          <div className="ayuda">
            {fmt(consumido / vasoMl, 1)} vasos de {vasoMl} ml
            {meta > consumido && ` · faltan ${fmt((meta - consumido) / vasoMl, 1)} vasos`}
          </div>
          <div className="agua-barra">
            <div style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="botonera no-print">
            <button className="btn btn-celeste" onClick={() => anadir(vasoMl)}>
              + 1 vaso
            </button>
            <button className="btn btn-celeste" onClick={() => anadir(BOTELLA_ML)}>
              + Botella {BOTELLA_ML} ml
            </button>
            <button className="btn btn-azul-oscuro" onClick={() => setModal(true)}>
              Registrar agua
            </button>
            {tomas.length > 0 && (
              <button className="link" onClick={() => setVerTomas((v) => !v)}>
                {verTomas ? 'Ocultar' : `Ver ${tomas.length} registros`}
              </button>
            )}
          </div>
        </div>
      </div>

      {mensajeError && (
        <div className="error">
          {mensajeError}
          {faltaTabla && ' — ¿Ejecutaste supabase/005_registro_agua.sql?'}
        </div>
      )}

      {verTomas && (
        <ul className="agua-tomas">
          {tomas.map((t) => (
            <li key={t.id}>
              <span>{new Date(t.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>{fmt(t.ml, 0)} ml</span>
              <button className="btn-circulo rojo no-print" onClick={() => quitar(t.id)} aria-label="Quitar">
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <RegistrarAgua
          vasoMl={vasoMl}
          onCambiarVaso={(ml) => {
            setVasoMl(ml)
            guardarVaso(ml)
          }}
          onClose={() => setModal(false)}
          onGuardar={(ml) => {
            setModal(false)
            anadir(ml)
          }}
        />
      )}
    </section>
  )
}

function RegistrarAgua({ vasoMl, onCambiarVaso, onClose, onGuardar }) {
  const [cantidad, setCantidad] = useState('1')
  const [unidad, setUnidad] = useState('vasos')
  const [tamVaso, setTamVaso] = useState(String(vasoMl))

  const factor = { vasos: Number(tamVaso) || 0, ml: 1, l: 1000 }[unidad]
  const ml = (Number(cantidad) || 0) * factor

  function guardar(e) {
    e.preventDefault()
    if (!(ml > 0)) return
    if (unidad === 'vasos' && Number(tamVaso) !== vasoMl) onCambiarVaso(Number(tamVaso))
    onGuardar(Math.round(ml))
  }

  return (
    <Modal titulo="Registrar agua" onClose={onClose} ancho={420}>
      <form onSubmit={guardar}>
        <div className="form-grid">
          <label className="campo">
            <span>Cantidad</span>
            <input autoFocus type="number" step="any" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </label>
          <label className="campo">
            <span>Unidad</span>
            <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
              <option value="vasos">Vasos</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="l">Litros (L)</option>
            </select>
          </label>
          {unidad === 'vasos' && (
            <label className="campo span-2">
              <span>Tamaño del vaso</span>
              <div className="input-sufijo">
                <input type="number" step="any" min="1" value={tamVaso} onChange={(e) => setTamVaso(e.target.value)} />
                <span>ml</span>
              </div>
            </label>
          )}
        </div>
        <p className="resumen-porcion">= {fmt(ml, 0)} ml</p>
        <div className="acciones-derecha">
          <button className="btn btn-verde">⊕ Añadir</button>
        </div>
      </form>
    </Modal>
  )
}
