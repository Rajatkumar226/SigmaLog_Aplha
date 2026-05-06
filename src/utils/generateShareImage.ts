export type SharePeriod = 'daily' | 'weekly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface ShareImageData {
  period: SharePeriod;
  streak: number;
  // For non-daily periods
  avgScore: number;
  daysLogged: number;
  totalDays: number;
  perfectDays: number;
  // For daily
  todayScore: number;
  todayMaxScore: number;
  habitsCompleted: number;
  totalHabits: number;
}

const PERIOD_LABEL: Record<SharePeriod, string> = {
  daily:      'TODAY',
  weekly:     'THIS WEEK',
  quarterly:  'THIS QUARTER',
  half_yearly:'HALF YEAR',
  yearly:     'THIS YEAR',
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const S = 1080;

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, S, S);

  const glow = ctx.createRadialGradient(S * 0.5, S * 0.3, 0, S * 0.5, S * 0.3, S * 0.6);
  glow.addColorStop(0,   'rgba(99,102,241,0.20)');
  glow.addColorStop(0.5, 'rgba(59,130,246,0.07)');
  glow.addColorStop(1,   'rgba(10,14,26,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  const line = ctx.createLinearGradient(0, 0, S, 0);
  line.addColorStop(0,   'rgba(99,102,241,0)');
  line.addColorStop(0.3, 'rgba(99,102,241,0.9)');
  line.addColorStop(0.7, 'rgba(139,92,246,0.9)');
  line.addColorStop(1,   'rgba(139,92,246,0)');
  ctx.fillStyle = line;
  ctx.fillRect(0, 0, S, 5);
}

function drawHeader(ctx: CanvasRenderingContext2D, period: SharePeriod) {
  ctx.font = `700 40px ${FONT}`;
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('SigmaLog', 80, 112);

  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = '#6366f1';
  ctx.textAlign = 'right';
  ctx.fillText(PERIOD_LABEL[period], S - 80, 112);
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, y);
  ctx.lineTo(S - 80, y);
  ctx.stroke();
}

function drawStats(
  ctx: CanvasRenderingContext2D,
  statsY: number,
  stats: { value: string; label: string }[],
) {
  const cols =
    stats.length === 3
      ? [S * 0.20, S * 0.50, S * 0.80]
      : [S * 0.25, S * 0.75];

  stats.forEach((s, i) => {
    ctx.font = `700 64px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(s.value, cols[i], statsY);

    ctx.font = `400 27px ${FONT}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(s.label, cols[i], statsY + 46);
  });

  // Vertical dividers
  const divPositions =
    stats.length === 3 ? [S * 0.355, S * 0.645] : [S * 0.50];
  divPositions.forEach(x => {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, statsY - 46);
    ctx.lineTo(x, statsY + 54);
    ctx.stroke();
  });
}

function drawProgressBar(ctx: CanvasRenderingContext2D, y: number, fill: number) {
  const barW = S - 160;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, 80, y, barW, 8, 4);
  ctx.fill();

  if (fill > 0) {
    const grad = ctx.createLinearGradient(80, 0, 80 + barW, 0);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    roundRect(ctx, 80, y, barW * Math.min(fill, 1), 8, 4);
    ctx.fill();
  }
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  // Marketing line 1
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'center';
  ctx.fillText('Install SigmaLog → sigmalog.vercel.app', S / 2, S - 72);

  // Marketing line 2
  ctx.font = `400 24px ${FONT}`;
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.fillText('Discipline creates freedom.', S / 2, S - 38);
}

// ── Daily card ────────────────────────────────────────────────────────────────
function drawDailyCard(ctx: CanvasRenderingContext2D, data: ShareImageData) {
  const pct = data.todayMaxScore > 0
    ? Math.round((data.todayScore / data.todayMaxScore) * 100)
    : 0;

  drawHeader(ctx, 'daily');

  // Date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  ctx.font = `400 32px ${FONT}`;
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'center';
  ctx.fillText(today, S / 2, 180);

  // Score percentage hero
  const numGrad = ctx.createLinearGradient(S * 0.3, 0, S * 0.7, 0);
  numGrad.addColorStop(0, '#a5b4fc');
  numGrad.addColorStop(1, '#ffffff');
  ctx.font = `800 240px ${FONT}`;
  ctx.fillStyle = numGrad;
  ctx.textAlign = 'center';
  ctx.fillText(`${pct}%`, S / 2, S * 0.52);

  ctx.font = `600 44px ${FONT}`;
  ctx.fillStyle = '#64748b';
  ctx.fillText("today's score", S / 2, S * 0.60);

  drawDivider(ctx, S * 0.675);

  drawStats(ctx, S * 0.775, [
    { value: `${data.habitsCompleted}/${data.totalHabits}`, label: 'habits done' },
    { value: `${data.streak}`, label: 'day streak' },
    { value: `${pct >= 100 ? '✓' : pct + '%'}`, label: 'completion' },
  ]);

  drawProgressBar(ctx, S * 0.875, pct / 100);
  drawFooter(ctx);
}

// ── Period card (weekly / quarterly / half-yearly / yearly) ───────────────────
function drawPeriodCard(ctx: CanvasRenderingContext2D, data: ShareImageData) {
  drawHeader(ctx, data.period);

  // Decorative rings behind streak number
  ctx.beginPath();
  ctx.arc(S / 2, S * 0.42, 170, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(99,102,241,0.10)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(S / 2, S * 0.42, 144, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(99,102,241,0.05)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Streak number
  const digits = data.streak.toString();
  const fontSize = digits.length <= 2 ? 210 : digits.length === 3 ? 170 : 140;
  const numGrad = ctx.createLinearGradient(S * 0.3, 0, S * 0.7, 0);
  numGrad.addColorStop(0, '#a5b4fc');
  numGrad.addColorStop(1, '#ffffff');
  ctx.font = `800 ${fontSize}px ${FONT}`;
  ctx.fillStyle = numGrad;
  ctx.textAlign = 'center';
  ctx.fillText(digits, S / 2, S * 0.505);

  ctx.font = `600 46px ${FONT}`;
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('day streak', S / 2, S * 0.597);

  drawDivider(ctx, S * 0.665);

  drawStats(ctx, S * 0.770, [
    { value: `${data.avgScore}%`, label: 'avg score' },
    { value: `${data.daysLogged}/${data.totalDays}`, label: 'days logged' },
    { value: `${data.perfectDays}`, label: 'perfect days' },
  ]);

  drawProgressBar(ctx, S * 0.875, data.avgScore / 100);
  drawFooter(ctx);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function generateShareImage(data: ShareImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas not supported')); return; }

    drawBackground(ctx);

    if (data.period === 'daily') {
      drawDailyCard(ctx, data);
    } else {
      drawPeriodCard(ctx, data);
    }

    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate image'));
    }, 'image/png');
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
