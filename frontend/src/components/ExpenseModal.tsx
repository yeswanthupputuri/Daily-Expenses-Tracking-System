import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Banknote, Smartphone, Landmark, Tag as TagIcon, Plus } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod, UserSettings } from '../types';
import { CATEGORIES, CURRENCIES } from '../utils/constants';
import { CategoryIcon } from './CategoryIcon';
import { getTodayDateString } from '../utils/formatters';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
  editingExpense?: Expense | null;
  settings: UserSettings;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  settings,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const currencyConfig = CURRENCIES[settings.currency] || CURRENCIES.USD;

  // Initialize or reset form on open/edit change
  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setPaymentMethod(editingExpense.paymentMethod);
      setDate(editingExpense.date);
      const d = new Date(editingExpense.timestamp);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      setNotes(editingExpense.notes || '');
      setTags(editingExpense.tags ? [...editingExpense.tags] : []);
      setTagInput('');
      setError('');
    } else {
      setAmount('');
      setDescription('');
      setCategory('food');
      setPaymentMethod('card');
      setDate(getTodayDateString());
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      setNotes('');
      setTags([]);
      setTagInput('');
      setError('');
    }
  }, [editingExpense, isOpen]);

  const handleAddTag = (newTag: string) => {
    const cleaned = newTag.trim().replace(/^#+/, '').toLowerCase();
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  if (!isOpen) return null;

  // Smart category suggestion based on description keyword
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    const lower = text.toLowerCase();
    if (lower.includes('coffee') || lower.includes('latte') || lower.includes('cafe') || lower.includes('starbucks') || lower.includes('cappuccino') || lower.includes('tea') || lower.includes('snack') || lower.includes('bakery')) {
      setCategory('coffee');
    } else if (lower.includes('lunch') || lower.includes('dinner') || lower.includes('burger') || lower.includes('pizza') || lower.includes('sushi') || lower.includes('restaurant') || lower.includes('takeout') || lower.includes('breakfast') || lower.includes('sandwich')) {
      setCategory('food');
    } else if (lower.includes('uber') || lower.includes('lyft') || lower.includes('metro') || lower.includes('bus') || lower.includes('train') || lower.includes('transit') || lower.includes('taxi') || lower.includes('gas') || lower.includes('parking')) {
      setCategory('transport');
    } else if (lower.includes('grocery') || lower.includes('market') || lower.includes('trader') || lower.includes('supermarket') || lower.includes('aldi') || lower.includes('safeway') || lower.includes('walmart')) {
      setCategory('groceries');
    } else if (lower.includes('pharmacy') || lower.includes('cvs') || lower.includes('walgreens') || lower.includes('doctor') || lower.includes('gym') || lower.includes('meds')) {
      setCategory('health');
    } else if (lower.includes('movie') || lower.includes('cinema') || lower.includes('concert') || lower.includes('game') || lower.includes('steam') || lower.includes('netflix')) {
      setCategory('entertainment');
    } else if (lower.includes('bill') || lower.includes('electric') || lower.includes('water') || lower.includes('wifi') || lower.includes('rent') || lower.includes('utility')) {
      setCategory('bills');
    } else if (lower.includes('amazon') || lower.includes('clothes') || lower.includes('shoes') || lower.includes('target') || lower.includes('shop')) {
      setCategory('shopping');
    }
  };

  const handleAmountNudge = (delta: number) => {
    const current = parseFloat(amount) || 0;
    const next = Math.max(0, current + delta);
    setAmount(next.toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a merchant or description.');
      return;
    }

    // Construct timestamp
    let timestamp = new Date().toISOString();
    try {
      if (date && time) {
        const [hours, minutes] = time.split(':').map(Number);
        const [y, m, d] = date.split('-').map(Number);
        const combined = new Date(y, m - 1, d, hours || 0, minutes || 0, 0);
        timestamp = combined.toISOString();
      }
    } catch {
      timestamp = new Date().toISOString();
    }

    const payload = {
      ...(editingExpense ? { id: editingExpense.id } : {}),
      amount: parsedAmount,
      category,
      description: description.trim(),
      timestamp,
      date,
      paymentMethod,
      tags: tags.length > 0 ? tags : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(payload as Expense);
    onClose();
  };

  return (
    <div
      id="expense-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="expense-modal-content"
        className="bg-white dark:bg-[#151821] text-neutral-900 dark:text-slate-100 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden my-8 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/70 dark:bg-[#1a1e2b]">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {editingExpense ? 'Edit Expense Record' : 'Record Daily Expense'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              {editingExpense ? 'Modify transaction values' : 'Instantly updates your live daily pacing'}
            </p>
          </div>
          <button
            id="close-expense-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Amount Spent ({currencyConfig.code})
            </label>
            <div className="relative rounded-xl border-2 border-neutral-200 focus-within:border-emerald-600 bg-white overflow-hidden transition-colors shadow-2xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-neutral-400 font-mono">
                {currencyConfig.symbol}
              </span>
              <input
                id="expense-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                autoFocus={!editingExpense}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="w-full pl-12 pr-4 py-3 text-2xl font-bold font-mono tracking-tight text-neutral-900 focus:outline-none"
              />
            </div>

            {/* Quick amount increment pills */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-neutral-400">Quick add:</span>
              {[1, 5, 10, 20].map((nudge) => (
                <button
                  key={nudge}
                  type="button"
                  onClick={() => handleAmountNudge(nudge)}
                  className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  +{currencyConfig.symbol}{nudge}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-2 py-1 rounded text-xs text-neutral-400 hover:text-neutral-600 transition-colors ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Description / Merchant */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Description or Merchant
            </label>
            <input
              id="expense-description-input"
              type="text"
              placeholder="e.g. Latte & Croissant, Uber ride, Trader Joe's"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
            />
          </div>

          {/* Category Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORIES) as ExpenseCategory[]).map((catKey) => {
                const meta = CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <div
                      className="p-1 rounded-md shrink-0"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : meta.bgLight,
                        color: isSelected ? '#ffffff' : meta.color,
                      }}
                    >
                      <CategoryIcon category={catKey} size={14} />
                    </div>
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'digital', label: 'Digital/Pay', icon: Smartphone },
                { id: 'bank', label: 'Bank/Transfer', icon: Landmark },
              ].map((method) => {
                const isSelected = paymentMethod === method.id;
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    <IconComponent size={16} className={isSelected ? 'text-emerald-700' : 'text-neutral-500'} />
                    <span className="mt-1">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Date</label>
              <input
                id="expense-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Time</label>
              <input
                id="expense-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Tags / Labels */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Tags & Custom Labels
              </label>
              <span className="text-[11px] text-neutral-400">Press Enter or comma to add</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <TagIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="expense-tags-input"
                  type="text"
                  placeholder="e.g. work, personal, recurring, trip..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                id="expense-add-tag-btn"
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Plus size={13} />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Rendered tag chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-emerald-500 hover:text-emerald-800 rounded-full focus:outline-none cursor-pointer"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick tag suggestions */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 text-[11px] text-neutral-500">
              <span className="shrink-0 text-neutral-400 font-medium">Quick suggestions:</span>
              {['work', 'personal', 'dining', 'coffee', 'commute', 'groceries', 'recurring', 'travel']
                .filter((t) => !tags.includes(t))
                .slice(0, 5)
                .map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => handleAddTag(sugg)}
                    className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer shrink-0 font-medium"
                  >
                    +{sugg}
                  </button>
                ))}
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Notes (Optional)
            </label>
            <input
              id="expense-notes-input"
              type="text"
              placeholder="e.g. Receipt saved, business expense, split with Sam"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-expense-submit-btn"
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1e202a] hover:bg-[#2d303f] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check size={16} />
              <span>{editingExpense ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
