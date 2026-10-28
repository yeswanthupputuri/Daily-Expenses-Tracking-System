import React, { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Wallet,
  Tag,
  Target,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Expense, TimeRange, UserSettings } from '../types';
import { CATEGORIES, CURRENCIES } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

interface StatCardsRowProps {
  expenses: Expense[];
  allExpenses: Expense[];
  settings: UserSettings;
  timeRange: TimeRange;
  onOpenBudgetModal?: () => void;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({
  expenses,
  allExpenses,
  settings,
  timeRange,
  onOpenBudgetModal,
}) => {
  const isDark = settings.darkMode;
  const currencyConfig = CURRENCIES[settings.currency] || CURRENCIES.USD;

  const formatStatCurrency = (val: number) => {
    try {
      return new Intl.NumberFormat(currencyConfig.locale, {
        style: 'currency',
        currency: currencyConfig.code,
        maximumFractionDigits: 0,
      }).format(Math.round(val));
    } catch {
      return `${currencyConfig.symbol}${Math.round(val)}`;
    }
  };

  const periodLabel = {
    week: 'Week total',
    month: 'Month total',
    year: 'Year total',
  }[timeRange];

  // Total sum for active period
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = expenses.length;

  // Top category calculation
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  let topCategoryKey = '';
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategoryKey = cat;
    }
  });

  const topCategoryPercent = totalAmount > 0 ? Math.round((topCategoryAmount / totalAmount) * 100) : 0;
  const topCategoryMeta = topCategoryKey ? CATEGORIES[topCategoryKey as keyof typeof CATEGORIES] : null;
  const topCategoryLabel = topCategoryMeta ? topCategoryMeta.label : 'None';

  // Distinct days logged
  const distinctDays = new Set(expenses.map((e) => e.date));
  const loggedDaysCount = distinctDays.size || 1;
  const dailyAverage = totalAmount / loggedDaysCount;

  // Monthly Budget Cap Calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  // Filter expenses strictly for the current calendar month
  const currentMonthExpenses = allExpenses.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const currentMonthSpend = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyCap = settings.monthlyBudgetCap || 2500;

  // Pacing projection
  const dailyRunRate = currentMonthSpend / Math.max(1, currentDay);
  const projectedMonthSpend = Math.round(dailyRunRate * daysInMonth);
  const percentCapUsed = Math.round((currentMonthSpend / monthlyCap) * 100);
  const percentProjected = Math.round((projectedMonthSpend / monthlyCap) * 100);

  const isCapExceeded = currentMonthSpend > monthlyCap;
  const isOnTrackToExceed = !isCapExceeded && projectedMonthSpend > monthlyCap;
  const isCapSafe = !isCapExceeded && !isOnTrackToExceed;

  const budgetRemaining = Math.max(0, monthlyCap - currentMonthSpend);
  const safeDailyAllowance = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

  // Pie chart data slices for Budget Alert
  const pieData = useMemo(() => {
    if (isCapExceeded) {
      const excess = currentMonthSpend - monthlyCap;
      return [
        {
          name: 'Budget Cap Covered',
          value: monthlyCap,
          color: '#f59e0b', // Amber
          percent: Math.round((monthlyCap / currentMonthSpend) * 100),
        },
        {
          name: 'Over Budget',
          value: excess,
          color: '#f43f5e', // Rose
          percent: Math.round((excess / currentMonthSpend) * 100),
        },
      ];
    }

    const spentColor = isOnTrackToExceed ? '#f59e0b' : '#10b981'; // Amber or Emerald
    const remainingColor = isDark ? '#262f45' : '#e2e8f0';

    if (currentMonthSpend === 0 && monthlyCap === 0) {
      return [{ name: 'No Budget Set', value: 1, color: remainingColor, percent: 100 }];
    }

    return [
      {
        name: 'Budget Spent',
        value: Math.max(0.01, currentMonthSpend),
        color: spentColor,
        percent: Math.min(100, percentCapUsed),
      },
      {
        name: 'Budget Remaining',
        value: Math.max(0, budgetRemaining),
        color: remainingColor,
        percent: Math.max(0, 100 - percentCapUsed),
      },
    ];
  }, [isCapExceeded, currentMonthSpend, monthlyCap, isOnTrackToExceed, isDark, percentCapUsed, budgetRemaining]);

  // Custom tooltip for Budget Alert Pie Chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const slice = payload[0];
    return (
      <div
        className={`px-3 py-2 rounded-xl text-xs font-medium shadow-xl border ${
          isDark
            ? 'bg-[#181b26] border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: slice.payload.color }}
          />
          <span className="font-semibold">{slice.name}</span>
        </div>
        <p className="font-mono text-sm font-bold">
          {formatCurrency(slice.value, settings.currency)}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {slice.payload.percent}% of monthly budget
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* =========================================================
          1. SINGLE SIMPLE CARD: Month Total / Top Category / Budget Left
          ========================================================= */}
      <div
        id="stat-card-unified"
        className="bg-white dark:bg-[#151821] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.25)] transition-colors"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80">
          {/* Section 1: Month / Period Total */}
          <div className="pb-4 md:pb-0 md:pr-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                <Wallet size={13} className="text-indigo-500" />
                <span>{periodLabel}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {formatStatCurrency(totalAmount)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
              <span>{expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}</span>
              <span>·</span>
              <span>Avg {formatStatCurrency(dailyAverage)}/day</span>
            </div>
          </div>

          {/* Section 2: Top Category */}
          <div className="py-4 md:py-0 md:px-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                <Tag size={13} className="text-amber-500" />
                <span>Top category</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {topCategoryAmount > 0 ? formatStatCurrency(topCategoryAmount) : '$0'}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium truncate">
              {topCategoryAmount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {topCategoryLabel}
                  </span>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
                    {topCategoryPercent}% of spend
                  </span>
                </span>
              ) : (
                'No expenses recorded yet'
              )}
            </p>
          </div>

          {/* Section 3: Monthly Budget Left */}
          <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Target size={13} className="text-teal-500" />
                  <span>Monthly budget left</span>
                </div>
                {onOpenBudgetModal && (
                  <button
                    type="button"
                    onClick={onOpenBudgetModal}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium cursor-pointer"
                    title="Update monthly budget limit cap"
                  >
                    Cap: {formatStatCurrency(monthlyCap)}
                  </button>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {formatStatCurrency(budgetRemaining)}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  isCapExceeded
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : isOnTrackToExceed
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {isCapExceeded
                  ? 'Cap exceeded'
                  : isOnTrackToExceed
                  ? `${percentCapUsed}% used (pacing alert)`
                  : `${percentCapUsed}% used (on track)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. BUDGET ALERT CARD IN PIE CHART STYLE
          ========================================================= */}
      <div
        id="budget-alert-pie-card"
        className={`rounded-3xl p-5 sm:p-6 border transition-all ${
          isCapExceeded
            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
            : isOnTrackToExceed
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
            : 'bg-white dark:bg-[#151821] border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.25)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          {/* Status Headline */}
          <div className="flex items-center gap-2.5">
            {isCapExceeded ? (
              <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertCircle size={18} />
              </div>
            ) : isOnTrackToExceed ? (
              <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle size={18} />
              </div>
            ) : (
              <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {isCapExceeded
                    ? 'Monthly Budget Cap Exceeded'
                    : isOnTrackToExceed
                    ? 'Budget Alert: Fast Pacing'
                    : 'Monthly Budget on Track'}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isCapExceeded
                      ? 'bg-rose-200/80 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200'
                      : isOnTrackToExceed
                      ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {isCapExceeded
                    ? `+${formatCurrency(currentMonthSpend - monthlyCap, settings.currency)} over cap`
                    : isOnTrackToExceed
                    ? `${percentProjected}% projected outflow`
                    : `${percentCapUsed}% of cap utilized`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isCapExceeded
                  ? `You have spent ${formatCurrency(currentMonthSpend, settings.currency)} against your ${formatCurrency(monthlyCap, settings.currency)} monthly limit.`
                  : isOnTrackToExceed
                  ? `At current rate of ${formatCurrency(dailyRunRate, settings.currency)}/day, you are projected to reach ${formatCurrency(projectedMonthSpend, settings.currency)}.`
                  : `Spent ${formatCurrency(currentMonthSpend, settings.currency)} of ${formatCurrency(monthlyCap, settings.currency)} cap with ${daysRemaining} days remaining in this month.`}
              </p>
            </div>
          </div>

          {/* Quick Action: Adjust Cap */}
          {onOpenBudgetModal && (
            <button
              id="change-budget-cap-btn"
              type="button"
              onClick={onOpenBudgetModal}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 self-end sm:self-auto"
              title="Change monthly and daily budget caps"
            >
              <Sliders size={13} />
              <span>Adjust Cap</span>
            </button>
          )}
        </div>

        {/* Pie Chart & Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          {/* Left: Pie Chart Donut with Center Percentage */}
          <div className="sm:col-span-5 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={pieData.length > 1 ? 3 : 0}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={`text-2xl font-bold font-mono tracking-tight ${
                    isCapExceeded
                      ? 'text-rose-600 dark:text-rose-400'
                      : isOnTrackToExceed
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {percentCapUsed}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isCapExceeded ? 'Exceeded' : 'Used'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Pie Legend & Pacing Analysis */}
          <div className="sm:col-span-7 space-y-3">
            {/* Pie Chart Legend Pills */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Spent Slice */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1a1e2b] border border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCapExceeded
                        ? 'bg-rose-500'
                        : isOnTrackToExceed
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>Spent this month</span>
                </div>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrency(currentMonthSpend, settings.currency)}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {percentCapUsed}% of total cap
                </span>
              </div>

              {/* Remaining or Excess Slice */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1a1e2b] border border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCapExceeded ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                  <span>{isCapExceeded ? 'Excess over cap' : 'Remaining budget'}</span>
                </div>
                <p
                  className={`text-base font-bold font-mono mt-1 ${
                    isCapExceeded
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {isCapExceeded
                    ? `+${formatCurrency(currentMonthSpend - monthlyCap, settings.currency)}`
                    : formatCurrency(budgetRemaining, settings.currency)}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isCapExceeded
                    ? 'Requires attention'
                    : `${Math.max(0, 100 - percentCapUsed)}% available`}
                </span>
              </div>
            </div>

            {/* Pacing Advice Strip */}
            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161a26] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Daily Burn Rate</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(dailyRunRate, settings.currency)} / day
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  {isCapExceeded ? 'Cap Target' : 'Safe Daily Allowance'}
                </span>
                <span
                  className={`font-mono font-bold ${
                    isCapExceeded
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isCapExceeded
                    ? `${formatCurrency(monthlyCap, settings.currency)} cap`
                    : `${formatCurrency(safeDailyAllowance, settings.currency)} / day`}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Projected Spend</span>
                <span
                  className={`font-mono font-bold ${
                    projectedMonthSpend > monthlyCap
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {formatCurrency(projectedMonthSpend, settings.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
