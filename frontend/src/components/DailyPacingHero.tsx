import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Flame,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Expense, UserSettings } from '../types';
import { formatCurrency, getHoursRemainingToday } from '../utils/formatters';

interface DailyPacingHeroProps {
  todayExpenses: Expense[];
  settings: UserSettings;
  onOpenAddModal: () => void;
  onAdjustBudget: () => void;
}

export const DailyPacingHero: React.FC<DailyPacingHeroProps> = ({
  todayExpenses,
  settings,
  onOpenAddModal,
  onAdjustBudget,
}) => {
  const dailyBudget = settings.dailyBudget;
  const currency = settings.currency;

  const totalSpentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingToday = dailyBudget - totalSpentToday;
  const percentUsed = dailyBudget > 0 ? (totalSpentToday / dailyBudget) * 100 : 0;
  const clampedPercent = Math.min(Math.max(percentUsed, 0), 100);

  const hoursRemaining = getHoursRemainingToday();
  const currentHour = new Date().getHours();
  const hoursElapsed = Math.max(1, currentHour + (new Date().getMinutes() / 60));

  // Burn rate calculations
  const hourlyBurnRate = totalSpentToday / hoursElapsed;
  const safeHourlyRemaining = remainingToday > 0 ? remainingToday / hoursRemaining : 0;
  const projectedDayTotal = hourlyBurnRate * 24;

  const isOverBudget = totalSpentToday > dailyBudget;
  const isNearBudget = !isOverBudget && percentUsed >= 80;

  // Find highest single expense today
  const highestExpense = todayExpenses.reduce(
    (max, e) => (e.amount > (max?.amount || 0) ? e : max),
    null as Expense | null
  );

  return (
    <section id="daily-pacing-hero" className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
      <div className="p-5 sm:p-7">
        {/* Top bar: Section Title & Pace Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
              Today's Real-Time Budget Pace
            </h2>
            <span className="text-xs text-neutral-500 hidden sm:inline">
              ({todayExpenses.length} {todayExpenses.length === 1 ? 'transaction' : 'transactions'} today)
            </span>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <span
                id="pace-status-pill"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
              >
                <AlertTriangle size={14} className="text-rose-600" />
                Over Budget (+{formatCurrency(Math.abs(remainingToday), currency)})
              </span>
            ) : isNearBudget ? (
              <span
                id="pace-status-pill"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
              >
                <Hourglass size={14} className="text-amber-600" />
                Pacing Fast ({percentUsed.toFixed(0)}% Used)
              </span>
            ) : (
              <span
                id="pace-status-pill"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                <ShieldCheck size={14} className="text-emerald-600" />
                On Track ({percentUsed.toFixed(0)}% Used)
              </span>
            )}
          </div>
        </div>

        {/* Primary Numbers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* 1. Spent Today */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-100">
            <div className="text-xs font-medium text-neutral-500 mb-1 flex items-center justify-between">
              <span>Total Spent Today</span>
              <TrendingUp size={14} className="text-neutral-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
              {formatCurrency(totalSpentToday, currency)}
            </div>
            <div className="text-xs text-neutral-500 mt-1.5">
              {totalSpentToday === 0
                ? 'No expenses recorded yet today'
                : `${hourlyBurnRate > 0 ? formatCurrency(hourlyBurnRate, currency) : '$0'}/hr active pace`}
            </div>
          </div>

          {/* 2. Remaining Today */}
          <div className={`p-4 rounded-xl border ${
            isOverBudget
              ? 'bg-rose-50/40 border-rose-100'
              : isNearBudget
              ? 'bg-amber-50/40 border-amber-100'
              : 'bg-emerald-50/40 border-emerald-100'
          }`}>
            <div className="text-xs font-medium text-neutral-500 mb-1 flex items-center justify-between">
              <span>{isOverBudget ? 'Over Budget By' : 'Remaining Safe to Spend'}</span>
              {isOverBudget ? (
                <AlertTriangle size={14} className="text-rose-500" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-500" />
              )}
            </div>
            <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
              isOverBudget ? 'text-rose-600' : 'text-neutral-900'
            }`}>
              {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remainingToday), currency)}
            </div>
            <div className="text-xs text-neutral-500 mt-1.5">
              {isOverBudget
                ? `Limit exceeded with ${hoursRemaining.toFixed(1)}h left in day`
                : `${formatCurrency(safeHourlyRemaining, currency)}/hr safe rate for remaining ${hoursRemaining.toFixed(1)}h`}
            </div>
          </div>

          {/* 3. Daily Target Limit */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-100 flex flex-col justify-between">
            <div>
              <div className="text-xs font-medium text-neutral-500 mb-1 flex items-center justify-between">
                <span>Daily Target Limit</span>
                <button
                  id="hero-adjust-budget-btn"
                  onClick={onAdjustBudget}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
                {formatCurrency(dailyBudget, currency)}
              </div>
            </div>
            <div className="text-xs text-neutral-500 mt-1.5 flex items-center justify-between">
              <span>Reset daily at midnight</span>
              <span className="font-mono text-[11px] text-neutral-400">24h window</span>
            </div>
          </div>
        </div>

        {/* Real-Time Progress Bar / Pacing Meter */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-neutral-700 flex items-center gap-1.5">
              <span>Day Budget Utilization:</span>
              <span className="font-mono font-bold text-neutral-900">{percentUsed.toFixed(1)}%</span>
            </span>
            <span className="font-mono text-neutral-500">
              {formatCurrency(totalSpentToday, currency)} of {formatCurrency(dailyBudget, currency)}
            </span>
          </div>

          <div className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200/60 relative">
            {/* Safe 80% guideline marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-neutral-300 z-10"
              style={{ left: '80%' }}
              title="80% Caution Threshold"
            />
            <div
              id="realtime-budget-progress-bar"
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isNearBudget
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${clampedPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-neutral-400 mt-1.5 font-mono">
            <span>$0.00</span>
            <span className="text-amber-600 font-medium">80% caution mark</span>
            <span>{formatCurrency(dailyBudget, currency)} Target</span>
          </div>
        </div>

        {/* Bottom Telemetry Bar: Live velocity, projected total, largest purchase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <Flame size={15} className="text-orange-500 shrink-0" />
            <span>
              Velocity:{' '}
              <strong className="text-neutral-900 font-mono">
                {formatCurrency(hourlyBurnRate, currency)}/hr
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-600">
            <TrendingUp size={15} className="text-blue-500 shrink-0" />
            <span>
              Projected Today:{' '}
              <strong className={`font-mono ${projectedDayTotal > dailyBudget ? 'text-rose-600' : 'text-neutral-900'}`}>
                {formatCurrency(projectedDayTotal, currency)}
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-between text-neutral-600">
            <span className="truncate">
              Peak single:{' '}
              {highestExpense ? (
                <strong className="text-neutral-900 font-mono">
                  {formatCurrency(highestExpense.amount, currency)}{' '}
                  <span className="font-normal text-neutral-500">({highestExpense.description})</span>
                </strong>
              ) : (
                'None yet'
              )}
            </span>

            <button
              id="hero-quick-log-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold ml-2 shrink-0 cursor-pointer"
            >
              <span>+ Log</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
