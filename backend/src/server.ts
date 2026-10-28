
import express, {
  type Request,
  type RequestHandler,
} from 'express';

import {
  connectRedis,
  getCached,
  setCached,
  deleteCached,
} from './redis.js';

import { cacheKeys } from './cacheKeys.js';

import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import {
  initMongoDB,
  getDatabaseStatus,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
  getSettings,
  saveSettings,
} from './db.js';

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
      };
    }
  }
}

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json({ limit: '1mb' }));

// Initialize Firebase Admin using the private service-account file.
function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_PATH is missing from backend/.env',
    );
  }

  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Firebase service-account file not found: ${resolvedPath}`,
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(resolvedPath, 'utf8'),
  );

  initializeApp({
    credential: cert(serviceAccount),
  });

  console.log('[Firebase Admin] Initialized successfully.');
}

// Verify the Firebase ID token on protected routes.
const authenticateUser: RequestHandler = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Missing Firebase ID token.',
    });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    res.status(401).json({
      error: 'Missing Firebase ID token.',
    });
    return;
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    next();
  } catch {
    res.status(401).json({
      error: 'Invalid or expired Firebase ID token.',
    });
  }
};

// Public health endpoint. Does not expose database credentials.
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'Node.js Express',
    authentication: 'Firebase Admin',
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
});

// All expense routes require Firebase authentication.
app.use('/api/expenses', authenticateUser);

app.get('/api/expenses', async (req, res) => {
  const userId = req.user!.uid;
  const key = cacheKeys.expenses(userId);

  try {
    const cached = await getCached<unknown[]>(key);

    if (cached !== null) {
      console.log('[Expenses Cache] HIT:', key);
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    console.log('[Expenses Cache] MISS:', key);

    const expenses = await getExpenses(userId);

    await setCached(key, expenses, 60);

    res.setHeader('X-Cache', 'MISS');
    res.json(expenses);
  } catch (error) {
    console.error('[Expenses] Fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses.',
    });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const expense = await createExpense(userId, req.body);
    await deleteCached(cacheKeys.expenses(userId));
    res.status(201).json(expense);
  } catch (error) {
    console.error('[Expenses] Create failed:', error);
    res.status(400).json({ error: 'Failed to create expense.' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const updated = await updateExpense(
      userId,
      req.params.id,
      req.body,
    );

    if (!updated) {
      res.status(404).json({ error: 'Expense not found.' });
      return;
    }

    await deleteCached(cacheKeys.expenses(userId));

    res.json(updated);
  } catch (error) {
    console.error('[Expenses] Update failed:', error);
    res.status(400).json({ error: 'Failed to update expense.' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const deleted = await deleteExpense(
      userId,
      req.params.id,
    );

    if (!deleted) {
      res.status(404).json({ error: 'Expense not found.' });
      return;
    }

    await deleteCached(cacheKeys.expenses(userId));

    res.json({ success: true });
  } catch (error) {
    console.error('[Expenses] Delete failed:', error);
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

// All recurring-payment routes require Firebase authentication.
app.use('/api/recurring', authenticateUser);

app.get('/api/recurring', async (req, res) => {
  const userId = req.user!.uid;
  const key = cacheKeys.recurring(userId);
  const cached = await getCached<unknown[]>(key);
  if (cached !== null){
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  try {
    const items = await getRecurringPayments(userId);
    await setCached(key, items, 60);
    res.setHeader('X-Cache', 'MISS');
    res.json(items);
  } catch (error) {
    console.error('[Recurring] Fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch recurring payments.',
    });
  }
});

app.post('/api/recurring', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const item = await createRecurringPayment(
      userId,
      req.body,
    );
    await deleteCached(cacheKeys.recurring(userId));
    res.status(201).json(item);
  } catch (error) {
    console.error('[Recurring] Create failed:', error);
    res.status(400).json({
      error: 'Failed to create recurring payment.',
    });
  }
});

app.put('/api/recurring/:id', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const updated = await updateRecurringPayment(
      userId,
      req.params.id,
      req.body,
    );

    if (!updated) {
      res.status(404).json({
        error: 'Recurring payment not found.',
      });
      return;
    }
    await deleteCached(cacheKeys.recurring(userId));
    res.json(updated);
  } catch (error) {
    console.error('[Recurring] Update failed:', error);
    res.status(400).json({
      error: 'Failed to update recurring payment.',
    });
  }
});

app.delete('/api/recurring/:id', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const deleted = await deleteRecurringPayment(
      userId,
      req.params.id,
    );

    if (!deleted) {
      res.status(404).json({
        error: 'Recurring payment not found.',
      });
      return;
    }
    await deleteCached(cacheKeys.recurring(userId));
    res.json({ success: true });
  } catch (error) {
    console.error('[Recurring] Delete failed:', error);
    res.status(500).json({
      error: 'Failed to delete recurring payment.',
    });
  }
});

// All settings routes require Firebase authentication.
app.use('/api/settings', authenticateUser);

app.get('/api/settings', async (req, res) => {
  const userId = req.user!.uid;
  const key = cacheKeys.settings(userId);
  const cached = await getCached<Record<string, unknown>>(key);
  if (cached !== null){
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }
  try {
    const settings = await getSettings(userId);
    await setCached(key, settings, 60);
    res.setHeader('X-Cache', 'MISS');
    res.json(settings);
  } catch (error) {
    console.error('[Settings] Fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

async function handleSaveSettings(req: Request, res: express.Response) {
  try {
    const userId = req.user!.uid;
    const settings = await saveSettings(userId, req.body);
    await deleteCached(cacheKeys.settings(userId));
    res.json(settings);
  } catch (error) {
    console.error('[Settings] Save failed:', error);
    res.status(400).json({ error: 'Failed to save settings.' });
  }
}

app.put('/api/settings', handleSaveSettings);
app.post('/api/settings', handleSaveSettings);

// Start only after both services initialize successfully.
async function startServer(): Promise<void> {
  initFirebaseAdmin();
  await initMongoDB();
  
  try {
    await connectRedis();
  } catch (error) {
    console.error(
      '[Redis] Initial connection failed; using MongoDB without cache.',
      error,
    );
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Express Backend] API running at http://localhost:${PORT}`,
    );
  });
}

startServer().catch((error) => {
  console.error('[Server Error] Failed to start server:', error);
  process.exit(1);
});
