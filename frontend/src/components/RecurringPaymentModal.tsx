import React, { useState, useEffect } from 'react';
import {
  X,
  Repeat,
  Tv,
  Home,
  CreditCard,
  Zap,
  Shield,
  Calendar,
  Bell,
  Check,
  Tag,
  Wallet,
  Building2,
  Receipt,
  Layers,
} from 'lucide-react';
import {
  ExpenseCategory,
  PaymentMethod,
  RecurringPayment,
  RecurringPaymentType,
  UserSettings,
} from '../types';
import { CATEGORIES, CURRENCIES, PAYMENT_METHODS } from '../utils/constants';
import { getTodayDateString } from '../utils/formatters';

interface RecurringPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<RecurringPayment, 'id' | 'createdAt'>, id?: string) => void;
  editingPayment: RecurringPayment | null;
  settings: UserSettings;
}

// 1. Requested Primary Category / Group Options
type CategoryGroup = 'rent' | 'subscriptions' | 'emi' | 'bills' | 'other';

const CATEGORY_GROUPS: {
  id: CategoryGroup;
  label: string;
  defaultType: RecurringPaymentType;
  defaultCategory: ExpenseCategory;
  icon: React.ReactNode;
}[] = [
  {
    id: 'rent',
    label: 'Rent',
    defaultType: 'rent',
    defaultCategory: 'housing',
    icon: <Home size={16} />,
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    defaultType: 'subscription',
    defaultCategory: 'entertainment',
    icon: <Tv size={16} />,
  },
  {
    id: 'emi',
    label: 'EMI',
    defaultType: 'emi',
    defaultCategory: 'bills',
    icon: <CreditCard size={16} />,
  },
  {
    id: 'bills',
    label: 'Bills',
    defaultType: 'utility',
    defaultCategory: 'utilities',
    icon: <Receipt size={16} />,
  },
  {
    id: 'other',
    label: 'Other',
    defaultType: 'other',
    defaultCategory: 'other',
    icon: <Layers size={16} />,
  },
];

// 2. Requested Quick Select Items
const QUICK_SELECT_ITEMS = [
  {
    name: 'Netflix',
    categoryGroup: 'subscriptions' as CategoryGroup,
    type: 'subscription' as RecurringPaymentType,
    category: 'entertainment' as ExpenseCategory,
    defaultAmount: 19.99,
  },
  {
    name: 'Prime',
    categoryGroup: 'subscriptions' as CategoryGroup,
    type: 'subscription' as RecurringPaymentType,
    category: 'entertainment' as ExpenseCategory,
    defaultAmount: 14.99,
  },
  {
    name: 'E-bill',
    categoryGroup: 'bills' as CategoryGroup,
    type: 'utility' as RecurringPaymentType,
    category: 'utilities' as ExpenseCategory,
    defaultAmount: 65,
  },
  {
    name: 'Wifi bill',
    categoryGroup: 'bills' as CategoryGroup,
    type: 'utility' as RecurringPaymentType,
    category: 'utilities' as ExpenseCategory,
    defaultAmount: 50,
  },
  {
    name: 'Insurance',
    categoryGroup: 'bills' as CategoryGroup,
    type: 'insurance' as RecurringPaymentType,
    category: 'bills' as ExpenseCategory,
    defaultAmount: 120,
  },
  {
    name: 'Others',
    categoryGroup: 'other' as CategoryGroup,
    type: 'other' as RecurringPaymentType,
    category: 'other' as ExpenseCategory,
    defaultAmount: 0,
  },
];

// 3. Requested Pay Types
const PAY_TYPES: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳' },
  { id: 'debit_card', label: 'Debit Card', icon: '💳' },
  { id: 'cash', label: 'Cash', icon: '💵' },
];

