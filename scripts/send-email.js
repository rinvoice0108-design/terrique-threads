import 'dotenv/config';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

function buildHtml(data) {
  const styleCard = 'background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px 24px;margin-bottom:20px;';
  const styleBadge = `display:inline-block;background:#A08878;color:#fff;font-size:11px;padding:3px 10px;border-radius:20px;margin-bottom:12px;`;
  const styleContent = 'font-size:15px;line-height:1.7;color:#333;white-space:pre-wrap;word-break:break-word;';
  const styleTime = 'margin-top:12px;font-size:12px;color:#999;';

  const styleHook = 'font-size:17px;font-weight:700;color:#1A1A1A;line-height:1.5;margin:0 0 14px;padding:12px 16px;background:#f7f4f1;border-left:3px solid #A08878;border-radius:4px;white-space:pre-wrap;';

  const cards = data.posts.map((p, i) => `
    <div style="${styleCard}">
      <span style="${styleBadge}">${i + 1}. ${p.type}</span>
      ${p.hook ? `<p style="${styleHook}">${p.hook.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
      <p style="${styleContent}">${p.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      <p style="${styleTime}">⏰ 추천 발행 시간: ${p.best_time}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:28px;">
      <p style="font-size:12px;color:#A08878;letter-spacing:2px;margin:0 0 6px;">TERRIQUE THREADS</p>
      <h1 style="font-size:22px;color:#1A1A1A;margin:0 0 6px;">오늘의 스레드 포스트</h1>
      <p style="font-size:13px;color:#888;margin:0;">${data.date} &nbsp;·&nbsp; 주제: ${data.topic}</p>
    </div>
    ${cards}
    <div style="text-align:center;padding:20px 0;border-top:1px solid #e5e5e5;margin-top:8px;">
      <p style="font-size:12px;color:#bbb;margin:0;">테리크 스레드 데일리 · 자동 생성 by Claude AI</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail(data, isTest = false) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const to = isTest ? process.env.EMAIL_USER : process.env.EMAIL_TO;
  const subjectPrefix = isTest ? '[테스트] ' : '';

  await transporter.sendMail({
    from: `"테리크 스레드 봇" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${subjectPrefix}[테리크 스레드] ${data.date} — ${data.topic}`,
    html: buildHtml(data),
  });

  console.log(`이메일 발송 완료 → ${to}`);
}

// 직접 실행 시 더미 테스트
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isTest = process.argv.includes('--test');
  const dummy = {
    topic: '테스트 주제',
    date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
    posts: [
      { type: '감성/공감형',  hook: '하루의 시작과 끝, 가장 자주 만나는 게 수건이라는 거 알고 계셨나요?', content: '아침 샤워 후, 잠들기 전 세면대 앞에서.\n\n하루에 두 번은 꼭 손에 쥐는 수건인데\n정작 고를 때는 대충 넘기는 경우가 많잖아요.\n\n테리크와 함께 소중한 일상을 더해보세요.\n\n#테리크 #수건 #호텔수건 #소확행', best_time: '오전 8-9시' },
      { type: '통념파괴형',  hook: '아직도 수건에 섬유유연제 쓰세요?', content: '사실 유연제는 수건에 독입니다.\n\n유연제 속 계면활성제가 면 루프를 코팅해서\n흡수력을 최대 50%까지 낮춰버리거든요.\n\n대신 헹굼 단계에 식초 반 컵만 넣어보세요.\n섬유가 부드러워지고 냄새까지 잡힙니다.\n\n#수건관리 #세탁꿀팁 #테리크 #생활정보', best_time: '오전 11-12시' },
      { type: '정보/팁형',   hook: '수건 냄새 없애는 방법, 3가지면 충분합니다', content: '1. 세탁 후 30분 내 꺼내기 — 방치할수록 세균 증식\n2. 건조기 저온 10분 — 루프가 펴지며 냄새 날아감\n3. 월 1회 60℃ 고온 세탁 — 세균 리셋\n\n식초 반 컵은 보너스로 넣어주세요.\n\n이것만 지켜도 수건 수명 2배 늘어납니다.\n\n#수건세탁 #수건냄새 #테리크 #생활꿀팁', best_time: '오후 12-1시' },
      { type: '스토리텔링형', hook: '돌잔치 답례품 뭐 드릴까 고민하다 수건으로 정했어요', content: '솔직히 처음엔 수건이 밋밋하게 느껴졌거든요.\n\n근데 생각해보니 어른도 아이도 매일 쓰고,\n실용적인데 고급스러울 수 있는 게 수건이더라고요.\n\n자수로 아이 이름 넣고 선물 포장까지 하니까\n받은 분들이 생각보다 훨씬 좋아하셨어요.\n\n#돌잔치답례품 #수건답례품 #테리크 #자수수건', best_time: '오후 5-7시' },
      { type: '제품/CTA형',  hook: '좋은 수건의 기준, 생각해보신 적 있으세요?', content: '부드러움? 흡수력? 가격?\n\n테리크는 거기에 하나를 더합니다.\n안전함 — OEKO-TEX 인증으로 유해물질 검사를 통과한 소재만 씁니다.\n\n집에서 누리는 호텔의 품격,\n한 번 써보시면 차이가 느껴질 거예요.\n\n#테리크 #오코텍스 #호텔수건 #안전한수건', best_time: '오후 7-9시' },
    ],
  };
  await sendEmail(dummy, isTest);
}
