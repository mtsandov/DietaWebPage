import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/auth'
import { KCAL, fmt, macrosPorcion, repartoEnergia } from '../lib/nutricion'
import Modal from './Modal'

const VACIO = { name: '', total_weight: '100', protein: '', carb: '', fat: '', calories: '', comments: '' }

// Crear o editar un alimento propio. Los macros se refieren a "Cantidad" gramos.
export default function AlimentoModal({ alimento, onClose, onGuardado }) {
  const { user } = useAuth()
  const [form, setForm] = useState(() =>
    alimento
      ? Object.fromEntries(Object.keys(VACIO).map((k) => [k, alimento[k] ?? '']))
      : VACIO,
  )
  const [detalles, setDetalles] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const kcalEstimadas =
    (Number(form.protein) || 0) * KCAL.proteina +
    (Number(form.carb) || 0) * KCAL.carbohidratos +
    (Number(form.fat) || 0) * KCAL.grasa

  const vista = {
    ...form,
    calories: form.calories === '' ? kcalEstimadas : form.calories,
  }
  const por100 = macrosPorcion(vista, 100)
  const reparto = repartoEnergia(por100)

  async function guardar(e) {
    e.preventDefault()
    setError('')
    if (!(Number(form.total_weight) > 0)) return setError('La cantidad debe ser mayor que 0.')
    setGuardando(true)
    const fila = {
      name: form.name.trim(),
      total_weight: Number(form.total_weight),
      protein: Number(form.protein) || 0,
      carb: Number(form.carb) || 0,
      fat: Number(form.fat) || 0,
      calories: form.calories === '' ? Math.round(kcalEstimadas * 10) / 10 : Number(form.calories),
      comments: form.comments.trim() || null,
    }
    const consulta = alimento
      ? supabase.from('alimentos').update(fila).eq('id', alimento.id)
      : supabase.from('alimentos').insert({ ...fila, user_id: user.id })
    const { data, error: err } = await consulta.select().single()
    setGuardando(false)
    if (err) return setError(err.message)
    onGuardado?.(data)
    onClose()
  }

  return (
    <Modal titulo={alimento ? 'Editar Alimento' : 'Crear Alimento'} onClose={onClose}>
      <form onSubmit={guardar} className="form-grid">
        <label className="campo">
          <span className="req">Nombre</span>
          <input required value={form.name} onChange={set('name')} placeholder="Nombre" autoFocus />
        </label>
        <label className="campo">
          <span className="req">Cantidad</span>
          <div className="input-sufijo">
            <input required type="number" step="any" min="0" value={form.total_weight} onChange={set('total_weight')} />
            <span>gr</span>
          </div>
        </label>
        <label className="campo">
          <span className="req">Proteína</span>
          <input required type="number" step="any" min="0" value={form.protein} onChange={set('protein')} placeholder="Proteína (gr)" />
        </label>
        <label className="campo">
          <span className="req">Carbohidratos</span>
          <input required type="number" step="any" min="0" value={form.carb} onChange={set('carb')} placeholder="Carbohidratos (gr)" />
        </label>
        <label className="campo">
          <span className="req">Grasa</span>
          <input required type="number" step="any" min="0" value={form.fat} onChange={set('fat')} placeholder="Grasa (gr)" />
        </label>
        <label className="campo">
          <span>Calorías</span>
          <input
            type="number"
            step="any"
            min="0"
            value={form.calories}
            onChange={set('calories')}
            placeholder={`≈ ${fmt(kcalEstimadas, 0)} (auto)`}
          />
        </label>
        <label className="campo span-2">
          <span>Comentarios</span>
          <textarea rows="2" value={form.comments} onChange={set('comments')} placeholder="Comentarios" />
        </label>

        <div className="span-2">
          <button type="button" className="barra-desplegable" onClick={() => setDetalles((d) => !d)}>
            {detalles ? '▾' : '▸'} Detalles Nutricionales
          </button>
          {detalles && (
            <div className="detalles">
              <div>
                Por 100 g: <b>{fmt(por100.kcal, 0)} kcal</b> · P {fmt(por100.proteina, 1)} g · C{' '}
                {fmt(por100.carbohidratos, 1)} g · G {fmt(por100.grasa, 1)} g
              </div>
              <div>
                Energía: proteína {fmt(reparto.proteina, 1)}% · carbohidratos {fmt(reparto.carbohidratos, 1)}% · grasa{' '}
                {fmt(reparto.grasa, 1)}%
              </div>
              {form.calories !== '' && Math.abs(Number(form.calories) - kcalEstimadas) > kcalEstimadas * 0.15 + 5 && (
                <div className="aviso">
                  Las calorías indicadas difieren de las calculadas por macros (≈ {fmt(kcalEstimadas, 0)} kcal).
                </div>
              )}
            </div>
          )}
        </div>

        {error && <div className="error span-2">{error}</div>}
        <div className="span-2 acciones-derecha">
          <button className="btn btn-verde" disabled={guardando}>
            {guardando ? 'Guardando…' : '⊕ Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
