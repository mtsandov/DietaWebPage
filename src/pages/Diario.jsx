import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/auth'
import { fmt, macrosPorcion, repartoEnergia, sumarMacros } from '../lib/nutricion'
import { formatoFecha, hoyISO, sumarDias } from '../lib/fechas'
import { useConsulta } from '../lib/useConsulta'
import { PanelAnillos } from '../components/Anillo'
import SelectorAlimento from '../components/SelectorAlimento'
import InputGramos from '../components/InputGramos'
import AlimentoModal from '../components/AlimentoModal'
import Modal from '../components/Modal'

const ORDEN_COMIDAS = ['desayuno', 'media mañana', 'almuerzo', 'comida', 'merienda', 'cena', 'post entreno']
const NOMBRES_SUGERIDOS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']

const posicion = (nombre) => {
  const i = ORDEN_COMIDAS.indexOf(nombre.trim().toLowerCase())
  return i === -1 ? ORDEN_COMIDAS.length : i
}

export default function Diario() {
  const { user, metas, perfilCargado } = useAuth()
  const [fecha, setFecha] = useState(hoyISO)
  const [extras, setExtras] = useState({ fecha: null, nombres: [] })
  const [error, setError] = useState('')
  const [nuevoAlimento, setNuevoAlimento] = useState(false)

  const consulta = useCallback(
    () =>
      supabase
        .from('registro_diario')
        .select('*, alimentos(*)')
        .eq('user_id', user.id)
        .eq('fecha', fecha)
        .order('created_at'),
    [fecha, user.id],
  )
  const { data, listo, error: errorCarga, recargar } = useConsulta(consulta)
  const filas = useMemo(() => data ?? [], [data])
  const nombresExtra = useMemo(() => (extras.fecha === fecha ? extras.nombres : []), [extras, fecha])

  const comidas = useMemo(() => {
    const mapa = new Map()
    for (const r of filas) {
      if (!mapa.has(r.tipo_comida)) mapa.set(r.tipo_comida, [])
      mapa.get(r.tipo_comida).push(r)
    }
    for (const n of nombresExtra) if (!mapa.has(n)) mapa.set(n, [])
    return [...mapa.entries()].sort((a, b) => posicion(a[0]) - posicion(b[0]))
  }, [filas, nombresExtra])

  const totalDia = useMemo(() => sumarMacros(filas.map((r) => macrosPorcion(r.alimentos, r.gramos))), [filas])

  const setNombresExtra = (fn) =>
    setExtras((e) => ({ fecha, nombres: fn(e.fecha === fecha ? e.nombres : []) }))

  function anadirComida() {
    const usados = new Set(comidas.map(([n]) => n.toLowerCase()))
    let nombre = NOMBRES_SUGERIDOS.find((n) => !usados.has(n.toLowerCase()))
    for (let i = comidas.length + 1; !nombre; i++) if (!usados.has(`comida ${i}`)) nombre = `Comida ${i}`
    setNombresExtra((ns) => [...ns, nombre])
  }

  async function ejecutar(promesa) {
    const { error: err } = await promesa
    setError(err ? err.message : '')
    recargar()
    return !err
  }

  const acciones = {
    anadir: (comida, alimento, gramos) =>
      ejecutar(
        supabase.from('registro_diario').insert({ user_id: user.id, alimento_id: alimento.id, fecha, gramos, tipo_comida: comida }),
      ),
    cambiarGramos: (id, gramos) => ejecutar(supabase.from('registro_diario').update({ gramos }).eq('id', id)),
    quitar: (id) => ejecutar(supabase.from('registro_diario').delete().eq('id', id)),
    renombrar: async (anterior, nuevo) => {
      setNombresExtra((ns) => ns.map((n) => (n === anterior ? nuevo : n)))
      if (filas.some((r) => r.tipo_comida === anterior)) {
        await ejecutar(
          supabase
            .from('registro_diario')
            .update({ tipo_comida: nuevo })
            .eq('user_id', user.id)
            .eq('fecha', fecha)
            .eq('tipo_comida', anterior),
        )
      }
    },
    eliminarComida: async (nombre) => {
      setNombresExtra((ns) => ns.filter((n) => n !== nombre))
      if (filas.some((r) => r.tipo_comida === nombre)) {
        await ejecutar(
          supabase.from('registro_diario').delete().eq('user_id', user.id).eq('fecha', fecha).eq('tipo_comida', nombre),
        )
      }
    },
    cargarMenu: async (comida, menu) => {
      if (!menu.detalle_menu.length) return
      await ejecutar(
        supabase.from('registro_diario').insert(
          menu.detalle_menu.map((d) => ({
            user_id: user.id,
            alimento_id: d.alimento_id,
            fecha,
            gramos: d.gramos,
            tipo_comida: comida,
          })),
        ),
      )
    },
  }

  return (
    <div>
      {perfilCargado && !metas && (
        <div className="aviso tarjeta">
          Completa tu <Link to="/perfil">perfil</Link> para calcular tus metas diarias.
        </div>
      )}
      {metas && <div className="banda-objetivo">OBJETIVO: {fmt(metas.calorias, 0)} kcal</div>}
      <PanelAnillos totales={totalDia} metas={metas} />

      <div className="navegador-fecha">
        <button className="btn-circulo no-print" onClick={() => setFecha((f) => sumarDias(f, -1))} aria-label="Día anterior">
          ‹
        </button>
        <label className="fecha-titulo">
          {formatoFecha(fecha)}
          <input type="date" className="no-print" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
        </label>
        <button className="btn-circulo no-print" onClick={() => setFecha((f) => sumarDias(f, 1))} aria-label="Día siguiente">
          ›
        </button>
      </div>

      {(error || errorCarga) && <div className="error tarjeta">{error || errorCarga.message}</div>}

      <div className="barra-comidas">
        <h2>Comidas</h2>
        <div className="botonera no-print">
          <button className="btn btn-verde" onClick={anadirComida}>
            ⊕ Añadir Comida
          </button>
          <button className="btn btn-azul-oscuro" onClick={() => window.print()}>
            Descargar PDF
          </button>
          <Link className="btn btn-azul-oscuro" to="/alimentos">
            Mis Productos
          </Link>
          <button className="btn btn-verde" onClick={() => setNuevoAlimento(true)}>
            Alimento Nuevo
          </button>
        </div>
      </div>

      {comidas.length === 0 && listo && (
        <p className="vacio tarjeta">Sin comidas registradas este día. Pulsa «Añadir Comida».</p>
      )}

      {comidas.map(([nombre, items]) => (
        <Comida key={nombre} nombre={nombre} items={items} acciones={acciones} userId={user.id} />
      ))}

      {filas.length > 0 && <TablaTotalDia total={totalDia} />}

      {nuevoAlimento && <AlimentoModal onClose={() => setNuevoAlimento(false)} />}
    </div>
  )
}

