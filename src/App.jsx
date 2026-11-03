import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/auth'
import Login from './pages/Login'
import Diario from './pages/Diario'
import Perfil from './pages/Perfil'
import Alimentos from './pages/Alimentos'
import Menus from './pages/Menus'

export default function App() {
  const { session, user, salir } = useAuth()

  if (session === undefined) return <p className="cargando">Cargando…</p>
  if (!session) return <Login />

  return (
    <>
      <header className="cabecera no-print">
        <span className="marca">Dieta</span>
        <nav>
          <NavLink to="/" end>
            Diario
          </NavLink>
          <NavLink to="/perfil">Perfil</NavLink>
          <NavLink to="/alimentos">Alimentos</NavLink>
          <NavLink to="/menus">Menús</NavLink>
        </nav>
        <span className="usuario">
          <span className="email">{user.email}</span>
          <button className="btn btn-borde" onClick={salir}>
            Salir
          </button>
        </span>
      </header>
      <main className="contenido">
        <Routes>
          <Route path="/" element={<Diario />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/alimentos" element={<Alimentos />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
