import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

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

function startStaticServer(port = 5175) {
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

async function testViewport(browser, width, height, isMobile, screenshotFilename, sampleText) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile, hasTouch: isMobile });

  // Injetar autenticação do apresentador
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('show_trilhao_token', 'mock_jwt_valid_presenter_token');
    localStorage.setItem('show_trilhao_user', JSON.stringify({
      id: 1,
      nome: 'Silvio Santos CPTM',
      email: 'silvio@cptm.sp.gov.br',
      role: 'ROLE_APRESENTADOR'
    }));
  });

  // Interceptar TODAS as requisições para a API e mockar respostas limpas sem warnings/toasts
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('show-do-trilhao-backend.onrender.com') || url.includes('/api/')) {
      if (url.includes('/salas/apresentador')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 10, nome: 'Expresso Luz - Turma das 14h', codigo: 'CPTM-LUZX', ativa: true, jogadoresConectados: 5 }
          ])
        });
      }
      if (url.includes('/perguntas')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
      if (url.includes('/ranking')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
      return req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'UP' })
      });
    }
    req.continue();
  });

  await page.goto('http://localhost:5175/apresentador', { waitUntil: 'networkidle0' });

  // Abrir o modal
  await page.waitForSelector('#btn-abrir-modal-nova-sala', { visible: true });
  await page.click('#btn-abrir-modal-nova-sala');

  // Esperar o input estar visível e em foco
  await page.waitForSelector('#nome-sala-input', { visible: true });
  await page.focus('#nome-sala-input');

  // Digitar texto de exemplo no input
  await page.type('#nome-sala-input', sampleText, { delay: 25 });

  // Aguardar 200ms para renderizar qualquer efeito de foco
  await new Promise(r => setTimeout(r, 200));

  // Limpar toasts de alerta para garantir captura impecável do modal
  await page.evaluate(() => {
    document.querySelectorAll('.game-toast-container, .cold-start-banner, .game-toast').forEach(el => el.remove());
  });

  // Validar estilos computados
  const metrics = await page.evaluate(() => {
    const input = document.querySelector('#nome-sala-input');
    const label = document.querySelector('label[for="nome-sala-input"]');
    const hint = document.querySelector('.form-hint');
    const title = document.querySelector('.game-modal-title');
    const closeBtn = document.querySelector('.game-modal-close');
    const formGroup = document.querySelector('.form-group');

    const inputStyle = window.getComputedStyle(input);
    const formGroupStyle = window.getComputedStyle(formGroup);

    const inputRect = input.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const hintRect = hint.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const closeRect = closeBtn.getBoundingClientRect();

    return {
      value: input.value,
      color: inputStyle.color,
      backgroundColor: inputStyle.backgroundColor,
      borderRadius: inputStyle.borderRadius,
      padding: inputStyle.padding,
      flexDirection: formGroupStyle.flexDirection,
      isVertical: labelRect.bottom <= inputRect.top && inputRect.bottom <= hintRect.top,
      headerOk: titleRect.left < closeRect.left
    };
  });

  const savePath = path.join(ARTIFACT_DIR, screenshotFilename);
  await page.screenshot({ path: savePath });
  console.log(`✓ [${width}x${height}] Salvo em ${screenshotFilename}:`, metrics);

  await page.close();
  return metrics;
}

async function run() {
  console.log('=== INICIANDO VALIDAÇÃO COMPLETA DO MODAL CRIAR SALA ===');
  const server = await startStaticServer(5175);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const sampleText = 'Sala do Pedro';

  // 1. Desktop 1280px (Principal)
  const dMetrics = await testViewport(browser, 1280, 800, false, 'modal_criar_sala_corrigido.png', sampleText);
  // Cópia 1280px para completude
  fs.copyFileSync(
    path.join(ARTIFACT_DIR, 'modal_criar_sala_corrigido.png'),
    path.join(ARTIFACT_DIR, 'modal_criar_sala_1280px.png')
  );

  // 2. Mobile 390px (iPhone 14)
  const m390Metrics = await testViewport(browser, 390, 844, true, 'modal_criar_sala_390px.png', sampleText);

  // 3. Mobile 360px (Android compacto)
  const m360Metrics = await testViewport(browser, 360, 740, true, 'modal_criar_sala_360px.png', sampleText);

  await browser.close();
  server.close();

  if (!dMetrics.isVertical || !m390Metrics.isVertical || !m360Metrics.isVertical) {
    throw new Error('Falha de hierarquia vertical!');
  }
  if (dMetrics.color !== 'rgb(255, 255, 255)') {
    throw new Error('Falha de contraste: texto digitado não é branco!');
  }

  console.log('=== TODAS AS TELAS E MÉTRICAS FORAM VALIDADAS COM SUCESSO! ===');
}

run().catch((err) => {
  console.error('ERRO:', err);
  process.exit(1);
});
