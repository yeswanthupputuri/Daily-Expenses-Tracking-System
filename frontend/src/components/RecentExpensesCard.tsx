import React from 'react';
import { Pencil, X } from 'lucide-react';
import { Expense, UserSettings } from '../types';
import { CATEGORIES } from '../utils/constants';
import { formatCurrency, formatDateShort } from '../utils/formatters';

interface RecentExpensesCardProps {
  expenses: Expense[];
  settings: UserSettings;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const RecentExpensesCard: React.FC<RecentExpensesCardProps> = ({
  expenses,
  settings,
  onEditExpense,
  onDeleteExpense,
}) => {
  // Sort descending by timestamp / date
  const sortedExpenses = [...expenses].sort((a, b) => {
    return new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime();
  });

  return (
    <div
      id="recent-expenses-card"
      className="bg-white dark:bg-[#151821] rounded-3xl p-6 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.25)] transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Recent</h2>
        <span className="text-xs font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full">
          {expenses.length > 30 ? `Last 30 of ${expenses.length}` : `${expenses.length} total`}
        </span>
      </div>

      {/* Transaction List */}
      {sortedExpenses.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
          No expenses logged yet. Add your first expense above.
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {sortedExpenses.slice(0, 30).map((expense) => {
            const catMeta = CATEGORIES[expense.category] || CATEGORIES.other;
            const dateDisplay = formatDateShort(expense.date);

            return (
              <div
                key={expense.id}
                id={`expense-row-${expense.id}`}
                className="bg-white dark:bg-[#1a1e2b] hover:bg-slate-50/70 dark:hover:bg-[#222838] border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3 px-3.5 transition-colors flex items-center justify-between group"
              >
                {/* Left: Description and Category / Date */}
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate max-w-[150px] sm:max-w-[170px]">
                    {expense.description}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <span>{catMeta.label}</span>
                    <span>·</span>
                    <span>{dateDisplay}</span>
                  </p>
                </div>

                {/* Right: Amount & Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    {formatCurrency(expense.amount, settings.currency)}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditExpense(expense)}
                      title="Edit expense"
                      aria-label={`Edit ${expense.description}`}
                      className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-md transition-colors cursor-pointer"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(expense.id)}
                      title="Delete expense"
                      aria-label={`Delete ${expense.description}`}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
