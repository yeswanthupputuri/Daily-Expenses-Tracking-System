import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Trash2,
  Edit3,
  Copy,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  ArrowUpDown,
  X,
  Clock,
  Sparkles,
  Tag as TagIcon,
} from 'lucide-react';
import { Expense, ExpenseCategory, UserSettings } from '../types';
import { CATEGORIES } from '../utils/constants';
import { CategoryIcon } from './CategoryIcon';
import {
  formatCurrency,
  formatRelativeTime,
  formatExpenseTime,
  getTodayDateString,
} from '../utils/formatters';

interface RealtimeExpenseFeedProps {
  expenses: Expense[];
  settings: UserSettings;
  onEditExpense: (expense: Expense) => void;
  onDuplicateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenAddModal: () => void;
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'all';
type SortOption = 'newest' | 'amount_desc' | 'amount_asc';

export const RealtimeExpenseFeed: React.FC<RealtimeExpenseFeedProps> = ({
  expenses,
  settings,
  onEditExpense,
  onDuplicateExpense,
  onDeleteExpense,
  onOpenAddModal,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [now, setNow] = useState<Date>(new Date());

  // Available unique tags across all expenses
  const allTags: string[] = Array.from(
    new Set<string>(
      expenses
        .flatMap((e) => e.tags || [])
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort();

  // Update relative timestamps every 10 seconds in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayDateString();

  // Compute yesterday string
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;

  // 7 days ago
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    // Date filter
    if (dateFilter === 'today' && e.date !== todayStr) return false;
    if (dateFilter === 'yesterday' && e.date !== yStr) return false;
    if (dateFilter === 'week') {
      const eDate = new Date(e.timestamp);
      if (eDate < weekAgo) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;

    // Tag filter
    if (tagFilter !== 'all') {
      const hasTag = (e.tags || []).some(
        (t) => t.trim().toLowerCase() === tagFilter.toLowerCase()
      );
      if (!hasTag) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchDesc = (e.description || '').toLowerCase().includes(query);
      const matchNotes = (e.notes || '').toLowerCase().includes(query);
      const matchCat = (CATEGORIES[e.category]?.label || '').toLowerCase().includes(query);
      const matchTag = (e.tags || []).some((t) => t.toLowerCase().includes(query));
      if (!matchDesc && !matchNotes && !matchCat && !matchTag) return false;
    }

    return true;
  });

  // Sort
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    if (sortOption === 'amount_desc') {
      return b.amount - a.amount;
    }
    if (sortOption === 'amount_asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  const totalFilteredAmount = sortedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getPaymentIcon = (method: Expense['paymentMethod']) => {
    switch (method) {
      case 'card':
        return <CreditCard size={12} className="text-neutral-500" />;
      case 'cash':
        return <Banknote size={12} className="text-neutral-500" />;
      case 'digital':
        return <Smartphone size={12} className="text-neutral-500" />;
      case 'bank':
        return <Landmark size={12} className="text-neutral-500" />;
    }
  };

  return (
    <section id="realtime-expense-feed" className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
      {/* Feed Header */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              Transaction Stream
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 font-mono">
              {sortedExpenses.length} {sortedExpenses.length === 1 ? 'item' : 'items'}
            </span>
            <span className="text-xs text-neutral-400 font-medium">|</span>
            <span className="text-xs font-mono font-bold text-neutral-900">
              Total: {formatCurrency(totalFilteredAmount, settings.currency)}
            </span>
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center p-1 bg-neutral-100/90 rounded-xl text-xs font-medium text-neutral-600 self-start sm:self-auto border border-neutral-200/50">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: '7 Days' },
                { id: 'all', label: 'All History' },
              ] as { id: DateFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                id={`date-filter-tab-${tab.id}`}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                    : 'hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Bar */}
          <div className="sm:col-span-4 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="expense-search-input"
              type="text"
              placeholder="Search merchant, notes, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <div className="sm:col-span-3">
            <select
              id="expense-category-filter"
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
              className="w-full py-2 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {Object.keys(CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIES[cat as ExpenseCategory].label}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Dropdown Filter */}
          <div className="sm:col-span-2">
            <select
              id="expense-tag-filter"
              aria-label="Filter by tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-3">
            <div className="relative">
              <select
                id="expense-sort-select"
                aria-label="Sort expenses"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full py-2 pl-3 pr-7 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="amount_desc">Sort: Amount (High to Low)</option>
                <option value="amount_asc">Sort: Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Tag Pill Chips Row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2.5 mt-2.5 border-t border-neutral-100 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <TagIcon size={12} /> Tags:
            </span>
            <button
              id="tag-filter-all-btn"
              type="button"
              onClick={() => setTagFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                tagFilter === 'all'
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => {
              const count = expenses.filter((e) =>
                (e.tags || []).map((t) => t.toLowerCase()).includes(tag.toLowerCase())
              ).length;
              const isSelected = tagFilter.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  id={`tag-filter-chip-${tag}`}
                  type="button"
                  onClick={() => setTagFilter(isSelected ? 'all' : tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-emerald-500'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <span>#{tag}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-neutral-200/80 text-neutral-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            {tagFilter !== 'all' && (
              <button
                id="clear-tag-filter-btn"
                type="button"
                onClick={() => setTagFilter('all')}
                className="text-xs text-rose-600 hover:text-rose-700 ml-1 font-medium flex items-center gap-0.5 shrink-0 cursor-pointer"
              >
                <X size={12} /> Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stream List */}
      <div className="divide-y divide-neutral-100 max-h-[540px] overflow-y-auto">
        {sortedExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <Calendar size={20} />
            </div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-1">
              No transactions found
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search query or category filters to see more entries.'
                : dateFilter === 'today'
                ? "You haven't logged any daily expenses yet today. Track your first expense to begin pacing!"
                : 'No expenses recorded for this timeframe.'}
            </p>
            <button
              id="empty-feed-log-btn"
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Record Expense Now</span>
            </button>
          </div>
        ) : (
          sortedExpenses.map((expense) => {
            const catMeta = CATEGORIES[expense.category] || CATEGORIES.other;
            const relativeTime = formatRelativeTime(expense.timestamp, now);
            const exactTime = formatExpenseTime(expense.timestamp);

            return (
              <div
                key={expense.id}
                id={`expense-row-${expense.id}`}
                className="p-4 sm:px-6 hover:bg-neutral-50/70 transition-colors flex items-center justify-between gap-3 group"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: catMeta.bgLight,
                      color: catMeta.color,
                      border: `1px solid ${catMeta.borderColor}`,
                    }}
                  >
                    <CategoryIcon category={expense.category} size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900 truncate">
                        {expense.description}
                      </span>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: catMeta.bgLight,
                          color: catMeta.color,
                        }}
                      >
                        {catMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                      {/* Live relative time */}
                      <span
                        className="font-medium text-neutral-700 flex items-center gap-1"
                        title={new Date(expense.timestamp).toLocaleString()}
                      >
                        <Clock size={11} className="text-neutral-400" />
                        {relativeTime}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="font-mono text-[11px] text-neutral-400">{exactTime}</span>
                      <span className="text-neutral-300">•</span>

                      {/* Payment method chip */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600 capitalize">
                        {getPaymentIcon(expense.paymentMethod)}
                        <span>{expense.paymentMethod}</span>
                      </span>

                      {expense.notes && (
                        <>
                          <span className="text-neutral-300 hidden sm:inline">•</span>
                          <span className="text-neutral-500 italic truncate max-w-[140px] hidden sm:inline text-[11px]">
                            {expense.notes}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Transaction Tags */}
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {expense.tags.map((tag) => {
                          const isTagActive = tagFilter.toLowerCase() === tag.toLowerCase();
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTagFilter(isTagActive ? 'all' : tag);
                              }}
                              title={`Filter by tag #${tag}`}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                                isTagActive
                                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700 border border-neutral-200/60'
                              }`}
                            >
                              <TagIcon size={10} className={isTagActive ? 'text-white' : 'text-neutral-400'} />
                              <span>#{tag}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
                      {formatCurrency(expense.amount, settings.currency)}
                    </div>
                  </div>

                  {/* Action buttons (always accessible, highlighted on hover) */}
                  <div className="flex items-center gap-1">
                    <button
                      id={`duplicate-expense-btn-${expense.id}`}
                      type="button"
                      onClick={() => onDuplicateExpense(expense)}
                      title="Duplicate transaction"
                      aria-label="Duplicate transaction"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      id={`edit-expense-btn-${expense.id}`}
                      type="button"
                      onClick={() => onEditExpense(expense)}
                      title="Edit transaction"
                      aria-label="Edit transaction"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      id={`delete-expense-btn-${expense.id}`}
                      type="button"
                      onClick={() => onDeleteExpense(expense.id)}
                      title="Delete transaction"
                      aria-label="Delete transaction"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
