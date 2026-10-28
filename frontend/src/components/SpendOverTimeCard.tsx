import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  Calendar,
  Layers,
  BarChart,
} from 'lucide-react';
import { Expense, UserSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CURRENCIES } from '../utils/constants';

interface SpendOverTimeCardProps {
  expenses: Expense[];
  settings: UserSettings;
}

export const SpendOverTimeCard: React.FC<SpendOverTimeCardProps> = ({
  expenses,
  settings,
}) => {
  // Chart metric display mode: 'cumulative' (running total trajectory) vs 'daily' (per-day spend)
  const [metricMode, setMetricMode] = useState<'cumulative' | 'daily'>('cumulative');

  const isDark = settings.darkMode;
  const currencySymbol = CURRENCIES[settings.currency]?.symbol || '$';

  // Compute 30-day comparative spending data (Current 30d vs Previous 30d)
  const comparativeData = useMemo(() => {
    const now = new Date();
    const currentDays: { dateStr: string; label: string; spend: number }[] = [];
    const prevDays: { dateStr: string; label: string; spend: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      // Current 30-day window (ending today at i = 0)
      const curD = new Date(now);
      curD.setDate(curD.getDate() - i);
      const cy = curD.getFullYear();
      const cm = String(curD.getMonth() + 1).padStart(2, '0');
      const cd = String(curD.getDate()).padStart(2, '0');
      const curStr = `${cy}-${cm}-${cd}`;
      const curSpend = expenses
        .filter((e) => e.date === curStr)
        .reduce((sum, e) => sum + e.amount, 0);

      currentDays.push({
        dateStr: curStr,
        label: curD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: Math.round(curSpend * 100) / 100,
      });

      // Previous 30-day window (shifted back by exactly 30 days)
      const prevD = new Date(now);
      prevD.setDate(prevD.getDate() - (i + 30));
      const py = prevD.getFullYear();
      const pm = String(prevD.getMonth() + 1).padStart(2, '0');
      const pd = String(prevD.getDate()).padStart(2, '0');
      const prevStr = `${py}-${pm}-${pd}`;
      const prevSpend = expenses
        .filter((e) => e.date === prevStr)
        .reduce((sum, e) => sum + e.amount, 0);

      prevDays.push({
        dateStr: prevStr,
        label: prevD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: Math.round(prevSpend * 100) / 100,
      });
    }

    let curRunning = 0;
    let prevRunning = 0;

    const points = currentDays.map((c, idx) => {
      const p = prevDays[idx];
      curRunning += c.spend;
      prevRunning += p.spend;

      const dayNumber = idx + 1;
      const isToday = dayNumber === 30;

      return {
        dayIndex: dayNumber,
        dayLabel: isToday ? 'Today (Day 30)' : `Day ${dayNumber}`,
        currentDate: c.label,
        currentSpend: c.spend,
        currentCumulative: Math.round(curRunning * 100) / 100,
        prevDate: p.label,
        prevSpend: p.spend,
        prevCumulative: Math.round(prevRunning * 100) / 100,
      };
    });

    const totalCurrent = Math.round(curRunning * 100) / 100;
    const totalPrev = Math.round(prevRunning * 100) / 100;
    const velocityDelta = totalCurrent - totalPrev;
    const velocityChangePercent = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : 0;
    const currentDailyVelocity = Math.round((totalCurrent / 30) * 100) / 100;
    const prevDailyVelocity = Math.round((totalPrev / 30) * 100) / 100;

    return {
      points,
      totalCurrent,
      totalPrev,
      velocityDelta,
      velocityChangePercent,
      currentDailyVelocity,
      prevDailyVelocity,
    };
  }, [expenses]);

  const isVelocityHigher = comparativeData.velocityDelta > 0;
  const isVelocitySame = Math.abs(comparativeData.velocityDelta) < 0.01;

  // Custom User-Friendly Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomVelocityTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isCumulative = metricMode === 'cumulative';
    const currentVal = isCumulative ? data.currentCumulative : data.currentSpend;
    const prevVal = isCumulative ? data.prevCumulative : data.prevSpend;
    const diff = currentVal - prevVal;

    return (
      <div
        className={`p-3.5 rounded-2xl shadow-xl border text-xs max-w-[240px] transition-all ${
          isDark
            ? 'bg-[#181b26] border-slate-700/80 text-slate-100 shadow-black/50'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
        }`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {data.dayLabel}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {data.currentDate}
          </span>
        </div>

        <div className="space-y-2">
          {/* Current Period */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">
                {isCumulative ? 'Total to Date:' : 'Spent This Day:'}
              </span>
            </div>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(currentVal, settings.currency)}
            </span>
          </div>

          {/* Previous Period */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-400 border-dashed bg-slate-200 dark:bg-slate-700 shrink-0" />
              <span className="text-slate-400">
                {isCumulative ? 'Last Month Total:' : `Prior (${data.prevDate}):`}
              </span>
            </div>
            <span className="font-medium font-mono text-slate-500 dark:text-slate-400">
              {formatCurrency(prevVal, settings.currency)}
            </span>
          </div>

          {/* User-friendly Difference */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">
              {diff > 0 ? 'Pace Increase:' : diff < 0 ? 'Savings vs Prior:' : 'Variance:'}
            </span>
            <span
              className={`font-bold font-mono ${
                diff > 0
                  ? 'text-rose-500 dark:text-rose-400'
                  : diff < 0
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {diff > 0 ? `+${formatCurrency(diff, settings.currency)}` : formatCurrency(diff, settings.currency)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="spend-over-time-card"
      className="bg-white dark:bg-[#151821] rounded-3xl p-6 sm:p-7 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.25)] transition-colors"
    >
      {/* 1. Header with Clear User-Friendly Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
              30-Day Spending Velocity & Trend
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              Month-over-Month
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare your spending over the last 30 days against the same 30-day window last month.
          </p>
        </div>

        {/* View Mode Toggle: Cumulative Running Total vs Daily Spend */}
        <div
          id="velocity-mode-toggle"
          className={`p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold self-start sm:self-auto ${
            isDark ? 'bg-[#181b26] border border-slate-800' : 'bg-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setMetricMode('cumulative')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              metricMode === 'cumulative'
                ? isDark
                  ? 'bg-[#2b3145] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Shows your running total accumulating over 30 days"
          >
            <Layers size={13} />
            <span>Running Total</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('daily')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              metricMode === 'daily'
                ? isDark
                  ? 'bg-[#2b3145] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Shows how much you spent on each specific calendar day"
          >
            <BarChart size={13} />
            <span>Daily Spend</span>
          </button>
        </div>
      </div>

      {/* 2. Plain-English Insight Banner */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border mb-5 flex items-start gap-3 text-xs leading-relaxed transition-all ${
          isVelocitySame
            ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            : isVelocityHigher
            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
            isVelocitySame
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              : isVelocityHigher
              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isVelocitySame ? (
            <Info size={16} />
          ) : isVelocityHigher ? (
            <TrendingUp size={16} />
          ) : (
            <Sparkles size={16} />
          )}
        </div>

        <div>
          <span className="font-bold text-xs uppercase tracking-wide block mb-0.5">
            {isVelocitySame
              ? 'Steady Spending Rate'
              : isVelocityHigher
              ? 'Spending Faster Than Last Month'
              : 'Slower Spending Rate — Great Job!'}
          </span>
          <p className="text-slate-600 dark:text-slate-300">
            {isVelocitySame ? (
              <>
                Your spending over the last 30 days (
                <strong>{formatCurrency(comparativeData.totalCurrent, settings.currency)}</strong>
                ) is identical to your prior month.
              </>
            ) : isVelocityHigher ? (
              <>
                You spent{' '}
                <strong>
                  {formatCurrency(comparativeData.velocityDelta, settings.currency)} (
                  +{comparativeData.velocityChangePercent.toFixed(1)}%) more
                </strong>{' '}
                in the last 30 days compared to last month. Your daily pace increased from{' '}
                {formatCurrency(comparativeData.prevDailyVelocity, settings.currency)}/day to{' '}
                <strong>
                  {formatCurrency(comparativeData.currentDailyVelocity, settings.currency)}/day
                </strong>
                .
              </>
            ) : (
              <>
                You spent{' '}
                <strong>
                  {formatCurrency(Math.abs(comparativeData.velocityDelta), settings.currency)} (
                  {Math.abs(comparativeData.velocityChangePercent).toFixed(1)}%) less
                </strong>{' '}
                in the last 30 days compared to last month. Your daily average dropped from{' '}
                {formatCurrency(comparativeData.prevDailyVelocity, settings.currency)}/day down to{' '}
                <strong>
                  {formatCurrency(comparativeData.currentDailyVelocity, settings.currency)}/day
                </strong>
                .
              </>
            )}
          </p>
        </div>
      </div>

      {/* 3. Three Plain & Clear Metric Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Pillar 1: Last 30 Days */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1a1e2b] border border-slate-200/60 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Last 30 Days (Current)
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatCurrency(comparativeData.totalCurrent, settings.currency)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Avg {formatCurrency(comparativeData.currentDailyVelocity, settings.currency)} / day
          </p>
        </div>

        {/* Pillar 2: Previous Month */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1a1e2b] border border-slate-200/60 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Previous 30 Days (Prior)
          </span>
          <p className="text-xl font-bold font-mono text-slate-600 dark:text-slate-300 mt-1">
            {formatCurrency(comparativeData.totalPrev, settings.currency)}
          </p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Averaged {formatCurrency(comparativeData.prevDailyVelocity, settings.currency)} / day
          </p>
        </div>

        {/* Pillar 3: Net Difference */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1a1e2b] border border-slate-200/60 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Difference vs Prior Month
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-xl font-bold font-mono ${
                isVelocitySame
                  ? 'text-slate-600 dark:text-slate-300'
                  : isVelocityHigher
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isVelocityHigher ? '+' : ''}
              {formatCurrency(comparativeData.velocityDelta, settings.currency)}
            </span>
            <span
              className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                isVelocitySame
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  : isVelocityHigher
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {isVelocityHigher ? '+' : ''}
              {comparativeData.velocityChangePercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isVelocityHigher ? 'Higher spending velocity' : isVelocitySame ? 'Identical volume' : 'Lower spending pace'}
          </p>
        </div>
      </div>

      {/* 4. Chart Header & Legend */}
      <div className="flex items-center justify-between pb-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {metricMode === 'cumulative'
            ? 'Running cumulative sum from Day 1 to Day 30:'
            : 'Individual daily spend per calendar day:'}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-indigo-500 rounded-full" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Last 30 Days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400 dark:border-slate-500" />
            <span className="text-slate-400">Previous Month</span>
          </div>
        </div>
      </div>

      {/* 5. Recharts Area Chart Container */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={comparativeData.points}
            margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
          >
            <defs>
              {/* Current Period Soft Indigo Gradient */}
              <linearGradient id="velocityCurrentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={isDark ? 0.35 : 0.22} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              {/* Previous Period Muted Subtle Slate Gradient */}
              <linearGradient id="velocityPrevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={isDark ? 0.15 : 0.08} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#252b3d' : '#f1f5f9'}
            />

            <XAxis
              dataKey="dayIndex"
              tickLine={false}
              axisLine={{ stroke: isDark ? '#252b3d' : '#e2e8f0' }}
              tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }}
              ticks={[1, 7, 14, 21, 30]}
              tickFormatter={(val) => (val === 30 ? 'Day 30' : `Day ${val}`)}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }}
              tickFormatter={(val: number) => {
                if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
                return `${currencySymbol}${Math.round(val)}`;
              }}
            />

            <Tooltip content={<CustomVelocityTooltip />} />

            {/* Previous Period Curve (Dashed line) */}
            <Area
              type="monotone"
              dataKey={metricMode === 'cumulative' ? 'prevCumulative' : 'prevSpend'}
              name="Previous Month"
              stroke={isDark ? '#94a3b8' : '#64748b'}
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#velocityPrevGrad)"
              activeDot={{ r: 4, fill: '#94a3b8', stroke: isDark ? '#151821' : '#ffffff', strokeWidth: 2 }}
            />

            {/* Current 30D Velocity Curve (Solid line with rich gradient fill) */}
            <Area
              type="monotone"
              dataKey={metricMode === 'cumulative' ? 'currentCumulative' : 'currentSpend'}
              name="Last 30 Days"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#velocityCurrentGrad)"
              activeDot={{ r: 5, fill: '#6366f1', stroke: isDark ? '#151821' : '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 6. Friendly How-To-Read Footer Tip */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          💡 <strong>How to read:</strong> When the solid purple curve sits <em>below</em> the dashed gray line, you are spending less and saving more than you did last month.
        </span>
        <span className="hidden sm:inline font-mono">Window: 30 days</span>
      </div>
    </div>
  );
};
