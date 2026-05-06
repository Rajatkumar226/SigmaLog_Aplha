export interface ShareImageData {
  streak: number;
  period: 'week' | 'month' | 'quarter' | 'year';
  avgScore: number;      // 0–100
  daysLogged: number;
  totalDays: number;
  perfectDays: number;
}

const PERIOD_LABEL: Record<ShareImageData['period'], string> = {
  week: 'THIS WEEK',
  month: 'THIS MONTH',
  quarter: 'THIS QUARTER',
  year: 'THIS YEAR',
};

export function generateShareImage(data: ShareImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const S = 1080;
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas not supported')); return; }

    // ── Background ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, S, S);

    // Radial glow (top-centre)
    const glow = ctx.createRadialGradient(S * 0.5, S * 0.28, 0, S * 0.5, S * 0.28, S * 0.55);
    glow.addColorStop(0, 'rgba(99,102,241,0.22)');
    glow.addColorStop(0.55, 'rgba(59,130,246,0.08)');
    glow.addColorStop(1, 'rgba(10,14,26,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, S, S);

    // ── Top accent line ───────────────────────────────────────────────────────
    const accentLine = ctx.createLinearGradient(0, 0, S, 0);
    accentLine.addColorStop(0,   'rgba(99,102,241,0)');
    accentLine.addColorStop(0.3, 'rgba(99,102,241,0.9)');
    accentLine.addColorStop(0.7, 'rgba(139,92,246,0.9)');
    accentLine.addColorStop(1,   'rgba(139,92,246,0)');
    ctx.fillStyle = accentLine;
    ctx.fillRect(0, 0, S, 5);

    const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif';

    // ── Header row ────────────────────────────────────────────────────────────
    ctx.font = `700 42px ${FONT}`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('SigmaLog', 80, 118);

    ctx.font = `700 30px ${FONT}`;
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'right';
    ctx.fillText(PERIOD_LABEL[data.period], S - 80, 118);

    // ── Streak hero ───────────────────────────────────────────────────────────
    // Decorative ring
    ctx.beginPath();
    ctx.arc(S / 2, S * 0.42, 170, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99,102,241,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(S / 2, S * 0.42, 145, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99,102,241,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Streak number (gradient fill)
    const digits = data.streak.toString();
    const fontSize = digits.length <= 2 ? 210 : digits.length === 3 ? 170 : 140;
    ctx.font = `800 ${fontSize}px ${FONT}`;
    ctx.textAlign = 'center';
    const numGrad = ctx.createLinearGradient(S * 0.3, 0, S * 0.7, 0);
    numGrad.addColorStop(0, '#a5b4fc');
    numGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = numGrad;
    ctx.fillText(digits, S / 2, S * 0.50);

    // Label beneath number
    ctx.font = `600 46px ${FONT}`;
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('day streak', S / 2, S * 0.595);

    // ── Divider ───────────────────────────────────────────────────────────────
    const divY = S * 0.665;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, divY);
    ctx.lineTo(S - 80, divY);
    ctx.stroke();

    // ── Stats row ─────────────────────────────────────────────────────────────
    const statsY = S * 0.77;
    const cols = [S * 0.20, S * 0.50, S * 0.80];
    const stats = [
      { value: `${data.avgScore}%`, label: 'avg score' },
      { value: `${data.daysLogged}/${data.totalDays}`, label: 'days logged' },
      { value: data.perfectDays.toString(), label: 'perfect days' },
    ];

    stats.forEach((s, i) => {
      ctx.font = `700 66px ${FONT}`;
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.fillText(s.value, cols[i], statsY);

      ctx.font = `400 28px ${FONT}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(s.label, cols[i], statsY + 48);
    });

    // Vertical dividers between stats
    [S * 0.355, S * 0.645].forEach(x => {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, statsY - 48);
      ctx.lineTo(x, statsY + 56);
      ctx.stroke();
    });

    // ── Progress bar ──────────────────────────────────────────────────────────
    const barY = S * 0.875;
    const barW = S - 160;
    const barH = 8;
    const barFill = Math.max(0, Math.min(1, data.avgScore / 100));

    // Track
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 80, barY, barW, barH, 4);
    ctx.fill();

    // Fill
    if (barFill > 0) {
      const barGrad = ctx.createLinearGradient(80, 0, 80 + barW, 0);
      barGrad.addColorStop(0, '#6366f1');
      barGrad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = barGrad;
      roundRect(ctx, 80, barY, barW * barFill, barH, 4);
      ctx.fill();
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    ctx.font = `400 28px ${FONT}`;
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText('sigmalog.vercel.app  ·  discipline in progress', S / 2, S - 48);

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
