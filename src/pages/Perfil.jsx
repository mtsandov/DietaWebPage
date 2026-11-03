import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/auth'
import { ACTIVIDADES, FORMULAS, KCAL, OBJETIVOS, TIPOS_DIETA, calcularMetas, fmt } from '../lib/nutricion'
import GrasaVisual from '../components/GrasaVisual'

const POR_DEFECTO = {
  genero: 'hombre',
  edad: '',
  peso_kg: '',
  altura_cm: '',
  grasa_corporal: '',
  indice_actividad: 'moderado',
  objetivo: 'ganar_musculo',
  formula: 'katch',
  deficit_pct: '15',
  excedente_pct: '15',
  tipo_dieta: 'estandar',
  proteina_gkg: '2',
  grasa_gkg: '0.75',
}

const NUMERICOS = ['edad', 'peso_kg', 'altura_cm', 'grasa_corporal', 'deficit_pct', 'excedente_pct', 'proteina_gkg', 'grasa_gkg']

export default function Perfil() {
  const { perfil, perfilCargado, user } = useAuth()
  if (!perfilCargado) return <p className="cargando">Cargando perfil…</p>
  return <FormPerfil key={user.id} inicial={perfil} />
}

function FormPerfil({ inicial }) {
  const { user, cargarPerfil } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    const f = { ...POR_DEFECTO }
    for (const k of Object.keys(f)) if (inicial?.[k] !== null && inicial?.[k] !== undefined) f[k] = String(inicial[k])
    return f
  })
  const [verGrasa, setVerGrasa] = useState(false)
  const [estado, setEstado] = useState(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const onCampo = (k) => (e) => set(k, e.target.value)

  function elegirDieta(valor) {
    const t = TIPOS_DIETA.find((d) => d.value === valor)
    setForm((f) => ({
      ...f,
      tipo_dieta: valor,
      ...(t?.proteina ? { proteina_gkg: String(t.proteina), grasa_gkg: String(t.grasa) } : {}),
    }))
  }

  function editarGkg(k, v) {
    setForm((f) => ({ ...f, [k]: v, tipo_dieta: 'personalizada' }))
  }

  const m = calcularMetas(form)

  async function guardar(e) {
    e.preventDefault()
    setEstado({ tipo: 'info', texto: 'Guardando…' })
    const fila = { id: user.id }
    for (const [k, v] of Object.entries(form)) fila[k] = NUMERICOS.includes(k) ? (v === '' ? null : Number(v)) : v
    const { error } = await supabase.from('perfiles').upsert(fila)
    if (error) {
      const faltaColumna = /column|columna/i.test(error.message)
      return setEstado({
        tipo: 'error',
        texto: faltaColumna
          ? `${error.message}. ¿Ejecutaste supabase/002_perfil_metas.sql?`
          : error.message,
      })
    }
    await cargarPerfil()
    setEstado({ tipo: 'exito', texto: 'Perfil guardado.' })
  }

  return (
    <form onSubmit={guardar}>
      <div className="tarjeta calculadora">
        <section>
          <h3>Datos personales</h3>
          <Fila etiqueta="Género">
            <select value={form.genero} onChange={onCampo('genero')}>
              <option value="hombre">HOMBRE</option>
              <option value="mujer">MUJER</option>
            </select>
          </Fila>
          <Fila etiqueta="Edad">
            <input type="number" min="10" max="110" required value={form.edad} onChange={onCampo('edad')} />
          </Fila>
          <Fila etiqueta="Peso (kg)">
            <input type="number" step="any" min="20" required value={form.peso_kg} onChange={onCampo('peso_kg')} />
          </Fila>
          <Fila etiqueta="Altura (cm)">
            <input type="number" step="any" min="100" required value={form.altura_cm} onChange={onCampo('altura_cm')} />
          </Fila>
          <Fila etiqueta="Grasa corporal (%)" info="Necesaria para Katch-McArdle y para calcular masa magra.">
            <div className="input-boton">
              <input type="number" step="any" min="3" max="70" value={form.grasa_corporal} onChange={onCampo('grasa_corporal')} />
              <button type="button" onClick={() => setVerGrasa(true)} title="Estimar visualmente">
                👁
              </button>
            </div>
          </Fila>
          <Fila etiqueta="Fórmula">
            <select value={form.formula} onChange={onCampo('formula')}>
              {FORMULAS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Fila>
        </section>

        <section>
          <h3>Actividad y objetivo</h3>
          <Fila etiqueta="Índice de actividad">
            <select value={form.indice_actividad} onChange={onCampo('indice_actividad')}>
              {ACTIVIDADES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label} (×{String(a.factor).replace('.', ',')})
                </option>
              ))}
            </select>
          </Fila>
          <Dato etiqueta="Índice de masa corporal" valor={m ? fmt(m.imc, 1) : '—'} />
          <Dato etiqueta="Masa corporal magra (kg)" valor={m?.masaMagra != null ? fmt(m.masaMagra, 1) : '—'} />
          <Dato etiqueta="Índice de masa corporal magra" valor={m?.ffmi != null ? fmt(m.ffmi, 1) : '—'} />
          <Dato etiqueta="Metabolismo basal (TMB)" valor={m ? `${fmt(m.tmb, 0)} kcal` : '—'} />
          <Dato etiqueta="Mantenimiento" valor={m ? `${fmt(m.mantenimiento, 0)} kcal` : '—'} />
          <Fila etiqueta="Objetivo">
            <select value={form.objetivo} onChange={onCampo('objetivo')}>
              {OBJETIVOS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label.toUpperCase()}
                </option>
              ))}
            </select>
          </Fila>
          <Fila etiqueta="Déficit" info="Porcentaje que se resta al mantenimiento al perder grasa.">
            <div className="input-sufijo">
              <input type="number" step="any" min="0" max="50" value={form.deficit_pct} onChange={onCampo('deficit_pct')} disabled={form.objetivo !== 'perder_grasa'} />
              <span>%</span>
            </div>
          </Fila>
          <Fila etiqueta="Excedente" info="Porcentaje que se suma al mantenimiento al ganar musculatura.">
            <div className="input-sufijo">
              <input type="number" step="any" min="0" max="50" value={form.excedente_pct} onChange={onCampo('excedente_pct')} disabled={form.objetivo !== 'ganar_musculo'} />
              <span>%</span>
            </div>
          </Fila>
        </section>

        <section>
          <h3>Macronutrientes</h3>
          <Fila etiqueta="Tipo de dieta">
            <select value={form.tipo_dieta} onChange={(e) => elegirDieta(e.target.value)}>
              {TIPOS_DIETA.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label.toUpperCase()}
                </option>
              ))}
            </select>
          </Fila>
          <table className="tabla tabla-macros">
            <thead>
              <tr>
                <th>Nutrientes</th>
                <th>(g/kg)</th>
                <th>Kcal</th>
                <th>Gr</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Proteínas</td>
                <td>
                  <input type="number" step="0.05" min="0" value={form.proteina_gkg} onChange={(e) => editarGkg('proteina_gkg', e.target.value)} />
                </td>
                <td>{m ? fmt(m.proteina * KCAL.proteina, 0) : '—'}</td>
                <td>{m ? fmt(m.proteina, 0) : '—'}</td>
              </tr>
              <tr>
                <td>Carbs</td>
                <td className="calculado">{m ? fmt(m.carbGkg, 2) : '—'}</td>
                <td>{m ? fmt(m.carbohidratos * KCAL.carbohidratos, 0) : '—'}</td>
                <td>{m ? fmt(m.carbohidratos, 0) : '—'}</td>
              </tr>
              <tr>
                <td>Grasa</td>
                <td>
                  <input type="number" step="0.05" min="0" value={form.grasa_gkg} onChange={(e) => editarGkg('grasa_gkg', e.target.value)} />
                </td>
                <td>{m ? fmt(m.grasa * KCAL.grasa, 0) : '—'}</td>
                <td>{m ? fmt(m.grasa, 0) : '—'}</td>
              </tr>
            </tbody>
          </table>
          <p className="ayuda">
            g/kg sobre {m?.baseEsMagra ? 'masa magra' : 'peso total'}
            {m ? ` (${fmt(m.baseKg, 1)} kg)` : ''}. Los carbohidratos completan las calorías restantes.
          </p>
          {m && form.formula === 'katch' && m.formulaUsada !== 'katch' && (
            <p className="aviso">Sin % de grasa se usa Mifflin-St Jeor en lugar de Katch-McArdle.</p>
          )}
        </section>
      </div>

      <div className="banda-objetivo">OBJETIVO: {m ? `${fmt(m.calorias, 0)} kcal` : '—'}</div>

      <div className="acciones-derecha">
        {estado && <span className={estado.tipo}>{estado.texto}</span>}
        <button className="btn btn-verde">Guardar perfil</button>
        {estado?.tipo === 'exito' && (
          <button type="button" className="btn btn-azul" onClick={() => navigate('/')}>
            Ir al diario →
          </button>
        )}
      </div>

      {verGrasa && (
        <GrasaVisual
          genero={form.genero}
          actual={form.grasa_corporal}
          onElegir={(v) => set('grasa_corporal', String(v))}
          onClose={() => setVerGrasa(false)}
        />
      )}
    </form>
  )
}

function Fila({ etiqueta, info, children }) {
  return (
    <label className="fila">
      <span>
        {etiqueta}
        {info && (
          <span className="info" title={info}>
            ⓘ
          </span>
        )}
        :
      </span>
      {children}
    </label>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="fila dato">
      <span>{etiqueta}</span>
      <b>{valor}</b>
    </div>
  )
}
