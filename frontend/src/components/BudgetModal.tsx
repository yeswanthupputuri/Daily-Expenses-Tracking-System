import React, { useState, useEffect } from 'react';
import { X, Target, Check, TrendingUp, Calendar } from 'lucide-react';
import { UserSettings } from '../types';
import { CURRENCIES } from '../utils/constants';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onSaveToast?: (msg: string) => void;
}

const MONTHLY_PRESETS = [1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSaveToast,
}) => {
  const [monthlyCapInput, setMonthlyCapInput] = useState<string>(
    (settings.monthlyBudgetCap || 2500).toString()
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Sync with current settings when opening
  useEffect(() => {
    if (isOpen) {
      setMonthlyCapInput((settings.monthlyBudgetCap || 2500).toString());
      setIsSaved(false);
    }
  }, [isOpen, settings.monthlyBudgetCap]);

  if (!isOpen) return null;

  const curr = CURRENCIES[settings.currency] || CURRENCIES.USD;
  const isDark = settings.darkMode;

  const parsedMonthly = parseFloat(monthlyCapInput) || 0;
  const approxDailyFromMonthly = parsedMonthly > 0 ? (parsedMonthly / 30).toFixed(2) : '0';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<UserSettings> = {};

    if (parsedMonthly > 0) {
      updates.monthlyBudgetCap = Math.round(parsedMonthly * 100) / 100;
    }

    if (Object.keys(updates).length > 0) {
      onUpdateSettings(updates);
      setIsSaved(true);
      if (onSaveToast) {
        onSaveToast('Monthly budget cap updated successfully.');
      }
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 600);
    }
  };

  const adjustMonthly = (delta: number) => {
    const nextVal = Math.max(100, (parseFloat(monthlyCapInput) || 0) + delta);
    setMonthlyCapInput(nextVal.toString());
  };

  return (
    <div
      id="budget-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="budget-modal-content"
        className={`rounded-3xl border shadow-2xl w-full max-w-lg overflow-hidden my-8 transition-colors ${
          isDark
            ? 'bg-[#151821] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark
              ? 'border-slate-800 bg-[#1a1e2b]'
              : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600 shadow-xs'
              }`}
            >
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Monthly Budget Cap</h3>
              <p className="text-[11px] text-slate-400">
                Configure your monthly spending limit cap & pacing projection
              </p>
            </div>
          </div>
          <button
            id="close-budget-modal-btn"
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

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Section: Monthly Budget Cap */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="modal-monthly-cap-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Calendar size={13} className="text-indigo-500" />
                <span>Monthly Budget Cap Limit</span>
              </label>
              <span className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 font-semibold">
                ≈ {curr.symbol}{approxDailyFromMonthly}/day equivalent
              </span>
            </div>

            {/* Input with Currency Prefix & Quick Step Buttons */}
            <div className="flex items-center gap-2">
              <div
                className={`relative flex-1 rounded-2xl border overflow-hidden transition-all ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700/80 focus-within:border-indigo-500'
                    : 'bg-[#f8f9fc] border-slate-200 focus-within:border-indigo-600'
                }`}
              >
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold font-mono text-slate-400">
                  {curr.symbol}
                </span>
                <input
                  id="modal-monthly-cap-input"
                  type="number"
                  step="25"
                  min="50"
                  value={monthlyCapInput}
                  onChange={(e) => setMonthlyCapInput(e.target.value)}
                  className={`w-full pl-9 pr-4 py-3 text-lg font-bold font-mono focus:outline-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  placeholder="2500"
                  required
                />
              </div>

              {/* Adjust buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustMonthly(-250)}
                  className={`px-2.5 py-3 rounded-xl border text-xs font-bold font-mono transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Decrease $250"
                >
                  -250
                </button>
                <button
                  type="button"
                  onClick={() => adjustMonthly(250)}
                  className={`px-2.5 py-3 rounded-xl border text-xs font-bold font-mono transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Increase $250"
                >
                  +250
                </button>
              </div>
            </div>

            {/* Quick Presets for Monthly Cap */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
              {MONTHLY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyCapInput(preset.toString())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    parsedMonthly === preset
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-[#1c202d] border border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {curr.symbol}{preset.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Your dashboard uses this single monthly limit cap to track pacing, days remaining, and alert you if current spending trends will exceed your cap.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>

            <button
              id="save-budget-modal-submit-btn"
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'bg-white hover:bg-slate-100 text-slate-900'
                  : 'bg-[#1e202a] hover:bg-[#2d303f] text-white'
              }`}
            >
              {isSaved ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <TrendingUp size={14} />
                  <span>Update Monthly Cap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
