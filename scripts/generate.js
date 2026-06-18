import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getTodayTopic() {
  const topics = JSON.parse(readFileSync(join(ROOT, 'topics.json'), 'utf-8'));
  const start = new Date(new Date().getFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return topics[dayOfYear % topics.length];
}

function load(filename) {
  return readFileSync(join(ROOT, 'knowledge', filename), 'utf-8');
}

export async function generatePosts() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 .env에 없습니다.');

  const brand      = load('brand.md');
  const towelFacts = load('towel-facts.md');
  const styleGuide = load('threads-style-guide.md');
  const hooks      = load('hooks.md');

  const topic = getTodayTopic();
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const prompt = `당신은 테리크 브랜드 Threads 전문 작가입니다.
수건 전문 지식을 바탕으로 스크롤을 멈추는 포스트 5개를 작성합니다.

## 브랜드
${brand}

## 수건 전문 지식
${towelFacts}

## Threads 스타일 레퍼런스
${styleGuide}

## 훅 패턴 (hook 필드에 반드시 적용)
${hooks}

---

오늘 날짜: ${today}
주제: ${topic.theme} — ${topic.angle}

## 작성 규칙
- hook: 훅 패턴에서 골라 이 주제에 맞게 변형한 첫 한 줄. 본문 없이도 스크롤이 멈춰야 함
- content: hook 다음에 오는 본문 + 해시태그 (hook 문장 제외, 200~380자)
- 구체적 수치 필수 (GSM, 온도, 소재명, 퍼센트 등)
- 막연한 표현 금지 — 이유·근거 명확히
- 단락 2~3줄 이하, 빈 줄로 호흡
- 이모지 1~2개, 문장 끝에만
- 해시태그 3~4개 (브랜드 1 + 주제 2~3)
- "오늘은 ~에 대해 알아볼게요" 절대 금지
- AI 나열식 표현("다양한", "효과적인") 금지

## 5개 포스트 유형
1. 감성/공감형 — 올리브영 스타일. 오늘 날짜/계절로 시작, 친근한 공감
2. 통념파괴형 — "아직도 이렇게 하세요?" 잘못된 상식을 깨고 올바른 해결책 제시
3. 정보/팁형 — Notion 스타일. 번호 구조, 저장하고 싶은 구체적 팁
4. 스토리텔링형 — 경험담처럼 시작해서 자연스럽게 제품으로 연결, 광고 느낌 X
5. 제품/CTA형 — Lush 스타일. 철학/인증 자연스럽게, 강요 없는 권유

아래 JSON만 응답 (코드블록 없이):

{
  "topic": "${topic.theme}",
  "date": "${today}",
  "posts": [
    { "type": "감성/공감형",  "hook": "첫 한 줄 훅", "content": "본문 + 해시태그", "best_time": "오전 8-9시" },
    { "type": "통념파괴형",  "hook": "첫 한 줄 훅", "content": "본문 + 해시태그", "best_time": "오전 11-12시" },
    { "type": "정보/팁형",   "hook": "첫 한 줄 훅", "content": "본문 + 해시태그", "best_time": "오후 12-1시" },
    { "type": "스토리텔링형", "hook": "첫 한 줄 훅", "content": "본문 + 해시태그", "best_time": "오후 5-7시" },
    { "type": "제품/CTA형",  "hook": "첫 한 줄 훅", "content": "본문 + 해시태그", "best_time": "오후 7-9시" }
  ]
}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 3000 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API 오류 ${res.status}: ${err}`);
  }

  const json = await res.json();
  const raw = json.candidates[0].content.parts[0].text.trim();
  const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  return JSON.parse(jsonStr);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await generatePosts();
  console.log(JSON.stringify(result, null, 2));
}
