import 'dotenv/config';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generatePosts } from './generate.js';
import { sendEmail } from './send-email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function todayKST() {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\. /g, '-').replace('.', '');
}

function isHoliday(dateStr) {
  const { holidays } = JSON.parse(readFileSync(join(ROOT, 'holidays.json'), 'utf-8'));
  return holidays.includes(dateStr);
}

function saveLog(data) {
  const dir = join(ROOT, 'output');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${todayKST()}.json`), JSON.stringify(data, null, 2), 'utf-8');
  console.log(`로그 저장 → output/${todayKST()}.json`);
}

async function run() {
  const today = todayKST();
  console.log(`[${today}] 테리크 스레드 데일리 시작`);

  if (isHoliday(today)) {
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
