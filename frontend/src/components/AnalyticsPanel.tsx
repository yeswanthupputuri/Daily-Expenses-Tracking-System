import React from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Calculator,
  Calendar,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { Expense, ExpenseCategory, UserSettings } from '../types';
import { CATEGORIES } from '../utils/constants';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, getTodayDateString } from '../utils/formatters';

interface AnalyticsPanelProps {
  todayExpenses: Expense[];
  allExpenses: Expense[];
  settings: UserSettings;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  todayExpenses,
  allExpenses,
  settings,
}) => {
  const currency = settings.currency;
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 1. Group today's expenses by category
  const categoryTotals: Record<ExpenseCategory, number> = {
    housing: 0,
    groceries: 0,
    utilities: 0,
    dining_out: 0,
    food: 0,
    coffee: 0,
    transport: 0,
    shopping: 0,
    bills: 0,
    entertainment: 0,
    health: 0,
    other: 0,
  };

  todayExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const activeCategories = (Object.keys(categoryTotals) as ExpenseCategory[])
    .filter((cat) => categoryTotals[cat] > 0)
    .sort((a, b) => categoryTotals[b] - categoryTotals[a]);

  // 2. 7-Day History Trend (Last 7 days including today for the bar chart)
  const todayStr = getTodayDateString();
  const past7Days: { dateStr: string; label: string; total: number; isToday: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

    const total = allExpenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);

    past7Days.push({
      dateStr,
      label: i === 0 ? 'Today' : dayName,
      total,
      isToday: dateStr === todayStr,
    });
  }

  const maxDayTotal = Math.max(1, ...past7Days.map((d) => d.total), settings.dailyBudget);

  // 4. SPENDING TREND COMPARISON: Today's total vs Average Daily Spend over last 7 days (prior 7 days)
  const prior7Days: { dateStr: string; label: string; total: number }[] = [];
  let prior7DaysSum = 0;

  for (let i = 7; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

    const total = allExpenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);

    prior7Days.push({ dateStr, label: dayName, total });
    prior7DaysSum += total;
  }

  const prior7DaysAverage = prior7DaysSum / 7;
  const trendDiff = todayTotal - prior7DaysAverage;
  const percentDiff =
    prior7DaysAverage > 0
      ? ((todayTotal - prior7DaysAverage) / prior7DaysAverage) * 100
      : todayTotal > 0
      ? 100
      : 0;

  const isTrendHigher = trendDiff > 0.009;
  const isTrendLower = trendDiff < -0.009;

  // 5. MONTHLY FORECAST (Linear Regression on Daily Spending Velocity)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const remainingDays = daysInMonth - currentDay;
  const monthName = now.toLocaleString(undefined, { month: 'long' });
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Build daily series for days 1 through currentDay in the active month
  const mtdDays: { day: number; total: number }[] = [];
  let mtdTotal = 0;

  for (let d = 1; d <= currentDay; d++) {
    const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
    const dayTotal = allExpenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    mtdDays.push({ day: d, total: dayTotal });
    mtdTotal += dayTotal;
  }

  // Linear Regression: y = alpha + beta * x
  // x = day of month (1..currentDay), y = daily spend
  const n = currentDay;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (const p of mtdDays) {
    sumX += p.day;
    sumY += p.total;
    sumXY += p.day * p.total;
    sumX2 += p.day * p.day;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  let slope = 0; // beta: spending velocity delta per day
  let intercept = meanY; // alpha

  const denominator = sumX2 - sumX * meanX;
  if (n > 1 && Math.abs(denominator) > 0.0001) {
    slope = (sumXY - sumX * meanY) / denominator;
    intercept = meanY - slope * meanX;
  } else {
    slope = 0;
    intercept = meanY;
  }

  // Predict future days: max(0, intercept + slope * day)
  let projectedRemainingSpend = 0;
  for (let fd = currentDay + 1; fd <= daysInMonth; fd++) {
    const projectedDaily = Math.max(0, intercept + slope * fd);
    projectedRemainingSpend += projectedDaily;
  }

  // Projected end-of-month total = actual MTD + projected remaining
  const projectedMonthTotal = mtdTotal + projectedRemainingSpend;
  const monthlyBudgetTarget = settings.dailyBudget * daysInMonth;
  const budgetVariance = monthlyBudgetTarget - projectedMonthTotal;
  const isProjectedUnderBudget = projectedMonthTotal <= monthlyBudgetTarget;
  const monthProgressPercent = Math.min(100, Math.round((currentDay / daysInMonth) * 100));

  return (
    <div id="analytics-panel-container" className="space-y-6">
      {/* Upper Grid: Spending Trend & Monthly Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Spending Trend Comparison */}
        <div
          id="spending-trend-card"
          className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isTrendHigher
                    ? 'bg-rose-50 text-rose-600'
                    : isTrendLower
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <Activity size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Spending Trend Comparison
                </h4>
                <p className="text-[11px] text-neutral-500">Today vs. Last 7 Days Daily Average</p>
              </div>
            </div>

            {/* Status Pill */}
            <span
              id="spending-trend-badge"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isTrendHigher
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                  : isTrendLower
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}
            >
              {isTrendHigher ? (
                <>
                  <ArrowUpRight size={13} />
                  <span>+{Math.abs(percentDiff).toFixed(1)}% Higher</span>
                </>
              ) : isTrendLower ? (
                <>
                  <ArrowDownRight size={13} />
                  <span>-{Math.abs(percentDiff).toFixed(1)}% Lower</span>
                </>
              ) : (
                <span>On Par (0%)</span>
              )}
            </span>
          </div>

          {/* Metrics comparison cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Today's Total
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
                {formatCurrency(todayTotal, currency)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {todayExpenses.length} {todayExpenses.length === 1 ? 'expense' : 'expenses'} logged
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                7-Day Daily Avg
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
                {formatCurrency(prior7DaysAverage, currency)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Total 7d: {formatCurrency(prior7DaysSum, currency)}
              </div>
            </div>
          </div>

          {/* Trend Analysis Text */}
          <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-100 text-xs text-neutral-700 flex items-start gap-2.5 mb-4">
            {isTrendHigher ? (
              <TrendingUp size={16} className="text-rose-600 shrink-0 mt-0.5" />
            ) : isTrendLower ? (
              <TrendingDown size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Activity size={16} className="text-neutral-500 shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed">
              {isTrendHigher ? (
                <>
                  Today's spending is{' '}
                  <strong className="text-rose-700 font-semibold font-mono">
                    +{formatCurrency(Math.abs(trendDiff), currency)}
                  </strong>{' '}
                  higher than your recent 7-day average. You are pacing above normal daily consumption.
                </>
              ) : isTrendLower ? (
                <>
                  Today's spending is{' '}
                  <strong className="text-emerald-700 font-semibold font-mono">
                    -{formatCurrency(Math.abs(trendDiff), currency)}
                  </strong>{' '}
                  below your 7-day daily average. Great pace control and disciplined saving today!
                </>
              ) : (
                <>
                  Today's total matches your trailing 7-day daily spending pace exactly. Stable pattern!
                </>
              )}
            </p>
          </div>

          {/* Mini 7-Day Baseline Bars */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5 font-medium">
              <span>Trailing 7 days daily totals:</span>
              <span className="font-mono">
                Avg: {formatCurrency(prior7DaysAverage, currency)}/day
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {prior7Days.map((d, i) => {
                const maxVal = Math.max(1, prior7DaysSum, todayTotal, settings.dailyBudget);
                const barPercent = Math.min(100, Math.max(12, (d.total / maxVal) * 100));
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-10 w-full bg-neutral-100 rounded-md flex items-end p-0.5 relative group">
                      <div
                        className="w-full rounded bg-neutral-300 group-hover:bg-neutral-400 transition-colors"
                        style={{ height: `${barPercent}%` }}
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {formatCurrency(d.total, currency)}
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Forecast (Linear Regression) */}
        <div
          id="monthly-forecast-card"
          className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calculator size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Monthly Forecast ({monthName})
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Linear regression velocity extrapolation
                </p>
              </div>
            </div>

            {/* Projected Pace Badge */}
            <span
              id="monthly-forecast-status-badge"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isProjectedUnderBudget
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/80'
              }`}
            >
              {isProjectedUnderBudget ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>Projected Under Budget</span>
                </>
              ) : (
                <>
                  <AlertCircle size={13} />
                  <span>Projected Over Target</span>
                </>
              )}
            </span>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Projected EOM Total
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
                {formatCurrency(projectedMonthTotal, currency)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Target: {formatCurrency(monthlyBudgetTarget, currency)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Month-to-Date Spent
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
                {formatCurrency(mtdTotal, currency)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Day {currentDay} of {daysInMonth} ({remainingDays} left)
              </div>
            </div>
          </div>

          {/* Mathematical regression details */}
          <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-100 space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-500" /> Velocity Slope (β):
              </span>
              <span className="font-mono font-semibold text-neutral-800">
                {slope >= 0 ? '+' : ''}
                {formatCurrency(slope, currency)}/day trend
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Average Daily Rate MTD:</span>
              <span className="font-mono font-semibold text-neutral-800">
                {formatCurrency(mtdTotal / Math.max(1, currentDay), currency)}/day
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
              <span className="text-neutral-600 font-medium">
                {isProjectedUnderBudget ? 'Projected Month Surplus:' : 'Projected Deficit:'}
              </span>
              <span
                className={`font-mono font-bold ${
                  isProjectedUnderBudget ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {isProjectedUnderBudget ? '+' : '-'}
                {formatCurrency(Math.abs(budgetVariance), currency)}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar: Month Elapsed & Projected Ratio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>
                Month timeline: <strong className="text-neutral-800">{monthProgressPercent}%</strong> elapsed
              </span>
              <span>
                Projected:{' '}
                <strong className={isProjectedUnderBudget ? 'text-emerald-700' : 'text-rose-600'}>
                  {monthlyBudgetTarget > 0
                    ? ((projectedMonthTotal / monthlyBudgetTarget) * 100).toFixed(0)
                    : 0}
                  %
                </strong>{' '}
                of limit
              </span>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden relative">
              {/* Target limit marker at 100% */}
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isProjectedUnderBudget ? 'bg-emerald-600' : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    monthlyBudgetTarget > 0
                      ? (projectedMonthTotal / monthlyBudgetTarget) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lower Grid: Category Breakdown & 7-Day History Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Category Breakdown */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-neutral-500" />
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight">
                Today's Categories
              </h4>
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              {activeCategories.length} {activeCategories.length === 1 ? 'category' : 'categories'}
            </span>
          </div>

          {activeCategories.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              Log expenses today to see category allocation.
            </div>
          ) : (
            <div className="space-y-3.5">
              {activeCategories.map((catKey) => {
                const amount = categoryTotals[catKey];
                const percent = todayTotal > 0 ? (amount / todayTotal) * 100 : 0;
                const meta = CATEGORIES[catKey];

                return (
                  <div key={catKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: meta.bgLight, color: meta.color }}
                        >
                          <CategoryIcon category={catKey} size={12} />
                        </div>
                        <span className="font-medium text-neutral-800">{meta.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-neutral-400 text-[11px]">{percent.toFixed(0)}%</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. 7-Day Spending History Bar Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-neutral-500" />
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight">
                7-Day Daily Trend
              </h4>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              Target: {formatCurrency(settings.dailyBudget, currency)}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-6 pb-2 border-b border-neutral-100">
            {past7Days.map((day, idx) => {
              const heightPercent = Math.min(100, Math.max(8, (day.total / maxDayTotal) * 100));
              const isOverBudget = day.total > settings.dailyBudget;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 bg-neutral-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    {formatCurrency(day.total, currency)}
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                      day.isToday
                        ? isOverBudget
                          ? 'bg-rose-500 ring-2 ring-rose-200'
                          : 'bg-emerald-600 ring-2 ring-emerald-200'
                        : isOverBudget
                        ? 'bg-rose-300 hover:bg-rose-400'
                        : 'bg-neutral-200 hover:bg-neutral-300'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {/* Day label */}
                  <span
                    className={`text-[11px] mt-2 font-medium ${
                      day.isToday ? 'text-neutral-900 font-bold' : 'text-neutral-500'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
              <span>Over Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neutral-200" />
              <span>Under Target</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

