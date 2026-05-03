import { motion } from 'motion/react';
import type { DailyLog, Habit } from '../App';
import '../styles/ShadowStats.scss';

interface ShadowStatsProps {
  dailyLogs: DailyLog[];
  habits: Habit[];
}

export function ShadowStats({ dailyLogs, habits }: ShadowStatsProps) {
  if (dailyLogs.length === 0 || habits.length === 0) return null;

  const today = new Date().toISOString().split('T')[0];
  const firstLogDate = [...dailyLogs].map(l => l.date).sort()[0];

  const start = new Date(firstLogDate);
  const end = new Date(today);
  const daysSinceStart = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const currentMaxScore = habits.reduce((sum, h) => sum + h.points, 0);

  const logsWithData = dailyLogs.filter(l => l.maxScore > 0);
  const actualPerfectDays = logsWithData.filter(l => l.score === l.maxScore).length;
  const actualTotalScore = logsWithData.reduce((sum, l) => sum + l.score, 0);
  const actualStreak = (() => {
    const sorted = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
    let s = 0;
    for (const log of sorted) {
      if (log.score > 0 && log.score === log.maxScore) s++;
      else break;
    }
    return s;
  })();
  const actualAvg = logsWithData.length > 0
    ? Math.round(logsWithData.reduce((sum, l) => sum + (l.score / l.maxScore) * 100, 0) / logsWithData.length)
    : 0;

  const shadowStreak = daysSinceStart;
  const shadowPerfectDays = daysSinceStart;
  const shadowTotalScore = currentMaxScore * daysSinceStart;
  const shadowAvg = 100;

  const gapScore = shadowTotalScore > 0 ? shadowTotalScore - actualTotalScore : 0;
  const gapPct = shadowTotalScore > 0
    ? Math.round((gapScore / shadowTotalScore) * 100)
    : 0;

  const rows = [
    { label: 'Streak',         actual: actualStreak,      shadow: shadowStreak,      suffix: ' days', color: '#10b981' },
    { label: 'Perfect Days',   actual: actualPerfectDays,  shadow: shadowPerfectDays, suffix: ' days', color: '#3b82f6' },
    { label: 'Avg Completion', actual: actualAvg,          shadow: shadowAvg,         suffix: '%',     color: '#f59e0b' },
    { label: 'Total Score',    actual: actualTotalScore,   shadow: shadowTotalScore,  suffix: ' pts',  color: '#a855f7' },
  ];

  return (
    <div className="shadow-stats">
      <div className="shadow-stats__header">
        <h3 className="shadow-stats__title">Shadow Stats</h3>
        <span className="shadow-stats__badge">Ghost of your best self</span>
      </div>

      <p className="shadow-stats__subtitle">
        You started <span className="days">{daysSinceStart} day{daysSinceStart !== 1 ? 's' : ''} ago</span>.
        {gapPct > 0
          ? <> You left <span className="gap-pct">{gapPct}%</span> on the table.</>
          : <span className="perfect"> Perfect consistency.</span>
        }
      </p>

      <div className="shadow-stats__legend">
        <div className="shadow-stats__legend-item">
          <div className="shadow-stats__legend-dot shadow-stats__legend-dot--actual" />
          <span>Your Reality</span>
        </div>
        <div className="shadow-stats__legend-item">
          <div className="shadow-stats__legend-dot shadow-stats__legend-dot--shadow" />
          <span>Shadow You</span>
        </div>
      </div>

      <div className="shadow-stats__rows">
        {rows.map((row) => {
          const pct = row.shadow > 0 ? Math.min((row.actual / row.shadow) * 100, 100) : 0;

          return (
            <div key={row.label} className="shadow-stats__row">
              <div className="shadow-stats__row-header">
                <span className="shadow-stats__row-label">{row.label}</span>
                <div className="shadow-stats__row-values">
                  <span className="shadow-stats__row-actual" style={{ color: row.color }}>
                    {row.actual}{row.suffix}
                  </span>
                  <span className="shadow-stats__row-sep">/</span>
                  <span className="shadow-stats__row-shadow">{row.shadow}{row.suffix}</span>
                </div>
              </div>

              <div className="shadow-stats__row-track">
                <div className="shadow-stats__row-track-bg" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="shadow-stats__row-track-fill"
                  style={{
                    background: `linear-gradient(to right, ${row.color}aa, ${row.color})`,
                    boxShadow: `0 0 10px ${row.color}44`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {gapScore > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="shadow-stats__gap-callout"
        >
          <p>
            Your shadow self scored{' '}
            <strong>{gapScore} more points</strong>.
            {' '}That gap is your target.
          </p>
        </motion.div>
      )}

      {gapPct === 0 && daysSinceStart > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="shadow-stats__perfect-callout"
        >
          <p>You ARE the shadow. Sigma behavior confirmed. 🗿</p>
        </motion.div>
      )}
    </div>
  );
}
