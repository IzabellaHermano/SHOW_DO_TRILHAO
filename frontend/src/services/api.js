import axios from 'axios'

// A URL da API respeita o ambiente de execução: se rodando em localhost/127.0.0.1, consome a API local; em produção, consome o Render
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const configuredEnvUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
const effectiveUrl = isLocalhost 
  ? 'http://localhost:8080/api' 
  : (configuredEnvUrl || 'https://show-do-trilhao-backend.onrender.com/api')
const API_URL = effectiveUrl.endsWith('/api') ? effectiveUrl : `${effectiveUrl}/api`

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s para acomodar cold-start do plano gratuito do Render
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptador para adicionar o token JWT nas requisições autenticadas (localStorage / sessionStorage)
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('show_trilhao_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('show_trilhao_token') ||
      sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isCurrentlyOffline = false

// Interceptador de resposta para tratar erros comuns, autenticação e cold start do Render
api.interceptors.response.use(
  (response) => {
    // Se respondeu com sucesso após uma perda de conexão, notifica reconexão
    if (isCurrentlyOffline) {
      isCurrentlyOffline = false
      window.dispatchEvent(new CustomEvent('app-connection-restored'))
    }
    // Notifica que o servidor está online/aquecido
    window.dispatchEvent(new CustomEvent('server-online'))
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token inválido, expirado ou permissão negada
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/')
      if (!isAuthEndpoint) {
        localStorage.removeItem('show_trilhao_token')
        localStorage.removeItem('show_trilhao_user')
        localStorage.removeItem('token')
        sessionStorage.removeItem('show_trilhao_token')
        sessionStorage.removeItem('show_trilhao_user')
        sessionStorage.removeItem('token')

        window.dispatchEvent(new CustomEvent('auth-session-expired'))

        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/sala/')
        ) {
          window.location.href = '/login'
        }
      }
    }

    // Erros de rede ou timeout indicam desconexão ou cold start
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))

    if (isNetworkError) {
      if (!isCurrentlyOffline) {
        isCurrentlyOffline = true
        window.dispatchEvent(new CustomEvent('app-connection-lost'))
      }

      // Tratamento de Cold Start no Render: se deu timeout ou erro de rede, tenta mais 1 vez
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true
        window.dispatchEvent(
          new CustomEvent('server-cold-start', {
            detail: { message: 'O servidor no Render está acordando do modo repouso. Aguarde alguns instantes...' },
          })
        )
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha })
    return response.data
  },
  cadastro: async (nome, email, senha, role = 'ROLE_JOGADOR') => {
    const response = await api.post('/auth/cadastro', { nome, email, senha, role })
    return response.data
  },
}

export const salaService = {
  verificarSala: async (codigo) => {
    const response = await api.get(`/salas/public/verificar/${codigo}`)
    return response.data
  },
  criarSala: async (dados) => {
    const response = await api.post('/salas/apresentador', dados)
    return response.data
  },
  listarMinhasSalas: async () => {
    const response = await api.get('/salas/apresentador/minhas')
    return response.data
  },
  alternarStatus: async (id) => {
    const response = await api.patch(`/salas/apresentador/${id}/alternar-status`)
    return response.data
  },
  entrarVisitante: async (codigo, nomeVisitante) => {
    const response = await api.post(`/salas/${codigo}/entrar-visitante`, {
      codigoSala: codigo,
      nomeVisitante,
    })
    return response.data
  },
  entrarJogador: async (codigo) => {
    const response = await api.post(`/salas/${codigo}/entrar-jogador`)
    return response.data
  },
  iniciarJogo: async (codigo) => {
    const response = await api.post(`/salas/${codigo}/iniciar`)
    return response.data
  },
  obterEstadoApresentador: async (codigo) => {
    const response = await api.get(`/salas/${codigo}/estado-apresentador`)
    return response.data
  },
  revelarResposta: async (codigo) => {
    const response = await api.post(`/salas/${codigo}/revelar`)
    return response.data
  },
  proximaPergunta: async (codigo) => {
    const response = await api.post(`/salas/${codigo}/proxima`)
    return response.data
  },
  obterEstadoJogador: async (codigo, tokenSessao) => {
    const headers = tokenSessao ? { 'X-Session-Token': tokenSessao } : {}
    const response = await api.get(`/salas/${codigo}/estado-jogador`, { headers })
    return response.data
  },
  responderSimbolo: async (codigo, tokenSessao, simboloNumero) => {
    const headers = tokenSessao ? { 'X-Session-Token': tokenSessao } : {}
    const response = await api.post(
      `/salas/${codigo}/responder-simbolo`,
      { simboloNumero },
      { headers }
    )
    return response.data
  },
}

export const perguntaService = {
  listarTodas: async () => {
    const response = await api.get('/perguntas/gestao')
    return response.data
  },
  cadastrar: async (dados) => {
    const response = await api.post('/perguntas/gestao', dados)
    return response.data
  },
  atualizar: async (id, dados) => {
    const response = await api.put(`/perguntas/gestao/${id}`, dados)
    return response.data
  },
  excluir: async (id) => {
    const response = await api.delete(`/perguntas/gestao/${id}`)
    return response.data
  },
}

export const partidaService = {
  iniciarJogador: async (codigoSala) => {
    const response = await api.post('/partidas/iniciar', { codigoSala })
    return response.data
  },
  iniciarVisitante: async (codigoSala, nomeVisitante) => {
    const response = await api.post('/partidas/visitante/iniciar', { codigoSala, nomeVisitante })
    return response.data
  },
  buscarStatus: async (id) => {
    const response = await api.get(`/partidas/${id}/status`)
    return response.data
  },
  responder: async (id, dados) => {
    const response = await api.post(`/partidas/${id}/responder`, dados)
    return response.data
  },
  abandonar: async (id) => {
    const response = await api.post(`/partidas/${id}/abandonar`)
    return response.data
  },
}

export const rankingService = {
  obterRankingGeral: async () => {
    const response = await api.get('/ranking/geral')
    return response.data
  },
  obterRankingSala: async (codigo) => {
    const response = await api.get(`/ranking/sala/${codigo}`)
    return response.data
  },
}

export const healthService = {
  checkHealth: async () => {
    const response = await api.get('/health')
    return response.data
  },
}

export default api
