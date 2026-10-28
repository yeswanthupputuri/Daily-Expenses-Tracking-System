import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Home,
  ShoppingCart,
  Zap,
  UtensilsCrossed,
  Bus,
  Tv,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Receipt,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Calendar,
  Wallet,
  ReceiptText,
  Repeat,
  Tag,
} from 'lucide-react';
import { Expense, ExpenseCategory, RecurringPayment, TimeRange, UserSettings } from '../types';
import { CATEGORIES, CURRENCIES, PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

interface SpendByCategoryCardProps {
  expenses: Expense[];
  allExpenses?: Expense[];
  recurringPayments?: RecurringPayment[];
  settings: UserSettings;
  timeRange: TimeRange;
}

// Icon mapper for categories
const getCategoryIcon = (catKey: string, size = 16) => {
  switch (catKey) {
    case 'housing':
      return <Home size={size} />;
    case 'groceries':
      return <ShoppingCart size={size} />;
    case 'utilities':
      return <Zap size={size} />;
    case 'dining_out':
      return <UtensilsCrossed size={size} />;
    case 'transport':
      return <Bus size={size} />;
    case 'entertainment':
      return <Tv size={size} />;
    case 'health':
    case 'healthcare':
      return <HeartPulse size={size} />;
    case 'shopping':
      return <ShoppingBag size={size} />;
    case 'education':
      return <GraduationCap size={size} />;
    case 'bills':
      return <Receipt size={size} />;
    default:
      return <HelpCircle size={size} />;
  }
};

export const SpendByCategoryCard: React.FC<SpendByCategoryCardProps> = ({
  expenses,
  allExpenses = [],
  recurringPayments = [],
  settings,
  timeRange,
}) => {
  // Selected category for drill-down expansion
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const isDark = settings.darkMode;

  const timeRangeLabel = {
    week: 'This week',
    month: 'This month',
    year: 'This year',
  }[timeRange];

  // Pool of expenses to analyze (prefer active range, fallback to all expenses if range is empty)
  const activeExpensePool = useMemo(() => {
    if (expenses.length > 0) return expenses;
    if (allExpenses.length > 0) return allExpenses;
    return [];
  }, [expenses, allExpenses]);

  // Aggregate category stats: total amount, count, percentage, strictly sorted descending
  const { categoryStats, totalSpend, totalCount } = useMemo(() => {
    const stats: Record<
      string,
      {
        category: ExpenseCategory;
        amount: number;
        count: number;
        average: number;
        percentage: number;
      }
    > = {};

    let total = 0;
    let count = 0;

    activeExpensePool.forEach((e) => {
      total += e.amount;
      count += 1;
      if (!stats[e.category]) {
        stats[e.category] = {
          category: e.category,
          amount: 0,
          count: 0,
          average: 0,
          percentage: 0,
        };
      }
      stats[e.category].amount += e.amount;
      stats[e.category].count += 1;
    });

    Object.values(stats).forEach((item) => {
      item.percentage = total > 0 ? (item.amount / total) * 100 : 0;
      item.average = item.count > 0 ? item.amount / item.count : 0;
    });

    // Sort strictly by highest spend amount descending
    const sorted = Object.values(stats).sort((a, b) => b.amount - a.amount);

    return {
      categoryStats: sorted,
      totalSpend: total,
      totalCount: count,
    };
  }, [activeExpensePool]);

  // Toggle selection when clicking a category or its arrow
  const handleCategoryClick = (cat: ExpenseCategory) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  };

  // Helper to get items for a category: checks active expenses, fallback to allExpenses
  const getItemsForCategory = (cat: ExpenseCategory): Expense[] => {
    const fromActive = expenses.filter((e) => e.category === cat);
    if (fromActive.length > 0) {
      return [...fromActive].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const fromAll = allExpenses.filter((e) => e.category === cat);
    return [...fromAll].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Helper to get recurring payments related to this category
  const getRecurringForCategory = (cat: ExpenseCategory): RecurringPayment[] => {
    return recurringPayments.filter(
      (r) =>
        r.category === cat ||
        (cat === 'housing' && r.type === 'rent') ||
        (cat === 'bills' && (r.type === 'emi' || r.type === 'utility' || r.type === 'insurance')) ||
        (cat === 'utilities' && r.type === 'utility') ||
        (cat === 'entertainment' && r.type === 'subscription')
    );
  };

  return (
    <div
      id="spend-by-category-card"
      className="bg-white dark:bg-[#151821] rounded-3xl p-5 sm:p-7 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.25)] transition-colors space-y-5"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <BarChart3 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                Spend by Category
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {categoryStats.length} {categoryStats.length === 1 ? 'category' : 'categories'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {timeRangeLabel} · Total {formatCurrency(totalSpend, settings.currency)} across {totalCount} logs · Click any category to view related data
            </p>
          </div>
        </div>
      </div>

      {categoryStats.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
          No category spending recorded for this period.
        </div>
      ) : (
        /* Single View: Horizontal Bar Chart Layout with Progress-Bar Indicators & Expandable Related Data */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>Category & Indicator</span>
            <span className="text-right">Spend Amount / Share</span>
          </div>

          <div className="space-y-2.5">
            {categoryStats.map((item) => {
              const meta = CATEGORIES[item.category as keyof typeof CATEGORIES] || CATEGORIES.other;
              const isSelected = selectedCategory === item.category;
              const relatedItems = isSelected ? getItemsForCategory(item.category) : [];
              const relatedRecurring = isSelected ? getRecurringForCategory(item.category) : [];

              return (
                <div
                  key={item.category}
                  id={`category-bar-container-${item.category}`}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isSelected
                      ? 'border-indigo-400 dark:border-indigo-500 shadow-sm bg-slate-50/50 dark:bg-[#181c28] ring-1 ring-indigo-400/20'
                      : 'bg-white dark:bg-[#181b25] border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Clickable Header Row */}
                  <div
                    id={`category-bar-btn-${item.category}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCategoryClick(item.category)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCategoryClick(item.category);
                      }
                    }}
                    className="w-full text-left p-3.5 flex flex-col gap-2.5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors select-none"
                    aria-expanded={isSelected}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: isDark ? `${meta.color}25` : meta.bgLight,
                            borderColor: isDark ? `${meta.color}50` : meta.borderColor,
                            color: meta.color,
                          }}
                        >
                          {getCategoryIcon(item.category, 16)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {meta.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              ({item.count} {item.count === 1 ? 'log' : 'logs'})
                            </span>
                            <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                              {isSelected ? '· Hide details' : '· Click to view'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {formatCurrency(item.amount, settings.currency)}
                        </span>
                        <span
                          className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border shrink-0"
                          style={{
                            backgroundColor: isDark ? `${meta.color}20` : `${meta.color}15`,
                            color: meta.color,
                            borderColor: isDark ? `${meta.color}40` : `${meta.color}30`,
                          }}
                        >
                          {item.percentage.toFixed(1)}%
                        </span>
                        {/* Interactive Clickable Arrow */}
                        <button
                          type="button"
                          id={`category-arrow-btn-${item.category}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(item.category);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title={isSelected ? 'Hide related items' : 'Click to show related items'}
                        >
                          {isSelected ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Progress-Bar Style Indicator */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(item.percentage, 2))}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* INLINE RELATED ITEMS EXPANSION FOR THIS CATEGORY */}
                  {isSelected && (
                    <div
                      id={`category-inline-items-${item.category}`}
                      className="px-4 pb-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 bg-white/80 dark:bg-[#151821]/90 space-y-3 animate-in fade-in duration-200"
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                          <ReceiptText size={14} />
                          <span>
                            Related Data in {meta.label} ({relatedItems.length} {relatedItems.length === 1 ? 'entry' : 'entries'})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(item.category)}
                          className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer font-medium"
                        >
                          Collapse
                        </button>
                      </div>

                      {/* 1. Related Logged Expenses List */}
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                        {relatedItems.length === 0 ? (
                          <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                            No individual expense transactions recorded for {meta.label}.
                          </div>
                        ) : (
                          relatedItems.map((exp) => {
                            const methodConfig =
                              PAYMENT_METHODS[exp.paymentMethod] || PAYMENT_METHODS.card;

                            return (
                              <div
                                key={exp.id}
                                id={`category-related-item-${exp.id}`}
                                className="p-3 rounded-xl bg-white dark:bg-[#1a1e2b] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 dark:text-white truncate">
                                      {exp.description}
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                      {methodConfig.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2.5 mt-1 text-[11px] text-slate-400 font-mono">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={11} className="text-slate-400" />
                                      {exp.date}
                                    </span>
                                    {exp.notes && (
                                      <span className="truncate italic font-sans text-slate-500 dark:text-slate-400 max-w-xs">
                                        · {exp.notes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="font-bold font-mono text-sm text-slate-900 dark:text-white shrink-0">
                                  {formatCurrency(exp.amount, settings.currency)}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* 2. Tracked Recurrent Payments in this Category (if any) */}
                      {relatedRecurring.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5 flex items-center gap-1.5">
                            <Repeat size={12} className="text-indigo-500" />
                            <span>Linked Recurrent Payments ({relatedRecurring.length})</span>
                          </span>
                          <div className="space-y-1.5">
                            {relatedRecurring.map((rec) => (
                              <div
                                key={rec.id}
                                className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Repeat size={12} />
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                                      {rec.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Due {rec.dueDay}{rec.dueDay === 1 ? 'st' : rec.dueDay === 2 ? 'nd' : rec.dueDay === 3 ? 'rd' : 'th'} monthly · {rec.paymentMethod.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-bold font-mono text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                                  {formatCurrency(rec.amount, settings.currency)}/mo
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