export const RecurringPaymentModal: React.FC<RecurringPaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPayment,
  settings,
}) => {
  // Category group
  const [categoryGroup, setCategoryGroup] = useState<CategoryGroup>('subscriptions');
  const [customCategory, setCustomCategory] = useState<string>('');

  // Selected quick item or Others
  const [selectedItem, setSelectedItem] = useState<string>('Netflix');
  const [title, setTitle] = useState<string>('Netflix');

  // Amount
  const [amount, setAmount] = useState<string>('');

  // Payment type (underlying technical type)
  const [type, setType] = useState<RecurringPaymentType>('subscription');
  const [category, setCategory] = useState<ExpenseCategory>('entertainment');

  // Due Date from Calendar (<input type="date" />)
  const [calendarDate, setCalendarDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [dueDay, setDueDay] = useState<number>(() => new Date().getDate());

  // Prior notify alert (type field)
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(3);

  // Pay type
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  // Notes & Extras
  const [notes, setNotes] = useState<string>('');
  const [autoLogAsExpense, setAutoLogAsExpense] = useState<boolean>(true);
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  // Sync state when modal opens or editing payment changes
  useEffect(() => {
    if (editingPayment) {
      setTitle(editingPayment.title);
      setAmount(editingPayment.amount.toString());
      setType(editingPayment.type);
      setCategory(editingPayment.category);
      setDueDay(editingPayment.dueDay);
      setReminderDaysBefore(editingPayment.reminderDaysBefore);
      setPaymentMethod(editingPayment.paymentMethod || 'upi');
      setNotes(editingPayment.notes || '');
      setAutoLogAsExpense(editingPayment.autoLogAsExpense !== false);
      setStatus(editingPayment.status);

      // Match category group
      if (editingPayment.type === 'rent') {
        setCategoryGroup('rent');
      } else if (editingPayment.type === 'subscription') {
        setCategoryGroup('subscriptions');
      } else if (editingPayment.type === 'emi') {
        setCategoryGroup('emi');
      } else if (editingPayment.type === 'utility' || editingPayment.type === 'insurance') {
        setCategoryGroup('bills');
      } else {
        setCategoryGroup('other');
      }

      // Match quick select item or Others
      const matchedPreset = QUICK_SELECT_ITEMS.find(
        (q) => q.name.toLowerCase() === editingPayment.title.toLowerCase()
      );
      if (matchedPreset) {
        setSelectedItem(matchedPreset.name);
      } else {
        setSelectedItem('Others');
      }

      // Initialize calendar date with current year & month but the editing dueDay
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const safeDay = Math.min(editingPayment.dueDay, 28);
      setCalendarDate(
        `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
      );
    } else {
      // Default initial state for new payment
      setCategoryGroup('rent');
      setCustomCategory('');
      setSelectedItem('Others');
      setTitle('House Rent');
      setType('rent');
      setCategory('housing');
      setAmount('');

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setCalendarDate(todayStr);
      setDueDay(now.getDate());

      setReminderDaysBefore(3);
      setPaymentMethod('upi');
      setNotes('');
      setAutoLogAsExpense(true);
      setStatus('active');
    }
  }, [editingPayment, isOpen]);

  if (!isOpen) return null;

  const curr = CURRENCIES[settings.currency] || CURRENCIES.USD;
  const isDark = settings.darkMode;

  // Handle Category Group Selection
  const handleSelectCategoryGroup = (group: typeof CATEGORY_GROUPS[0]) => {
    setCategoryGroup(group.id);
    setType(group.defaultType);
    setCategory(group.defaultCategory);

    if (group.id === 'rent') {
      if (selectedItem !== 'Others') setSelectedItem('Others');
      if (!title || title === 'Netflix' || title === 'Prime' || title === 'E-bill' || title === 'Wifi bill' || title === 'Insurance') {
        setTitle('House Rent');
      }
    } else if (group.id === 'subscriptions') {
      if (selectedItem === 'Others' || selectedItem === 'E-bill' || selectedItem === 'Wifi bill' || selectedItem === 'Insurance') {
        setSelectedItem('Netflix');
        setTitle('Netflix');
      }
    } else if (group.id === 'emi') {
      if (selectedItem !== 'Others') setSelectedItem('Others');
      if (!title || title === 'Netflix' || title === 'Prime' || title === 'E-bill' || title === 'Wifi bill' || title === 'Insurance') {
        setTitle('Loan EMI');
      }
    } else if (group.id === 'bills') {
      if (selectedItem === 'Netflix' || selectedItem === 'Prime') {
        setSelectedItem('E-bill');
        setTitle('E-bill');
      }
    }
  };

  // Handle Quick Select Item Click
  const handleSelectQuickItem = (itemName: string) => {
    setSelectedItem(itemName);
    if (itemName === 'Others') {
      setTitle('');
    } else {
      setTitle(itemName);
      const matched = QUICK_SELECT_ITEMS.find((q) => q.name === itemName);
      if (matched) {
        setCategoryGroup(matched.categoryGroup);
        setType(matched.type);
        setCategory(matched.category);
        if (!amount && matched.defaultAmount > 0) {
          setAmount(matched.defaultAmount.toString());
        }
      }
    }
  };

  // Handle Calendar Date Change
  const handleCalendarDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCalendarDate(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const parsedDay = parseInt(parts[2], 10);
        if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
          setDueDay(parsedDay);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    const finalTitle = title.trim() || (categoryGroup === 'other' && customCategory.trim() ? customCategory.trim() : 'Recurrent Payment');

    onSave(
      {
        title: finalTitle,
        amount: Math.round(parsedAmount * 100) / 100,
        type,
        category,
        frequency: 'monthly',
        dueDay: Math.min(31, Math.max(1, dueDay)),
        reminderDaysBefore: Math.max(0, Number(reminderDaysBefore) || 0),
        paymentMethod,
        notes: notes.trim() ? (customCategory ? `[${customCategory}] ${notes.trim()}` : notes.trim()) : customCategory ? `Category: ${customCategory}` : undefined,
        status,
        autoLogAsExpense,
        lastPaidDate: editingPayment?.lastPaidDate,
      },
      editingPayment?.id
    );

    onClose();
  };

  return (
    <div
      id="recurring-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="recurring-modal-content"
        className={`rounded-3xl border shadow-2xl w-full max-w-lg overflow-hidden my-4 sm:my-6 transition-colors ${
          isDark
            ? 'bg-[#151821] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-slate-800 bg-[#1a1e2b]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDark
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-indigo-50 text-indigo-600 shadow-xs'
              }`}
            >
              <Repeat size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {editingPayment ? 'Edit Recurrent Payment' : 'Add Recurrent Payment'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Rent, subscriptions, EMI, bills & calendar due alert
              </p>
            </div>
          </div>
          <button
            id="close-recurring-modal-btn"
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          {/* 1. Category Selection: [ Rent, Subscriptions, EMI, Bills, Other ] */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category
              </label>
              <span className="text-[11px] text-indigo-500 font-semibold capitalize">
                Selected: {categoryGroup}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {CATEGORY_GROUPS.map((group) => {
                const isSelected = categoryGroup === group.id;
                return (
                  <button
                    key={group.id}
                    id={`category-group-btn-${group.id}`}
                    type="button"
                    onClick={() => handleSelectCategoryGroup(group)}
                    className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/30'
                        : isDark
                        ? 'border-slate-800 bg-[#1c202d] text-slate-300 hover:bg-[#252b3d]'
                        : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={isSelected ? 'text-white' : 'text-slate-400'}>
                      {group.icon}
                    </div>
                    <span className="text-[11px] sm:text-xs leading-none font-semibold truncate w-full px-0.5">
                      {group.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* If 'Other' is selected, show custom type text field */}
            {categoryGroup === 'other' && (
              <div className="mt-2.5 animate-in fade-in duration-200">
                <input
                  id="recurring-custom-category-input"
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type custom category name (e.g. Tuition, Maintenance, Gym)"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#1c202d] border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            )}
          </div>

          {/* 2. Item / Service Selection: [ Netflix, Prime, E-bill, Wifi bill, Insurance, Others ] */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select or Type Item
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_SELECT_ITEMS.map((item) => {
                const isSelected = selectedItem === item.name;
                return (
                  <button
                    key={item.name}
                    id={`quick-item-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => handleSelectQuickItem(item.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                        : isDark
                        ? 'border-slate-800 bg-[#1c202d] text-slate-300 hover:bg-[#252b3d]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.name}</span>
                    {isSelected && <Check size={13} className="text-white" />}
                  </button>
                );
              })}
            </div>

            {/* If 'Others' or custom item is selected, or for editing the item title */}
            <div className="mt-2.5">
              <label
                htmlFor="recurring-title-input"
                className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
              >
                {selectedItem === 'Others' ? 'Type Item / Payment Name' : 'Item Name (Editable)'}
              </label>
              <input
                id="recurring-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (selectedItem !== 'Others') {
                    const exists = QUICK_SELECT_ITEMS.find((q) => q.name === e.target.value);
                    if (!exists) setSelectedItem('Others');
                  }
                }}
                placeholder="Type item name (e.g. Netflix, Prime, Electricity Bill, Car EMI)"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600'
                }`}
              />
            </div>
          </div>

          {/* 3. Amount Field */}
          <div>
            <label
              htmlFor="recurring-amount-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Amount ({curr.symbol})
            </label>
            <div
              className={`relative rounded-xl border overflow-hidden transition-colors ${
                isDark
                  ? 'bg-[#1c202d] border-slate-700 focus-within:border-indigo-500'
                  : 'bg-[#f8f9fc] border-slate-200 focus-within:border-indigo-600'
              }`}
            >
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold font-mono text-slate-400">
                {curr.symbol}
              </span>
              <input
                id="recurring-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-3 py-2.5 text-sm font-bold font-mono focus:outline-none ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* 4. Pay Type: [ UPI, Net Banking, Credit Card, Debit Card, Cash ] */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Wallet size={13} className="text-slate-400" />
              <span>Pay Type</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {PAY_TYPES.map((pt) => {
                const isSelected = paymentMethod === pt.id;
                return (
                  <button
                    key={pt.id}
                    id={`pay-type-btn-${pt.id}`}
                    type="button"
                    onClick={() => setPaymentMethod(pt.id)}
                    className={`p-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/30'
                        : isDark
                        ? 'border-slate-800 bg-[#1c202d] text-slate-300 hover:bg-[#252b3d]'
                        : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{pt.icon}</span>
                    <span className="text-[11px] font-semibold truncate w-full px-0.5">
                      {pt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Due Date from Calendar & 6. Prior Notify Alert Type Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20">
            {/* Due Date Calendar Picker */}
            <div>
              <label
                htmlFor="recurring-calendar-date-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Calendar size={13} className="text-indigo-500" />
                <span>Due Date (Calendar)</span>
              </label>
              <input
                id="recurring-calendar-date-input"
                type="date"
                required
                value={calendarDate}
                onChange={handleCalendarDateChange}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block mt-1">
                Due every month on the {dueDay}{dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'}
              </span>
            </div>

            {/* Prior Notify Alert Type Field */}
            <div>
              <label
                htmlFor="recurring-prior-alert-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Bell size={13} className="text-amber-500" />
                <span>Prior Notify Alert (Days)</span>
              </label>
              <input
                id="recurring-prior-alert-input"
                type="number"
                min="0"
                max="30"
                required
                value={reminderDaysBefore}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setReminderDaysBefore(isNaN(val) ? 0 : Math.max(0, val));
                }}
                placeholder="e.g. 3"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium block mt-1">
                Alert notice {reminderDaysBefore} {reminderDaysBefore === 1 ? 'day' : 'days'} prior
              </span>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label
              htmlFor="recurring-notes-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
            >
              Notes (Optional)
            </label>
            <input
              id="recurring-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Consumer number, Landlord UPI, policy details"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#1c202d] border-slate-700 text-white placeholder:text-slate-600'
                  : 'bg-[#f8f9fc] border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Auto log toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Auto-record in Expense Ledger on Paid
              </span>
              <span className="text-[11px] text-slate-400 block">
                Automatically adds transaction to daily expenses when marked paid.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoLogAsExpense(!autoLogAsExpense)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                autoLogAsExpense ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                  autoLogAsExpense ? 'right-0.75' : 'left-0.75'
                }`}
              />
            </button>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              id="save-recurring-payment-btn"
              type="submit"
              className="px-6 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{editingPayment ? 'Save Changes' : 'Create Recurrent Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
