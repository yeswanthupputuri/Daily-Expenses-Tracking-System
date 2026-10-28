export type ExpenseCategory =
  | 'housing'
  | 'groceries'
  | 'utilities'
  | 'dining_out'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'coffee'
  | 'other';

export type TimeRange = 'week' | 'month' | 'year';

export type PaymentMethod =
  | 'upi'
  | 'netbanking'
  | 'credit_card'
  | 'debit_card'
  | 'card'
  | 'cash'
  | 'digital'
  | 'bank';

export type RecurringFrequency = 'monthly' | 'yearly' | 'quarterly' | 'weekly';

export type RecurringPaymentType =
  | 'subscription' // OTT like Netflix, Prime, Spotify
  | 'rent'         // House rent, Flat rent
  | 'gas'          // LPG Gas cylinder, Piped gas
  | 'emi'          // Loan EMI, Device EMI
  | 'utility'      // Electricity, Water, Internet
  | 'insurance'    // Health, Life, Auto insurance
  | 'other';

export interface RecurringPayment {
  id: string;
  title: string;
  amount: number;
  type: RecurringPaymentType;
  category: ExpenseCategory;
  frequency: RecurringFrequency;
  dueDay: number; // Day of the month: 1 - 31
  reminderDaysBefore: number; // Prior days to update/alert before due date
  paymentMethod: PaymentMethod;
  notes?: string;
  status: 'active' | 'paused';
  lastPaidDate?: string; // YYYY-MM-DD
  createdAt: string;
  autoLogAsExpense?: boolean;
  userId?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  timestamp: string; // ISO 8601 string
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  tags?: string[];
  userId?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency?: string;
  createdAt: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface UserSettings {
  dailyBudget: number;
  monthlyBudgetCap: number;
  darkMode: boolean;
  currency: string;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
}

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
}
