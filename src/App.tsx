import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Lock,
  Send,
  ShieldCheck
} from 'lucide-react';
import { AdvisorLoginModal } from './components/AdvisorLoginModal';
import { CalculatorsView } from './components/CalculatorsView';
import { CarrierEntrySheet } from './components/CarrierEntrySheet';
import { CasesDashboard } from './components/CasesDashboard';
import { ClientSubmittedView } from './components/ClientSubmittedView';
import { ConfirmModal } from './components/ConfirmModal';
import { Header, type AdvisorTab } from './components/Header';
import { Stepper } from './components/Stepper';
import { StrategistSidebar } from './components/StrategistSidebar';
import { ToastContainer } from './components/ToastContainer';
import { Step1Track } from './components/steps/Step1Track';
import { Step2Owner } from './components/steps/Step2Owner';
import { Step3Beneficiaries } from './components/steps/Step3Beneficiaries';
import { Step4Suitability } from './components/steps/Step4Suitability';
import { Step5Funding } from './components/steps/Step5Funding';
import { Step6Review } from './components/steps/Step6Review';
import {
  createCaseId,
  createDefaultCase,
  createSampleCase,
  STEPS_META
} from './data/knowledgeBase';
import type {
  AgentCompliance,
  CaseStatus,
  ClientCase,
  ToastItem
} from './types/portal';
import {
  apiAdvisorLogout,
  apiCheckSession,
  apiDeleteSubmission,
  apiFetchSubmissions,
  apiSubmitApplication,
  apiUpdateSubmission
} from './utils/api';
import {
  buildPlainTextSummary,
  exportCaseJSON,
  exportCasesCSV,
  generateFactFinderPDF
} from './utils/exports';

const CLIENT_DRAFT_KEY = 'finline_client_draft_v2';

function loadClientDraft(): ClientCase {
  try {
    const raw = localStorage.getItem(CLIENT_DRAFT_KEY);
    if (raw) {
      return createDefaultCase(JSON.parse(raw));
    }
  } catch (err) {
    console.error('Failed to load client draft:', err);
  }
  return createDefaultCase({ signedCityState: '' });
}

