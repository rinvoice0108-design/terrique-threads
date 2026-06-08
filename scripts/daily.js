import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generatePosts } from './generate.js';
import { sendEmail } from './send-email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function saveLog(data) {
  const today = new Date().toISOString().slice(0, 10);
  const dir = join(ROOT, 'output');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${today}.json`), JSON.stringify(data, null, 2), 'utf-8');
  console.log(`로그 저장 → output/${today}.json`);
}

async function run() {
  console.log(`[${new Date().toLocaleString('ko-KR')}] 테리크 스레드 데일리 시작`);

  try {
    console.log('1/2 Claude로 포스트 생성 중...');
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
