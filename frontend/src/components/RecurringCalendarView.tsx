import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Repeat,
  Tv,
  Home,
  Flame,
  CreditCard,
  Zap,
  Shield,
  Check,
  Undo2,
  Edit2,
  Info,
  CalendarDays,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { RecurringPayment, RecurringPaymentType, UserSettings } from '../types';
import { CURRENCIES } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';
import { RECURRING_TYPE_CONFIG, getLocalToday, getRecurringStatus } from '../utils/recurringHelpers';

interface RecurringCalendarViewProps {
  recurringPayments: RecurringPayment[];
  settings: UserSettings;
  onOpenAddModal: () => void;
  onEditPayment: (payment: RecurringPayment) => void;
  onDeletePayment: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onMarkAsPaid: (payment: RecurringPayment) => void;
  onUnmarkAsPaid: (payment: RecurringPayment) => void;
  selectedDay?: number | null;
  onSelectDay?: (day: number | null) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const RecurringCalendarView: React.FC<RecurringCalendarViewProps> = ({
  recurringPayments,
  settings,
  onOpenAddModal,
  onEditPayment,
  onDeletePayment,
  onToggleStatus,
  onMarkAsPaid,
  onUnmarkAsPaid,
  selectedDay,
  onSelectDay,
}) => {
  const { year: currentYear, month: currentMonth, day: currentDay } = getLocalToday();

  // Selected calendar view month/year
  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [viewMonth, setViewMonth] = useState<number>(currentMonth); // 0-11
  const [internalSelectedDay, setInternalSelectedDay] = useState<number | null>(currentDay);

  const activeSelectedDay = onSelectDay !== undefined ? selectedDay : internalSelectedDay;

  const handleDaySelect = (dayNum: number) => {
    if (onSelectDay) {
      if (selectedDay === dayNum) {
        onSelectDay(null); // Click selected day to clear filter
      } else {
        onSelectDay(dayNum);
      }
    } else {
      setInternalSelectedDay((prev) => (prev === dayNum ? null : dayNum));
    }
  };

  const isDark = settings.darkMode;
  const isCurrentViewingMonth = viewYear === currentYear && viewMonth === currentMonth;

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((prev) => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
    if (onSelectDay) onSelectDay(null);
    else setInternalSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
    if (onSelectDay) onSelectDay(null);
    else setInternalSelectedDay(null);
  };

  const handleGoToToday = () => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    if (onSelectDay) onSelectDay(currentDay);
    else setInternalSelectedDay(currentDay);
  };

