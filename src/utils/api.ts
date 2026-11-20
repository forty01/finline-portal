import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import type { ClientCase } from '../types/portal';
import { auth, db, isFirebaseConfigured } from './firebase';

const TOKEN_KEY = 'finline_advisor_token';
const SUBMISSIONS_COLLECTION = 'submissions';
const DRAFTS_COLLECTION = 'drafts';
export const AUTHORIZED_ADVISOR_EMAIL = 'fortysinbox@gmail.com';
export const UNAUTHORIZED_ADVISOR_MSG =
  'Not authorized — this portal is restricted to the authorized advisor account. Please sign in with the authorized Google account.';

export function isAuthorizedAdvisorEmail(email?: string | null): boolean {
  return String(email || '').trim().toLowerCase() === AUTHORIZED_ADVISOR_EMAIL;
}

export function getBackendMode(): 'firebase' | 'local' {
  return isFirebaseConfigured && auth && db ? 'firebase' : 'local';
}

export function getSavedToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setSavedToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function authHeaders(): HeadersInit {
  const token = getSavedToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function apiSubmitApplication(data: ClientCase): Promise<ClientCase> {
  if (getBackendMode() === 'firebase' && db) {
    const now = new Date().toISOString();
    const record: ClientCase = {
      ...data,
      status: data.status || 'In Review',
      createdAt: data.createdAt || now,
      updatedAt: now
    };
    await setDoc(doc(db, SUBMISSIONS_COLLECTION, record.id), record);
    return record;
  }

  const res = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit application');
  }
  const json = await res.json();
  return json.submission;
}

export async function apiAdvisorGoogleLogin(): Promise<{
  advisor: { email: string; name: string };
}> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await signInWithPopup(auth, provider);
    const userEmail = cred.user.email || '';
    if (!isAuthorizedAdvisorEmail(userEmail)) {
      await signOut(auth);
      throw new Error(UNAUTHORIZED_ADVISOR_MSG);
    }
    return {
      advisor: {
        email: userEmail,
        name: cred.user.displayName || 'FIN-Line Advisor'
      }
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Click "Continue with Google" to try again.');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
    }
    throw new Error(err instanceof Error ? err.message : 'Google sign-in failed.');
  }
}

export async function apiAdvisorLogout(): Promise<void> {
  if (getBackendMode() === 'firebase' && auth) {
    await signOut(auth);
  }
  setSavedToken('');
}

export async function apiCheckSession(): Promise<{ email: string; name: string } | null> {
  if (getBackendMode() === 'firebase' && auth) {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth!, async (user) => {
        unsubscribe();
        if (user) {
          if (!isAuthorizedAdvisorEmail(user.email)) {
            await signOut(auth!).catch(() => {});
            resolve(null);
            return;
          }
          resolve({
            email: user.email || '',
            name: user.displayName || 'FIN-Line Advisor'
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  const token = getSavedToken();
  if (!token) return null;
  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  if (!res.ok) {
    setSavedToken('');
    return null;
  }
  const json = await res.json();
  return json.advisor;
}

export async function apiFetchSubmissions(): Promise<ClientCase[]> {
  if (getBackendMode() === 'firebase' && db) {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...(d.data() as ClientCase), id: d.id }));
  }

  const res = await fetch('/api/submissions', { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('Could not load client submissions');
  }
  const json = await res.json();
  return json.submissions || [];
}

export async function apiUpdateSubmission(
  id: string,
  patch: Partial<ClientCase>
): Promise<ClientCase> {
  if (getBackendMode() === 'firebase' && db) {
    const updatedAt = new Date().toISOString();
    await updateDoc(doc(db, SUBMISSIONS_COLLECTION, id), {
      ...patch,
      updatedAt
    } as Record<string, unknown>);
    return { ...(patch as ClientCase), id, updatedAt };
  }

  const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    throw new Error('Could not update submission');
  }
  const json = await res.json();
  return json.submission;
}

export async function apiDeleteSubmission(id: string): Promise<void> {
  if (getBackendMode() === 'firebase' && db) {
    await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id));
    return;
  }

  const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    throw new Error('Could not delete submission');
  }
}

// =========================================================================
// SEPARATE CLIENT RESUME DRAFTS (get-by-unguessable-token ONLY; never listed)
// =========================================================================
export async function apiSaveDraft(token: string, draft: ClientCase): Promise<boolean> {
  if (!token || token.length < 32) return false;
  const payload = {
    draft,
    updatedAt: new Date().toISOString()
  };
  try {
    if (getBackendMode() === 'firebase' && db) {
      await setDoc(doc(db, DRAFTS_COLLECTION, token), payload);
      return true;
    }
    const res = await fetch(`/api/drafts/${encodeURIComponent(token)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud draft sync skipped or pending Firestore drafts rule:', err);
    return false;
  }
}

export async function apiLoadDraft(token: string): Promise<ClientCase | null> {
  if (!token || token.length < 32) return null;
  try {
    if (getBackendMode() === 'firebase' && db) {
      const snap = await getDoc(doc(db, DRAFTS_COLLECTION, token));
      if (!snap.exists()) return null;
      const data = snap.data() as { draft?: ClientCase };
      return data.draft || null;
    }
    const res = await fetch(`/api/drafts/${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.draft || null;
  } catch (err) {
    console.warn('Could not load cloud draft:', err);
    return null;
  }
}

export async function apiDeleteDraft(token: string): Promise<void> {
  if (!token || token.length < 32) return;
  try {
    if (getBackendMode() === 'firebase' && db) {
      await deleteDoc(doc(db, DRAFTS_COLLECTION, token));
      return;
    }
    await fetch(`/api/drafts/${encodeURIComponent(token)}`, { method: 'DELETE' });
  } catch {
    // non-fatal cleanup
  }
}
