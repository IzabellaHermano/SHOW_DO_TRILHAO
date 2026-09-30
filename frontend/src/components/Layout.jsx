import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-cptm-tag">
            <span>CPTM</span> • Companhia Paulista de Trens Metropolitanos
          </div>
          <p>Show do Trilhão • O Game Show nos Trilhos de São Paulo</p>
        </div>
      </footer>
    </div>
  )
}
