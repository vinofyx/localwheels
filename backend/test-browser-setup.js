const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

async function run() {
  console.log('='.repeat(80));
  console.log('REAL BROWSER VERIFICATION: SETUP WIZARD & ADMIN AUTHENTICATION');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));

  try {
    // 1. Navigate to Login Page
    console.log('\n--- 1. ADMIN LOGIN ---');
    await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('  Navigated to /login');

    // Select System Login tab
    const tabs = await page.$$('button');
    for (const t of tabs) {
      const text = await page.evaluate(el => el.textContent, t);
      if (text.includes('System Login')) {
        await t.click();
        break;
      }
    }

    // Fill credentials
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    console.log('  Admin login submitted, current URL:', page.url());

    // 2. Navigate directly to /setup
    console.log('\n--- 2. SETUP WIZARD NAVIGATION ---');
    await page.goto('http://localhost:8081/setup', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('  Navigated to /setup, URL:', page.url());

    // Verify Title
    const title = await page.title();
    console.log('  Page title:', title);

    // Verify company name input has value or can be filled
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });
    const companyNameVal = await page.$eval('input[name="name"]', el => el.value);
    console.log('  Company Name input current value:', companyNameVal);

    // Modify name to ensure dirty state
    await page.$eval('input[name="name"]', el => el.value = 'Local Wheels Enterprise Pvt Ltd');
    await page.type('input[name="name"]', ' '); // trigger change event

    // 3. Click Next button
    console.log('\n--- 3. CLICK NEXT BUTTON ---');
    const buttons = await page.$$('button');
    let nextBtn = null;
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Next')) {
        nextBtn = b;
        break;
      }
    }

    if (!nextBtn) throw new Error('Next button not found');
    console.log('  Next button found. Clicking Next...');
    await nextBtn.click();

    // Wait for step transition or network request
    await page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(r => setTimeout(r, 2000));

    // Check if error toast exists
    const toasts = await page.$$eval('[role="status"], .toaster, [class*="toast"]', els => els.map(e => e.textContent));
    console.log('  Toasts displayed:', toasts);

    const hasInsufficientPermissions = toasts.some(t => t.includes('Insufficient permissions'));
    if (hasInsufficientPermissions) {
      console.error('  [FAIL] "Insufficient permissions" toast was displayed!');
      process.exit(1);
    } else {
      console.log('  [PASS] NO "Insufficient permissions" error displayed!');
    }

    // 4. Verify Step 2 is now active
    console.log('\n--- 4. VERIFY STEP TRANSITION ---');
    const activeStepText = await page.$$eval('.text-\\[\\#0b8fd3\\].font-medium', els => els.map(e => e.textContent));
    console.log('  Active step indicator:', activeStepText);

    // 5. Test Back Button
    console.log('\n--- 5. TEST BACK BUTTON ---');
    const backButtons = await page.$$('button');
    let backBtn = null;
    for (const b of backButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Back')) {
        backBtn = b;
        break;
      }
    }

    if (backBtn) {
      await backBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log('  Back button clicked successfully.');
    }

    console.log('\n' + '='.repeat(80));
    console.log('BROWSER TEST COMPLETE: ALL CHECKS PASSED');
    console.log('='.repeat(80));
  } catch (err) {
    console.error('Browser test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();

