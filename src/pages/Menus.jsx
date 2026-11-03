import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/auth'
import { fmt, macrosPorcion, sumarMacros } from '../lib/nutricion'
import SelectorAlimento from '../components/SelectorAlimento'
import InputGramos from '../components/InputGramos'
import { useConsulta } from '../lib/useConsulta'

const consultaMenus = () =>
  supabase
    .from('menus')
    .select('*, detalle_menu(*, alimentos(*))')
    .order('nombre')
    .order('id', { referencedTable: 'detalle_menu' })

export default function Menus() {
  const { user } = useAuth()
  const { data: menus, recargar: cargar } = useConsulta(consultaMenus)
  const [error, setError] = useState('')
  const [nuevo, setNuevo] = useState('')

  async function ejecutar(promesa) {
    const { error: err } = await promesa
    setError(err ? err.message : '')
    cargar()
  }

  function crear(e) {
    e.preventDefault()
    if (!nuevo.trim()) return
    ejecutar(supabase.from('menus').insert({ user_id: user.id, nombre: nuevo.trim() }))
    setNuevo('')
  }

  return (
    <div>
      <div className="tarjeta">
        <div className="cabecera-pagina">
          <h2>Mis Menús</h2>
        </div>
        <p className="ayuda">
          Plantillas reutilizables. Desde el diario puedes cargarlas en cualquier comida o guardar una comida como menú.
        </p>
        <form className="filtros" onSubmit={crear}>
          <input className="buscador" placeholder="Nombre del nuevo menú" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
          <button className="btn btn-verde">⊕ Crear menú</button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
      {menus === null && <p className="cargando">Cargando…</p>}
      {menus?.length === 0 && <p className="vacio tarjeta">Todavía no hay menús.</p>}
      {menus?.map((m) => (
        <Menu key={m.id} menu={m} ejecutar={ejecutar} />
      ))}
    </div>
  )
}

function Menu({ menu, ejecutar }) {
  const [nombre, setNombre] = useState(menu.nombre)
  const [anadiendo, setAnadiendo] = useState(false)
  const porciones = menu.detalle_menu.map((d) => ({ d, m: macrosPorcion(d.alimentos, d.gramos) }))
  const total = sumarMacros(porciones.map((p) => p.m))

  function renombrar() {
    const n = nombre.trim()
    if (!n) return setNombre(menu.nombre)
    if (n !== menu.nombre) ejecutar(supabase.from('menus').update({ nombre: n }).eq('id', menu.id))
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar el menú «${menu.nombre}»?`)) return
    ejecutar(supabase.from('menus').delete().eq('id', menu.id))
  }

  return (
    <section className="comida tarjeta">
      <div className="comida-cabecera">
        <input
          className="comida-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={renombrar}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className="comida-kcal">{fmt(total.kcal, 0)} kcal</span>
        <div className="botonera">
          <button className="btn btn-celeste" onClick={() => setAnadiendo(true)}>
            ⊕ Añadir Alimento
          </button>
          <button className="btn btn-rojo" onClick={eliminar} aria-label="Eliminar menú">
            🗑
          </button>
        </div>
      </div>
      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Gramos</th>
              <th>Kcal</th>
              <th>Proteínas</th>
              <th>Carbohidratos</th>
              <th>Grasas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {porciones.map(({ d, m }) => (
              <tr key={d.id}>
                <td>{d.alimentos?.name}</td>
                <td>
                  <InputGramos
                    valor={d.gramos}
                    onCambio={(g) => ejecutar(supabase.from('detalle_menu').update({ gramos: g }).eq('id', d.id))}
                  />
                </td>
                <td>{fmt(m.kcal)}</td>
                <td>{fmt(m.proteina)}</td>
                <td>{fmt(m.carbohidratos)}</td>
                <td>{fmt(m.grasa)}</td>
                <td>
                  <button
                    className="btn-circulo rojo"
                    onClick={() => ejecutar(supabase.from('detalle_menu').delete().eq('id', d.id))}
                    aria-label="Quitar"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {porciones.length === 0 && (
              <tr>
                <td colSpan="7" className="vacio">
                  Menú vacío.
                </td>
              </tr>
            )}
          </tbody>
          {porciones.length > 0 && (
            <tfoot>
              <tr>
                <th>Total</th>
                <th />
                <th>{fmt(total.kcal)}</th>
                <th>{fmt(total.proteina)}</th>
                <th>{fmt(total.carbohidratos)}</th>
                <th>{fmt(total.grasa)}</th>
                <th />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {anadiendo && (
        <SelectorAlimento
          onClose={() => setAnadiendo(false)}
          onSelect={(a, gramos) => {
            setAnadiendo(false)
            ejecutar(supabase.from('detalle_menu').insert({ menu_id: menu.id, alimento_id: a.id, gramos }))
          }}
        />
      )}
    </section>
  )
}
