import { ExpenseCategory, CurrencyConfig, CategoryMeta, PaymentMethod } from '../types';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', locale: 'en-AU' },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { id: PaymentMethod; label: string }> = {
  upi: { id: 'upi', label: 'UPI' },
  netbanking: { id: 'netbanking', label: 'Net Banking' },
  credit_card: { id: 'credit_card', label: 'Credit Card' },
  debit_card: { id: 'debit_card', label: 'Debit Card' },
  card: { id: 'card', label: 'Card' },
  bank: { id: 'bank', label: 'Bank Transfer' },
  digital: { id: 'digital', label: 'Digital Wallet' },
  cash: { id: 'cash', label: 'Cash' },
};

export const CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  housing: {
    id: 'housing',
    label: 'Housing',
    icon: 'Home',
    color: '#7c5295', // soft purple
    bgLight: '#f3eef7',
    borderColor: '#e5d9ec',
  },
  groceries: {
    id: 'groceries',
    label: 'Groceries',
    icon: 'ShoppingCart',
    color: '#38bdf8', // sky-400 / cyan
    bgLight: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  utilities: {
    id: 'utilities',
    label: 'Utilities',
    icon: 'Zap',
    color: '#f59e0b', // amber-500
    bgLight: '#fef3c7',
    borderColor: '#fde68a',
  },
  dining_out: {
    id: 'dining_out',
    label: 'Dining out',
    icon: 'UtensilsCrossed',
    color: '#fb7185', // coral rose-400
    bgLight: '#ffe4e6',
    borderColor: '#fecdd3',
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    icon: 'Bus',
    color: '#4ade80', // green-400
    bgLight: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  health: {
    id: 'health',
    label: 'Health',
    icon: 'HeartPulse',
    color: '#a78bfa', // violet-400
    bgLight: '#ede9fe',
    borderColor: '#ddd6fe',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'Film',
    color: '#34d399', // emerald-400
    bgLight: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  food: {
    id: 'food',
    label: 'Dining out',
    icon: 'UtensilsCrossed',
    color: '#fb7185',
    bgLight: '#ffe4e6',
    borderColor: '#fecdd3',
  },
  coffee: {
    id: 'coffee',
    label: 'Coffee & Snacks',
    icon: 'Coffee',
    color: '#fb923c',
    bgLight: '#ffedd5',
    borderColor: '#fed7aa',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    icon: 'ShoppingBag',
    color: '#c084fc',
    bgLight: '#f3e8ff',
    borderColor: '#e9d5ff',
  },
  bills: {
    id: 'bills',
    label: 'Utilities & Bills',
    icon: 'Receipt',
    color: '#f59e0b',
    bgLight: '#fef3c7',
    borderColor: '#fde68a',
  },
  other: {
    id: 'other',
    label: 'Other',
    icon: 'Tag',
    color: '#94a3b8',
    bgLight: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
};

export const QUICK_ADD_PRESETS = [
  { label: 'Morning Coffee', amount: 4.75, category: 'coffee' as ExpenseCategory, method: 'card' as const },
  { label: 'Lunch / Meal', amount: 13.50, category: 'food' as ExpenseCategory, method: 'card' as const },
  { label: 'Transit / Commute', amount: 2.90, category: 'transport' as ExpenseCategory, method: 'card' as const },
  { label: 'Grocery Stop', amount: 24.80, category: 'groceries' as ExpenseCategory, method: 'card' as const },
  { label: 'Afternoon Tea', amount: 3.50, category: 'coffee' as ExpenseCategory, method: 'cash' as const },
];
