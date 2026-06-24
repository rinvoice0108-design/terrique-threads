import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generatePosts } from './generate.js';
import { sendEmail } from './send-email.js';
import { getHolidays } from './holidays.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function todayKST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

function saveLog(data) {
  const dir = join(ROOT, 'output');
  mkdirSync(dir, { recursive: true });
  const today = todayKST();
  writeFileSync(join(dir, `${today}.json`), JSON.stringify(data, null, 2), 'utf-8');
  console.log(`로그 저장 → output/${today}.json`);
}

async function run() {
  const today = todayKST();
  console.log(`[${today}] 테리크 스레드 데일리 시작`);

  const logFile = join(ROOT, 'output', `${today}.json`);
  if (existsSync(logFile)) {
    console.log(`오늘(${today}) 이미 발송 완료. 건너뜁니다.`);
    process.exit(0);
  }

  const holidays = await getHolidays();
  if (holidays.includes(today)) {
    console.log(`오늘(${today})은 공휴일입니다. 발송을 건너뜁니다.`);
    process.exit(0);
  }

  try {
    console.log('1/2 Gemini로 포스트 생성 중...');
    const data = await generatePosts();

    console.log('2/2 이메일 발송 중...');
    await sendEmail(data);

    saveLog(data);
    console.log('완료.');
  } catch (err) {
    console.error('오류 발생:', err.message);
    process.exit(1);
  }
}

run();
