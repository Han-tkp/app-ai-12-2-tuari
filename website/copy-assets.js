import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, 'icons', 'icon.png');
const sourceScreenshotsDir = path.join(__dirname, 'image-appdrpai');

const targets = [
  path.join(__dirname, 'public'),
  path.join(__dirname, 'dist'),
];

targets.forEach((targetDir) => {
  const targetIcon = path.join(targetDir, 'icon.png');
  const targetScreenshotsDir = path.join(targetDir, 'screenshots');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  if (!fs.existsSync(targetScreenshotsDir)) {
    fs.mkdirSync(targetScreenshotsDir, { recursive: true });
  }

  if (fs.existsSync(sourceIcon)) {
    fs.copyFileSync(sourceIcon, targetIcon);
    console.log(`Copied ${sourceIcon} -> ${targetIcon}`);
  }

  for (let i = 1; i <= 7; i++) {
    const filename = `imageappdrpai (${i}).png`;
    const src = path.join(sourceScreenshotsDir, filename);
    const dest = path.join(targetScreenshotsDir, filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${src} -> ${dest}`);
    } else {
      console.error(`Source screenshot missing: ${src}`);
    }
  }
});

console.log('Asset copy complete for public and dist!');
