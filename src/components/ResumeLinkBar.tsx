import React, { useState } from 'react';
import { Check, Cloud, Copy, Link2, MailCheck } from 'lucide-react';

interface ResumeLinkBarProps {
  resumeUrl: string;
  cloudSaved: boolean;
  emailedTo: string;
  onCopied: () => void;
}

export const ResumeLinkBar: React.FC<ResumeLinkBarProps> = ({
  resumeUrl,
  cloudSaved,
  emailedTo,
  onCopied
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resumeUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = resumeUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      id="clientResumeBar"
      className="no-print"
      style={{
        marginBottom: 18,
        padding: '12px 16px',
        borderRadius: 14,
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, flex: '1 1 280px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: '#0f172a',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1
          }}
        >
          <Link2 size={15} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
              Continue Your Application on Any Device
            </span>
            {cloudSaved && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#047857'
                }}
              >
                <Cloud size={12} /> Synced
              </span>
            )}
            {emailedTo && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#b45309'
                }}
              >
                <MailCheck size={12} /> Link emailed to {emailedTo}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: '#64748b',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}
            title={resumeUrl}
          >
            Save this private link to resume later on your phone or computer.
          </div>
        </div>
      </div>

      <button
        id="btnCopyResumeLink"
        type="button"
        onClick={handleCopy}
        className={`btn btn-sm ${copied ? 'btn-gold' : 'btn-primary'}`}
        style={{ flexShrink: 0 }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} color="#fbbf24" />}
        <span>{copied ? 'Link Copied!' : 'Copy Resume Link'}</span>
      </button>
    </div>
  );
};
