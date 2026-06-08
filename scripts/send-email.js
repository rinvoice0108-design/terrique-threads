import 'dotenv/config';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

function buildHtml(data) {
  const styleCard = 'background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px 24px;margin-bottom:20px;';
  const styleBadge = `display:inline-block;background:#A08878;color:#fff;font-size:11px;padding:3px 10px;border-radius:20px;margin-bottom:12px;`;
  const styleContent = 'font-size:15px;line-height:1.7;color:#333;white-space:pre-wrap;word-break:break-word;';
  const styleTime = 'margin-top:12px;font-size:12px;color:#999;';

  const cards = data.posts.map((p, i) => `
    <div style="${styleCard}">
      <span style="${styleBadge}">${i + 1}. ${p.type}</span>
      ${p.ref_brand ? `<span style="display:inline-block;background:#f0ebe7;color:#A08878;font-size:11px;padding:3px 10px;border-radius:20px;margin-bottom:12px;margin-left:6px;">ref. ${p.ref_brand}</span>` : ''}
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
      { type: '감성/공감형', content: '하루의 시작, 포근한 수건 한 장이 기분을 바꿉니다.\n\n아침마다 보송보송한 수건을 쓰는 것만으로도\n작은 사치를 누리는 느낌이 들지 않으신가요?\n\n테리크와 함께 소중한 일상을 더해보세요.\n\n#테리크 #수건 #호텔수건 #소확행', best_time: '오전 8-9시' },
      { type: '정보/팁형', content: '수건이 딱딱해졌다면 유연제 때문일 수 있어요.\n\n유연제는 섬유 코팅으로 흡수력을 낮춥니다.\n대신 식초 1큰술을 헹굼물에 넣어보세요.\n\n부드러움도 살고 냄새도 잡힙니다.\n\n#수건관리 #세탁꿀팁 #테리크 #생활정보', best_time: '오후 12-1시' },
      { type: '제품/CTA형', content: '오코텍스 인증 — 유해물질 없는 안전한 소재.\n\n테리크 수건은 피부에 닿는 모든 것을\n철저하게 검증합니다.\n\n집에서 누리는 호텔의 품격, 지금 만나보세요.\n\n#테리크 #오코텍스 #호텔수건 #안심소재', best_time: '오후 7-9시' },
    ],
  };
  await sendEmail(dummy, isTest);
}
