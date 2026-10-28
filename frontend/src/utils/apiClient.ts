
import { auth } from '../lib/firebase';
import type { Expense, RecurringPayment, UserSettings } from '../types';

export interface BackendStatus {
  status: string;
  server: string;
  authentication: string;
  database: {
    database: string;
    connected: boolean;
    uptimeSeconds: number;
  };
  timestamp: string;
}

// Attach the verified user's Firebase ID token to protected API requests.
async function authorizedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You must be signed in to access this resource.');
  }

  const token = await user.getIdToken();
  const headers = new Headers(options.headers);

  headers.set('Authorization', `Bearer ${token}`);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Public health endpoint; no token is required.
export async function fetchBackendStatus(): Promise<BackendStatus | null> {
  try {
    const res = await fetch('/api/status');

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.warn('[API Client] Backend status unavailable:', error);
    return null;
  }
}

// Expenses
export async function apiGetExpenses(
  _userId?: string,
): Promise<Expense[] | null> {
  try {
    const res = await authorizedFetch('/api/expenses');
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Fetch expenses failed:', error);
    return null;
  }
}

export async function apiCreateExpense(
  expense: Expense,
): Promise<Expense | null> {
  try {
    const res = await authorizedFetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Create expense failed:', error);
    return null;
  }
}

export async function apiUpdateExpense(
  id: string,
  updates: Partial<Expense>,
): Promise<Expense | null> {
  try {
    const res = await authorizedFetch(
      `/api/expenses/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Update expense failed:', error);
    return null;
  }
}

export async function apiDeleteExpense(id: string): Promise<boolean> {
  try {
    const res = await authorizedFetch(
      `/api/expenses/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );

    return res.ok;
  } catch (error) {
    console.warn('[API Client] Delete expense failed:', error);
    return false;
  }
}

// Recurring payments
export async function apiGetRecurring(
  _userId?: string,
): Promise<RecurringPayment[] | null> {
  try {
    const res = await authorizedFetch('/api/recurring');
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Fetch recurring payments failed:', error);
    return null;
  }
}

export async function apiCreateRecurring(
  recurring: RecurringPayment,
): Promise<RecurringPayment | null> {
  try {
    const res = await authorizedFetch('/api/recurring', {
      method: 'POST',
      body: JSON.stringify(recurring),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Create recurring payment failed:', error);
    return null;
  }
}

export async function apiUpdateRecurring(
  id: string,
  updates: Partial<RecurringPayment>,
): Promise<RecurringPayment | null> {
  try {
    const res = await authorizedFetch(
      `/api/recurring/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Update recurring payment failed:', error);
    return null;
  }
}

export async function apiDeleteRecurring(id: string): Promise<boolean> {
  try {
    const res = await authorizedFetch(
      `/api/recurring/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );

    return res.ok;
  } catch (error) {
    console.warn('[API Client] Delete recurring payment failed:', error);
    return false;
  }
}

// User settings
export async function apiGetSettings(
  _userId?: string,
): Promise<UserSettings | null> {
  try {
    const res = await authorizedFetch('/api/settings');
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Fetch settings failed:', error);
    return null;
  }
}

export async function apiSaveSettings(
  settings: UserSettings & { userId?: string },
): Promise<UserSettings | null> {
  try {
    const res = await authorizedFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[API Client] Save settings failed:', error);
    return null;
  }
}