function Comida({ nombre, items, acciones, userId }) {
  const [abierta, setAbierta] = useState(true)
  const [titulo, setTitulo] = useState(nombre)
  const [modal, setModal] = useState(null) // 'alimento' | 'guardarMenu' | 'cargarMenu'

  const porciones = items.map((r) => ({ r, m: macrosPorcion(r.alimentos, r.gramos) }))
  const total = sumarMacros(porciones.map((p) => p.m))
  const reparto = repartoEnergia(total)

  function confirmarTitulo() {
    const nuevo = titulo.trim()
    if (!nuevo) return setTitulo(nombre)
    if (nuevo !== nombre) acciones.renombrar(nombre, nuevo)
  }

  function eliminar() {
    if (items.length && !window.confirm(`¿Eliminar «${nombre}» y sus ${items.length} alimentos?`)) return
    acciones.eliminarComida(nombre)
  }

  return (
    <section className="comida tarjeta">
      <div className="comida-cabecera">
        <button className="btn-icono claro" onClick={() => setAbierta((a) => !a)} aria-label={abierta ? 'Contraer' : 'Expandir'}>
          {abierta ? '▾' : '▸'}
        </button>
        <input
          className="comida-nombre"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={confirmarTitulo}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className="comida-kcal">{fmt(total.kcal, 0)} kcal</span>
        <div className="botonera no-print">
          <button className="btn btn-celeste" onClick={() => setModal('alimento')}>
            ⊕ Añadir Alimento
          </button>
          <button className="btn btn-azul-oscuro" onClick={() => setModal('cargarMenu')} title="Cargar un menú guardado">
            Cargar menú
          </button>
          {items.length > 0 && (
            <button className="btn btn-azul-oscuro" onClick={() => setModal('guardarMenu')} title="Guardar como plantilla">
              Guardar menú
            </button>
          )}
          <button className="btn btn-rojo" onClick={eliminar} aria-label="Eliminar comida">
            🗑
          </button>
        </div>
      </div>

      {abierta && (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad - Unidad</th>
                <th>Kcal</th>
                <th>Proteínas</th>
                <th>Carbohidratos</th>
                <th>Grasas</th>
                <th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {porciones.map(({ r, m }) => (
                <tr key={r.id}>
                  <td>{r.alimentos?.name ?? '—'}</td>
                  <td>
                    <InputGramos valor={r.gramos} onCambio={(g) => acciones.cambiarGramos(r.id, g)} />
                  </td>
                  <td>{fmt(m.kcal)}</td>
                  <td>{fmt(m.proteina)}</td>
                  <td>{fmt(m.carbohidratos)}</td>
                  <td>{fmt(m.grasa)}</td>
                  <td className="no-print">
                    <button className="btn-circulo rojo" onClick={() => acciones.quitar(r.id)} aria-label="Quitar">
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="7" className="vacio">
                    Sin alimentos todavía.
                  </td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th />
                  <th>{fmt(total.kcal)}</th>
                  <th>{fmt(total.proteina)}</th>
                  <th>{fmt(total.carbohidratos)}</th>
                  <th>{fmt(total.grasa)}</th>
                  <th className="no-print" />
                </tr>
                <tr>
                  <th>Energía %</th>
                  <th />
                  <th />
                  <th>{fmt(reparto.proteina)}%</th>
                  <th>{fmt(reparto.carbohidratos)}%</th>
                  <th>{fmt(reparto.grasa)}%</th>
                  <th className="no-print" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {modal === 'alimento' && (
        <SelectorAlimento
          onClose={() => setModal(null)}
          onSelect={async (alimento, gramos) => {
            setModal(null)
            await acciones.anadir(nombre, alimento, gramos)
          }}
        />
      )}
      {modal === 'guardarMenu' && (
        <GuardarMenu items={items} sugerido={nombre} userId={userId} onClose={() => setModal(null)} />
      )}
      {modal === 'cargarMenu' && (
        <CargarMenu
          onClose={() => setModal(null)}
          onElegir={async (menu) => {
            setModal(null)
            await acciones.cargarMenu(nombre, menu)
          }}
        />
      )}
    </section>
  )
}

function TablaTotalDia({ total }) {
  const reparto = repartoEnergia(total)
  return (
    <div className="tarjeta total-dia">
      <b>Total del día:</b> {fmt(total.kcal, 0)} kcal · Proteínas {fmt(total.proteina, 1)} g ({fmt(reparto.proteina, 1)}%) ·
      Carbohidratos {fmt(total.carbohidratos, 1)} g ({fmt(reparto.carbohidratos, 1)}%) · Grasas {fmt(total.grasa, 1)} g (
      {fmt(reparto.grasa, 1)}%)
    </div>
  )
}

function GuardarMenu({ items, sugerido, userId, onClose }) {
  const [nombre, setNombre] = useState(sugerido)
  const [estado, setEstado] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    setEstado({ tipo: 'info', texto: 'Guardando…' })
    const { data: menu, error } = await supabase.from('menus').insert({ user_id: userId, nombre: nombre.trim() }).select().single()
    if (error) return setEstado({ tipo: 'error', texto: error.message })
    const { error: err2 } = await supabase
      .from('detalle_menu')
      .insert(items.map((r) => ({ menu_id: menu.id, alimento_id: r.alimento_id, gramos: r.gramos })))
    if (err2) return setEstado({ tipo: 'error', texto: err2.message })
    onClose()
  }

  return (
    <Modal titulo="Guardar como menú" onClose={onClose}>
      <form onSubmit={guardar}>
        <label className="campo">
          <span>Nombre del menú</span>
          <input autoFocus required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <p className="ayuda">Se guardarán {items.length} alimentos con sus gramos actuales.</p>
        {estado && <div className={estado.tipo}>{estado.texto}</div>}
        <div className="acciones-derecha">
          <button className="btn btn-verde">Guardar</button>
        </div>
      </form>
    </Modal>
  )
}

const consultaMenus = () => supabase.from('menus').select('*, detalle_menu(*, alimentos(*))').order('nombre')

function CargarMenu({ onClose, onElegir }) {
  const { data: menus } = useConsulta(consultaMenus)

  return (
    <Modal titulo="Cargar menú" onClose={onClose}>
      {menus === null && <p className="cargando">Cargando…</p>}
      {menus?.length === 0 && (
        <p className="vacio">
          Aún no tienes menús. Usa «Guardar menú» en una comida o ve a <Link to="/menus">Menús</Link>.
        </p>
      )}
      <ul className="lista-busqueda">
        {menus?.map((m) => {
          const t = sumarMacros(m.detalle_menu.map((d) => macrosPorcion(d.alimentos, d.gramos)))
          return (
            <li key={m.id}>
              <button type="button" onClick={() => onElegir(m)}>
                <span>{m.nombre}</span>
                <small>
                  {m.detalle_menu.length} alimentos · {fmt(t.kcal, 0)} kcal
                </small>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
