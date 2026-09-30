import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/api'
import { LogIn, UserPlus, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'
import gameLogo from '../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [isRegister, setIsRegister] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState('ROLE_JOGADOR')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setCarregando(true)

    try {
      if (isRegister) {
        const response = await authService.cadastro(nome, email, senha, role)
        login(response.token, {
          id: response.id,
          nome: response.nome,
          email: response.email,
          role: response.role,
        })
        setSucesso('Conta criada com sucesso! Redirecionando aos trilhos...')
      } else {
        const response = await authService.login(email, senha)
        login(response.token, {
          id: response.id,
          nome: response.nome,
          email: response.email,
          role: response.role,
        })
        setSucesso('Login efetuado com sucesso!')
      }

      setTimeout(() => {
        navigate(from, { replace: true })
      }, 500)
    } catch (err) {
      const msg =
        err.response?.data?.mensagem ||
        err.response?.data?.message ||
        'Não foi possível conectar ao servidor. Você pode usar os botões de demonstração abaixo para testar o jogo!'
      setErro(msg)
    } finally {
      setCarregando(false)
    }
  }

  // Atalho de demonstração
  const handleEntrarComoDemo = (demoRole = 'ROLE_JOGADOR') => {
    login('token_demo_jwt_123', {
      id: 999,
      nome: demoRole === 'ROLE_APRESENTADOR' ? 'Apresentador Oficial' : 'Passageiro Convidado',
      email: demoRole === 'ROLE_APRESENTADOR' ? 'apresentador@cptm.sp.gov.br' : 'jogador@teste.com',
      role: demoRole,
    })
    navigate(from, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <img src={gameLogo} alt="Show do Trilhão" className="auth-logo" />
          </div>
          <h1 className="auth-title">
            {isRegister ? 'Criar Nova Conta' : 'Acesse sua Conta'}
          </h1>
          <p className="auth-subtitle">
            {isRegister
              ? 'Cadastre-se para disputar prêmios e entrar no ranking oficial'
              : 'Entre no vagão e continue sua jornada rumo ao Trilhão'}
          </p>
        </div>

        {/* Alternador de Abas */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegister}
            className={`tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false)
              setErro('')
              setSucesso('')
            }}
          >
            <LogIn size={16} />
            <span>Login</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegister}
            className={`tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true)
              setErro('')
              setSucesso('')
            }}
          >
            <UserPlus size={16} />
            <span>Cadastrar</span>
          </button>
        </div>

        {erro && (
          <div className="alert alert-danger" role="alert">
            <ShieldAlert size={20} />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="alert alert-success" role="status">
            <CheckCircle2 size={20} />
            <span>{sucesso}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label htmlFor="nome">Nome Completo:</label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="input-field"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail Corporativo ou Pessoal:</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha de Acesso:</label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="role">Tipo de Perfil na Estação:</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
              >
                <option value="ROLE_JOGADOR">Passageiro / Jogador</option>
                <option value="ROLE_APRESENTADOR">Apresentador de Sala CPTM</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="btn btn-primary btn-block btn-lg btn-pulse"
          >
            {carregando ? (
              'Embarcando...'
            ) : isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Confirmar Cadastro</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Entrar no Show</span>
              </>
            )}
          </button>
        </form>

        {/* Atalhos para Modo Demonstração */}
        <div className="demo-box">
          <p className="demo-title">
            <Sparkles size={14} />
            <span>Acesso Rápido para Demonstração:</span>
          </p>
          <div className="demo-buttons">
            <button
              type="button"
              onClick={() => handleEntrarComoDemo('ROLE_JOGADOR')}
              className="btn btn-secondary btn-xs"
            >
              Passageiro
            </button>
            <button
              type="button"
              onClick={() => handleEntrarComoDemo('ROLE_APRESENTADOR')}
              className="btn btn-secondary btn-xs"
            >
              Apresentador
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
