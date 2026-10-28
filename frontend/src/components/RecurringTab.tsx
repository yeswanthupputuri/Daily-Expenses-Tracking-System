import React, { useState, useMemo } from 'react';
import {
  Plus,
  Repeat,
  Tv,
  Home,
  Flame,
  CreditCard,
  Zap,
  Shield,
  Calendar,
  CalendarDays,
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Search,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { RecurringPayment, RecurringPaymentType, UserSettings } from '../types';
import { CURRENCIES, CATEGORIES } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';
import { getRecurringStatus, RECURRING_TYPE_CONFIG } from '../utils/recurringHelpers';
import { RecurringCalendarView } from './RecurringCalendarView';

interface RecurringTabProps {
  recurringPayments: RecurringPayment[];
  settings: UserSettings;
  onOpenAddModal: () => void;
  onEditPayment: (payment: RecurringPayment) => void;
  onDeletePayment: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onMarkAsPaid: (payment: RecurringPayment) => void;
  onUnmarkAsPaid: (payment: RecurringPayment) => void;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  recurringPayments,
  settings,
  onOpenAddModal,
  onEditPayment,
  onDeletePayment,
  onToggleStatus,
  onMarkAsPaid,
  onUnmarkAsPaid,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'alert' | 'pending' | 'paid'>('all');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState<boolean>(false);

  const curr = CURRENCIES[settings.currency] || CURRENCIES.USD;
  const isDark = settings.darkMode;

  // Compute status for all payments
  const paymentsWithStatus = useMemo(() => {
    return recurringPayments.map((p) => {
      const statusInfo = getRecurringStatus(p);
      return {
        payment: p,
        statusInfo,
      };
    });
  }, [recurringPayments]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalMonthly = 0;
    let paidMonthly = 0;
    let pendingMonthly = 0;
    let alertCount = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;

    paymentsWithStatus.forEach(({ payment, statusInfo }) => {
      if (payment.status === 'paused') return;

      totalMonthly += payment.amount;

      if (statusInfo.isPaidCurrentMonth) {
        paidMonthly += payment.amount;
      } else {
        pendingMonthly += payment.amount;
      }

      if (statusInfo.isAlert) {
        alertCount++;
      }
      if (statusInfo.status === 'overdue') {
        overdueCount++;
      }
      if (statusInfo.status === 'due_today') {
        dueTodayCount++;
      }
    });

    return {
      totalMonthly,
      paidMonthly,
      pendingMonthly,
      alertCount,
      overdueCount,
      dueTodayCount,
    };
  }, [paymentsWithStatus]);

  // Urgent/Due Soon payments for banner
  const alertPayments = useMemo(() => {
    return paymentsWithStatus
      .filter(({ payment, statusInfo }) => payment.status === 'active' && statusInfo.isAlert)
      .sort((a, b) => a.statusInfo.daysRemaining - b.statusInfo.daysRemaining);
  }, [paymentsWithStatus]);

  // Filtered payments (includes calendar day filter when a day is clicked)
  const filteredPayments = useMemo(() => {
    return paymentsWithStatus.filter(({ payment, statusInfo }) => {
      // Day filter from interactive calendar
      if (selectedCalendarDay !== null && payment.dueDay !== selectedCalendarDay) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && payment.type !== selectedType) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === 'alert' && !statusInfo.isAlert) {
        return false;
      }
      if (selectedStatusFilter === 'pending' && statusInfo.isPaidCurrentMonth) {
        return false;
      }
      if (selectedStatusFilter === 'paid' && !statusInfo.isPaidCurrentMonth) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = payment.title.toLowerCase().includes(query);
        const matchesNotes = (payment.notes || '').toLowerCase().includes(query);
        const matchesCategory = (CATEGORIES[payment.category]?.label || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes && !matchesCategory) return false;
      }

      return true;
    });
  }, [paymentsWithStatus, selectedCalendarDay, selectedType, selectedStatusFilter, searchQuery]);

  // Type icon helper
  const renderTypeIcon = (t: RecurringPaymentType) => {
    switch (t) {
      case 'subscription':
        return <Tv size={15} />;
      case 'rent':
        return <Home size={15} />;
      case 'gas':
        return <Flame size={15} />;
      case 'emi':
        return <CreditCard size={15} />;
      case 'utility':
        return <Zap size={15} />;
      case 'insurance':
        return <Shield size={15} />;
      default:
        return <Repeat size={15} />;
    }
  };

  return (
    <div id="recurring-payments-tab" className="space-y-6">
      {/* 1. Header with Title & Direct Actions (One Unified Tab) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Recurrent Payments & Subscriptions
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
              {recurringPayments.length} tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track OTT subscriptions, house rent, cooking gas, EMIs, and custom advance reminder windows with calendar scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Toggle Calendar Visibility */}
          <button
            id="toggle-calendar-view-btn"
            type="button"
            onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
            className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151821] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title={isCalendarCollapsed ? 'Show monthly calendar grid' : 'Hide monthly calendar grid'}
          >
            <CalendarDays size={14} className="text-indigo-500" />
            <span>{isCalendarCollapsed ? 'Show Calendar Grid' : 'Hide Calendar Grid'}</span>
            {isCalendarCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>

          {/* Add Recurrent Payment Button */}
          <button
            id="add-recurrent-payment-header-btn"
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Recurrent Payment</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Commitments */}
        <div
          id="metric-monthly-commitments"
          className="bg-white dark:bg-[#151821] rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/80 border-t-2 border-t-indigo-500 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Total Monthly Obligation
              </span>
              <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Repeat size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(metrics.totalMonthly, settings.currency)}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Across {recurringPayments.filter((p) => p.status === 'active').length} active monthly recurring bills
          </p>
        </div>

        {/* Due Soon / Reminder Alerts */}
        <div
          id="metric-due-soon-alerts"
          className={`bg-white dark:bg-[#151821] rounded-3xl p-5 border shadow-xs flex flex-col justify-between transition-colors ${
            metrics.alertCount > 0
              ? 'border-amber-300 dark:border-amber-800/80 border-t-2 border-t-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
              : 'border-slate-200/70 dark:border-slate-800/80 border-t-2 border-t-slate-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Due Within Prior Days
              </span>
              <div
                className={`p-1.5 rounded-xl ${
                  metrics.alertCount > 0
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Bell size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {metrics.alertCount}
              </p>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {metrics.dueTodayCount > 0 ? `(${metrics.dueTodayCount} due today)` : 'action required'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Payments entering their custom reminder notice window
          </p>
        </div>

        {/* Paid this month */}
        <div
          id="metric-paid-this-month"
          className="bg-white dark:bg-[#151821] rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/80 border-t-2 border-t-emerald-500 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Paid This Month
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(metrics.paidMonthly, settings.currency)}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {metrics.totalMonthly > 0
              ? `${Math.round((metrics.paidMonthly / metrics.totalMonthly) * 100)}% of monthly commitments settled`
              : 'No commitments'}
          </p>
        </div>

        {/* Unsettled Payments to pay */}
        <div
          id="metric-pending-to-pay"
          className="bg-white dark:bg-[#151821] rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/80 border-t-2 border-t-teal-500 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Unsettled Payments
              </span>
              <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Clock size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(metrics.pendingMonthly, settings.currency)}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Pending to be paid this billing cycle
          </p>
        </div>
      </div>

      {/* 3. Prior Days Alert Notice Banner */}
      {alertPayments.length > 0 && (
        <div
          id="recurring-alert-notice-banner"
          className="p-4 rounded-3xl border border-amber-200 dark:border-amber-900/80 bg-gradient-to-r from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-950/20 text-slate-900 dark:text-slate-100 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Prior Days Payment Alert
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-amber-200/80 text-amber-950 dark:bg-amber-900 dark:text-amber-200">
                  {alertPayments.length} upcoming
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                The following recurrent obligations have reached their scheduled reminder dates and need to be paid:
              </p>

              {/* Actionable item chips in banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
                {alertPayments.map(({ payment, statusInfo }) => (
                  <div
                    key={payment.id}
                    className="p-3 rounded-2xl bg-white/90 dark:bg-[#1c202d] border border-amber-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {payment.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5 font-mono">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {formatCurrency(payment.amount, settings.currency)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span
                          className={`font-semibold ${
                            statusInfo.status === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400'
                              : statusInfo.status === 'due_today'
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onMarkAsPaid(payment)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
                      title="Mark as paid and record to expenses"
                    >
                      <Check size={12} />
                      <span>Pay</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Calendar Grid Section (Included Directly in Main Tab) */}
      {!isCalendarCollapsed && (
        <section id="recurring-calendar-section" className="space-y-3">
          <RecurringCalendarView
            recurringPayments={recurringPayments}
            settings={settings}
            onOpenAddModal={onOpenAddModal}
            onEditPayment={onEditPayment}
            onDeletePayment={onDeletePayment}
            onToggleStatus={onToggleStatus}
            onMarkAsPaid={onMarkAsPaid}
            onUnmarkAsPaid={onUnmarkAsPaid}
            selectedDay={selectedCalendarDay}
            onSelectDay={setSelectedCalendarDay}
          />
        </section>
      )}

      {/* 5. Cards List Section Header & Interactive Filters */}
      <section id="recurring-cards-section" className="space-y-4 pt-2">
        {/* Section Title & Calendar Day Filter Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                All Recurrent Commitments
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredPayments.length} of {recurringPayments.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
              Browse, search, edit, and mark your monthly obligations as settled.
            </p>
          </div>

          {/* If a calendar day is selected, show active filter pill */}
          {selectedCalendarDay !== null && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 animate-in fade-in">
              <Calendar size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>
                Filtered to <strong>Day {selectedCalendarDay}</strong> ({filteredPayments.length} bills)
              </span>
              <button
                type="button"
                onClick={() => setSelectedCalendarDay(null)}
                className="ml-1 p-0.5 rounded-full hover:bg-indigo-200/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 cursor-pointer"
                title="Clear day filter to view all days"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Filters Row: Category / Type Pills & Search + Status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Category / Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
            >
              All Types
            </button>
            {(Object.keys(RECURRING_TYPE_CONFIG) as RecurringPaymentType[]).map((tKey) => {
              const config = RECURRING_TYPE_CONFIG[tKey];
              const isSelected = selectedType === tKey;
              return (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setSelectedType(tKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                  }`}
                >
                  {renderTypeIcon(tKey)}
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side: Search & Status Filter */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-52">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payments..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700/80 text-white placeholder:text-slate-500 focus:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600'
                }`}
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium focus:outline-none ${
                isDark ? 'bg-[#1c202d] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Status</option>
              <option value="alert">Due Soon / Alerts</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid this Month</option>
            </select>
          </div>
        </div>

        {/* 6. Payments Cards Grid */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#151821] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Repeat size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Recurrent Payments Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {selectedCalendarDay !== null
                ? `No payments scheduled on Day ${selectedCalendarDay}. Click "Clear filter" to view all dates.`
                : searchQuery || selectedType !== 'all' || selectedStatusFilter !== 'all'
                ? 'No recurrent payments match your selected filter criteria.'
                : 'Start tracking monthly subscriptions, house rent, LPG gas cylinders, and EMIs.'}
            </p>
            {selectedCalendarDay !== null ? (
              <button
                type="button"
                onClick={() => setSelectedCalendarDay(null)}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View All Days</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Add First Recurrent Payment</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPayments.map(({ payment, statusInfo }) => {
              const typeConfig = RECURRING_TYPE_CONFIG[payment.type];
              const isPaid = statusInfo.isPaidCurrentMonth;
              const isPaused = payment.status === 'paused';

              return (
                <div
                  key={payment.id}
                  id={`recurring-card-${payment.id}`}
                  className={`rounded-3xl p-5 border transition-all relative flex flex-col justify-between ${
                    isPaused
                      ? 'opacity-60 bg-slate-50 dark:bg-[#11131a] border-slate-200 dark:border-slate-800'
                      : isPaid
                      ? 'bg-white dark:bg-[#151821] border-emerald-200 dark:border-emerald-950/80 shadow-xs'
                      : statusInfo.isAlert
                      ? 'bg-white dark:bg-[#151821] border-amber-300 dark:border-amber-800/80 shadow-xs ring-1 ring-amber-200 dark:ring-amber-900/40'
                      : 'bg-white dark:bg-[#151821] border-slate-200/70 dark:border-slate-800/80 shadow-xs'
                  }`}
                >
                  {/* Card Top: Icon, Title, Type Pill & Status */}
                  <div>
                    <div className="flex items-start justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${typeConfig.badgeBg} ${typeConfig.badgeText}`}
                        >
                          {renderTypeIcon(payment.type)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                            {payment.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${typeConfig.badgeBg} ${typeConfig.badgeText}`}
                            >
                              {typeConfig.label}
                            </span>
                            {isPaused && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                Paused
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block leading-none">
                          {formatCurrency(payment.amount, settings.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block mt-1">/ month</span>
                      </div>
                    </div>

                    {/* Card Middle: Due Date & Prior Days Alert Configuration */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#1a1e2b] border border-slate-100 dark:border-slate-800/80 space-y-1.5 my-3">
                      {/* Due Date */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar size={13} className="text-indigo-500" />
                          <span>Payment Due Date:</span>
                        </span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {payment.dueDay}
                          {payment.dueDay === 1
                            ? 'st'
                            : payment.dueDay === 2
                            ? 'nd'
                            : payment.dueDay === 3
                            ? 'rd'
                            : 'th'}{' '}
                          of every month
                        </span>
                      </div>

                      {/* Prior Days Reminder Alert */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Bell size={13} className="text-amber-500" />
                          <span>Prior Notice Window:</span>
                        </span>
                        <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.2 rounded-md">
                          {payment.reminderDaysBefore} {payment.reminderDaysBefore === 1 ? 'day' : 'days'} prior
                        </span>
                      </div>

                      {/* Next Due / Status Pill */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-400 text-[11px]">Current Cycle Status:</span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                              : statusInfo.status === 'overdue'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 animate-pulse'
                              : statusInfo.status === 'due_today'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-extrabold'
                              : statusInfo.isAlert
                              ? 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isPaid && <Check size={11} />}
                          {statusInfo.status === 'overdue' && <AlertCircle size={11} />}
                          {statusInfo.status === 'due_today' && <AlertTriangle size={11} />}
                          {statusInfo.status === 'reminder_active' && <Clock size={11} />}
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Notes / Provider info if available */}
                    {payment.notes && (
                      <p className="text-[11px] text-slate-400 italic mb-3 line-clamp-1">
                        "{payment.notes}"
                      </p>
                    )}
                  </div>

                  {/* Card Actions: Mark Paid / Undo, Edit, Pause, Delete */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Mark as Paid / Paid Status Button */}
                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => onUnmarkAsPaid(payment)}
                        className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Click to undo paid status"
                      >
                        <Check size={13} className="text-emerald-600" />
                        <span>Settled (Undo)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkAsPaid(payment)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          statusInfo.isAlert
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-[#1e202a] hover:bg-[#2d303f] dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white'
                        }`}
                        title="Mark as paid and record into expense ledger"
                      >
                        <Check size={13} />
                        <span>Mark as Paid</span>
                      </button>
                    )}

                    {/* Secondary Action Icons: Edit, Pause/Resume, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(payment.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isDark
                            ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                            : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                        title={isPaused ? 'Resume payment' : 'Pause payment'}
                      >
                        <Clock size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditPayment(payment)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isDark
                            ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                            : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                        title="Edit payment & reminder days"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeletePayment(payment.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isDark
                            ? 'border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400'
                            : 'border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                        }`}
                        title="Delete recurrent payment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
