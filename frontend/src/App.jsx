import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'

// Páginas do Show do Trilhão
import Home from './pages/Home'
import Login from './pages/Login'
import Ranking from './pages/Ranking'
import Jogo from './pages/Jogo'
import Apresentador from './pages/Apresentador'
import NotFound from './pages/NotFound'

import './App.css'

function App() {
  return (
    <Routes>
      {/* Layout Compartilhado (com Navbar e Rodapé) */}
      <Route element={<Layout />}>
        {/* Rotas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/jogo" element={<Jogo />} />
        <Route path="/jogo/:id" element={<Jogo />} />

        {/* Rotas Protegidas (Exigem autenticação ou perfil específico) */}
        <Route element={<PrivateRoute requiredRole="ROLE_APRESENTADOR" />}>
          <Route path="/apresentador" element={<Apresentador />} />
        </Route>

        {/* Rota 404 / Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
