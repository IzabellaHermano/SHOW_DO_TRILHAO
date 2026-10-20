import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkRemote() {
  console.log('Connecting to remote Firebase app...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  page.on('requestfailed', req => {
    errors.push(`Request failed: ${req.url()} (${req.failure()?.errorText})`);
  });

  try {
    const res = await page.goto('https://show-do-trilhao-6a86a.web.app/', { waitUntil: 'networkidle2', timeout: 20000 });
    console.log('HTTP Status:', res.status());
  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('Console messages:', consoleMessages);
  console.log('Errors:', errors);

  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML : 'No #root found';
  });
  console.log('Root innerHTML:', rootContent.substring(0, 500));

  await browser.close();
}

checkRemote().catch(console.error);
