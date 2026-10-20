import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve('dist');
const ARTIFACT_DIR = 'C:\\Users\\IZABELLAA\\.gemini\\antigravity-ide\\brain\\d5736a06-1912-4e5a-bea9-54aa37697476';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startStaticServer(port = 5174) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(DIST_DIR, reqPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } catch (e) {
        res.writeHead(500);
        res.end(e.message);
      }
    });
    server.listen(port, () => resolve(server));
  });
}

async function captureEvidence() {
  console.log('--- CAPTURANDO EVIDÊNCIAS VISUAIS: TELÃO vs. CELULAR DO JOGADOR ---');
  const server = await startStaticServer(5174);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Setup da Sala via API local (Spring Boot)
  const API = 'http://localhost:8080/api';
  const timestamp = Date.now();
  
  // Apresentador
  const apresRes = await axios.post(`${API}/auth/cadastro`, {
    nome: 'Silvio Apresentador CPTM',
    email: `apres_${timestamp}@cptm.sp.gov.br`,
    senha: 'password123',
    role: 'ROLE_APRESENTADOR'
  });
  const apresToken = apresRes.data.token;

  // Cria Sala
  const salaRes = await axios.post(`${API}/salas/apresentador`, {
    nome: 'Expresso Luz - Telão Oficial'
  }, { headers: { Authorization: `Bearer ${apresToken}` } });
  const codigo = salaRes.data.codigo;

  // Jogador 1 (Logado)
  const playerRes = await axios.post(`${API}/auth/cadastro`, {
    nome: 'Maria da Silva',
    email: `player_${timestamp}@cptm.sp.gov.br`,
    senha: 'password123',
    role: 'ROLE_JOGADOR'
  });
  const playerToken = playerRes.data.token;

  // Jogador 1 entra na sala
  await axios.post(`${API}/salas/${codigo}/entrar-jogador`, {}, {
    headers: { Authorization: `Bearer ${playerToken}` }
  });

  // Visitante entra na sala
  const visitRes = await axios.post(`${API}/salas/${codigo}/entrar-visitante`, {
    codigoSala: codigo,
    nomeVisitante: 'João Visitante'
  });
  const visitToken = visitRes.data.tokenSessao;

  // Apresentador inicia a partida oficial
  await axios.post(`${API}/salas/${codigo}/iniciar`, {}, {
    headers: { Authorization: `Bearer ${apresToken}` }
  });

  console.log(`Sala ${codigo} iniciada com 1 Apresentador e 2 Jogadores!`);

  // 2. Captura TELÃO DO APRESENTADOR (1280x800)
  const pageApresentador = await browser.newPage();
  await pageApresentador.setViewport({ width: 1280, height: 800 });
  
  // Injeta token do apresentador no localStorage
  await pageApresentador.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await pageApresentador.evaluate((token, user) => {
    localStorage.setItem('show_trilhao_token', token);
    localStorage.setItem('show_trilhao_user', JSON.stringify(user));
  }, apresToken, apresRes.data);

  // Acessa telão da sala
  await pageApresentador.goto(`http://localhost:5174/apresentador`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Clica no card da sala para abrir o telão ao vivo
  await pageApresentador.evaluate((cod) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Abrir Telão') || b.innerText.includes('Telão'));
    if (btn) btn.click();
  }, codigo);
  await new Promise(r => setTimeout(r, 1500));

  const telaoScreenshotPath = path.join(ARTIFACT_DIR, '01_telao_apresentador_ao_vivo.png');
  await pageApresentador.screenshot({ path: telaoScreenshotPath, fullPage: false });
  console.log('Captura salva: 01_telao_apresentador_ao_vivo.png');

  // 3. Captura CELULAR DO JOGADOR (390x844 iPhone 14)
  const pageJogador = await browser.newPage();
  await pageJogador.setViewport({ width: 390, height: 844 });
  
  // Injeta token e código de sala
  await pageJogador.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await pageJogador.evaluate((cod, token, user) => {
    localStorage.setItem('show_trilhao_token', token);
    localStorage.setItem('show_trilhao_user', JSON.stringify(user));
    localStorage.setItem(`show_trilhao_session_${cod}`, token);
    sessionStorage.setItem('show_trilhao_current_sala', cod);
  }, codigo, playerToken, playerRes.data);

  await pageJogador.goto(`http://localhost:5174/jogo/sala/${codigo}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const jogadorScreenshotPath = path.join(ARTIFACT_DIR, '02_celular_jogador_simbolos.png');
  await pageJogador.screenshot({ path: jogadorScreenshotPath, fullPage: false });
  console.log('Captura salva: 02_celular_jogador_simbolos.png');

  // 4. Captura CELULAR DO VISITANTE (360x740)
  const pageVisitante = await browser.newPage();
  await pageVisitante.setViewport({ width: 360, height: 740 });
  await pageVisitante.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await pageVisitante.evaluate((cod, token) => {
    localStorage.setItem(`show_trilhao_session_${cod}`, token);
    sessionStorage.setItem('show_trilhao_current_sala', cod);
  }, codigo, visitToken);

  await pageVisitante.goto(`http://localhost:5174/jogo/sala/${codigo}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const visitanteScreenshotPath = path.join(ARTIFACT_DIR, '03_celular_visitante_360px.png');
  await pageVisitante.screenshot({ path: visitanteScreenshotPath, fullPage: false });
  console.log('Captura salva: 03_celular_visitante_360px.png');

  await browser.close();
  server.close();
  console.log('--- CAPTURAS DE EVIDÊNCIA CONCLUÍDAS COM SUCESSO ---');
}

captureEvidence().catch(err => {
  console.error('Erro na captura:', err);
  process.exit(1);
});
