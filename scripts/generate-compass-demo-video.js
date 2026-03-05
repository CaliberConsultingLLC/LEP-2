import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../public/compass-how-it-works-demo.mp4');
const fontPath = 'C\\:/Windows/Fonts/arial.ttf';

const filter = [
  'color=c=#0a1830:s=1280x720:d=30',
  'format=yuv420p',

  // Base overlays
  "drawbox=x=0:y=0:w=1280:h=720:color=#0a1830@1:t=fill",
  "drawbox=x=0:y=0:w=1280:h=88:color=#071224@0.72:t=fill",
  "drawbox=x=0:y=88:w=1280:h=2:color=#3f647b@0.62:t=fill",
  "drawbox=x=52:y=52:w=1176:h=616:color=#132945@0.56:t=fill",

  // Global title
  `drawtext=fontfile='${fontPath}':text='How Compass Works':fontcolor=white:fontsize=34:x=80:y=26`,

  // Scene 1: Leadership Intake (0 - 7.5)
  "drawbox=x=0:y=0:w=1280:h=720:color=#0f2340@0.74:t=fill:enable='between(t,0,7.5)'",
  `drawtext=fontfile='${fontPath}':text='1) Leadership Intake':fontcolor=white:fontsize=52:x=90:y=118:enable='between(t,0,7.5)'`,
  `drawtext=fontfile='${fontPath}':text='Rapid assessment captures your current leadership patterns.':fontcolor=#d8e8ff:fontsize=24:x=92:y=178:enable='between(t,0,7.5)'`,
  "drawbox=x=92:y=236:w=1096:h=344:color=#ffffff@0.09:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=282:w=700:h=16:color=#ffffff@0.14:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=334:w=700:h=16:color=#ffffff@0.14:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=386:w=700:h=16:color=#ffffff@0.14:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=438:w=700:h=16:color=#ffffff@0.14:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=282:w='min(700,max(0,(t-0.6)*390))':h=16:color=#6393aa@0.95:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=334:w='min(700,max(0,(t-1.7)*330))':h=16:color=#7ab1c9@0.95:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=386:w='min(700,max(0,(t-2.8)*370))':h=16:color=#3f647b@0.96:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x=130:y=438:w='min(700,max(0,(t-3.9)*300))':h=16:color=#e07a3f@0.92:t=fill:enable='between(t,0,7.5)'",
  "drawbox=x='if(lt(t,0.4),130, if(gt(t,7.4),822,130+92*(t-0.4)))':y=505:w=14:h=14:color=#e07a3f@0.96:t=fill:enable='between(t,0,7.5)'",

  // Scene 2: Reflection Results (7.5 - 15)
  "drawbox=x=0:y=0:w=1280:h=720:color=#10253f@0.78:t=fill:enable='between(t,7.5,15)'",
  `drawtext=fontfile='${fontPath}':text='2) Reflection Results':fontcolor=white:fontsize=52:x=90:y=118:enable='between(t,7.5,15)'`,
  `drawtext=fontfile='${fontPath}':text='Compass turns responses into a clear current-state snapshot.':fontcolor=#d8e8ff:fontsize=24:x=92:y=178:enable='between(t,7.5,15)'`,
  "drawbox=x=100:y=244:w=520:h=310:color=#ffffff@0.10:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=138:y=520:w=444:h=12:color=#ffffff@0.12:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=138:y=520:w='min(444,max(0,(t-8.1)*92))':h=12:color=#6f9a83@0.95:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=700:y=254:w=468:h=290:color=#ffffff@0.11:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=736:y=296:w=300:h=14:color=#ffffff@0.14:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=736:y=336:w='min(380,max(0,(t-9.1)*130))':h=12:color=#6393aa@0.95:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=736:y=372:w='min(360,max(0,(t-10.0)*135))':h=12:color=#e07a3f@0.95:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=736:y=408:w='min(332,max(0,(t-10.9)*128))':h=12:color=#3f647b@0.95:t=fill:enable='between(t,7.5,15)'",
  "drawbox=x=736:y=444:w='min(288,max(0,(t-11.7)*124))':h=12:color=#7ab1c9@0.95:t=fill:enable='between(t,7.5,15)'",

  // Scene 3: Trait Selection (15 - 22.5)
  "drawbox=x=0:y=0:w=1280:h=720:color=#0d223a@0.80:t=fill:enable='between(t,15,22.5)'",
  `drawtext=fontfile='${fontPath}':text='3) Trait Selection':fontcolor=white:fontsize=52:x=90:y=118:enable='between(t,15,22.5)'`,
  `drawtext=fontfile='${fontPath}':text='You get five priority traits matched to your leadership profile.':fontcolor=#d8e8ff:fontsize=24:x=92:y=178:enable='between(t,15,22.5)'`,
  "drawbox=x=92:y=252:w=1096:h=304:color=#ffffff@0.10:t=fill:enable='between(t,15,22.5)'",
  "drawbox=x=136:y=304:w=980:h=42:color=#6393aa@0.96:t=fill:enable='between(t,15.3,22.5)'",
  "drawbox=x=136:y=362:w=980:h=42:color=#3f647b@0.96:t=fill:enable='between(t,16.3,22.5)'",
  "drawbox=x=136:y=420:w=980:h=42:color=#e07a3f@0.95:t=fill:enable='between(t,17.3,22.5)'",
  "drawbox=x=136:y=478:w=980:h=42:color=#6f9a83@0.95:t=fill:enable='between(t,18.3,22.5)'",
  "drawbox=x='136+mod((t-15)*170,980)':y=548:w=120:h=6:color=#ffffff@0.45:t=fill:enable='between(t,15,22.5)'",

  // Scene 4: Growth Campaign (22.5 - 30)
  "drawbox=x=0:y=0:w=1280:h=720:color=#0b1f34@0.82:t=fill:enable='between(t,22.5,30)'",
  `drawtext=fontfile='${fontPath}':text='4) Growth Campaign':fontcolor=white:fontsize=52:x=90:y=118:enable='between(t,22.5,30)'`,
  `drawtext=fontfile='${fontPath}':text='Track progress and momentum in your live dashboard.':fontcolor=#d8e8ff:fontsize=24:x=92:y=178:enable='between(t,22.5,30)'`,
  "drawbox=x=110:y=290:w=300:h=14:color=#ffffff@0.22:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x=410:y=304:w=340:h=14:color=#ffffff@0.22:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x=750:y=318:w=300:h=14:color=#ffffff@0.22:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x=126:y=275:w=34:h=34:color=#6f9a83@0.96:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x=546:y=289:w=34:h=34:color=#d7c97e@0.96:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x=1012:y=303:w=34:h=34:color=#e07a3f@0.96:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x=112:y=540:w=1056:h=18:color=#ffffff@0.14:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x=112:y=540:w='min(1056,max(0,(t-22.9)*170))':h=18:color=#3f647b@0.97:t=fill:enable='between(t,22.5,30)'",
  "drawbox=x='112+min(1056,max(0,(t-22.9)*170))-14':y=536:w=28:h=26:color=#e07a3f@0.98:t=fill:enable='between(t,22.5,30)'",

  // Footer label
  `drawtext=fontfile='${fontPath}':text='30s Product Walkthrough':fontcolor=#d8e8ff:fontsize=20:x=80:y=680`,
].join(',');

const args = [
  '-y',
  '-f',
  'lavfi',
  '-i',
  filter,
  '-r',
  '30',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  outputPath,
];

const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`Created demo video: ${outputPath}`);
