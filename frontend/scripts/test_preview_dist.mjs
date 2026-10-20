import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(DIST_DIR, reqPath);

      // SPA fallback
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

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function testDist() {
  console.log('--- TESTANDO BUILD DE PRODUÇÃO (DIST) VIA SERVIDOR ESTÁTICO EMBUTIDO ---');
  const server = await startServer(4173);
  console.log('Servidor rodando em http://localhost:4173');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(err.toString()));

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  console.log('Root HTML rendered length:', rootHtml.length);
  console.log('Page Errors:', pageErrors);
  console.log('Console Errors:', consoleErrors);

  const hasContent = rootHtml.length > 200 && rootHtml.includes('Show do Trilhão');
  console.log('Verificação de Tela Não-Branca (Renderização Completa):', hasContent ? 'SUCESSO TOTAL!' : 'FALHOU');

  // Testar rota de sala /sala/CPTM-TEST
  await page.goto('http://localhost:4173/sala/CPTM-TEST', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  const salaHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  console.log('Rota /sala/CPTM-TEST rendered length:', salaHtml.length);

  await browser.close();
  server.close();

  if (pageErrors.length > 0 || !hasContent) {
    throw new Error('Falha no teste da build de produção!');
  }
  console.log('--- TESTE DE PRODUÇÃO DIST CONCLUÍDO COM 100% DE SUCESSO ---');
}

testDist().catch(err => {
  console.error(err);
  process.exit(1);
});