export default function App() {
  // Client-facing application state (blank by default)
  const [clientDraft, setClientDraft] = useState<ClientCase>(() => loadClientDraft());
  const [submittedReceipt, setSubmittedReceipt] = useState<ClientCase | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Advisor back-office state (authenticated via backend)
  const [isAdvisor, setIsAdvisor] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [advisorTab, setAdvisorTab] = useState<AdvisorTab>('inbox');
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');

  const [privacyMask, setPrivacyMask] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const selectedAdvisorCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) ?? cases[0] ?? null,
    [cases, selectedCaseId]
  );

  // Check if advisor already has a valid session token on mount
  useEffect(() => {
    apiCheckSession()
      .then((advisor) => {
        if (advisor) {
          setIsAdvisor(true);
          return apiFetchSubmissions().then((list) => {
            const normalized = list.map((item) => createDefaultCase(item));
            setCases(normalized);
            if (normalized[0]) setSelectedCaseId(normalized[0].id);
          });
        }
      })
      .catch(() => {
        // remain in client view
      });
  }, []);

  // Auto-save client's in-progress draft locally so they don't lose work on refresh
  useEffect(() => {
    try {
      localStorage.setItem(CLIENT_DRAFT_KEY, JSON.stringify(clientDraft));
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  }, [clientDraft]);

  const addToast = (
    message: string,
    type: 'success' | 'warning' | 'error' = 'success'
  ) => {
    const id = 't_' + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  };

  const refreshSubmissionsFromServer = async () => {
    try {
      const list = await apiFetchSubmissions();
      const normalized = list.map((item) => createDefaultCase(item));
      setCases(normalized);
      if (normalized[0] && !normalized.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(normalized[0].id);
      }
    } catch (err) {
      console.error(err);
      addToast('Could not refresh submissions from server.', 'error');
    }
  };

  const updateClientDraft = (patch: Partial<ClientCase>) => {
    setClientDraft((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString()
    }));
  };

  const updateAdvisorCase = (patch: Partial<ClientCase>) => {
    if (!selectedAdvisorCase) return;
    const id = selectedAdvisorCase.id;
    setCases((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
      )
    );
    apiUpdateSubmission(id, patch).catch(() => {
      addToast('Failed to sync update to server.', 'error');
    });
  };

  const updateCompliance = (patch: Partial<AgentCompliance>) => {
    if (!selectedAdvisorCase) return;
    updateAdvisorCase({
      agentCompliance: {
        ...selectedAdvisorCase.agentCompliance,
        ...patch
      }
    });
  };

  const handleSubmitClientApplication = async () => {
    if (submitting) return;
    if (!clientDraft.ownerName.trim()) {
      addToast('Please enter your Full Legal Name in Step 2 before submitting.', 'warning');
      updateClientDraft({ currentStep: 2 });
      return;
    }
    if (!clientDraft.clientAcknowledged || clientDraft.clientSignature.trim().length < 2) {
      addToast('Please check the acknowledgment box and type your signature to submit.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload: ClientCase = {
        ...clientDraft,
        id: createCaseId(),
        status: 'In Review',
        updatedAt: new Date().toISOString()
      };
      const saved = await apiSubmitApplication(payload);
      setSubmittedReceipt(createDefaultCase(saved));
      setClientDraft(createDefaultCase({ signedCityState: '' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast('Thank you! Your application has been securely sent to me.');
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Submission failed — please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewAdvisorCase = async () => {
    try {
      const fresh = createDefaultCase({ signedCityState: '', status: 'Draft' });
      const saved = await apiSubmitApplication(fresh);
      const normalized = createDefaultCase(saved);
      setCases((prev) => [normalized, ...prev]);
      setSelectedCaseId(normalized.id);
      setAdvisorTab('edit-form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast('Created new blank client application.');
    } catch {
      addToast('Failed to create new case on server.', 'error');
    }
  };

  const handleLoadSample = async (type: 'annuity' | 'life' | 'bonus') => {
    try {
      const sample = createSampleCase(type);
      const saved = await apiSubmitApplication(sample);
      const normalized = createDefaultCase(saved);
      setCases((prev) => [normalized, ...prev]);
      setSelectedCaseId(normalized.id);
      setAdvisorTab('carrier-sheet');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast(`Added sample client: ${normalized.ownerName}`);
    } catch {
      addToast('Could not save sample case.', 'error');
    }
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result || '{}'));
        const imported = createDefaultCase({
          ...parsed,
          id: createCaseId(),
          updatedAt: new Date().toISOString()
        });
        const saved = await apiSubmitApplication(imported);
        const normalized = createDefaultCase(saved);
        setCases((prev) => [normalized, ...prev]);
        setSelectedCaseId(normalized.id);
        setAdvisorTab('carrier-sheet');
        addToast(`Imported client file: ${normalized.ownerName || 'Client'}`);
      } catch {
        addToast('Invalid JSON client file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDuplicateCase = async (id: string) => {
    const src = cases.find((c) => c.id === id);
    if (!src) return;
    try {
      const copy: ClientCase = {
        ...src,
        id: createCaseId(),
        ownerName: src.ownerName ? `${src.ownerName} (Copy)` : 'Untitled (Copy)',
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const saved = await apiSubmitApplication(copy);
      const normalized = createDefaultCase(saved);
      setCases((prev) => [normalized, ...prev]);
      addToast(`Duplicated case: ${normalized.ownerName}`);
    } catch {
      addToast('Could not duplicate case.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const idToDelete = deleteTargetId;
    try {
      await apiDeleteSubmission(idToDelete);
      setCases((prev) => {
        const remaining = prev.filter((c) => c.id !== idToDelete);
        if (selectedCaseId === idToDelete) {
          setSelectedCaseId(remaining[0]?.id ?? '');
        }
        return remaining;
      });
      setDeleteTargetId(null);
      addToast('Application deleted.', 'warning');
    } catch {
      addToast('Failed to delete application.', 'error');
    }
  };

  const copySummaryFor = async (target: ClientCase) => {
    const text = buildPlainTextSummary(target, privacyMask, isAdvisor);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    addToast('Full carrier summary copied to clipboard!');
  };

  const downloadPdfFor = (target: ClientCase) => {
    generateFactFinderPDF(target, privacyMask, isAdvisor);
    addToast(`Downloaded PDF for ${target.ownerName || 'Client'}.`);
  };

  const renderWizard = (
    activeForm: ClientCase,
    onUpdateForm: (patch: Partial<ClientCase>) => void,
    advisorEditing: boolean
  ) => {
    const goToStep = (step: number) => {
      onUpdateForm({ currentStep: Math.max(1, Math.min(6, step)) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderStepBody = () => {
      switch (activeForm.currentStep) {
        case 1:
          return (
            <Step1Track
              clientCase={activeForm}
              isAdvisor={advisorEditing}
              onUpdate={onUpdateForm}
            />
          );
        case 2:
          return (
            <Step2Owner
              clientCase={activeForm}
              privacyMask={privacyMask}
              onTogglePrivacyMask={() => setPrivacyMask((v) => !v)}
              onUpdate={onUpdateForm}
            />
          );
        case 3:
          return (
            <Step3Beneficiaries
              clientCase={activeForm}
              privacyMask={privacyMask}
              onUpdate={onUpdateForm}
              onToast={addToast}
            />
          );
        case 4:
          return <Step4Suitability clientCase={activeForm} onUpdate={onUpdateForm} />;
        case 5:
          return <Step5Funding clientCase={activeForm} onUpdate={onUpdateForm} />;
        case 6:
          return (
            <Step6Review
              clientCase={activeForm}
              privacyMask={privacyMask}
              isAdvisor={advisorEditing}
              onUpdate={onUpdateForm}
              onGoToStep={goToStep}
              onSubmitClientApplication={handleSubmitClientApplication}
              onDownloadPDF={() => downloadPdfFor(activeForm)}
              onCopyFireLight={() => copySummaryFor(activeForm)}
              onExportJSON={() => {
                exportCaseJSON(activeForm);
                addToast('Client Intake JSON downloaded.');
              }}
            />
          );
        default:
          return <Step1Track clientCase={activeForm} onUpdate={onUpdateForm} />;
      }
    };

    return (
      <>
        <Stepper clientCase={activeForm} onGoToStep={goToStep} />
        <div className={`workspace-grid ${advisorEditing ? 'advisor-open' : ''}`}>
          <div>
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              <div className="card">{renderStepBody()}</div>

              <div className="wizard-nav-bar no-print">
                <button
                  type="button"
                  disabled={activeForm.currentStep === 1}
                  onClick={() => goToStep(activeForm.currentStep - 1)}
                  className="btn btn-secondary btn-lg"
                >
                  <ArrowLeft size={15} />
                  <span>Previous</span>
                </button>

                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                  Step {activeForm.currentStep} of 6 —{' '}
                  {STEPS_META[activeForm.currentStep - 1]?.title}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {activeForm.currentStep < 6 && (
                    <button
                      type="button"
                      onClick={() => goToStep(6)}
                      className="btn btn-ghost"
                    >
                      <FileCheck2 size={15} color="#d97706" />
                      <span>Review</span>
                    </button>
                  )}
                  {activeForm.currentStep < 6 ? (
                    <button
                      type="button"
                      onClick={() => goToStep(activeForm.currentStep + 1)}
                      className="btn btn-primary btn-lg"
                    >
                      <span>Save &amp; Continue</span>
                      <ArrowRight size={15} color="#fbbf24" />
                    </button>
                  ) : !advisorEditing ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitClientApplication}
                      className="btn btn-gold btn-lg"
                    >
                      <Send size={15} />
                      <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdvisorTab('carrier-sheet')}
                      className="btn btn-gold btn-lg"
                    >
                      <span>Open Carrier Entry Sheet</span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {advisorEditing && (
            <StrategistSidebar
              clientCase={activeForm}
              onUpdateCompliance={updateCompliance}
              onUpdateNotes={(notes) => onUpdateForm({ advisorNotes: notes })}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div className="app-shell">
      <Header
        isAdvisor={isAdvisor}
        advisorTab={advisorTab}
        onChangeAdvisorTab={setAdvisorTab}
        casesCount={cases.length}
        lastSaved={lastSaved}
        privacyMask={privacyMask}
        onTogglePrivacyMask={() => setPrivacyMask((v) => !v)}
        onOpenAdvisorLogin={() => setLoginModalOpen(true)}
        onExitAdvisor={() => {
          apiAdvisorLogout().finally(() => {
            setIsAdvisor(false);
            setSubmittedReceipt(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            addToast('Signed out of Advisor Portal.');
          });
        }}
        onLoadSample={handleLoadSample}
        onImportJson={handleImportJson}
      />

      <main className="main-content">
        <div className="container">
          {/* CLIENT-FACING APPLICATION PORTAL (DEFAULT) */}
          {!isAdvisor && (
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
              {submittedReceipt ? (
                <ClientSubmittedView
                  submittedCase={submittedReceipt}
                  onDownloadCopy={() => downloadPdfFor(submittedReceipt)}
                  onStartNew={() => {
                    setSubmittedReceipt(null);
                    setClientDraft(createDefaultCase({ signedCityState: '' }));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ) : (
                <>
                  {clientDraft.currentStep === 1 && (
                    <div
                      style={{
                        marginBottom: 20,
                        padding: '18px 22px',
                        borderRadius: 16,
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px -1px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14
                      }}
                    >
                      <div>
                        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                          Welcome — Let&apos;s Get Your Application Started
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
                          Fill out the 6 quick steps below at your own pace. I&apos;ll personally review your details and handle all of the carrier paperwork for you.
                        </p>
                      </div>
                      <span className="badge badge-emerald" style={{ padding: '6px 12px', fontSize: 11.5 }}>
                        <ShieldCheck size={14} /> Private &amp; Confidential
                      </span>
                    </div>
                  )}

                  {renderWizard(clientDraft, updateClientDraft, false)}
                </>
              )}
            </div>
          )}

          {/* ADVISOR BACK-OFFICE PORTAL */}
          {isAdvisor && (
            <>
              {advisorTab === 'inbox' && (
                <CasesDashboard
                  cases={cases}
                  activeCaseId={selectedAdvisorCase?.id ?? ''}
                  onOpenCarrierSheet={(id) => {
                    setSelectedCaseId(id);
                    setAdvisorTab('carrier-sheet');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onEditCase={(id) => {
                    setSelectedCaseId(id);
                    setAdvisorTab('edit-form');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNewCase={handleNewAdvisorCase}
                  onDuplicateCase={handleDuplicateCase}
                  onDeleteCase={(id) => setDeleteTargetId(id)}
                  onChangeStatus={(id, status: CaseStatus) => {
                    setCases((prev) =>
                      prev.map((c) =>
                        c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
                      )
                    );
                    apiUpdateSubmission(id, { status }).catch(() =>
                      addToast('Could not update status on server.', 'error')
                    );
                    addToast(`Updated status to ${status}`);
                  }}
                  onDownloadPDF={downloadPdfFor}
                  onExportAllCSV={() => {
                    exportCasesCSV(cases);
                    addToast('Exported all submissions to CSV.');
                  }}
                />
              )}

              {advisorTab === 'carrier-sheet' &&
                (selectedAdvisorCase ? (
                  <div className="workspace-grid advisor-open">
                    <CarrierEntrySheet
                      clientCase={selectedAdvisorCase}
                      privacyMask={privacyMask}
                      onTogglePrivacyMask={() => setPrivacyMask((v) => !v)}
                      onBackToInbox={() => setAdvisorTab('inbox')}
                      onEditInWizard={() => setAdvisorTab('edit-form')}
                      onCopyFullSummary={() => copySummaryFor(selectedAdvisorCase)}
                      onDownloadPDF={() => downloadPdfFor(selectedAdvisorCase)}
                      onChangeStatus={(status) => updateAdvisorCase({ status })}
                      onToast={(m) => addToast(m)}
                    />
                    <StrategistSidebar
                      clientCase={selectedAdvisorCase}
                      onUpdateCompliance={updateCompliance}
                      onUpdateNotes={(notes) => updateAdvisorCase({ advisorNotes: notes })}
                    />
                  </div>
                ) : (
                  <div className="card card-padded" style={{ textAlign: 'center', padding: 48 }}>
                    <h3 style={{ margin: '0 0 8px' }}>No Client Selected</h3>
                    <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
                      Wait for a client submission or load a sample case to preview the 1-click Carrier Data-Entry Sheet.
                    </p>
                    <button type="button" onClick={() => handleLoadSample('annuity')} className="btn btn-gold">
                      Load Sample Client Case
                    </button>
                  </div>
                ))}

              {advisorTab === 'edit-form' &&
                (selectedAdvisorCase ? (
                  renderWizard(selectedAdvisorCase, updateAdvisorCase, true)
                ) : (
                  <div className="card card-padded" style={{ textAlign: 'center', padding: 48 }}>
                    <button type="button" onClick={handleNewAdvisorCase} className="btn btn-primary">
                      Start New Client Application
                    </button>
                  </div>
                ))}

              {advisorTab === 'calculators' && (
                <CalculatorsView
                  activeCase={selectedAdvisorCase ?? clientDraft}
                  onApplyToCase={(patch, label) => {
                    if (selectedAdvisorCase) updateAdvisorCase(patch);
                    else updateClientDraft(patch);
                    addToast(label);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="app-footer no-print">
        <div className="container footer-inner">
          <div>
            <strong style={{ color: '#334155' }}>The FIN-Line Agency | GFI Advisory</strong> •
            Confidential Client Application Portal
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 600 }}>
              <Lock size={13} />
              <span>Secure Portal Connection</span>
            </span>
          </div>
        </div>
      </footer>

      <AdvisorLoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onUnlock={async () => {
          setLoginModalOpen(false);
          setIsAdvisor(true);
          setAdvisorTab('inbox');
          await refreshSubmissionsFromServer();
          addToast('Signed in to Advisor Back-Office');
        }}
      />

      <ConfirmModal
        open={deleteTargetId !== null}
        title="Delete Client Application?"
        description="This permanently removes the selected client application from the server database."
        confirmLabel="Yes, Delete"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
