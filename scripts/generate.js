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
  const structures = load('structures.md');

  const topic = getTodayTopic();
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const prompt = `당신은 테리크 브랜드 Threads 전문 작가입니다.
숏폼 영상 원고에서 검증된 구조로 스크롤을 멈추는 포스트 5개를 작성합니다.

## 브랜드 정보
${brand}

## 수건 전문 지식 (수치·근거 여기서만 인용)
${towelFacts}

## Threads 플랫폼 스타일 가이드
${styleGuide}

## 훅 패턴 (hook 필드에 반드시 적용)
${hooks}

## 검증된 포스트 구조 (각 유형에 맞는 구조 엄격히 적용)
${structures}

---

오늘 날짜: ${today}
주제: ${topic.theme} — ${topic.angle}

## 절대 규칙
- hook: 훅 패턴에서 골라 주제에 맞게 변형한 첫 한 줄. 독립적으로 읽어도 스크롤이 멈춰야 함
- content: hook을 제외한 본문 + 해시태그 (200~380자)
- 구체적 수치 필수: GSM, 온도(℃), 소재명, 인증명, 퍼센트 — 근거 없는 수치 절대 금지
- 단락 2~3줄 이하, 빈 줄로 호흡 (모바일 가독성)
- 이모지 1~2개, 문장 끝에만
- 해시태그 3~4개 (브랜드 1 + 주제 2~3)
- 금지 표현: "오늘은 ~에 대해 알아볼게요", "다양한", "효과적인", "~드립니다"
- 구어체로 소리 내어 읽었을 때 자연스러운 것만
- 5개 포스트 전부 반드시 작성 (누락 금지)

## 5개 포스트 유형 및 적용 구조
1. 감성/공감형 → 구조 5 적용. 오늘 날짜/계절로 시작, 친근한 공감, 시그니처 표현 1개 포함
2. 통념파괴형 → 구조 1 적용. "아직도 이렇게 하세요?" 잘못된 상식 → 근거(수치) → 올바른 방법
3. 정보/팁형 → 구조 2 적용. 번호 리스트, 각 팁에 수치 포함, 저장하고 싶은 밀도
4. 스토리텔링형 → 구조 3 적용. "얼마 전에~" 경험담으로 시작, 광고 느낌 없이 제품 연결
5. 제품/CTA형 → 구조 4 적용. 고민 → 해결책(수치+인증) → 부드러운 권유

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

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: 3000 },
  });

  const MAX_RETRIES = 4;
  const RETRY_DELAYS = [5000, 15000, 30000, 60000];
  let res;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (res.ok || res.status !== 503) break;
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt];
      console.log(`Gemini 503 — ${delay / 1000}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

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
