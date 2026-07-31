import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = Number(process.env.DEMO_PORT || 3079);
const baseUrl = `http://127.0.0.1:${port}`;
const outputDir = path.join(root, 'public', 'videos');
const videoPath = path.join(outputDir, 'homepage-demo.webm');
const tempVideoDir = path.join(root, '.tmp-homepage-demo-video');

dotenv.config({ path: path.join(root, '.env.local') });

function readQaLogin() {
  const loginFile = path.join(root, 'QA_LOGIN.local.md');
  const text = readFileSync(loginFile, 'utf8');
  const email = text.match(/^Email:\s*(.+)$/m)?.[1]?.trim();
  const password = text.match(/^Password:\s*(.+)$/m)?.[1]?.trim();
  if (!email || !password) throw new Error('QA login file is missing Email or Password.');
  return { email, password };
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {
      // Wait for Next to finish booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function ensureQaProfileComplete(email, password) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) return;

  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return;

  const admin = serviceRole
    ? createClient(url, serviceRole, { auth: { persistSession: false } })
    : supabase;

  await admin
    .from('profiles')
    .upsert({
      id: data.user.id,
      full_name: 'MicroFreelanceHub Demo',
      business_name: 'Demo Creative Studio',
      has_completed_onboarding: true,
    });
}

async function installCursor(page) {
  await page.addStyleTag({
    content: `
      .demo-cursor {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 2147483647;
        width: 26px;
        height: 26px;
        pointer-events: none;
        transform: translate(-50%, -50%);
        filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.28));
      }
      .demo-cursor::before {
        content: "";
        position: absolute;
        width: 0;
        height: 0;
        border-left: 18px solid #0f172a;
        border-top: 4px solid transparent;
        border-bottom: 18px solid transparent;
        transform: rotate(-12deg);
      }
      .demo-cursor::after {
        content: "";
        position: absolute;
        left: 12px;
        top: 14px;
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #2563eb;
        border: 2px solid white;
      }
      .demo-cursor.demo-click {
        animation: demo-click-pulse 420ms ease-out;
      }
      @keyframes demo-click-pulse {
        0% { transform: translate(-50%, -50%) scale(1); }
        45% { transform: translate(-50%, -50%) scale(0.82); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
    `,
  });
  await page.evaluate(() => {
    if (!document.querySelector('.demo-cursor')) {
      const cursor = document.createElement('div');
      cursor.className = 'demo-cursor';
      cursor.style.left = '1120px';
      cursor.style.top = '190px';
      document.body.appendChild(cursor);
    }
  });
}

async function moveCursor(page, x, y, steps = 18) {
  await installCursor(page);
  const current = await page.evaluate(() => {
    const cursor = document.querySelector('.demo-cursor');
    return {
      x: parseFloat(cursor?.style.left || '1120'),
      y: parseFloat(cursor?.style.top || '190'),
    };
  });

  for (let i = 1; i <= steps; i += 1) {
    const ease = i / steps;
    const nextX = current.x + (x - current.x) * ease;
    const nextY = current.y + (y - current.y) * ease;
    await page.mouse.move(nextX, nextY);
    await page.evaluate(({ nextX, nextY }) => {
      const cursor = document.querySelector('.demo-cursor');
      if (cursor) {
        cursor.style.left = `${nextX}px`;
        cursor.style.top = `${nextY}px`;
      }
    }, { nextX, nextY });
    await page.waitForTimeout(16);
  }
}

async function centerOf(locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Could not locate element for cursor move.');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function clickLocator(page, locator, pauseMs = 650) {
  const point = await centerOf(locator);
  await moveCursor(page, point.x, point.y);
  await page.evaluate(() => document.querySelector('.demo-cursor')?.classList.add('demo-click'));
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(420);
  await page.evaluate(() => document.querySelector('.demo-cursor')?.classList.remove('demo-click'));
  await page.waitForTimeout(pauseMs);
}

async function fillLocator(page, locator, value, pauseMs = 350) {
  const point = await centerOf(locator);
  await moveCursor(page, point.x, point.y);
  await locator.fill(value);
  await page.waitForTimeout(pauseMs);
}

async function main() {
  const { email, password } = readQaLogin();
  await ensureQaProfileComplete(email, password);

  mkdirSync(outputDir, { recursive: true });
  rmSync(tempVideoDir, { recursive: true, force: true });
  mkdirSync(tempVideoDir, { recursive: true });

  let server;
  try {
    server = spawn('npm', ['run', 'dev', '--', '-p', String(port), '-H', '127.0.0.1'], {
      cwd: root,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
    });

    server.stdout.on('data', (chunk) => process.stdout.write(chunk));
    server.stderr.on('data', (chunk) => process.stderr.write(chunk));
    await waitForServer(baseUrl);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      recordVideo: { dir: tempVideoDir, size: { width: 1440, height: 900 } },
    });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await installCursor(page);
    await page.waitForTimeout(900);

    await clickLocator(page, page.getByRole('link', { name: /log in/i }).first());
    await page.waitForURL(/\/login/, { timeout: 30000 });
    await installCursor(page);
    await fillLocator(page, page.getByPlaceholder('Email address'), email);
    await fillLocator(page, page.getByPlaceholder('Password'), password);
    await clickLocator(page, page.getByRole('button', { name: /sign in/i }));
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    await installCursor(page);
    await page.waitForTimeout(1200);

    await clickLocator(page, page.locator('a[href="/create"]').first(), 300);
    await page.goto(`${baseUrl}/create`, { waitUntil: 'domcontentloaded' });
    await installCursor(page);
    await page.waitForTimeout(900);

    await fillLocator(page, page.getByPlaceholder('e.g. John Smith'), 'Brightside Kitchen Co.');
    await fillLocator(page, page.getByPlaceholder('e.g. john@example.com'), 'client@example.com');
    await fillLocator(page, page.getByPlaceholder('Untitled Agreement'), 'Brand Refresh Agreement');
    await fillLocator(page, page.getByPlaceholder('Start typing your agreement here...'), '1. PROJECT OVERVIEW\nA concise brand refresh agreement with scope, signature, and upfront payment terms.\n\n2. SPECIFIC PROVISIONS\n- Homepage design package\n- Two revision rounds\n- Final source files after full payment\n\n--------------------------------------------------\nTERMS & CONDITIONS\n\n1. PAYMENT TERMS\nA 50% deposit is required before work begins.');
    await fillLocator(page, page.getByPlaceholder('0.00').first(), '2500');
    await clickLocator(page, page.getByRole('button', { name: /^50%$/ }));
    await page.waitForTimeout(700);
    await clickLocator(page, page.getByRole('button', { name: /fixed/i }));
    await page.waitForTimeout(700);
    await clickLocator(page, page.getByRole('button', { name: /50%/i }));
    await page.waitForTimeout(900);

    await clickLocator(page, page.getByRole('link').first(), 300);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await installCursor(page);
    await page.waitForTimeout(1000);

    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await installCursor(page);
    await moveCursor(page, 1030, 360);
    await page.waitForTimeout(1600);

    await context.close();
    await browser.close();

    const recorded = existsSync(tempVideoDir)
      ? path.join(tempVideoDir, readdirSync(tempVideoDir).find((file) => file.endsWith('.webm')) || '')
      : '';
    if (!recorded || !existsSync(recorded)) throw new Error('Playwright did not produce a video file.');
    copyFileSync(recorded, videoPath);
    console.log(`Demo video written to ${videoPath}`);
  } finally {
    if (server && !server.killed) server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
