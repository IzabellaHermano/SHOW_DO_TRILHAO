import { Link } from 'react-router-dom'
import { AlertCircle, Home, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="card notfound-card">
        <div className="notfound-icon">
          <AlertCircle size={56} />
        </div>
        <h1 className="notfound-code">404</h1>
        <h2 className="notfound-title">Estação Não Encontrada!</h2>
        <p className="notfound-desc">
          Parece que o trem pegou o desvio errado ou esta linha ainda não existe no mapa do Show do Trilhão.
        </p>

        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary btn-lg">
            <Home size={18} />
            <span>Voltar para o Início</span>
          </Link>
          <Link to="/ranking" className="btn btn-outline btn-lg">
            <Compass size={18} />
            <span>Explorar Ranking</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
