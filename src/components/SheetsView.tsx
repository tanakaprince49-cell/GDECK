import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  Table,
  ChevronDown,
  Layers,
  Search,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { SheetMetadata, DriveFile } from '../types/workspace';
import {
  searchSpreadsheets,
  getSheetMetadata,
  getSheetValues,
  appendSheetRow,
  createDriveFile,
} from '../services/workspace';
import { X, FileSpreadsheet as SheetIcon } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { GoogleSheetsIcon } from './GoogleIcons';

interface SheetsViewProps {
  token: string;
  onBackToOverview?: () => void;
}

export const SheetsView: React.FC<SheetsViewProps> = ({ token, onBackToOverview }) => {
  const [spreadsheets, setSpreadsheets] = useState<DriveFile[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [customIdInput, setCustomIdInput] = useState<string>('');

  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<string>('');
  const [sheetValues, setSheetValues] = useState<string[][]>([]);
  const [loadingSheet, setLoadingSheet] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Append row state
  const [showAppendModal, setShowAppendModal] = useState<boolean>(false);
  const [newRowInput, setNewRowInput] = useState<string>('');
  const [isAppending, setIsAppending] = useState<boolean>(false);

  // New Sheet modal state
  const [showCreateSheetModal, setShowCreateSheetModal] = useState<boolean>(false);
  const [newSheetName, setNewSheetName] = useState<string>('');
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;
    setIsCreatingSheet(true);
    setError(null);
    try {
      const created = await createDriveFile(
        token,
        newSheetName.trim(),
        'application/vnd.google-apps.spreadsheet'
      );
      setSpreadsheets([created, ...spreadsheets]);
      setSelectedSpreadsheetId(created.id);
      setSuccessMsg(`Spreadsheet "${newSheetName}" created!`);
      setShowCreateSheetModal(false);
      setNewSheetName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create spreadsheet');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Load available spreadsheets from Drive
  const loadSpreadsheets = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const files = await searchSpreadsheets(token);
      setSpreadsheets(files);
      if (files.length > 0 && !selectedSpreadsheetId) {
        setSelectedSpreadsheetId(files[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list spreadsheets');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadSpreadsheets();
  }, [token]);

  // Load sheet metadata and values when spreadsheetId changes
  useEffect(() => {
    if (!selectedSpreadsheetId) return;

    const fetchSheetData = async () => {
      setLoadingSheet(true);
      setError(null);
      try {
        const meta = await getSheetMetadata(token, selectedSpreadsheetId);
        setMetadata(meta);
        const firstTabName = meta.sheets?.[0]?.properties?.title || 'Sheet1';
        setActiveSheetTab(firstTabName);

        // Fetch values
        const valRes = await getSheetValues(token, selectedSpreadsheetId, `${firstTabName}!A1:Z50`);
        setSheetValues(valRes.values || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load spreadsheet details');
        setMetadata(null);
        setSheetValues([]);
      } finally {
        setLoadingSheet(false);
      }
    };

    fetchSheetData();
  }, [selectedSpreadsheetId, token]);

  // Switch tab
  const handleTabChange = async (tabName: string) => {
    if (!selectedSpreadsheetId) return;
    setActiveSheetTab(tabName);
    setLoadingSheet(true);
    try {
      const valRes = await getSheetValues(token, selectedSpreadsheetId, `${tabName}!A1:Z50`);
      setSheetValues(valRes.values || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load sheet tab');
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleCustomIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let id = customIdInput.trim();
    // Extract ID if full URL passed: https://docs.google.com/spreadsheets/d/{ID}/edit
    const urlMatch = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      id = urlMatch[1];
    }
    if (id) {
      setSelectedSpreadsheetId(id);
    }
  };

  const handleAppendConfirm = async () => {
    if (!selectedSpreadsheetId || !activeSheetTab) return;
    setIsAppending(true);
    try {
      const rowData = newRowInput
        .split(',')
        .map((cell) => cell.trim());
      await appendSheetRow(token, selectedSpreadsheetId, `${activeSheetTab}!A1`, rowData);

      setSuccessMsg('Row appended successfully to sheet!');
      setShowAppendModal(false);
      setNewRowInput('');

      // Refresh sheet values
      const valRes = await getSheetValues(token, selectedSpreadsheetId, `${activeSheetTab}!A1:Z50`);
      setSheetValues(valRes.values || []);
    } catch (err: any) {
      setError(err.message || 'Failed to append row');
    } finally {
      setIsAppending(false);
    }
  };

  return (
    <div id="sheets-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="sheets-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-emerald-500/10 border border-emerald-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleSheetsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Sheets</h2>
            <p className="text-sm text-slate-500">Read, explore, and append spreadsheet data</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateSheetModal(true)}
            className="px-4 py-2.5 bg-[#0f9d58] hover:bg-[#0b8043] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Sheet</span>
          </button>
          {metadata && selectedSpreadsheetId && (
            <>
              <button
                id="append-row-open-btn"
                onClick={() => setShowAppendModal(true)}
                className="px-4 py-2.5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-emerald-400/40 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Append Row
              </button>
              <a
                href={`https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 text-slate-600 hover:text-emerald-700 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
                title="Open in Google Sheets"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          )}

          <button
            onClick={() => loadSpreadsheets()}
            disabled={loadingList}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Refresh spreadsheets"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/80 text-red-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50/80 backdrop-blur-md border border-emerald-200/80 text-emerald-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Spreadsheet selector bar */}
      <div className="bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select from your Drive spreadsheets:
            </label>
            <select
              id="spreadsheet-select"
              value={selectedSpreadsheetId}
              onChange={(e) => setSelectedSpreadsheetId(e.target.value)}
              className="w-full text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl px-3.5 py-2.5 text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {spreadsheets.length === 0 ? (
                <option value="">No spreadsheets found in Drive</option>
              ) : (
                spreadsheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id.slice(0, 8)}...)
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="sm:w-72">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Or paste Spreadsheet ID or URL:
            </label>
            <form onSubmit={handleCustomIdSubmit} className="flex gap-2">
              <input
                id="custom-spreadsheet-id-input"
                type="text"
                placeholder="ID or Docs link..."
                value={customIdInput}
                onChange={(e) => setCustomIdInput(e.target.value)}
                className="flex-1 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl px-3.5 py-2.5 text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Load
              </button>
            </form>
          </div>
        </div>

        {/* Tab switcher */}
        {metadata && metadata.sheets && metadata.sheets.length > 0 && (
          <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5" /> Sheet Tabs:
            </span>
            <div className="flex items-center gap-1.5">
              {metadata.sheets.map((s) => {
                const title = s.properties.title;
                const isActive = activeSheetTab === title;
                return (
                  <button
                    key={s.properties.sheetId}
                    id={`sheet-tab-${s.properties.sheetId}`}
                    onClick={() => handleTabChange(title)}
                    className={`px-3.5 py-1.5 text-xs rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-300/80 shadow-2xs'
                        : 'text-slate-600 hover:bg-white/80 border border-transparent'
                    }`}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sheet Grid Table */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] overflow-hidden">
        {loadingSheet ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
            <p className="text-sm font-medium">Loading cells from Google Sheets...</p>
          </div>
        ) : !selectedSpreadsheetId ? (
          <div className="p-12 text-center text-slate-400">
            <Table className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No spreadsheet selected</p>
            <p className="text-xs text-slate-400 mt-1">
              Choose a spreadsheet from the dropdown above or paste an ID
            </p>
          </div>
        ) : sheetValues.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Table className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Sheet tab is empty</p>
            <p className="text-xs text-slate-400 mt-1">
              No values found in range {activeSheetTab}!A1:Z50. Click "Append Row" to add data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-600 sticky top-0 z-10 border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center font-mono text-slate-400 border-r border-slate-200">
                    #
                  </th>
                  {sheetValues[0]?.map((_, colIdx) => (
                    <th
                      key={colIdx}
                      className="py-2.5 px-3 text-left font-mono font-medium tracking-wider border-r border-slate-200 last:border-r-0 min-w-[120px]"
                    >
                      {String.fromCharCode(65 + (colIdx % 26))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {sheetValues.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 bg-slate-50/50 border-r border-slate-200 select-none">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className={`py-2 px-3 border-r border-slate-100 last:border-r-0 truncate max-w-xs ${
                          rowIdx === 0 ? 'font-semibold text-slate-900 bg-slate-50/30' : 'text-slate-700'
                        }`}
                      >
                        {cell || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Append Row Confirmation Modal */}
      <ConfirmModal
        isOpen={showAppendModal}
        title="Append New Row to Sheet"
        description={`Enter comma-separated values to append to tab "${activeSheetTab}" in spreadsheet "${
          metadata?.properties?.title || selectedSpreadsheetId
        }". This operation will write data directly to Google Sheets.`}
        confirmLabel="Append Row to Sheet"
        isDestructive={false}
        isLoading={isAppending}
        itemsList={
          newRowInput
            ? newRowInput.split(',').map((c, i) => `Column ${String.fromCharCode(65 + i)}: ${c.trim()}`)
            : ['No cell values entered yet']
        }
        onConfirm={handleAppendConfirm}
        onCancel={() => {
          setShowAppendModal(false);
          setNewRowInput('');
        }}
      />

      {/* Input popup if modal is triggerable */}
      {showAppendModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4">
          <div className="w-full max-w-md bg-white p-4 rounded-xl border border-slate-300 shadow-xl pointer-events-auto mt-[-100px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comma-Separated Row Values:
            </label>
            <input
              id="sheet-append-input"
              type="text"
              placeholder="e.g. Sales, 4500, Approved, 2026-09-12"
              value={newRowInput}
              onChange={(e) => setNewRowInput(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Separate each column value with a comma.
            </p>
          </div>
        </div>
      )}
      {/* New Spreadsheet Creation Modal */}
      {showCreateSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateSheet}
            className="w-full max-w-sm bg-white rounded-3xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-3">
              <h3 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-2">
                <SheetIcon className="w-4 h-4 text-[#0f9d58]" /> Create New Spreadsheet
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateSheetModal(false)}
                className="text-[#5f6368] hover:text-[#1f1f1f] p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#444746] mb-1">
                Spreadsheet Title
              </label>
              <input
                type="text"
                placeholder="Untitled Spreadsheet"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                autoFocus
                className="w-full px-4 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#0f9d58] rounded-full focus:bg-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateSheetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-slate-100 rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newSheetName.trim() || isCreatingSheet}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0f9d58] hover:bg-[#0b8043] rounded-full disabled:opacity-50"
              >
                {isCreatingSheet ? 'Creating...' : 'Create Spreadsheet'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
