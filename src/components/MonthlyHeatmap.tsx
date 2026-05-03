import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as logService from '../services/logService';
import type { DailyLog } from '../App';
import '../styles/MonthlyHeatmap.scss';

interface MonthlyHeatmapProps {
  dailyLogs: DailyLog[];
  joinDate?: string;
}

const localDateStr = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const todayLocal = () => {
  const n = new Date();
  return localDateStr(n.getFullYear(), n.getMonth(), n.getDate());
};

export function MonthlyHeatmap({ dailyLogs, joinDate }: MonthlyHeatmapProps) {
  const now = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed

  const [viewYear,  setViewYear]  = useState(curYear);
  const [viewMonth, setViewMonth] = useState(curMonth);
  const [fetchedData, setFetchedData] = useState<{ date: string; score: number; maxScore: number }[] | null>(null);
  const [fetching, setFetching]   = useState(false);

  const isCurrentMonth = viewYear === curYear && viewMonth === curMonth;

  // Earliest navigable month (join date or 12 months ago)
  const minDate = (() => {
    if (joinDate) {
      const d = new Date(joinDate);
      return { y: d.getFullYear(), m: d.getMonth() };
    }
    const lim = new Date(curYear, curMonth - 11, 1);
    return { y: lim.getFullYear(), m: lim.getMonth() };
  })();

  const canGoPrev = !(viewYear === minDate.y && viewMonth === minDate.m) &&
                    !(viewYear < minDate.y);
  const canGoNext = !isCurrentMonth;

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0)  { m += 12; y--; }
    if (m > 11) { m -= 12; y++; }
    setViewYear(y);
    setViewMonth(m);
  };

  // Fetch data for non-current months
  useEffect(() => {
    if (isCurrentMonth) { setFetchedData(null); return; }

    let cancelled = false;
    setFetching(true);
    logService.getMonthlyHeatmap(viewYear, viewMonth + 1).then(res => {
      if (cancelled) return;
      setFetchedData(res.success && res.data ? res.data : []);
      setFetching(false);
    }).catch(() => {
      if (!cancelled) { setFetchedData([]); setFetching(false); }
    });
    return () => { cancelled = true; };
  }, [viewYear, viewMonth, isCurrentMonth]);

  // Build cell data
  const firstDay    = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayStr    = todayLocal();

  const dataSource: { date: string; score: number; maxScore: number }[] = isCurrentMonth
    ? dailyLogs.map(l => ({ date: l.date, score: l.score, maxScore: l.maxScore }))
    : (fetchedData ?? []);

  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const day     = i + 1;
    const dateStr = localDateStr(viewYear, viewMonth, day);
    const log     = dataSource.find(l => l.date === dateStr);
    const pct     = log && log.maxScore > 0 ? (log.score / log.maxScore) * 100 : 0;

    let status: 'empty' | 'partial' | 'complete' = 'empty';
    if (log && pct === 100) status = 'complete';
    else if (log && pct > 0) status = 'partial';

    return { day, dateStr, status, isToday: dateStr === todayStr, pct };
  });

  const monthName = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div id="monthly-calendar" className="heatmap">
      {/* Navigation */}
      <div className="heatmap__nav">
        <button
          className="heatmap__nav-btn"
          onClick={() => goMonth(-1)}
          disabled={!canGoPrev}
          title="Previous month"
        >
          <ChevronLeft />
        </button>

        <span className="heatmap__month-label">{monthName}</span>

        <button
          className="heatmap__nav-btn"
          onClick={() => goMonth(1)}
          disabled={!canGoNext}
          title="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="heatmap__weekdays">
        {weekDays.map(d => (
          <div key={d} className="heatmap__weekday">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {fetching ? (
        <div className="heatmap__loading">
          <span className="spinner" />
          Loading...
        </div>
      ) : (
        <div className="heatmap__grid">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`gap-${i}`} className="heatmap__empty-cell" />
          ))}

          {cells.map((cell, idx) => {
            const cls = [
              'heatmap__cell',
              `heatmap__cell--${cell.status}`,
              cell.isToday ? 'heatmap__cell--today' : '',
            ].filter(Boolean).join(' ');

            return (
              <div
                key={cell.dateStr}
                className={cls}
                style={{ animationDelay: `${idx * 8}ms` }}
                title={`${cell.dateStr}: ${Math.round(cell.pct)}%`}
              >
                {cell.day}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="heatmap__legend">
        <div className="heatmap__legend-item">
          <div className="heatmap__legend-dot heatmap__legend-dot--empty" />
          <span>None</span>
        </div>
        <div className="heatmap__legend-item">
          <div className="heatmap__legend-dot heatmap__legend-dot--partial" />
          <span>Partial</span>
        </div>
        <div className="heatmap__legend-item">
          <div className="heatmap__legend-dot heatmap__legend-dot--complete" />
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
