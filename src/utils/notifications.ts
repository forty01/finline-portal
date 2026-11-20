import { addDoc, collection } from 'firebase/firestore';
import type { ClientCase } from '../types/portal';
import { AUTHORIZED_ADVISOR_EMAIL, getBackendMode } from './api';
import { fmtCurrencyExact } from './calculations';
import { db } from './firebase';

export const PORTAL_BASE_URL = 'https://forty01.github.io/finline-portal/';
const MAIL_COLLECTION = 'mail';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

export function generateResumeToken(): string {
  const bytes = new Uint8Array(24); // 192 bits of entropy -> 48 hex chars
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildResumeUrl(token: string): string {
  const originBase =
    typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? `${window.location.origin}${window.location.pathname}`
      : PORTAL_BASE_URL;
  const cleanBase = originBase.endsWith('/') ? originBase : `${originBase}/`;
  return `${cleanBase}?resume=${encodeURIComponent(token)}`;
}

interface MailPayload {
  to: string[];
  message: {
    subject: string;
    text: string;
    html: string;
  };
  meta: {
    type: 'advisor_started' | 'advisor_completed' | 'client_resume';
    createdAt: string;
    refCode?: string;
  };
}

async function enqueueMail(payload: MailPayload): Promise<boolean> {
  try {
    if (getBackendMode() === 'firebase' && db) {
      await addDoc(collection(db, MAIL_COLLECTION), payload);
      return true;
    }
    const res = await fetch('/api/mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    // Never interrupt the client experience if mail rules or extension aren't active yet
    console.warn('Email queue skipped or pending Firebase Trigger Email setup:', err);
    return false;
  }
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function queueAdvisorStartedEmail(c: ClientCase): Promise<boolean> {
  const name = c.ownerName.trim();
  const email = c.ownerEmail.trim();
  const phone = c.ownerPhone.trim() || 'Not provided yet';
  const deposit = c.estimatedPremium ? fmtCurrencyExact(c.estimatedPremium) : 'Not entered yet';
  const trackLabel =
    c.track === 'annuity'
      ? 'Retirement Savings & Income (Annuity)'
      : c.track === 'life'
        ? 'Life Insurance & Family Protection'
        : 'Not selected yet';

  const subject = `Client Started Application — ${name}`;
  const text = [
    `A client has started filling out their application:`,
    ``,
    `Client Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Planning Focus: ${trackLabel}`,
    `Proposed Deposit: ${deposit}`,
    ``,
    `Advisor Back-Office: ${PORTAL_BASE_URL}`,
    `(Note: Drafts stay private until the client submits their completed application.)`
  ].join('\n');

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; color: #0f172a; line-height: 1.55;">
      <div style="background: #0f172a; color: #fff; padding: 18px 22px; border-radius: 12px 12px 0 0; border-bottom: 3px solid #f59e0b;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #fbbf24; font-weight: 700;">Client Activity Alert</div>
        <h2 style="margin: 4px 0 0; font-size: 18px;">New Application Started</h2>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px 22px; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 150px;">Client Name</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Phone</td><td style="padding: 6px 0;">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Planning Focus</td><td style="padding: 6px 0;">${escapeHtml(trackLabel)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Proposed Deposit</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(deposit)}</td></tr>
        </table>
        <div style="margin-top: 18px;">
          <a href="${PORTAL_BASE_URL}" style="display: inline-block; background: #0f172a; color: #fbbf24; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 13px;">Open Advisor Back-Office</a>
        </div>
      </div>
    </div>
  `;

  return enqueueMail({
    to: [AUTHORIZED_ADVISOR_EMAIL],
    message: { subject, text, html },
    meta: { type: 'advisor_started', createdAt: new Date().toISOString() }
  });
}

export async function queueAdvisorCompletedEmail(
  c: ClientCase,
  refCode: string
): Promise<boolean> {
  const name = c.ownerName.trim() || 'Client';
  const email = c.ownerEmail.trim() || 'Not provided';
  const phone = c.ownerPhone.trim() || 'Not provided';
  const deposit = c.estimatedPremium ? fmtCurrencyExact(c.estimatedPremium) : 'Not entered';
  const trackLabel =
    c.track === 'annuity'
      ? 'Retirement Savings & Income (Annuity)'
      : c.track === 'life'
        ? 'Life Insurance & Family Protection'
        : '—';

  const subject = `Application Submitted — ${name} (Ref #FL-${refCode})`;
  const text = [
    `A client has completed and submitted their application!`,
    ``,
    `Reference Number: FL-${refCode}`,
    `Client Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Planning Focus: ${trackLabel}`,
    `Proposed Deposit: ${deposit}`,
    ``,
    `Sign in to your Advisor Back-Office to review and open the 1-Click Carrier Entry Sheet:`,
    PORTAL_BASE_URL
  ].join('\n');

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; color: #0f172a; line-height: 1.55;">
      <div style="background: #0f172a; color: #fff; padding: 18px 22px; border-radius: 12px 12px 0 0; border-bottom: 3px solid #10b981;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #34d399; font-weight: 700;">Application Submitted • Ref #FL-${escapeHtml(refCode)}</div>
        <h2 style="margin: 4px 0 0; font-size: 18px;">${escapeHtml(name)} Submitted Their Application</h2>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px 22px; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 155px;">Reference #</td><td style="padding: 6px 0; font-weight: 800; color: #b45309;">FL-${escapeHtml(refCode)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Client Name</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Phone</td><td style="padding: 6px 0;">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Planning Focus</td><td style="padding: 6px 0;">${escapeHtml(trackLabel)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Proposed Deposit</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(deposit)}</td></tr>
        </table>
        <div style="margin-top: 18px;">
          <a href="${PORTAL_BASE_URL}" style="display: inline-block; background: #f59e0b; color: #020617; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 13px;">View in Advisor Back-Office</a>
        </div>
      </div>
    </div>
  `;

  return enqueueMail({
    to: [AUTHORIZED_ADVISOR_EMAIL],
    message: { subject, text, html },
    meta: {
      type: 'advisor_completed',
      refCode: `FL-${refCode}`,
      createdAt: new Date().toISOString()
    }
  });
}

export async function queueClientResumeEmail(
  c: ClientCase,
  resumeUrl: string
): Promise<boolean> {
  const name = c.ownerName.trim() || 'there';
  const email = c.ownerEmail.trim();
  if (!isValidEmail(email)) return false;

  const subject = 'Continue Your Application — Private Resume Link';
  const text = [
    `Hi ${name},`,
    ``,
    `Your application progress is saved automatically. You can pick up right where you left off on any phone, tablet, or computer using your private resume link:`,
    ``,
    resumeUrl,
    ``,
    `Please keep this link private, as it opens your saved application draft.`
  ].join('\n');

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; color: #0f172a; line-height: 1.55;">
      <div style="background: #0f172a; color: #fff; padding: 18px 22px; border-radius: 12px 12px 0 0; border-bottom: 3px solid #f59e0b;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #fbbf24; font-weight: 700;">The FIN-Line Agency | GFI Advisory</div>
        <h2 style="margin: 4px 0 0; font-size: 18px;">Continue Your Application Anytime</h2>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px 22px; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 12px; font-size: 14px;">Hi ${escapeHtml(name)},</p>
        <p style="margin: 0 0 16px; font-size: 13.5px; color: #334155;">
          Your progress has been saved. Use your private link below to continue your application on any device right where you left off:
        </p>
        <div style="margin: 18px 0;">
          <a href="${escapeHtml(resumeUrl)}" style="display: inline-block; background: #f59e0b; color: #020617; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-weight: 700; font-size: 13.5px;">Continue My Application</a>
        </div>
        <p style="margin: 14px 0 0; font-size: 11.5px; color: #64748b; word-break: break-all;">
          Or copy and paste this link: ${escapeHtml(resumeUrl)}
        </p>
        <p style="margin: 12px 0 0; font-size: 11.5px; color: #64748b;">
          Please keep this link private — it provides direct access to your in-progress application draft.
        </p>
      </div>
    </div>
  `;

  return enqueueMail({
    to: [email],
    message: { subject, text, html },
    meta: { type: 'client_resume', createdAt: new Date().toISOString() }
  });
}
