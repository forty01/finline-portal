import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  HeartPulse,
  Lock,
  LogOut,
  ShieldCheck,
  Sparkles,
  Upload
} from 'lucide-react';

export type AdvisorTab = 'inbox' | 'carrier-sheet' | 'edit-form' | 'calculators';

interface HeaderProps {
  isAdvisor: boolean;
  advisorTab: AdvisorTab;
  onChangeAdvisorTab: (tab: AdvisorTab) => void;
  casesCount: number;
  lastSaved: string;
  privacyMask: boolean;
  onTogglePrivacyMask: () => void;
  onOpenAdvisorLogin: () => void;
  onExitAdvisor: () => void;
  onLoadSample: (type: 'annuity' | 'life' | 'bonus') => void;
  onImportJson: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdvisor,
  advisorTab,
  onChangeAdvisorTab,
  casesCount,
  lastSaved,
  privacyMask,
  onTogglePrivacyMask,
  onOpenAdvisorLogin,
  onExitAdvisor,
  onLoadSample,
  onImportJson
}) => {
  const [sampleOpen, setSampleOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSampleOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <header className="app-header no-print">
      <div className="container">
        <div className="header-inner">
          {/* Brand Identity */}
          <div className="brand-group">
            <div className="brand-monogram">FL</div>
            <div>
              <div className="brand-title-row">
                <h1 className="brand-name">The FIN-Line Agency</h1>
                <span className="brand-badge">GFI Advisory</span>
              </div>
              <p className="brand-sub">
                <span>
                  {isAdvisor
                    ? 'Advisor Back-Office & Carrier Data-Entry Portal'
                    : 'Secure Client Application Form'}
                </span>
                <span className="save-badge">
                  <CheckCircle2 size={12} /> Auto-saved {lastSaved}
                </span>
              </p>
            </div>
          </div>

          {/* Advisor-Only Navigation Tabs */}
          {isAdvisor && (
            <nav className="nav-tabs" aria-label="Advisor Navigation">
              <button
                type="button"
                className={`nav-tab ${advisorTab === 'inbox' ? 'active' : ''}`}
                onClick={() => onChangeAdvisorTab('inbox')}
              >
                <FolderKanban size={14} />
                <span>Submissions</span>
                <span className="nav-tab-count">{casesCount}</span>
              </button>
              <button
                type="button"
                className={`nav-tab ${advisorTab === 'carrier-sheet' ? 'active' : ''}`}
                onClick={() => onChangeAdvisorTab('carrier-sheet')}
              >
                <ClipboardList size={14} />
                <span>Carrier Entry Sheet</span>
              </button>
              <button
                type="button"
                className={`nav-tab ${advisorTab === 'edit-form' ? 'active' : ''}`}
                onClick={() => onChangeAdvisorTab('edit-form')}
              >
                <FileText size={14} />
                <span>Edit Form</span>
              </button>
              <button
                type="button"
                className={`nav-tab ${advisorTab === 'calculators' ? 'active' : ''}`}
                onClick={() => onChangeAdvisorTab('calculators')}
              >
                <Calculator size={14} />
                <span>Calculators</span>
              </button>
            </nav>
          )}

          {/* Right Utility Controls */}
          <div className="header-actions">
            {isAdvisor ? (
              <>
                <button
                  type="button"
                  onClick={onTogglePrivacyMask}
                  className="btn btn-sm btn-dark"
                  title="Mask or show SSN and ID numbers on screen"
                >
                  {privacyMask ? <EyeOff size={14} color="#fbbf24" /> : <Eye size={14} color="#fbbf24" />}
                  <span>{privacyMask ? 'SSN Hidden' : 'SSN Visible'}</span>
                </button>
                <div className="dropdown-wrap" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setSampleOpen((v) => !v)}
                    className="btn btn-sm btn-dark"
                  >
                    <Sparkles size={14} color="#fbbf24" />
                    <span>Samples / Import</span>
                    <ChevronDown size={13} color="#94a3b8" />
                  </button>
                  {sampleOpen && (
                    <div className="dropdown-menu">
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setSampleOpen(false);
                          onLoadSample('annuity');
                        }}
                      >
                        <ShieldCheck size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0f172a' }}>
                            Sample: American Equity IRA Rollover
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Age 74 TX Retiree • $250k IncomeShield 10
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setSampleOpen(false);
                          onLoadSample('life');
                        }}
                      >
                        <HeartPulse size={16} color="#1e293b" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0f172a' }}>
                            Sample: IUL &amp; Health Case
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Age 46 TX • Controlled BP + Occasional Cigar
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setSampleOpen(false);
                          onLoadSample('bonus');
                        }}
                      >
                        <Award size={16} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0f172a' }}>
                            Sample: 403(b) Bonus Rollover
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Age 62 TX • $385k AssetShield 10 Bonus
                          </div>
                        </div>
                      </button>
                      <div className="dropdown-divider" />
                      <label className="dropdown-item" style={{ cursor: 'pointer' }}>
                        <Upload size={16} color="#475569" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0f172a' }}>
                            Import Client File (.json)
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Add saved client intake into submissions
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".json"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSampleOpen(false);
                              onImportJson(file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button type="button" onClick={onExitAdvisor} className="btn btn-sm btn-gold">
                  <LogOut size={14} />
                  <span>Client Form View</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAdvisorLogin}
                className="btn btn-sm btn-gold-outline"
              >
                <Lock size={13} />
                <span>Advisor Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isAdvisor && (
        <div className="advisor-banner">
          <div className="container advisor-banner-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={15} />
              <span>
                ADVISOR BACK-OFFICE ACTIVE — View Client Submissions, Copy Fields Into Any Carrier Portal, Check IGO Compliance &amp; Run Calculators
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
