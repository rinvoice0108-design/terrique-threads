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

function loadBrand() {
  return readFileSync(join(ROOT, 'knowledge', 'brand.md'), 'utf-8');
}

function loadStyleGuide() {
  return readFileSync(join(ROOT, 'knowledge', 'threads-style-guide.md'), 'utf-8');
}

export async function generatePosts() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 .env에 없습니다.');

  const brand = loadBrand();
  const styleGuide = loadStyleGuide();
  const topic = getTodayTopic();
  const count = parseInt(process.env.POST_COUNT || '3');

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const prompt = `당신은 테리크 브랜드의 스레드(Threads) SNS 담당자입니다.
Threads에서 실제로 반응이 좋은 브랜드들의 패턴을 학습한 전문가입니다.

## 브랜드 정보
${brand}

## Threads 잘하는 브랜드 스타일 레퍼런스
${styleGuide}

## 오늘 날짜
${today}

## 오늘의 주제
- 테마: ${topic.theme}
- 각도: ${topic.angle}

## 작성 지침
- 스레드 포스트 ${count}개를 작성하세요
- 각 포스트는 위 레퍼런스 브랜드의 핵심 패턴을 적용하세요:
  1번 (감성/공감형): 올리브영 스타일 — 오늘 날짜/계절로 공감 시작, 친근한 말투
  2번 (정보/팁형): Notion 스타일 — 번호 구조, 저장하고 싶은 실용 팁
  3번 (제품/CTA형): Lush 스타일 — 철학/인증 자연스럽게, 강요 없는 권유
- 첫 줄은 반드시 스크롤을 멈추게 하는 훅으로 시작 (질문/숫자/공감/반전 중 하나)
- "오늘은 ~에 대해 알아볼게요" 같은 진부한 시작 절대 금지
- 단락은 2~3줄 이하로 짧게, 공백으로 호흡 조절
- 마지막은 댓글 유도형 질문이나 부드러운 권유로 마무리
- 각 포스트는 200~420자 (해시태그 포함)
- 해시태그는 포스트 마지막에 3~4개만 (브랜드 태그 1개 + 주제 2~3개)
- 이모지는 전체 포스트에 1~2개만, 문장 끝에만 사용
- 반드시 아래 JSON 형식으로만 응답하세요 (코드블록 없이 순수 JSON만)

{
  "topic": "${topic.theme}",
  "date": "${today}",
  "posts": [
    {
      "type": "감성/공감형",
      "ref_brand": "올리브영",
      "content": "포스트 본문 + 해시태그",
      "best_time": "오전 8-9시"
    },
    {
      "type": "정보/팁형",
      "ref_brand": "Notion",
      "content": "포스트 본문 + 해시태그",
      "best_time": "오후 12-1시"
    },
    {
      "type": "제품/CTA형",
      "ref_brand": "Lush",
      "content": "포스트 본문 + 해시태그",
      "best_time": "오후 7-9시"
    }
  ]
}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
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

// 직접 실행 시 테스트 출력
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await generatePosts();
  console.log(JSON.stringify(result, null, 2));
}
