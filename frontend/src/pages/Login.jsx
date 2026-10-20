import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/api'
import { useToast } from '../context/ToastContext'
import { LogIn, UserPlus, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'
import CptmLogo from '../components/CptmLogo'
import GameLogo from '../components/GameLogo'
import GameTitle from '../components/GameTitle'
import GameButton from '../components/GameButton'
import GameCard from '../components/GameCard'

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
    <div className="home-hero-stage" style={{ minHeight: 'calc(100dvh - 65px)', justifyContent: 'center', padding: '1rem' }}>
      <GameCard className="modal-md" style={{ width: '100%', maxWidth: '480px', margin: 'auto 0' }}>
        <div style={{ textAlign: 'center', padding: '1.75rem 1.75rem 0.75rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <CptmLogo size="md" />
            <GameLogo size="sm" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(1.3rem, 3.5vw, 1.75rem)', marginTop: '0.5rem' }}>
            {isRegister ? 'Cadastre-se nos Trilhos' : 'Acesse sua Conta CPTM'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            {isRegister
              ? 'Crie seu perfil oficial para disputar o ranking geral de milionários'
              : 'Entre no vagão e continue sua jornada rumo ao Trilhão'}
          </p>

          {/* Alternador de Abas */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <GameButton
              variant={!isRegister ? 'primary' : 'secondary'}
              size="sm"
              block
              icon={LogIn}
              onClick={() => {
                setIsRegister(false)
                setErro('')
              }}
            >
              Login
            </GameButton>
            <GameButton
              variant={isRegister ? 'primary' : 'secondary'}
              size="sm"
              block
              icon={UserPlus}
              onClick={() => {
                setIsRegister(true)
                setErro('')
              }}
            >
              Cadastrar
            </GameButton>
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

            <GameButton
              type="submit"
              disabled={carregando}
              loading={carregando}
              variant="primary"
              size="lg"
              block
              icon={isRegister ? UserPlus : LogIn}
              className="btn-pulse"
              style={{ marginTop: '0.75rem' }}
            >
              {isRegister ? 'Confirmar Cadastro' : 'Entrar no Show'}
            </GameButton>
          </form>

          {/* Atalho Demo para Avaliação */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.12)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Atalhos Rápidos de Demonstração:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <GameButton
                variant="secondary"
                size="sm"
                icon={Sparkles}
                onClick={() => handleEntrarComoDemo('ROLE_APRESENTADOR')}
              >
                Apresentador
              </GameButton>
              <GameButton
                variant="secondary"
                size="sm"
                onClick={() => handleEntrarComoDemo('ROLE_ADMIN')}
              >
                Administrador
              </GameButton>
            </div>
          </div>
        </div>
      </GameCard>
    </div>
  )
}
