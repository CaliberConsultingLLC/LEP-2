import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const rawDir = path.resolve(root, 'public', 'raw-demo');
const outputVideo = path.resolve(root, 'public', 'compass-live-demo.mp4');
const fontPath = 'C\\:/Windows/Fonts/arial.ttf';
const demoUrl = process.env.DEMO_URL || 'https://compass-exh1mpldq-northstarpartners.vercel.app';

fs.mkdirSync(rawDir, { recursive: true });

function latestWebm(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => ({ file: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length ? path.join(dir, files[0].file) : null;
}

async function record() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: rawDir,
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();

  const clickButtonByText = async (label) => {
    const byButton = page.locator('button').filter({ hasText: label }).first();
    if (await byButton.count()) {
      await byButton.click({ timeout: 20000 });
      return;
    }
    const byRole = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
    await byRole.click({ timeout: 20000 });
  };

  await page.goto(demoUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3200);

  // Move through homepage hero + section controls.
  await page.mouse.move(210, 505, { steps: 24 });
  await clickButtonByText('How It Works');
  await page.waitForTimeout(5200);

  await page.mouse.move(980, 360, { steps: 24 });
  await page.waitForTimeout(2800);
  await page.mouse.wheel(0, 580);
  await page.waitForTimeout(4200);

  await page.mouse.move(290, 506, { steps: 20 });
  await clickButtonByText('Deliverables');
  await page.waitForTimeout(4300);

  await page.mouse.move(188, 506, { steps: 20 });
  await clickButtonByText('Methodology');
  await page.waitForTimeout(4100);

  // Show sign in route quickly.
  await page.mouse.move(1150, 86, { steps: 20 });
  await clickButtonByText('Sign In');
  await page.waitForTimeout(4800);

  // Return to home and showcase begin flow.
  await page.goto(demoUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  await page.mouse.move(232, 470, { steps: 20 });
  await clickButtonByText('Begin Your Journey');
  await page.waitForTimeout(6200);

  // Return to homepage for outro.
  await page.goto(demoUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(7600);

  await context.close();
  await browser.close();
}

function transcode(rawInput) {
  const filter = [
    // Light zoom treatment.
    'scale=1344:756',
    'crop=1280:720',

    // Captions by scene.
    `drawtext=fontfile='${fontPath}':text='Compass Demo 55-second guided walkthrough':fontsize=34:fontcolor=white:x=56:y=34:box=1:boxcolor=0x081224AA:boxborderw=10:enable='between(t,0,6)'`,
    `drawtext=fontfile='${fontPath}':text='1) Leadership Intake':fontsize=32:fontcolor=white:x=56:y=634:box=1:boxcolor=0x081224AA:boxborderw=8:enable='between(t,2,14)'`,
    `drawtext=fontfile='${fontPath}':text='2) Reflection Results':fontsize=32:fontcolor=white:x=56:y=634:box=1:boxcolor=0x081224AA:boxborderw=8:enable='between(t,14,26)'`,
    `drawtext=fontfile='${fontPath}':text='3) Trait Selection':fontsize=32:fontcolor=white:x=56:y=634:box=1:boxcolor=0x081224AA:boxborderw=8:enable='between(t,26,39)'`,
    `drawtext=fontfile='${fontPath}':text='4) Growth Campaign + Dashboard':fontsize=32:fontcolor=white:x=56:y=634:box=1:boxcolor=0x081224AA:boxborderw=8:enable='between(t,39,55)'`,

    // Cursor highlight overlays (follow-click cue).
    "drawbox=x=250:y=494:w=18:h=18:color=#E07A3F@0.92:t=fill:enable='between(t,3.8,5.0)'",
    "drawbox=x=280:y=496:w=18:h=18:color=#E07A3F@0.92:t=fill:enable='between(t,17.5,18.8)'",
    "drawbox=x=382:y=496:w=18:h=18:color=#E07A3F@0.92:t=fill:enable='between(t,22.2,23.5)'",
    "drawbox=x=153:y=496:w=18:h=18:color=#E07A3F@0.92:t=fill:enable='between(t,27.0,28.3)'",
    "drawbox=x=1138:y=76:w=18:h=18:color=#E07A3F@0.92:t=fill:enable='between(t,31.7,32.9)'",
    "drawbox=x=246:y=462:w=18:h=18:color=#E07A3F@0.92:t=fill:enable='between(t,41.2,42.5)'",
  ].join(',');

  const args = [
    '-y',
    '-i',
    rawInput,
    '-vf',
    filter,
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    outputVideo,
  ];

  const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

await record();
const rawVideo = latestWebm(rawDir);
if (!rawVideo) {
  throw new Error('No recorded raw video found.');
}
transcode(rawVideo);
console.log(`Created ${outputVideo}`);
