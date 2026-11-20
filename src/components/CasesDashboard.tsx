import React, { useMemo, useState } from 'react';
import {
  ClipboardList,
  Copy,
  Download,
  Edit3,
  FileDown,
  FilePlus2,
  Search,
  Trash2
} from 'lucide-react';
import type { CaseStatus, ClientCase } from '../types/portal';
import { evaluateIGO, fmtCurrency, parseNum } from '../utils/calculations';

interface CasesDashboardProps {
  cases: ClientCase[];
  activeCaseId: string;
  onOpenCarrierSheet: (id: string) => void;
  onEditCase: (id: string) => void;
  onNewCase: () => void;
  onDuplicateCase: (id: string) => void;
  onDeleteCase: (id: string) => void;
  onChangeStatus: (id: string, status: CaseStatus) => void;
  onDownloadPDF: (c: ClientCase) => void;
  onExportAllCSV: () => void;
}

const STATUS_BADGE: Record<CaseStatus, string> = {
  Draft: 'badge-slate',
  'In Review': 'badge-gold',
  'IGO Ready': 'badge-emerald',
  Submitted: 'badge-navy'
};

export const CasesDashboard: React.FC<CasesDashboardProps> = ({
  cases,
  activeCaseId,
  onOpenCarrierSheet,
  onEditCase,
  onNewCase,
  onDuplicateCase,
  onDeleteCase,
  onChangeStatus,
  onDownloadPDF,
  onExportAllCSV
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [trackFilter, setTrackFilter] = useState<string>('All');

  const stats = useMemo(() => {
    const totalPremium = cases.reduce((sum, c) => sum + parseNum(c.estimatedPremium), 0);
    const igoScores = cases.map((c) => evaluateIGO(c).scorePct);
    const avgScore = igoScores.length
      ? Math.round(igoScores.reduce((a, b) => a + b, 0) / igoScores.length)
      : 0;
    const readyCount = cases.filter(
      (c) => c.status === 'IGO Ready' || c.status === 'Submitted' || evaluateIGO(c).failCount === 0
    ).length;

    return { totalPremium, avgScore, readyCount };
  }, [cases]);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (trackFilter !== 'All' && c.track !== trackFilter) return false;
      if (!q) return true;
      return (
        c.ownerName.toLowerCase().includes(q) ||
        c.targetProduct.toLowerCase().includes(q) ||
        c.ownerState.toLowerCase().includes(q) ||
        c.taxQualification.toLowerCase().includes(q)
      );
    });
  }, [cases, search, statusFilter, trackFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Top Action Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14
        }}
      >
        <div>
          <span className="kicker-label" style={{ marginBottom: 3, color: '#b45309' }}>
            Advisor Back-Office • Client Submissions Inbox
          </span>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
            Submitted Client Applications
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Click <strong>Carrier Entry Sheet</strong> on any client to copy their info field-by-field into any carrier portal.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={onExportAllCSV} className="btn btn-secondary">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={onNewCase} className="btn btn-primary btn-lg">
            <FilePlus2 size={16} color="#fbbf24" />
            <span>New Client Form</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-4">
        <div className="kpi-card">
          <span className="kpi-label">Saved Applications</span>
          <span className="kpi-value">{cases.length}</span>
          <span className="kpi-sub">Client submissions in vault</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Proposed Premium</span>
          <span className="kpi-value">{fmtCurrency(stats.totalPremium)}</span>
          <span className="kpi-sub">Rollovers &amp; planned annuals</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">IGO-Ready / Entered</span>
          <span className="kpi-value" style={{ color: '#047857' }}>
            {stats.readyCount} / {cases.length}
          </span>
          <span className="kpi-sub">Zero hard IGO errors</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Avg. IGO Score</span>
          <span className="kpi-value" style={{ color: '#b45309' }}>
            {stats.avgScore}%
          </span>
          <span className="kpi-sub">Form 2000 &amp; 4106 checks</span>
        </div>
      </div>

      {/* Filter Bar + Cases Table */}
      <div className="card">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#f8fafc'
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <Search
              size={15}
              color="#64748b"
              style={{ position: 'absolute', left: 11, top: 11 }}
            />
            <input
              className="input"
              style={{ paddingLeft: 34 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client name, product, state..."
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <select
              className="select"
              style={{ width: 'auto', fontSize: 12.5, fontWeight: 600 }}
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
            >
              <option value="All">All Tracks</option>
              <option value="annuity">Annuity &amp; Rollover</option>
              <option value="life">Life / IUL / FE</option>
            </select>

            <select
              className="select"
              style={{ width: 'auto', fontSize: 12.5, fontWeight: 600 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="IGO Ready">IGO Ready</option>
              <option value="Submitted">Entered in Carrier</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client / Owner</th>
                <th>Track &amp; Target Series</th>
                <th>Proposed Deposit</th>
                <th>IGO Score</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 36, color: '#64748b' }}>
                    No client submissions yet. When a client submits their application, it will appear here — or load a sample from the top menu.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const igo = evaluateIGO(c);
                  const isActive = c.id === activeCaseId;
                  return (
                    <tr key={c.id} style={{ background: isActive ? '#fffbeb' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span>{c.ownerName.trim() || 'Untitled Client'}</span>
                          {isActive && <span className="badge badge-gold">Selected</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>
                          {c.ownerState} {igo.ownerAge !== null ? `• Age ${igo.ownerAge}` : ''} •{' '}
                          {c.taxQualification}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 12.5 }}>
                          {c.targetProduct}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>
                          {c.track === 'annuity' ? 'Annuity / FIA' : 'Life / IUL / FE'}
                          {c.dualReview ? ' + Dual Review' : ''}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {fmtCurrency(c.estimatedPremium)}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {c.fundingMethod.split(' ')[0]}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 58 }} className="progress-track">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${igo.scorePct}%`,
                                background:
                                  igo.failCount > 0
                                    ? '#f43f5e'
                                    : igo.scorePct === 100
                                      ? '#10b981'
                                      : '#f59e0b'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                            {igo.scorePct}%
                          </span>
                        </div>
                      </td>

                      <td>
                        <select
                          className={`badge ${STATUS_BADGE[c.status]}`}
                          style={{ border: 'none', cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit' }}
                          value={c.status}
                          onChange={(e) => onChangeStatus(c.id, e.target.value as CaseStatus)}
                        >
                          <option value="Draft">Draft</option>
                          <option value="In Review">In Review</option>
                          <option value="IGO Ready">IGO Ready</option>
                          <option value="Submitted">Entered in Carrier</option>
                        </select>
                      </td>

                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => onOpenCarrierSheet(c.id)}
                            className="btn btn-sm btn-primary"
                            title="Open 1-Click Carrier Entry Sheet"
                          >
                            <ClipboardList size={13} color="#fbbf24" />
                            <span>Carrier Sheet</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditCase(c.id)}
                            className="btn btn-sm btn-secondary"
                            title="Edit Application"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadPDF(c)}
                            className="btn btn-sm btn-secondary"
                            title="Download Executive PDF"
                          >
                            <FileDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateCase(c.id)}
                            className="btn btn-sm btn-secondary"
                            title="Duplicate Case"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCase(c.id)}
                            className="btn btn-sm btn-danger-ghost"
                            title="Delete Case"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
