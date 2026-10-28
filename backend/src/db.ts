
import mongoose, { Schema } from 'mongoose';

type ExpenseInput = {
  id: string;
  amount: number;
  category: string;
  description: string;
  timestamp?: string;
  date: string;
  paymentMethod: string;
  notes?: string;
  tags?: string[];
};

type RecurringInput = {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  frequency: string;
  dueDay: number;
  reminderDaysBefore?: number;
  paymentMethod: string;
  notes?: string;
  status?: 'active' | 'paused';
  lastPaidDate?: string;
  createdAt?: string;
  autoLogAsExpense?: boolean;
};

type SettingsInput = {
  dailyBudget?: number;
  monthlyBudgetCap?: number;
  darkMode?: boolean;
  currency?: string;
  hapticEnabled?: boolean;
  soundEnabled?: boolean;
};

// Expense schema
const expenseSchema = new Schema(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
    date: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

expenseSchema.index({ userId: 1, id: 1 }, { unique: true });
expenseSchema.index({ userId: 1, timestamp: -1 });

// Recurring-payment schema
const recurringSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, required: true },
  category: { type: String, required: true },
  frequency: { type: String, required: true },
  dueDay: { type: Number, required: true, min: 1, max: 31 },
  reminderDaysBefore: { type: Number, default: 3, min: 0 },
  paymentMethod: { type: String, required: true },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active',
  },
  lastPaidDate: String,
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  autoLogAsExpense: { type: Boolean, default: false },
});

recurringSchema.index({ userId: 1, id: 1 }, { unique: true });

// Settings schema
const settingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    dailyBudget: { type: Number, default: 150, min: 0 },
    monthlyBudgetCap: { type: Number, default: 2500, min: 0 },
    darkMode: { type: Boolean, default: false },
    currency: { type: String, default: 'USD' },
    hapticEnabled: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Models
export const ExpenseModel =
  mongoose.models.Expense ||
  mongoose.model('Expense', expenseSchema);

export const RecurringModel =
  mongoose.models.RecurringPayment ||
  mongoose.model('RecurringPayment', recurringSchema);

export const SettingsModel =
  mongoose.models.Settings ||
  mongoose.model('Settings', settingsSchema);

// MongoDB connection
export async function initMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing from backend/.env');
  }

  console.log('[MongoDB] Connecting to Atlas...');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    `[MongoDB] Connected to database: ${mongoose.connection.name}`,
  );
}

export function getDatabaseStatus() {
  return {
    database: mongoose.connection.name,
    connected: mongoose.connection.readyState === 1,
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

// Expenses
export async function getExpenses(userId: string) {
  return ExpenseModel.find({ userId })
    .sort({ timestamp: -1 })
    .lean();
}

export async function createExpense(
  userId: string,
  data: ExpenseInput,
) {
  const { userId: _ignored, ...input } = data as ExpenseInput & {
    userId?: string;
  };

  return ExpenseModel.create({
    ...input,
    userId,
    timestamp: input.timestamp || new Date().toISOString(),
  });
}

export async function updateExpense(
  userId: string,
  id: string,
  data: Partial<ExpenseInput>,
) {
  const {
    userId: _ignored,
    id: _ignoredId,
    ...safeData
  } = data as Partial<ExpenseInput> & {
    userId?: string;
    id?: string;
  };

  return ExpenseModel.findOneAndUpdate(
    { userId, id },
    { $set: safeData },
    { new: true, runValidators: true },
  );
}

export async function deleteExpense(
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await ExpenseModel.deleteOne({ userId, id });
  return result.deletedCount === 1;
}

// Recurring payments
export async function getRecurringPayments(userId: string) {
  return RecurringModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createRecurringPayment(
  userId: string,
  data: RecurringInput,
) {
  const { userId: _ignored, ...input } = data as RecurringInput & {
    userId?: string;
  };

  return RecurringModel.create({
    ...input,
    userId,
    createdAt: input.createdAt || new Date().toISOString(),
  });
}

export async function updateRecurringPayment(
  userId: string,
  id: string,
  data: Partial<RecurringInput>,
) {
  const {
    userId: _ignored,
    id: _ignoredId,
    ...safeData
  } = data as Partial<RecurringInput> & {
    userId?: string;
    id?: string;
  };

  return RecurringModel.findOneAndUpdate(
    { userId, id },
    { $set: safeData },
    { new: true, runValidators: true },
  );
}

export async function deleteRecurringPayment(
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await RecurringModel.deleteOne({ userId, id });
  return result.deletedCount === 1;
}

// Settings
const DEFAULT_SETTINGS = {
  dailyBudget: 150,
  monthlyBudgetCap: 2500,
  darkMode: false,
  currency: 'USD',
  hapticEnabled: true,
  soundEnabled: true,
};

export async function getSettings(userId: string) {
  const existing = await SettingsModel.findOne({ userId }).lean();

  if (existing) {
    return existing;
  }

  return { userId, ...DEFAULT_SETTINGS };
}

export async function saveSettings(
  userId: string,
  data: SettingsInput,
) {
  const {
    userId: _ignored,
    ...safeData
  } = data as SettingsInput & { userId?: string };

  return SettingsModel.findOneAndUpdate(
    { userId },
    { $set: safeData, $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true },
  );
}
