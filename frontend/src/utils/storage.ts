import { AuthUser, Expense, RecurringPayment, UserSettings } from '../types';
import { getTodayDateString } from './formatters';

const STORAGE_KEY_SETTINGS = 'northlight_expenses_settings_v3';
const STORAGE_KEY_AUTH = 'northlight_auth_user_v1';
const BROADCAST_CHANNEL_NAME = 'expenses_realtime_channel';

export const DEFAULT_SETTINGS: UserSettings = {
  dailyBudget: 150.0,
  monthlyBudgetCap: 2500.0,
  darkMode: false,
  currency: 'USD',
  hapticEnabled: true,
};

// No default/mock expenses - only logged-in user data is displayed
export function getInitialExpenses(): Expense[] {
  return [];
}

// No default/mock recurring payments - only logged-in user data is displayed
export function getInitialRecurringPayments(): RecurringPayment[] {
  return [];
}

export function getUserExpensesKey(userId?: string): string {
  if (userId && userId !== 'global') {
    return `northlight_expenses_user_${userId}`;
  }
  return 'northlight_expenses_user_global';
}

export function getUserRecurringKey(userId?: string): string {
  if (userId && userId !== 'global') {
    return `northlight_recurring_user_${userId}`;
  }
  return 'northlight_recurring_user_global';
}

export function getUserSettingsKey(userId?: string): string {
  if (userId && userId !== 'global') {
    return `northlight_settings_user_${userId}`;
  }
  return STORAGE_KEY_SETTINGS;
}

// Clear any legacy demo data stored in previous turns
export function purgeLegacyDemoData(): void {
  if (typeof window === 'undefined') return;
  try {
    const legacyKeys = [
      'northlight_expenses_ledger_v2',
      'northlight_expenses_ledger_v1',
      'northlight_recurring_payments_v1',
      'northlight_recurring_payments_v2',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Could not purge legacy storage keys:', err);
  }
}

export function loadExpenses(userId?: string): Expense[] {
  if (typeof window === 'undefined') return [];
  purgeLegacyDemoData();
  try {
    const key = getUserExpensesKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any lingering mock demo items
    const cleanList = parsed.filter(
      (e: Expense) => e && typeof e.id === 'string' && !e.id.startsWith('exp-nl-')
    );
    return cleanList;
  } catch (err) {
    console.error('Failed to load expenses from storage:', err);
    return [];
  }
}

export function saveExpenses(expenses: Expense[], broadcast: boolean = true, userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserExpensesKey(userId);
    localStorage.setItem(key, JSON.stringify(expenses));
    if (broadcast) {
      broadcastRealtimeEvent({ type: 'EXPENSES_UPDATED', payload: expenses });
    }
  } catch (err) {
    console.error('Failed to save expenses to storage:', err);
  }
}

export function loadSettings(userId?: string): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const key = getUserSettingsKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings, broadcast: boolean = true, userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserSettingsKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
    if (broadcast) {
      broadcastRealtimeEvent({ type: 'SETTINGS_UPDATED', payload: settings });
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadRecurringPayments(userId?: string): RecurringPayment[] {
  if (typeof window === 'undefined') return [];
  purgeLegacyDemoData();
  try {
    const key = getUserRecurringKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any lingering old demo records
    const cleanList = parsed.filter(
      (p: RecurringPayment) =>
        p &&
        typeof p.id === 'string' &&
        !['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5', 'rec-6'].includes(p.id)
    );
    return cleanList;
  } catch (err) {
    console.error('Failed to load recurring payments:', err);
    return [];
  }
}

export function saveRecurringPayments(
  payments: RecurringPayment[],
  broadcast = true,
  userId?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserRecurringKey(userId);
    localStorage.setItem(key, JSON.stringify(payments));
    if (broadcast) {
      broadcastRealtimeEvent({
        type: 'RECURRING_UPDATE',
        payload: payments,
      });
    }
  } catch (err) {
    console.error('Failed to save recurring payments:', err);
  }
}

export function loadCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) {
      return null;
    }
    const user = JSON.parse(raw);
    // Ignore legacy dummy demo user
    if (user?.id === 'usr-demo-1' || user?.id === 'usr-alex-vance') {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      return null;
    }
    return user;
  } catch (err) {
    console.error('Failed to load current user:', err);
    return null;
  }
}

export function saveCurrentUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save user:', err);
  }
}

// BroadcastChannel for instant real-time synchronization between tabs/windows
let syncChannel: BroadcastChannel | null = null;

function getSyncChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!syncChannel && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
  return syncChannel;
}

export function broadcastRealtimeEvent(message: { type: string; payload: unknown }) {
  const channel = getSyncChannel();
  if (channel) {
    channel.postMessage(message);
  }
}

export function subscribeToRealtimeSync(
  onMessage: (message: { type: string; payload: unknown }) => void
): () => void {
  const channel = getSyncChannel();
  if (!channel) return () => {};

  const handler = (event: MessageEvent) => {
    onMessage(event.data);
  };

  channel.addEventListener('message', handler);
  return () => {
    channel.removeEventListener('message', handler);
  };
}

export function exportExpensesToCSV(expenses: Expense[], currencySymbol: string): void {
  const headers = [
    'ID',
    'Date',
    'Time',
    'Category',
    'Description',
    `Amount (${currencySymbol})`,
    'Payment Method',
    'Tags',
    'Notes',
  ];
  const rows = expenses.map((e) => [
    e.id,
    e.date,
    new Date(e.timestamp).toLocaleTimeString([], { hour12: false }),
    e.category,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
    e.paymentMethod,
    `"${(e.tags || []).join(', ').replace(/"/g, '""')}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `expenses-${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
