import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [
  { name: '360px_mobile_small', width: 360, height: 740 },
  { name: '390px_mobile_iphone', width: 390, height: 844 },
  { name: '768px_tablet', width: 768, height: 1024 },
  { name: '1024px_laptop', width: 1024, height: 768 },
  { name: '1280px_desktop', width: 1280, height: 800 }
];

const PAGES_TO_TEST = [
  { name: '01_home', url: 'http://localhost:5173/' },
  { name: '02_login', url: 'http://localhost:5173/login' },
  { name: '03_ranking', url: 'http://localhost:5173/ranking' },
  { name: '04_apresentador', url: 'http://localhost:5173/apresentador' },
  { name: '05_not_found', url: 'http://localhost:5173/estacao-inexistente' }
];

const OUTPUT_DIR = path.resolve('..', 'test_results');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('--- INICIANDO TESTE VISUAL E DE RESPONSIVIDADE (ETAPA 4) ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n>>> Testando Viewport: ${vp.width}x${vp.height} (${vp.name})`);
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const p of PAGES_TO_TEST) {
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Warn navigation:', e.message));
      await new Promise(r => setTimeout(r, 600));

      const scrollMetrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientWidth = doc.clientWidth;
        const hasOverflow = scrollWidth > clientWidth;
        
        // Find elements causing horizontal overflow if any
        const overflowingElements = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > clientWidth + 1) {
            overflowingElements.push({
              tag: el.tagName,
              className: el.className,
              id: el.id,
              right: rect.right,
              clientWidth: clientWidth
            });
          }
        });

        return {
          scrollWidth,
          clientWidth,
          hasOverflow,
          overflowingElements: overflowingElements.slice(0, 5)
        };
      });

      const screenshotName = `${p.name}_${vp.width}px.png`;
      const screenshotPath = path.join(OUTPUT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        page: p.name,
        viewport: vp.width,
        scrollWidth: scrollMetrics.scrollWidth,
        clientWidth: scrollMetrics.clientWidth,
        hasOverflow: scrollMetrics.hasOverflow,
        overflowingElements: scrollMetrics.overflowingElements,
        screenshot: screenshotName
      });

      const statusStr = scrollMetrics.hasOverflow ? 'FALHOU (Overflow detectado)' : 'PASSOU (Zero rolagem horizontal)';
      console.log(`  [${p.name} @ ${vp.width}px] clientWidth=${scrollMetrics.clientWidth}, scrollWidth=${scrollMetrics.scrollWidth} -> ${statusStr}`);
    }
  }

  await browser.close();

  fs.writeFileSync(path.join(OUTPUT_DIR, 'responsive_summary.json'), JSON.stringify(results, null, 2));
  console.log('\n--- RELATÓRIO DE RESPONSIVIDADE GERADO COM SUCESSO ---');
}

run().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
