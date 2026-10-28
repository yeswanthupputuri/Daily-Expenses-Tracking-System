import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Expense, ExpenseCategory, TimeRange, UserSettings } from '../types';
import { CATEGORIES, CURRENCIES } from '../utils/constants';
import { getTodayDateString } from '../utils/formatters';

interface QuickAddCardProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  settings: UserSettings;
  timeRange: TimeRange;
}

export const QuickAddCard: React.FC<QuickAddCardProps> = ({
  onAddExpense,
  settings,
  timeRange,
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('groceries');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');

  const currencyConfig = CURRENCIES[settings.currency] || CURRENCIES.USD;

  const timeRangeBadgeText = {
    week: 'This week',
    month: 'This month',
    year: 'This year',
  }[timeRange];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Use note as description or category label if empty
    const catMeta = CATEGORIES[category] || CATEGORIES.other;
    const finalDescription = note.trim() || `${catMeta.label} expense`;

    onAddExpense({
      amount: Math.round(numAmount * 100) / 100,
      category,
      description: finalDescription,
      timestamp: new Date().toISOString(),
      date: date || getTodayDateString(),
      paymentMethod: 'card',
      notes: note.trim() ? note.trim() : undefined,
    });

    // Reset inputs
    setAmount('');
    setNote('');
  };

  return (
    <div
      id="quick-add-card"
      className="bg-white dark:bg-[#151821] rounded-3xl p-6 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.25)] relative transition-colors"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Quick add</h2>
        <span className="bg-[#e6f4ea] dark:bg-emerald-950/60 text-[#137333] dark:text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {timeRangeBadgeText}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label htmlFor="quick-add-amount" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-mono text-base font-semibold">
              {currencyConfig.symbol}
            </span>
            <input
              id="quick-add-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#f8f9fc] dark:bg-[#1c202d] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-mono text-base font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#202535] focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none transition"
              required
            />
          </div>
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="quick-add-category" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Category
          </label>
          <select
            id="quick-add-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full bg-[#f8f9fc] dark:bg-[#1c202d] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium focus:bg-white dark:focus:bg-[#202535] focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none transition cursor-pointer"
          >
            <option value="groceries" className="dark:bg-[#1c202d]">Groceries</option>
            <option value="housing" className="dark:bg-[#1c202d]">Housing</option>
            <option value="utilities" className="dark:bg-[#1c202d]">Utilities</option>
            <option value="dining_out" className="dark:bg-[#1c202d]">Dining out</option>
            <option value="transport" className="dark:bg-[#1c202d]">Transport</option>
            <option value="health" className="dark:bg-[#1c202d]">Health</option>
            <option value="entertainment" className="dark:bg-[#1c202d]">Entertainment</option>
            <option value="shopping" className="dark:bg-[#1c202d]">Shopping</option>
            <option value="other" className="dark:bg-[#1c202d]">Other</option>
          </select>
        </div>

        {/* Date and Note Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="quick-add-date" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Date
            </label>
            <input
              id="quick-add-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#f8f9fc] dark:bg-[#1c202d] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:bg-white dark:focus:bg-[#202535] focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none transition"
            />
          </div>
          <div>
            <label htmlFor="quick-add-note" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Note
            </label>
            <input
              id="quick-add-note"
              type="text"
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#f8f9fc] dark:bg-[#1c202d] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#202535] focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="quick-add-submit-btn"
          type="submit"
          className="w-full bg-[#1e202a] hover:bg-[#2d303f] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 active:scale-[0.99] py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer mt-2"
        >
          <Plus size={16} />
          <span>Add expense</span>
        </button>
      </form>
    </div>
  );
};
