import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  FileDown,
  Moon,
  Sun,
  ReceiptText,
  Repeat,
  Bell,
  Plus,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { AuthUser, TimeRange, UserSettings } from '../types';

interface LiveHeaderProps {
  settings: UserSettings;
  timeRange: TimeRange;
  onChangeTimeRange: (range: TimeRange) => void;
  activeTab: 'expenses' | 'recurring';
  onChangeTab: (tab: 'expenses' | 'recurring') => void;
  recurringAlertCount?: number;
  onOpenAddModal: () => void;
  onOpenRecurringModal?: () => void;
  onOpenSettings: () => void;
  onExportPDF: (period: 'week' | 'month') => void;
  onToggleDarkMode?: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  onOpenAuth?: () => void;
}

export const LiveHeader: React.FC<LiveHeaderProps> = ({
  settings,
  timeRange,
  onChangeTimeRange,
  activeTab,
  onChangeTab,
  recurringAlertCount = 0,
  onOpenAddModal,
  onOpenRecurringModal,
  onOpenSettings,
  onExportPDF,
  onToggleDarkMode,
  currentUser,
  onSignOut,
  onOpenAuth,
}) => {
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target as Node)) {
        setShowPdfMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = settings.darkMode;

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header
      id="northlight-header"
      className="bg-transparent pt-6 pb-3 px-4 sm:px-8 max-w-7xl mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1e202a] dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-lg shadow-sm shrink-0 transition-colors">
            N
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none transition-colors">
              Northlight
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-normal">
              Daily expense ledger & recurring bills
            </p>
          </div>
        </div>

        {/* Center Primary Tab Navigation + Next After: Add Recurrent Payment Button */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div
            id="main-app-tab-navigation"
            className={`p-1 rounded-2xl border flex items-center gap-1 transition-colors ${
              isDark ? 'bg-[#151821] border-slate-800' : 'bg-slate-200/60 border-slate-200/80'
            }`}
          >
            <button
              id="tab-btn-expenses"
              type="button"
              onClick={() => onChangeTab('expenses')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'expenses'
                  ? isDark
                    ? 'bg-[#2b3145] text-white shadow-xs'
                    : 'bg-[#1e202a] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ReceiptText size={14} />
              <span>Ledger & Analytics</span>
            </button>

            <button
              id="tab-btn-recurring"
              type="button"
              onClick={() => onChangeTab('recurring')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                activeTab === 'recurring'
                  ? isDark
                    ? 'bg-[#2b3145] text-white shadow-xs'
                    : 'bg-[#1e202a] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Repeat size={14} />
              <span>Recurrent Payments</span>
              {recurringAlertCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white animate-pulse">
                  {recurringAlertCount}
                </span>
              )}
            </button>
          </div>

          {/* Placed Next After Tab Selection: Add Recurrent Payment (shown only in recurrent payments section tab) */}
          {activeTab === 'recurring' && (
            <button
              id="header-add-recurrent-pay-btn"
              type="button"
              onClick={() => onOpenRecurringModal?.()}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
              title="Add a new recurrent payment"
            >
              <Plus size={14} />
              <span>Add Recurrent Payment</span>
            </button>
          )}
        </div>

        {/* Right Controls: PDF Export, Quick Theme Toggle, Settings, User Auth, Week/Month/Year Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* PDF Download Menu (available for ledger) */}
          <div className="relative" ref={pdfMenuRef}>
            <button
              type="button"
              id="header-pdf-download-btn"
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              className={`px-3 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-[#181b26] border-slate-700/80 text-slate-200 hover:bg-[#222736]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Download expenses as PDF"
            >
              <FileDown size={14} className="text-indigo-500" />
              <span>PDF Report</span>
            </button>

            {/* Dropdown Menu to choose Week / Month */}
            {showPdfMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? 'bg-[#1a1e2b] border-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Period
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfMenu(false);
                    onExportPDF('week');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isDark ? 'hover:bg-[#252b3d]' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>Weekly (7 Days)</span>
                  <span className="text-[10px] text-indigo-400 font-mono">.pdf</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfMenu(false);
                    onExportPDF('month');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isDark ? 'hover:bg-[#252b3d]' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>Monthly (30 Days)</span>
                  <span className="text-[10px] text-indigo-400 font-mono">.pdf</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
              className={`p-2 rounded-full border shadow-xs transition cursor-pointer ${
                isDark
                  ? 'border-slate-700/80 text-amber-400 bg-[#181b26] hover:bg-[#222736]'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50'
              }`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings & Data Preferences"
            aria-label="Settings and Data Preferences"
            className={`p-2 rounded-full border shadow-xs transition cursor-pointer ${
              isDark
                ? 'border-slate-700/80 text-slate-300 bg-[#181b26] hover:bg-[#222736]'
                : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50'
            }`}
          >
            <Sliders size={15} />
          </button>

          {/* User Account / Sign In Menu */}
          <div className="relative" ref={userMenuRef}>
            {currentUser ? (
              <button
                type="button"
                id="header-user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`p-1 pl-2 pr-2.5 rounded-full border shadow-xs transition flex items-center gap-2 cursor-pointer ${
                  isDark
                    ? 'border-slate-700/80 bg-[#181b26] hover:bg-[#222736] text-slate-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
                title={`Signed in as ${currentUser.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {initials}
                </div>
                <span className="text-xs font-semibold max-w-[85px] truncate hidden sm:inline-block">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>
            ) : (
              <button
                type="button"
                id="header-signin-btn"
                onClick={onOpenAuth}
                className="px-3 py-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <User size={14} />
                <span>Sign In / Up</span>
              </button>
            )}

            {/* User Dropdown */}
            {currentUser && showUserMenu && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? 'bg-[#1a1e2b] border-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <span className="block text-xs font-bold truncate">{currentUser.name}</span>
                  <span className="block text-[11px] text-slate-400 truncate">{currentUser.email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onSignOut?.();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-2 cursor-pointer ${
                    isDark ? 'hover:bg-rose-950/30' : 'hover:bg-rose-50'
                  }`}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Time Range Filter: Week | Month | Year (when in expenses tab) */}
          {activeTab === 'expenses' && (
            <div
              id="time-range-segmented-control"
              className={`p-1 rounded-full flex items-center gap-0.5 text-xs font-semibold transition-colors ${
                isDark ? 'bg-[#181b26] border border-slate-800' : 'bg-slate-200/70'
              }`}
            >
              <button
                type="button"
                onClick={() => onChangeTimeRange('week')}
                className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                  timeRange === 'week'
                    ? isDark
                      ? 'bg-[#2b3145] text-white shadow-xs'
                      : 'bg-[#1e202a] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => onChangeTimeRange('month')}
                className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                  timeRange === 'month'
                    ? isDark
                      ? 'bg-[#2b3145] text-white shadow-xs'
                      : 'bg-[#1e202a] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => onChangeTimeRange('year')}
                className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                  timeRange === 'year'
                    ? isDark
                      ? 'bg-[#2b3145] text-white shadow-xs'
                      : 'bg-[#1e202a] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Year
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

