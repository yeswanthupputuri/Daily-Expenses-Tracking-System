import { RecurringPayment, RecurringPaymentType } from '../types';

export interface RecurringStatusInfo {
  status: 'paid' | 'due_today' | 'reminder_active' | 'upcoming' | 'overdue';
  label: string;
  daysRemaining: number;
  nextDueDate: string; // YYYY-MM-DD
  reminderTriggerDate: string; // YYYY-MM-DD
  isAlert: boolean;
  isPaidCurrentMonth: boolean;
}

/**
 * Returns today's date parts in local time
 */
export function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 - 11
  const day = now.getDate();
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { now, year, month, day, todayStr };
}

/**
 * Checks if a payment was already paid for the current month
 */
export function isPaidForCurrentCycle(payment: RecurringPayment): boolean {
  if (!payment.lastPaidDate) return false;
  const { year, month } = getLocalToday();
  const [paidYear, paidMonth] = payment.lastPaidDate.split('-').map(Number);
  return paidYear === year && paidMonth === month + 1;
}

/**
 * Computes the next due date and status for a recurring payment
 */
export function getRecurringStatus(payment: RecurringPayment): RecurringStatusInfo {
  const { year, month, day, todayStr } = getLocalToday();
  const isPaid = isPaidForCurrentCycle(payment);

  // Determine target month and year
  // Number of days in current month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const targetDay = Math.min(payment.dueDay, daysInCurrentMonth);

  // Due date for current month
  const currentMonthDue = new Date(year, month, targetDay);
  const currentMonthDueStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

  // If already paid for this month, the next due date is next month
  if (isPaid) {
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const normalizedNextMonth = nextMonth % 12;
    const daysInNextMonth = new Date(nextYear, normalizedNextMonth + 1, 0).getDate();
    const nextTargetDay = Math.min(payment.dueDay, daysInNextMonth);
    const nextDueDateObj = new Date(nextYear, normalizedNextMonth, nextTargetDay);
    const nextDueDateStr = `${nextYear}-${String(normalizedNextMonth + 1).padStart(2, '0')}-${String(nextTargetDay).padStart(2, '0')}`;

    // Reminder trigger date for next month
    const reminderDate = new Date(nextDueDateObj);
    reminderDate.setDate(reminderDate.getDate() - payment.reminderDaysBefore);
    const reminderStr = `${reminderDate.getFullYear()}-${String(reminderDate.getMonth() + 1).padStart(2, '0')}-${String(reminderDate.getDate()).padStart(2, '0')}`;

    const diffMs = nextDueDateObj.getTime() - new Date(year, month, day).getTime();
    const daysUntilNext = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      status: 'paid',
      label: `Paid for ${currentMonthDue.toLocaleString('default', { month: 'short' })}`,
      daysRemaining: daysUntilNext,
      nextDueDate: nextDueDateStr,
      reminderTriggerDate: reminderStr,
      isAlert: false,
      isPaidCurrentMonth: true,
    };
  }

  // Not paid for current month: check relative to currentMonthDue
  const diffDays = targetDay - day;

  // Reminder trigger date for current month
  const reminderDate = new Date(currentMonthDue);
  reminderDate.setDate(reminderDate.getDate() - payment.reminderDaysBefore);
  const reminderStr = `${reminderDate.getFullYear()}-${String(reminderDate.getMonth() + 1).padStart(2, '0')}-${String(reminderDate.getDate()).padStart(2, '0')}`;

  if (diffDays < 0) {
    // Overdue for this month!
    const overdueDays = Math.abs(diffDays);
    return {
      status: 'overdue',
      label: `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`,
      daysRemaining: diffDays,
      nextDueDate: currentMonthDueStr,
      reminderTriggerDate: reminderStr,
      isAlert: true,
      isPaidCurrentMonth: false,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Due Today!',
      daysRemaining: 0,
      nextDueDate: currentMonthDueStr,
      reminderTriggerDate: reminderStr,
      isAlert: true,
      isPaidCurrentMonth: false,
    };
  }

  if (diffDays <= payment.reminderDaysBefore) {
    return {
      status: 'reminder_active',
      label: `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`,
      daysRemaining: diffDays,
      nextDueDate: currentMonthDueStr,
      reminderTriggerDate: reminderStr,
      isAlert: true,
      isPaidCurrentMonth: false,
    };
  }

  return {
    status: 'upcoming',
    label: `Due in ${diffDays} days`,
    daysRemaining: diffDays,
    nextDueDate: currentMonthDueStr,
    reminderTriggerDate: reminderStr,
    isAlert: false,
    isPaidCurrentMonth: false,
  };
}

export interface TypeMeta {
  type: RecurringPaymentType;
  label: string;
  defaultCategory: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
}

export const RECURRING_TYPE_CONFIG: Record<RecurringPaymentType, TypeMeta> = {
  subscription: {
    type: 'subscription',
    label: 'OTT & Subscriptions',
    defaultCategory: 'entertainment',
    iconName: 'Tv',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  rent: {
    type: 'rent',
    label: 'House Rent',
    defaultCategory: 'housing',
    iconName: 'Home',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  gas: {
    type: 'gas',
    label: 'GAS [LPG]',
    defaultCategory: 'utilities',
    iconName: 'Flame',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
    badgeText: 'text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  emi: {
    type: 'emi',
    label: 'Loan & EMI',
    defaultCategory: 'bills',
    iconName: 'CreditCard',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  utility: {
    type: 'utility',
    label: 'Utilities & Bills',
    defaultCategory: 'utilities',
    iconName: 'Zap',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeText: 'text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  insurance: {
    type: 'insurance',
    label: 'Insurance',
    defaultCategory: 'bills',
    iconName: 'Shield',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  other: {
    type: 'other',
    label: 'Other Recurrent',
    defaultCategory: 'other',
    iconName: 'Repeat',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};
