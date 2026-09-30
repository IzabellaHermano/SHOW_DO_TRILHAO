import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

export const api = axios.create({
  baseURL: API_URL,
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

// Interceptador de resposta para tratar erros comuns (ex: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('show_trilhao_token')
      localStorage.removeItem('show_trilhao_user')
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

export default api