  // Calendar calculations
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const monthName = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });
  }, [viewYear, viewMonth]);

  // Check if a payment is paid for the currently viewed month
  const isPaidForViewMonth = (payment: RecurringPayment) => {
    if (!payment.lastPaidDate) return false;
    const [paidYear, paidMonth] = payment.lastPaidDate.split('-').map(Number);
    return paidYear === viewYear && paidMonth === viewMonth + 1;
  };

  // Group recurring payments by day of month
  const paymentsByDay = useMemo(() => {
    const map = new Map<number, RecurringPayment[]>();
    recurringPayments.forEach((p) => {
      // Map payment to this month's day (handle if dueDay exceeds month days)
      const mappedDay = Math.min(p.dueDay, daysInMonth);
      const existing = map.get(mappedDay) || [];
      existing.push(p);
      map.set(mappedDay, existing);
    });
    return map;
  }, [recurringPayments, daysInMonth]);

  // Metrics for the viewed month
  const monthMetrics = useMemo(() => {
    let totalScheduled = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let alertsCount = 0;

    recurringPayments.forEach((p) => {
      if (p.status === 'paused') return;
      totalScheduled += p.amount;

      const isPaid = isPaidForViewMonth(p);
      if (isPaid) {
        totalPaid += p.amount;
      } else {
        totalRemaining += p.amount;
      }

      // Check alert status if currently viewing this month
      if (isCurrentViewingMonth) {
        const statusInfo = getRecurringStatus(p);
        if (statusInfo.isAlert) {
          alertsCount++;
        }
      }
    });

    return {
      totalScheduled,
      totalPaid,
      totalRemaining,
      alertsCount,
    };
  }, [recurringPayments, viewYear, viewMonth, isCurrentViewingMonth]);

  // Selected Day Payments
  const selectedDayPayments = useMemo(() => {
    if (activeSelectedDay === null || activeSelectedDay === undefined) return [];
    return paymentsByDay.get(activeSelectedDay) || [];
  }, [activeSelectedDay, paymentsByDay]);

  // Selected Day Total
  const selectedDayTotal = useMemo(() => {
    return selectedDayPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [selectedDayPayments]);

  const renderTypeIcon = (t: RecurringPaymentType, size = 13) => {
    switch (t) {
      case 'subscription':
        return <Tv size={size} />;
      case 'rent':
        return <Home size={size} />;
      case 'gas':
        return <Flame size={size} />;
      case 'emi':
        return <CreditCard size={size} />;
      case 'utility':
        return <Zap size={size} />;
      case 'insurance':
        return <Shield size={size} />;
      default:
        return <Repeat size={size} />;
    }
  };

  return (
    <div id="recurring-calendar-summary-view" className="space-y-6">
      {/* 1. Calendar Header & Controls */}
      <div className="bg-white dark:bg-[#151821] rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Month Navigator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {monthName} {viewYear}
                </h3>
                {isCurrentViewingMonth && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    Current Cycle
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualizing due dates on a monthly grid · Click any date to focus the list below
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="inline-flex items-center rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 p-1">
              <button
                id="calendar-prev-month-btn"
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                id="calendar-today-btn"
                type="button"
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                id="calendar-next-month-btn"
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Month Summary KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Total Obligations</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(monthMetrics.totalScheduled, settings.currency)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block mb-0.5">
              Settled / Paid
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {formatCurrency(monthMetrics.totalPaid, settings.currency)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Unsettled Payments</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(monthMetrics.totalRemaining, settings.currency)}
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl border transition-colors ${
              monthMetrics.alertsCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60'
            }`}
          >
            <span
              className={`text-[11px] font-medium block mb-0.5 ${
                monthMetrics.alertsCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'
              }`}
            >
              Prior Days Alerts
            </span>
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                monthMetrics.alertsCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'
              }`}
            >
              {monthMetrics.alertsCount} {monthMetrics.alertsCount === 1 ? 'Notice' : 'Notices'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Status Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Due Soon (Alert Window)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span>Paused</span>
          </div>
        </div>
      </div>

      {/* 2. Calendar Grid */}
      <div className="bg-white dark:bg-[#151821] rounded-3xl p-4 sm:p-6 border border-slate-200/70 dark:border-slate-800/80 shadow-xs">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {WEEKDAYS.map((wd, index) => (
            <div
              key={wd}
              className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${
                index === 0 || index === 6
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Leading Empty Cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[85px] sm:min-h-[110px] rounded-2xl bg-slate-50/40 dark:bg-[#10121a]/30 border border-transparent opacity-40 select-none p-1.5"
            />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isToday = isCurrentViewingMonth && dayNum === currentDay;
            const isSelected = activeSelectedDay === dayNum;
            const dayPayments = paymentsByDay.get(dayNum) || [];
            const hasPayments = dayPayments.length > 0;

            // Day status summary
            const hasAlert =
              isCurrentViewingMonth &&
              dayPayments.some((p) => p.status === 'active' && getRecurringStatus(p).isAlert);
            const allPaid =
              hasPayments && dayPayments.every((p) => p.status === 'paused' || isPaidForViewMonth(p));
            const hasOverdue =
              isCurrentViewingMonth &&
              dayPayments.some((p) => p.status === 'active' && getRecurringStatus(p).status === 'overdue');

            return (
              <div
                key={`day-${dayNum}`}
                id={`calendar-day-${dayNum}`}
                onClick={() => handleDaySelect(dayNum)}
                className={`min-h-[85px] sm:min-h-[110px] rounded-2xl p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between text-left relative group ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : isToday
                    ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/10'
                    : hasAlert
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400'
                    : hasPayments
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#12151d] hover:border-indigo-200 dark:hover:border-slate-700'
                    : 'border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-[#141720]'
                }`}
              >
                {/* Day Header: Day Number & Indicators */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs sm:text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Badges / Micro Indicators */}
                  {hasPayments && (
                    <div className="flex items-center gap-1">
                      {hasAlert ? (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                          title="Due soon within reminder window"
                        />
                      ) : hasOverdue ? (
                        <span
                          className="w-2 h-2 rounded-full bg-rose-500"
                          title="Overdue bill"
                        />
                      ) : allPaid ? (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-500"
                          title="All payments settled for this day"
                        />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full bg-indigo-400"
                          title="Scheduled payment"
                        />
                      )}
                      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                        {dayPayments.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Day Content: Payment Item Pills (visible on medium+ screens) */}
                <div className="my-1 space-y-1 overflow-hidden">
                  {dayPayments.slice(0, 2).map((p) => {
                    const isPaid = isPaidForViewMonth(p);
                    const isAlert = isCurrentViewingMonth && p.status === 'active' && getRecurringStatus(p).isAlert;
                    const isOverdue =
                      isCurrentViewingMonth && p.status === 'active' && getRecurringStatus(p).status === 'overdue';
                    const typeConfig = RECURRING_TYPE_CONFIG[p.type];

                    return (
                      <div
                        key={p.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded-lg font-medium flex items-center justify-between gap-1 truncate transition-colors ${
                          p.status === 'paused'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                            : isPaid
                            ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40'
                            : isOverdue
                            ? 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                            : isAlert
                            ? 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 font-semibold'
                            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40'
                        }`}
                        title={`${p.title} - ${formatCurrency(p.amount, settings.currency)}`}
                      >
                        <span className="truncate flex items-center gap-1">
                          {renderTypeIcon(p.type, 10)}
                          <span className="truncate">{p.title}</span>
                        </span>
                        <span className="font-mono font-semibold shrink-0 text-[9px]">
                          {formatCurrency(p.amount, settings.currency)}
                        </span>
                      </div>
                    );
                  })}

                  {dayPayments.length > 2 && (
                    <div className="text-[9px] font-semibold text-slate-400 pl-1">
                      +{dayPayments.length - 2} more
                    </div>
                  )}
                </div>

                {/* Day Footer: Daily Total */}
                {hasPayments && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span className="text-[9px] uppercase font-sans text-slate-400">Total:</span>
                    <span>
                      {formatCurrency(
                        dayPayments.reduce((sum, p) => sum + p.amount, 0),
                        settings.currency
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Day Detailed Inspector & Action Drawer (Standalone usage only) */}
      {!onSelectDay && activeSelectedDay !== null && (
        <div
          id="calendar-selected-day-details"
          className="bg-white dark:bg-[#151821] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800/80 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {monthName} {selectedDay}, {viewYear}
                </h4>
                {isCurrentViewingMonth && selectedDay === currentDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedDayPayments.length === 0
                  ? 'No recurrent commitments scheduled on this date.'
                  : `${selectedDayPayments.length} ${
                      selectedDayPayments.length === 1 ? 'payment' : 'payments'
                    } totaling ${formatCurrency(selectedDayTotal, settings.currency)}`}
              </p>
            </div>
          </div>

          {/* List of payments for this selected day */}
          {selectedDayPayments.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <CalendarIcon size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Clear Day — No Payments Scheduled
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                You have no recurrent commitments due on the {selectedDay}th of the month.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedDayPayments.map((payment) => {
                const typeConfig = RECURRING_TYPE_CONFIG[payment.type];
                const isPaid = isPaidForViewMonth(payment);
                const statusInfo = getRecurringStatus(payment);
                const isPaused = payment.status === 'paused';

                return (
                  <div
                    key={payment.id}
                    id={`calendar-detail-payment-${payment.id}`}
                    className={`rounded-2xl p-4 border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                      isPaused
                        ? 'opacity-60 bg-slate-50 dark:bg-[#10121a] border-slate-200 dark:border-slate-800'
                        : isPaid
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                        : statusInfo.isAlert
                        ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70 ring-1 ring-amber-200/50 dark:ring-amber-900/30'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70'
                    }`}
                  >
                    {/* Left: Icon, Title & Meta */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${typeConfig.badgeBg} ${typeConfig.badgeText}`}
                      >
                        {renderTypeIcon(payment.type, 16)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {payment.title}
                          </h5>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeConfig.badgeBg} ${typeConfig.badgeText}`}
                          >
                            {typeConfig.label}
                          </span>
                          {isPaid ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              Paid ({monthName})
                            </span>
                          ) : statusInfo.isAlert ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1 animate-pulse">
                              <AlertCircle size={11} />
                              {statusInfo.label}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Upcoming ({statusInfo.label})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>
                            Advance Notice: <strong>{payment.reminderDaysBefore} days before</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Auto-sync to Ledger:{' '}
                            <strong>{payment.autoLogAsExpense !== false ? 'Enabled' : 'Disabled'}</strong>
                          </span>
                          {payment.notes && (
                            <>
                              <span>•</span>
                              <span className="italic truncate max-w-xs">{payment.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800/50">
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block">
                          {formatCurrency(payment.amount, settings.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400">Monthly</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPaid ? (
                          <button
                            type="button"
                            onClick={() => onUnmarkAsPaid(payment)}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Reset payment status"
                          >
                            <Undo2 size={13} />
                            <span>Unmark</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onMarkAsPaid(payment)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Pay & record to expense ledger"
                          >
                            <Check size={13} />
                            <span>Mark Paid</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditPayment(payment)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                          title="Edit payment details"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
