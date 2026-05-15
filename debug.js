const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  
  console.log('Navigating to admin manager...');
  await page.goto('http://localhost:3000/admin/manager', { waitUntil: 'networkidle0' });
  
  console.log('Page loaded. Checking if login is required...');
  const loginButton = await page.$('button[type="submit"]');
  
  if (loginButton) {
    console.log('Logging in...');
    await page.type('input[type="password"]', 'admin123');
    await loginButton.click();
    await page.waitForTimeout(2000);
  }
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: '/home/ramo/Projects/retro-spot/debug-screenshot.png' });
  
  console.log('Done.');
  await browser.close();
})();
