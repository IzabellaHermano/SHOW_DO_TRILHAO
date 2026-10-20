import axios from 'axios'

// A URL da API vem estritamente das variáveis de ambiente (.env.development / .env.production)
const configuredUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').trim().replace(/\/+$/, '')
const API_URL = configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s para acomodar cold-start do plano gratuito do Render
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptador para adicionar o token JWT nas requisições autenticadas
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('show_trilhao_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isCurrentlyOffline = false

// Interceptador de resposta para tratar erros comuns e cold start do Render
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

    if (error.response && error.response.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('show_trilhao_token')
      localStorage.removeItem('show_trilhao_user')
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
