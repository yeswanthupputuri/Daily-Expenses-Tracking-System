import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Moon,
  Sun,
  FileText,
  Download,
  RefreshCw,
  Trash2,
  Check,
  Target,
  Zap,
  Server,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { UserSettings } from '../types';
import { CURRENCIES } from '../utils/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportCSV: () => void;
  onClearAllData: () => void;
  onExportPDF: (period: 'week' | 'month') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportCSV,
  onClearAllData,
  onExportPDF,
}) => {
  const [monthlyCapInput, setMonthlyCapInput] = useState<string>(
    (settings.monthlyBudgetCap || 2500).toString()
  );
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMonthlyCapInput((settings.monthlyBudgetCap || 2500).toString());
    }
  }, [isOpen, settings.monthlyBudgetCap]);

  if (!isOpen) return null;

  const handleSaveBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonthly = parseFloat(monthlyCapInput);

    const updates: Partial<UserSettings> = {};
    if (!isNaN(parsedMonthly) && parsedMonthly > 0) {
      updates.monthlyBudgetCap = Math.round(parsedMonthly * 100) / 100;
    }

    if (Object.keys(updates).length > 0) {
      onUpdateSettings(updates);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    }
  };

  const handleTriggerPDF = (period: 'week' | 'month') => {
    setPdfGenerating(period);
    try {
      onExportPDF(period);
    } finally {
      setTimeout(() => setPdfGenerating(null), 1000);
    }
  };

  const curr = CURRENCIES[settings.currency] || CURRENCIES.USD;
  const isDark = settings.darkMode;

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settings-modal-content"
        className={`rounded-3xl border shadow-2xl w-full max-w-lg overflow-hidden my-8 transition-colors ${
          isDark
            ? 'bg-[#151821] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark
              ? 'border-slate-800 bg-[#1a1e2a]'
              : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800 shadow-xs'
              }`}
            >
              <Sliders size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">System Preferences</h3>
              <p className="text-[11px] text-slate-400">Appearance, budget caps & exports</p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
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

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Sleek Dark Mode Theme Toggle */}
          <div
            id="theme-toggle-row"
            className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#1a1e2b] border-slate-800/90'
                : 'bg-slate-50/90 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <div className="text-xs font-bold">Dark Theme Appearance</div>
                <div className="text-[11px] text-slate-400">
                  {isDark ? 'Sleek dark theme active' : 'Classy light theme active'}
                </div>
              </div>
            </div>

            {/* Custom Toggle Switch */}
            <button
              id="settings-dark-mode-toggle"
              type="button"
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                isDark ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              aria-label="Toggle dark mode"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm flex items-center justify-center text-[10px] text-slate-800 ${
                  isDark ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              >
                {isDark ? <Moon size={10} className="text-indigo-600" /> : <Sun size={10} className="text-amber-500" />}
              </div>
            </button>
          </div>

          {/* 2. Monthly Budget Cap & Daily Limit */}
          <form onSubmit={handleSaveBudgets} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target size={13} className="text-indigo-500" />
                  <span>Monthly Budget Cap</span>
                </label>
                <span className="text-[11px] text-indigo-500 font-semibold">Pacing Alert Trigger</span>
              </div>
              <div
                className={`relative rounded-2xl border overflow-hidden transition-all ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700/80 focus-within:border-indigo-500'
                    : 'bg-[#f8f9fc] border-slate-200 focus-within:border-indigo-600'
                }`}
              >
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold font-mono text-slate-400">
                  {curr.symbol}
                </span>
                <input
                  id="settings-monthly-budget-input"
                  type="number"
                  step="10"
                  min="1"
                  value={monthlyCapInput}
                  onChange={(e) => setMonthlyCapInput(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2.5 text-sm font-bold font-mono focus:outline-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  placeholder="2500"
                />
              </div>
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {[1500, 2000, 2500, 3000, 4000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMonthlyCapInput(preset.toString())}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                      parseFloat(monthlyCapInput) === preset
                        ? 'bg-indigo-600 text-white'
                        : isDark
                        ? 'bg-[#1e2230] text-slate-300 hover:bg-[#252a3d]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {curr.symbol}{preset}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Visual indicator in the dashboard alerts you when you are on track to exceed this monthly cap.
              </p>
            </div>

            <button
              id="save-budget-btn"
              type="submit"
              className="w-full py-2.5 bg-[#1e202a] hover:bg-[#2d303f] dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-2xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saveFeedback ? (
                <>
                  <Check size={14} className="text-emerald-400 dark:text-emerald-600" />
                  <span>Caps & Limits Saved!</span>
                </>
              ) : (
                <span>Update Budget Caps & Limits</span>
              )}
            </button>
          </form>

          {/* 3. Download as PDF (Week or Month choice) */}
          <div
            id="pdf-download-section"
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-[#1a1e2b] border-slate-800/90'
                : 'bg-slate-50/90 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Download PDF Expense Report
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Export an itemized ledger report with category breakdown, run-rate statistics, and formatted transaction records.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="export-pdf-week-btn"
                onClick={() => handleTriggerPDF('week')}
                disabled={pdfGenerating === 'week'}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#202535] hover:bg-[#282f42] border-slate-700/80 text-slate-200'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <Download size={13} />
                <span>{pdfGenerating === 'week' ? 'Generating...' : 'Week (7 Days)'}</span>
              </button>

              <button
                type="button"
                id="export-pdf-month-btn"
                onClick={() => handleTriggerPDF('month')}
                disabled={pdfGenerating === 'month'}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#202535] hover:bg-[#282f42] border-slate-700/80 text-slate-200'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <Download size={13} />
                <span>{pdfGenerating === 'month' ? 'Generating...' : 'Month (30 Days)'}</span>
              </button>
            </div>
          </div>

          {/* 4. Currency Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Currency
            </label>
            <select
              id="settings-currency-select"
              value={settings.currency}
              onChange={(e) => onUpdateSettings({ currency: e.target.value })}
              className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-medium cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#1c202d] border-slate-700/80 text-slate-100 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-600'
              }`}
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code} className={isDark ? 'bg-[#1c202d]' : 'bg-white'}>
                  {c.name} ({c.code} - {c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Data Management & Backup */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Data Management & Export
            </span>
            <div>
              <button
                id="settings-export-csv-btn"
                type="button"
                onClick={onExportCSV}
                className={`w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-800 hover:bg-[#1a1e2b] text-slate-300'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Download size={14} />
                <span>Export Ledger Data (CSV)</span>
              </button>
            </div>
          </div>

          {/* 7. Reset / Danger Options */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clear Account Records
            </span>
            <div>
              {showClearConfirm ? (
                <button
                  id="settings-confirm-clear-btn"
                  type="button"
                  onClick={() => {
                    onClearAllData();
                    setShowClearConfirm(false);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Confirm Delete All My Data?
                </button>
              ) : (
                <button
                  id="settings-clear-all-btn"
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Clear All My Logged Data</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end px-6 py-3.5 border-t ${
            isDark ? 'border-slate-800 bg-[#1a1e2a]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'bg-white text-slate-900 hover:bg-slate-100'
                : 'bg-[#1e202a] text-white hover:bg-[#2d303f]'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
