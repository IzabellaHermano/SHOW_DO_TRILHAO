import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/api'
import { useToast } from '../context/ToastContext'
import { LogIn, UserPlus, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameTitle from '../components/GameTitle'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()

  const [isRegister, setIsRegister] = useState(Boolean(location.state?.register))
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState(location.state?.roleDefault || 'ROLE_JOGADOR')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
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
        toast.success('Conta criada com sucesso! Embarque confirmado.', 'Boas-Vindas')
      } else {
        const response = await authService.login(email, senha)
        login(response.token, {
          id: response.id,
          nome: response.nome,
          email: response.email,
          role: response.role,
        })
        toast.success('Login efetuado com sucesso!', 'Embarque Concluído')
      }

      setTimeout(() => {
        navigate(from, { replace: true })
      }, 400)
    } catch (err) {
      console.error('Erro de autenticação:', err)
      const msg =
        err.response?.data?.mensagem ||
        err.response?.data?.message ||
        'Não foi possível autenticar. Confira os dados ou utilize o acesso rápido para testes.'
      setErro(msg)
    } finally {
      setCarregando(false)
    }
  }

  const handleEntrarComoDemo = (demoRole = 'ROLE_APRESENTADOR') => {
    setIsRegister(false)
    setErro('')
    if (demoRole === 'ROLE_APRESENTADOR') {
      setEmail('apresentador@cptm.sp.gov.br')
      setSenha('Mestre@CPTM2026')
    } else {
      setEmail('admin@cptm.sp.gov.br')
      setSenha('Admin@CPTM2026')
    }
  }

  return (
    <div className="home-hero-stage" style={{ minHeight: 'calc(100vh - 65px)', justifyContent: 'center' }}>
      <div className="game-modal-container modal-md" style={{ margin: 'auto 0' }}>
        <div style={{ textAlign: 'center', padding: '2rem 2rem 1rem 2rem' }}>
          <CptmLogo size="lg" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.75rem', marginTop: '0.75rem' }}>
            {isRegister ? 'Cadastre-se nos Trilhos' : 'Acesse sua Conta CPTM'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            {isRegister
              ? 'Crie seu perfil oficial para disputar o ranking geral de milionários'
              : 'Entre no vagão e continue sua jornada rumo ao Trilhão'}
          </p>

          {/* Alternador de Abas */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className={`btn-cptm ${!isRegister ? 'btn-cptm-primary' : 'btn-cptm-secondary'} btn-sm btn-block`}
              onClick={() => {
                setIsRegister(false)
                setErro('')
              }}
            >
              <LogIn size={15} />
              <span>Login</span>
            </button>
            <button
              type="button"
              className={`btn-cptm ${isRegister ? 'btn-cptm-primary' : 'btn-cptm-secondary'} btn-sm btn-block`}
              onClick={() => {
                setIsRegister(true)
                setErro('')
              }}
            >
              <UserPlus size={15} />
              <span>Cadastrar</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '0 2rem 2rem 2rem' }}>
          {erro && (
            <div className="game-alert game-alert-danger" role="alert">
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="enter-game-form">
            {isRegister && (
              <div className="game-form-group">
                <label htmlFor="loginNome" className="game-form-label">Nome Completo</label>
                <input
                  id="loginNome"
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="game-input"
                />
              </div>
            )}

            <div className="game-form-group">
              <label htmlFor="loginEmail" className="game-form-label">E-mail</label>
              <input
                id="loginEmail"
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="game-input"
              />
            </div>

            <div className="game-form-group">
              <label htmlFor="loginSenha" className="game-form-label">Senha</label>
              <input
                id="loginSenha"
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="game-input"
              />
            </div>

            {isRegister && (
              <div className="game-form-group">
                <label htmlFor="loginRole" className="game-form-label">Perfil de Passageiro</label>
                <select
                  id="loginRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="game-input"
                >
                  <option value="ROLE_JOGADOR">Passageiro / Jogador Oficial</option>
                  <option value="ROLE_APRESENTADOR">Apresentador de Sala CPTM</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="btn-cptm btn-cptm-primary btn-lg btn-block btn-pulse"
              style={{ marginTop: '0.75rem' }}
            >
              {carregando ? (
                'Autenticando...'
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

          {/* Atalho Demo para Avaliação */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Atalhos Rápidos de Demonstração:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleEntrarComoDemo('ROLE_APRESENTADOR')}
                className="btn-cptm btn-cptm-secondary btn-sm"
              >
                <Sparkles size={13} className="gold-icon" />
                <span>Apresentador</span>
              </button>
              <button
                type="button"
                onClick={() => handleEntrarComoDemo('ROLE_ADMIN')}
                className="btn-cptm btn-cptm-secondary btn-sm"
              >
                <span>Administrador</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
