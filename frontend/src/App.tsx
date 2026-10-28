import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  loadExpenses,
  saveExpenses,
  loadSettings,
  saveSettings,
  loadRecurringPayments,
  saveRecurringPayments,
  subscribeToRealtimeSync,
  exportExpensesToCSV,
  loadCurrentUser,
  saveCurrentUser,
} from './utils/storage';

import { exportExpensesToPDF } from './utils/pdfExport';
import { AuthUser, Expense, RecurringPayment, TimeRange, UserSettings } from './types';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';

import {
  apiGetExpenses,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
  apiGetRecurring,
  apiCreateRecurring,
  apiUpdateRecurring,
  apiDeleteRecurring,
  apiGetSettings,
  apiSaveSettings,
  fetchBackendStatus,
  BackendStatus,
} from './utils/apiClient';

import { formatCurrency, getTodayDateString } from './utils/formatters';
import { getRecurringStatus } from './utils/recurringHelpers';
import { LiveHeader } from './components/LiveHeader';
import { QuickAddCard } from './components/QuickAddCard';
import { RecentExpensesCard } from './components/RecentExpensesCard';
import { StatCardsRow } from './components/StatCardsRow';
import { SpendByCategoryCard } from './components/SpendByCategoryCard';
import { SpendOverTimeCard } from './components/SpendOverTimeCard';
import { RecurringTab } from './components/RecurringTab';
import { RecurringPaymentModal } from './components/RecurringPaymentModal';
import { ExpenseModal } from './components/ExpenseModal';
import { SettingsModal } from './components/SettingsModal';
import { BudgetModal } from './components/BudgetModal';
import { AuthPage } from './components/AuthPage';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const user = loadCurrentUser();
    return user ? loadExpenses(user.id) : [];
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const user = loadCurrentUser();
    return loadSettings(user?.id);
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('year');
  const [activeTab, setActiveTab] = useState<'expenses' | 'recurring'>('expenses');
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(() => {
    const user = loadCurrentUser();
    return user ? loadRecurringPayments(user.id) : [];
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState<boolean>(false);
  const [editingRecurringPayment, setEditingRecurringPayment] = useState<RecurringPayment | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add toast helper
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync dark class with document element for global CSS variables and variants
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // State for backend status
  const [backendInfo, setBackendInfo] = useState<BackendStatus | null>(null);

  // Synchronize data for the logged-in user from Express + MongoDB backend
  useEffect(() => {
    let isMounted = true;
    async function syncWithBackend() {
      try {
        if (isAuthChecking){
          return;
        }
        const status = await fetchBackendStatus();
        if (isMounted && status) {
          setBackendInfo(status);
        }

        if (!currentUser?.id) {
          if (isMounted) {
            setExpenses([]);
            setRecurringPayments([]);
          }
          return;
        }

        const uid = currentUser.id;

        const serverExpenses = await apiGetExpenses(uid);
        if (isMounted && serverExpenses !== null) {
          setExpenses(serverExpenses);
          saveExpenses(serverExpenses, false, uid);
        } else if (serverExpenses === null) {
          console.error('[Sync] Could not fetch expenses. Keeping current expenses.', );
        }

        const serverRecurring = await apiGetRecurring(uid);
        if (isMounted && serverRecurring !== null) {
          setRecurringPayments(serverRecurring);
          saveRecurringPayments(serverRecurring, false, uid);
        } else if (serverRecurring === null) {
          console.error('[Sync] Could not fetch recurring payments. Keeping current data.',);
        }

        const serverSettings = await apiGetSettings(uid);
        if (isMounted && serverSettings) {
          setSettings((prev) => ({ ...prev, ...serverSettings }));
          saveSettings({ ...settings, ...serverSettings }, false, uid);
        }
      } catch (err) {
        console.warn('[Sync] Backend initialization note:', err);
      }
    }

    syncWithBackend();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, isAuthChecking]);

  // Protect private pages: Verify active session with Firebase Auth & listen for auth state
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        const displayName =
          fbUser.displayName ||
          fbUser.email?.split('@')[0].replace(/[._-]/g, ' ') ||
          'User';

        const user: AuthUser = {
          id: fbUser.uid,
          name: displayName,
          email: fbUser.email || '',
          currency: settings.currency || 'USD',
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        };
        setCurrentUser(user);
        saveCurrentUser(user);
        setExpenses(loadExpenses(user.id));
        setRecurringPayments(loadRecurringPayments(user.id));
        setSettings(loadSettings(user.id));
      } else {
        setCurrentUser(null);
        saveCurrentUser(null);
        setExpenses([]);
        setRecurringPayments([]);
      }
      setIsAuthChecking(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [settings.currency]);

  // Listen to real-time sync events from other browser tabs / windows
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeSync((event) => {
      if (event.type === 'EXPENSES_UPDATED') {
        const updatedExpenses = event.payload as Expense[];
        setExpenses(updatedExpenses);
        addToast({
          type: 'info',
          title: 'Live Sync Active',
          message: 'Transactions updated from another connected tab.',
        });
      } else if (event.type === 'SETTINGS_UPDATED') {
        const updatedSettings = event.payload as UserSettings;
        setSettings(updatedSettings);
      } else if (event.type === 'RECURRING_UPDATE') {
        const updatedRecurring = event.payload as RecurringPayment[];
        setRecurringPayments(updatedRecurring);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addToast]);

  // Compute number of active recurring payments currently within their prior reminder alert window
  const recurringAlertCount = useMemo(() => {
    return recurringPayments.filter(
      (p) => p.status === 'active' && getRecurringStatus(p).isAlert
    ).length;
  }, [recurringPayments]);

  // Keyboard shortcut: Press 'n' to log expense (when not inside inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'n' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) &&
        !isExpenseModalOpen &&
        !isSettingsModalOpen &&
        !isRecurringModalOpen
      ) {
        e.preventDefault();
        if (activeTab === 'recurring') {
          setEditingRecurringPayment(null);
          setIsRecurringModalOpen(true);
        } else {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpenseModalOpen, isSettingsModalOpen, isRecurringModalOpen, activeTab]);

  // Filtered expenses based on active time range (Week / Month / Year)
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    if (timeRange === 'week') {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      return expenses.filter((e) => new Date(e.date).getTime() >= cutoff.getTime());
    }
    if (timeRange === 'month') {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      return expenses.filter((e) => new Date(e.date).getTime() >= cutoff.getTime());
    }
    // 'year'
    const currentYear = now.getFullYear();
    const yearExpenses = expenses.filter((e) => {
      const parts = e.date.split('-');
      if (parts.length > 0) {
        return parseInt(parts[0], 10) === currentYear;
      }
      return true;
    });
    return yearExpenses.length > 0 ? yearExpenses : expenses;
  }, [expenses, timeRange]);

  // Add or Update Expense
  const handleSaveExpense = (expenseData: Omit<Expense, 'id'> | Expense) => {
    let updated: Expense[];
    const isEdit = 'id' in expenseData;
    const uid = currentUser?.id || 'global';

    if (isEdit) {
      const updatedExpense = { ...expenseData, userId: uid } as Expense;
      updated = expenses.map((e) => (e.id === expenseData.id ? updatedExpense : e));
      apiUpdateExpense(expenseData.id, updatedExpense);
      addToast({
        type: 'success',
        title: 'Expense Updated',
        message: `${formatCurrency(expenseData.amount, settings.currency)} updated.`,
      });
    } else {
      const newExpense: Expense = {
        ...(expenseData as Omit<Expense, 'id'>),
        id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        userId: uid,
      };
      updated = [newExpense, ...expenses];
      apiCreateExpense(newExpense);

      addToast({
        type: 'success',
        title: 'Expense Recorded',
        message: `${formatCurrency(newExpense.amount, settings.currency)} for "${newExpense.description}" saved to your account.`,
      });
    }

    setExpenses(updated);
    saveExpenses(updated, true, uid);
  };

  // Delete Expense with undo option
  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    const uid = currentUser?.id || 'global';

    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated, true, uid);
    apiDeleteExpense(id);

    addToast({
      type: 'info',
      title: 'Expense Removed',
      message: `Deleted "${target.description}" (${formatCurrency(target.amount, settings.currency)})`,
      actionLabel: 'Undo',
      onAction: () => {
        const restored = [target, ...updated];
        setExpenses(restored);
        saveExpenses(restored, true, uid);
        apiCreateExpense(target);
      },
    });
  };

  // Settings update
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const uid = currentUser?.id || 'global';
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated, true, uid);
    apiSaveSettings({ ...updated, userId: uid });
  };

  // Auth Handlers
  const handleLoginSuccess = (user: AuthUser, initialSettings?: Partial<UserSettings>) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    setExpenses(loadExpenses(user.id));
    setRecurringPayments(loadRecurringPayments(user.id));
    if (initialSettings) {
      handleUpdateSettings(initialSettings);
    }
    setIsAuthOpen(false);
    addToast({
      type: 'success',
      title: `Welcome, ${user.name}!`,
      message: `Successfully signed in as ${user.email}.`,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setCurrentUser(null);
    saveCurrentUser(null);
    setExpenses([]);
    setRecurringPayments([]);
    setIsAuthOpen(false);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have signed out of your account.',
    });
  };


  // Quick toggle dark mode
  const handleToggleDarkMode = () => {
    handleUpdateSettings({ darkMode: !settings.darkMode });
  };

  // PDF Export for week or month
  const handleExportPDF = (period: 'week' | 'month') => {
    try {
      exportExpensesToPDF(
        expenses,
        period,
        settings.currency,
        settings.monthlyBudgetCap,
        currentUser,
        recurringPayments
      );
      addToast({
        type: 'success',
        title: 'PDF Exported',
        message: `Downloaded ${period === 'week' ? 'Weekly' : 'Monthly'} PDF expense report.`,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate PDF report. Please try again.',
      });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    exportExpensesToCSV(expenses, settings.currency);
    addToast({
      type: 'success',
      title: 'Export Complete',
      message: `Exported ${expenses.length} expense records to CSV file.`,
    });
  };

  // Clear all data for current user
  const handleClearAllData = () => {
    const uid = currentUser?.id || 'global';
    // Delete each expense from backend
    expenses.forEach((e) => apiDeleteExpense(e.id));
    setExpenses([]);
    saveExpenses([], true, uid);
    addToast({
      type: 'info',
      title: 'All Records Cleared',
      message: 'All your personal expense records have been removed.',
    });
  };

  // Recurring Payments Handlers
  const handleSaveRecurringPayment = (
    paymentData: Omit<RecurringPayment, 'id' | 'createdAt'>,
    id?: string
  ) => {
    let updated: RecurringPayment[];
    const uid = currentUser?.id || 'global';
    if (id) {
      const updatedPayment = { ...paymentData, userId: uid };
      updated = recurringPayments.map((p) => (p.id === id ? { ...p, ...updatedPayment } : p));
      apiUpdateRecurring(id, updatedPayment);
      addToast({
        type: 'success',
        title: 'Recurrent Payment Updated',
        message: `Saved changes to "${paymentData.title}".`,
      });
    } else {
      const newRec: RecurringPayment = {
        id: 'rec-' + Date.now(),
        ...paymentData,
        userId: uid,
        createdAt: new Date().toISOString(),
      };
      updated = [newRec, ...recurringPayments];
      apiCreateRecurring(newRec);
      addToast({
        type: 'success',
        title: 'Recurrent Payment Added',
        message: `"${paymentData.title}" tracked with ${paymentData.reminderDaysBefore}-day prior alert notice.`,
      });
    }

    setRecurringPayments(updated);
    saveRecurringPayments(updated, true, uid);
  };

  const handleDeleteRecurringPayment = (id: string) => {
    const target = recurringPayments.find((p) => p.id === id);
    const uid = currentUser?.id || 'global';
    const updated = recurringPayments.filter((p) => p.id !== id);
    setRecurringPayments(updated);
    saveRecurringPayments(updated, true, uid);
    apiDeleteRecurring(id);
    addToast({
      type: 'info',
      title: 'Recurrent Payment Removed',
      message: `Deleted "${target?.title || 'payment'}" from tracked subscriptions.`,
    });
  };

  const handleToggleRecurringStatus = (id: string) => {
    const uid = currentUser?.id || 'global';
    const updated = recurringPayments.map((p) => {
      if (p.id === id) {
        const nextStatus: 'active' | 'paused' = p.status === 'active' ? 'paused' : 'active';
        return { ...p, status: nextStatus };
      }
      return p;
    });
    setRecurringPayments(updated);
    saveRecurringPayments(updated, true, uid);
  };

  const handleMarkRecurringPaid = (payment: RecurringPayment) => {
    const today = getTodayDateString();
    const uid = currentUser?.id || 'global';

    // 1. Update lastPaidDate in recurring state
    const updatedRecurring = recurringPayments.map((p) =>
      p.id === payment.id ? { ...p, lastPaidDate: today } : p
    );
    setRecurringPayments(updatedRecurring);
    saveRecurringPayments(updatedRecurring, true, uid);

    // 2. Automatically log to expense ledger if autoLogAsExpense is true
    if (payment.autoLogAsExpense !== false) {
      const newExp: Expense = {
        id: 'exp-' + Date.now(),
        amount: payment.amount,
        category: payment.category,
        description: `${payment.title} (Recurrent)`,
        timestamp: new Date().toISOString(),
        date: today,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes ? `Recurrent payment: ${payment.notes}` : 'Recurrent bill payment',
        userId: uid,
      };
      const updatedExpenses = [newExp, ...expenses];
      setExpenses(updatedExpenses);
      saveExpenses(updatedExpenses, true, uid);
      apiCreateExpense(newExp);
    }

    addToast({
      type: 'success',
      title: 'Payment Recorded',
      message: `Paid "${payment.title}" (${formatCurrency(payment.amount, settings.currency)}) & logged to daily ledger.`,
    });
  };

  const handleUnmarkRecurringPaid = (payment: RecurringPayment) => {
    const uid = currentUser?.id || 'global';
    const updatedRecurring = recurringPayments.map((p) =>
      p.id === payment.id ? { ...p, lastPaidDate: undefined } : p
    );
    setRecurringPayments(updatedRecurring);
    saveRecurringPayments(updatedRecurring, true, uid);
    addToast({
      type: 'info',
      title: 'Status Reset',
      message: `Reset payment status for "${payment.title}".`,
    });
  };

  // Session loading state while checking Supabase session
  if (isAuthChecking) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          settings.darkMode ? 'bg-[#0c0e14] text-slate-200' : 'bg-[#f4f6fb] text-slate-800'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-[#1e202a] dark:bg-white text-white dark:text-slate-950 font-bold text-2xl flex items-center justify-center shadow-lg">
            N
          </div>
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Protect private pages: if user is not authenticated or explicitly opening auth modal
  if (!currentUser || isAuthOpen) {
    return (
      <>
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          settings={settings}
          onCancel={currentUser ? () => setIsAuthOpen(false) : undefined}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div
      id="northlight-expense-app"
      className={`min-h-screen transition-colors duration-200 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] ${
        settings.darkMode ? 'dark bg-[#0c0e14] text-slate-100' : 'bg-[#f2f4f8] text-slate-900'
      }`}
    >
      {/* Top Header with Tab Switcher + Add Recurrent Pay + PDF + Settings + Dark Mode + Auth */}
      <LiveHeader
        settings={settings}
        timeRange={timeRange}
        onChangeTimeRange={setTimeRange}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        recurringAlertCount={recurringAlertCount}
        onOpenAddModal={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenRecurringModal={() => {
          setEditingRecurringPayment(null);
          setIsRecurringModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExportPDF={handleExportPDF}
        onToggleDarkMode={handleToggleDarkMode}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-2 sm:py-4">
        {activeTab === 'expenses' ? (
          /* Ledger & Analytics View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (Quick add + Recent) */}
            <div className="lg:col-span-4 space-y-6">
              <QuickAddCard
                onAddExpense={handleSaveExpense}
                settings={settings}
                timeRange={timeRange}
              />

              <RecentExpensesCard
                expenses={expenses}
                settings={settings}
                onEditExpense={(expense) => {
                  setEditingExpense(expense);
                  setIsExpenseModalOpen(true);
                }}
                onDeleteExpense={handleDeleteExpense}
              />
            </div>

            {/* Right Column (Stat Cards + Spend by category + Spend over time) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Top 3 Stat Cards + Monthly Budget Cap Pacing Indicator */}
              <StatCardsRow
                expenses={filteredExpenses}
                allExpenses={expenses}
                settings={settings}
                timeRange={timeRange}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              />

              {/* Spend by Category Card */}
              <SpendByCategoryCard
                expenses={filteredExpenses}
                allExpenses={expenses}
                recurringPayments={recurringPayments}
                settings={settings}
                timeRange={timeRange}
              />

              {/* Spend Over Time Card */}
              <SpendOverTimeCard
                expenses={expenses}
                settings={settings}
              />
            </div>
          </div>
        ) : (
          /* Recurrent Payments & Subscriptions View */
          <RecurringTab
            recurringPayments={recurringPayments}
            settings={settings}
            onOpenAddModal={() => {
              setEditingRecurringPayment(null);
              setIsRecurringModalOpen(true);
            }}
            onEditPayment={(payment) => {
              setEditingRecurringPayment(payment);
              setIsRecurringModalOpen(true);
            }}
            onDeletePayment={handleDeleteRecurringPayment}
            onToggleStatus={handleToggleRecurringStatus}
            onMarkAsPaid={handleMarkRecurringPaid}
            onUnmarkAsPaid={handleUnmarkRecurringPaid}
          />
        )}
      </main>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        settings={settings}
      />

      <RecurringPaymentModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditingRecurringPayment(null);
        }}
        onSave={handleSaveRecurringPayment}
        editingPayment={editingRecurringPayment}
        settings={settings}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportCSV={handleExportCSV}
        onClearAllData={handleClearAllData}
        onExportPDF={handleExportPDF}
      />

      {/* Floating Toast Notification*/}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
