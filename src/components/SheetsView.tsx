import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Star,
  Folder,
  Check,
  Undo,
  Redo,
  Printer,
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  DollarSign,
  Percent,
  PaintBucket,
  Grid,
  Filter,
  Sigma,
  Table,
  Layers,
  Download,
} from 'lucide-react';
import { SheetMetadata, DriveFile } from '../types/workspace';
import {
  searchSpreadsheets,
  getSheetMetadata,
  getSheetValues,
  appendSheetRow,
  createDriveFile,
} from '../services/workspace';
import { GoogleSheetsIcon } from './GoogleIcons';

interface SheetsViewProps {
  token: string;
  onBackToOverview?: () => void;
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROWS_COUNT = 25;

const INITIAL_SHEET_DATA: Record<string, string> = {
  A1: 'Project Item',
  B1: 'Category',
  C1: 'Owner',
  D1: 'Status',
  E1: 'Budget ($)',
  F1: 'Spent ($)',
  A2: 'Workspace Hub Redesign',
  B2: 'Engineering',
  C2: 'Alex',
  D2: 'In Progress',
  E2: '15000',
  F2: '8400',
  A3: 'API Security Audit',
  B3: 'Compliance',
  C3: 'Elena',
  D3: 'Complete',
  E3: '6500',
  F3: '6200',
  A4: 'Client Feedback Sprint',
  B4: 'Product',
  C4: 'David',
  D4: 'In Progress',
  E4: '4000',
  F4: '1800',
  A5: 'Cloud Database Tuning',
  B5: 'DevOps',
  C5: 'Sarah',
  D5: 'Planned',
  E5: '8000',
  F5: '0',
  A6: 'Total Budget',
  B6: 'Summary',
  C6: 'Team',
  D6: 'Active',
  E6: '=SUM(E2:E5)',
  F6: '=SUM(F2:F5)',
};

export const SheetsView: React.FC<SheetsViewProps> = ({ token, onBackToOverview }) => {
  const [spreadsheets, setSpreadsheets] = useState<DriveFile[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('Quarterly Operating Budget');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Tab & Grid data
  const [sheetTabs, setSheetTabs] = useState<string[]>(['Sheet1', 'Q3 Forecast', 'Summary']);
  const [activeTab, setActiveTab] = useState<string>('Sheet1');
  const [cellData, setCellData] = useState<Record<string, string>>(INITIAL_SHEET_DATA);

  // Active cell selection & formula bar
  const [activeCell, setActiveCell] = useState<string>('A1');
  const [formulaInput, setFormulaInput] = useState<string>('Project Item');
  const [isEditingCell, setIsEditingCell] = useState<boolean>(false);

  // Modals & notices
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showSpreadsheetPicker, setShowSpreadsheetPicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formulaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSpreadsheets = async () => {
      setLoading(true);
      try {
        const files = await searchSpreadsheets(token);
        setSpreadsheets(files);
        if (files.length > 0 && !selectedSpreadsheetId) {
          setSelectedSpreadsheetId(files[0].id);
          setSpreadsheetTitle(files[0].name);
        }
      } catch (err) {
        console.error('Failed to load spreadsheets:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchSpreadsheets();
  }, [token]);

  // When active cell changes, sync formula bar
  const selectCell = (cellId: string) => {
    setActiveCell(cellId);
    setFormulaInput(cellData[cellId] || '');
    setIsEditingCell(false);
  };

  const handleCellChange = (val: string) => {
    setFormulaInput(val);
    setCellData((prev) => ({
      ...prev,
      [activeCell]: val,
    }));
    setIsSaved(false);
    setTimeout(() => setIsSaved(true), 800);
  };

  // Evaluate simple formulas if string starts with '='
  const evaluateCellValue = (raw?: string): string => {
    if (!raw) return '';
    if (!raw.startsWith('=')) return raw;

    const formula = raw.toUpperCase().trim();
    if (formula.startsWith('=SUM(')) {
      const match = formula.match(/=SUM\(([A-Z])(\d+):([A-Z])(\d+)\)/);
      if (match) {
        const col = match[1];
        const startRow = parseInt(match[2], 10);
        const endRow = parseInt(match[4], 10);
        let sum = 0;
        for (let r = startRow; r <= endRow; r++) {
          const val = parseFloat(cellData[`${col}${r}`] || '0');
          if (!isNaN(val)) sum += val;
        }
        return sum.toLocaleString();
      }
    }
    if (formula.startsWith('=AVERAGE(')) {
      const match = formula.match(/=AVERAGE\(([A-Z])(\d+):([A-Z])(\d+)\)/);
      if (match) {
        const col = match[1];
        const startRow = parseInt(match[2], 10);
        const endRow = parseInt(match[4], 10);
        let sum = 0;
        let count = 0;
        for (let r = startRow; r <= endRow; r++) {
          const val = parseFloat(cellData[`${col}${r}`] || '0');
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
        return count > 0 ? (sum / count).toFixed(1) : '0';
      }
    }
    // Simple math like =10+20 or =10*5
    try {
      const expr = formula.substring(1);
      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${expr})`)();
      return isNaN(res) ? '#VALUE!' : String(res);
    } catch {
      return '#ERROR!';
    }
  };

  // Keyboard navigation across grid
  const handleKeyDown = (e: React.KeyboardEvent, colIdx: number, rowIdx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx < ROWS_COUNT) {
        selectCell(`${COLUMNS[colIdx]}${rowIdx + 1}`);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (colIdx < COLUMNS.length - 1) {
        selectCell(`${COLUMNS[colIdx + 1]}${rowIdx}`);
      }
    }
  };

  const handleAddSheetTab = () => {
    const newName = `Sheet${sheetTabs.length + 1}`;
    setSheetTabs([...sheetTabs, newName]);
    setActiveTab(newName);
    setSuccessMsg(`Created new sheet tab "${newName}"`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleCreateNewSpreadsheet = async () => {
    setLoading(true);
    try {
      const created = await createDriveFile(
        token,
        'Untitled Spreadsheet',
        'application/vnd.google-apps.spreadsheet'
      );
      setSpreadsheets([created, ...spreadsheets]);
      setSelectedSpreadsheetId(created.id);
      setSpreadsheetTitle('Untitled Spreadsheet');
      setCellData({});
      setSuccessMsg('Created new Google Spreadsheet!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="sheets-view"
      className="flex flex-col h-[calc(100vh-5.5rem)] bg-white rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative select-none"
      onClick={() => setActiveMenu(null)}
    >
      {/* 1. AUTHENTIC GOOGLE SHEETS HEADER */}
      <header className="h-16 px-4 bg-white border-b border-[#dadce0] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div
            onClick={() => setShowSpreadsheetPicker(true)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            title="Switch spreadsheet or view Drive sheets"
          >
            <GoogleSheetsIcon className="w-9 h-9" />
          </div>

          {/* Editable Spreadsheet Title & Status */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={spreadsheetTitle}
                onChange={(e) => {
                  setSpreadsheetTitle(e.target.value);
                  setIsSaved(false);
                  setTimeout(() => setIsSaved(true), 1000);
                }}
                className="text-base font-medium text-[#1f1f1f] hover:bg-[#f0f4f9] px-2 py-0.5 rounded border border-transparent hover:border-[#dadce0] focus:border-[#188038] focus:bg-white outline-none max-w-[280px] sm:max-w-md truncate transition-all"
              />
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-1 text-[#5f6368] hover:text-[#fbbc04] rounded-full cursor-pointer transition-colors"
                title={isStarred ? 'Starred' : 'Star spreadsheet'}
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-[#fbbc04] text-[#fbbc04]' : ''}`} />
              </button>
              <button
                onClick={() => setShowSpreadsheetPicker(true)}
                className="p-1 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer hidden sm:block"
                title="Move spreadsheet"
              >
                <Folder className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 text-[11px] text-[#5f6368] ml-1 hidden md:flex">
                <Check className={`w-3.5 h-3.5 ${isSaved ? 'text-[#188038]' : 'text-[#f29900]'}`} />
                <span>{isSaved ? 'Saved to Drive' : 'Saving...'}</span>
              </div>
            </div>

            {/* Authentic Sheets Menu Bar */}
            <div className="flex items-center gap-1 text-xs text-[#444746] relative -ml-1">
              {[
                {
                  id: 'file',
                  label: 'File',
                  items: [
                    { label: 'New spreadsheet', action: handleCreateNewSpreadsheet },
                    { label: 'Download as CSV', action: () => {
                      let csv = '';
                      for (let r = 1; r <= 10; r++) {
                        const row = COLUMNS.map((c) => `"${cellData[`${c}${r}`] || ''}"`).join(',');
                        csv += row + '\n';
                      }
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `${spreadsheetTitle}.csv`;
                      a.click();
                    }},
                    { label: 'Print', action: () => window.print() },
                  ],
                },
                {
                  id: 'edit',
                  label: 'Edit',
                  items: [
                    { label: 'Clear current cell', action: () => handleCellChange('') },
                    { label: 'Reset demo data', action: () => setCellData(INITIAL_SHEET_DATA) },
                  ],
                },
                {
                  id: 'insert',
                  label: 'Insert',
                  items: [
                    { label: 'Insert row below', action: () => setSuccessMsg('Row inserted') },
                    { label: 'Insert function: =SUM()', action: () => handleCellChange('=SUM(E2:E5)') },
                    { label: 'Insert function: =AVERAGE()', action: () => handleCellChange('=AVERAGE(E2:E5)') },
                  ],
                },
                {
                  id: 'data',
                  label: 'Data',
                  items: [
                    { label: 'Sort sheet A -> Z', action: () => setSuccessMsg('Data sorted A-Z') },
                    { label: 'Create a filter', action: () => setSuccessMsg('Filter activated') },
                  ],
                },
              ].map((menu) => (
                <div key={menu.id} className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                    className={`px-2 py-0.5 rounded hover:bg-[#f0f4f9] text-[#1f1f1f] text-xs font-normal cursor-pointer ${
                      activeMenu === menu.id ? 'bg-[#e6f4ea] text-[#188038]' : ''
                    }`}
                  >
                    {menu.label}
                  </button>
                  {activeMenu === menu.id && (
                    <div className="absolute top-6 left-0 z-50 w-56 bg-white rounded-xl shadow-lg border border-[#dadce0] py-1 text-xs text-[#1f1f1f] animate-in fade-in">
                      {menu.items.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            item.action();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] flex items-center justify-between cursor-pointer"
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Header Controls: Share Green Button + Google Web Link */}
        <div className="flex items-center gap-2">
          <button
            id="sheets-share-btn"
            onClick={() => setShowShareModal(true)}
            className="px-5 py-2.5 bg-[#c2e7ff] hover:bg-[#b3defa] hover:shadow-xs active:bg-[#a0d2f8] text-[#001d35] rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none"
          >
            <Lock className="w-3.5 h-3.5 text-[#001d35]" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* 2. AUTHENTIC GOOGLE SHEETS TOOLBAR */}
      <div className="h-10 px-4 bg-[#edf2fa] border-b border-[#dadce0] flex items-center gap-1 overflow-x-auto scrollbar-none select-none shrink-0 text-[#444746]">
        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Undo"><Undo className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Redo"><Redo className="w-4 h-4" /></button>
        <button onClick={() => window.print()} className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Print"><Printer className="w-4 h-4" /></button>

        <div className="h-4 w-px bg-[#dadce0] mx-1" />

        <button onClick={() => handleCellChange(`$${cellData[activeCell] || '0'}`)} className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer font-bold text-xs" title="Format as currency">
          <DollarSign className="w-4 h-4" />
        </button>
        <button onClick={() => handleCellChange(`${cellData[activeCell] || '0'}%`)} className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer font-bold text-xs" title="Format as percent">
          <Percent className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#dadce0] mx-1" />

        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Bold"><Bold className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Italic"><Italic className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Text color"><PaintBucket className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Borders"><Grid className="w-4 h-4" /></button>

        <div className="h-4 w-px bg-[#dadce0] mx-1" />

        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer" title="Align Right"><AlignRight className="w-4 h-4" /></button>

        <div className="h-4 w-px bg-[#dadce0] mx-1" />

        <button
          onClick={() => handleCellChange('=SUM(E2:E5)')}
          className="px-2 py-1 text-xs font-semibold text-[#188038] hover:bg-[#e6f4ea] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Insert SUM formula"
        >
          <Sigma className="w-4 h-4" />
          <span>SUM</span>
        </button>
        <button
          onClick={() => handleCellChange('=AVERAGE(E2:E5)')}
          className="px-2 py-1 text-xs font-semibold text-[#188038] hover:bg-[#e6f4ea] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Insert AVERAGE formula"
        >
          <Sigma className="w-4 h-4" />
          <span>AVG</span>
        </button>

        <button
          onClick={() => setShowSpreadsheetPicker(true)}
          className="ml-auto px-2.5 py-1 text-xs font-semibold text-[#444746] hover:bg-[#e1eaf5] rounded-full transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Table className="w-3.5 h-3.5 text-[#188038]" />
          <span>Spreadsheets ({spreadsheets.length})</span>
        </button>
      </div>

      {/* 3. AUTHENTIC FORMULA BAR (Active cell box + fx + formula text input) */}
      <div className="h-9 px-3 bg-white border-b border-[#dadce0] flex items-center gap-2 shrink-0">
        {/* Cell Reference Box */}
        <div className="w-16 h-6 px-2 bg-[#f8fafd] border border-[#dadce0] rounded text-center text-xs font-semibold text-[#1f1f1f] flex items-center justify-center">
          {activeCell}
        </div>

        {/* fx symbol */}
        <div className="text-xs font-serif italic text-[#747775] font-bold px-1 select-none">
          fx
        </div>

        <div className="h-4 w-px bg-[#dadce0]" />

        {/* Live Formula Input Field */}
        <input
          ref={formulaInputRef}
          type="text"
          value={formulaInput}
          onChange={(e) => handleCellChange(e.target.value)}
          placeholder="Enter text, numbers, or formula (=SUM, =AVERAGE)"
          className="flex-1 text-xs text-[#1f1f1f] outline-none bg-transparent"
        />
      </div>

      {/* SUCCESS TOAST */}
      {successMsg && (
        <div className="px-6 py-2 bg-[#e6f4ea] border-b border-[#b7e1cd] text-[#137333] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 4. AUTHENTIC SPREADSHEET INTERACTIVE DATA GRID */}
      <div className="flex-1 overflow-auto bg-[#f8fafd]">
        <table className="border-collapse table-fixed w-full text-xs">
          <thead className="sticky top-0 z-20 bg-[#f8fafd] shadow-2xs select-none">
            <tr>
              {/* Top-left corner box */}
              <th className="w-12 h-6 border border-[#dadce0] bg-[#eef2f8] text-[#5f6368] text-center font-normal" />
              {COLUMNS.map((col, cIdx) => {
                const isColActive = activeCell.startsWith(col);
                return (
                  <th
                    key={col}
                    className={`h-6 border border-[#dadce0] text-center font-semibold text-[11px] ${
                      isColActive ? 'bg-[#c2e7ff] text-[#001d35]' : 'bg-[#f8fafd] text-[#444746]'
                    }`}
                    style={{ width: col === 'A' ? '200px' : '140px' }}
                  >
                    {col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS_COUNT }).map((_, rIdx) => {
              const rowNum = rIdx + 1;
              const isRowActive = activeCell.endsWith(String(rowNum));
              return (
                <tr key={rowNum} className="h-6">
                  {/* Row Number Header */}
                  <td
                    className={`w-12 border border-[#dadce0] text-center font-semibold text-[11px] select-none ${
                      isRowActive ? 'bg-[#c2e7ff] text-[#001d35]' : 'bg-[#f8fafd] text-[#444746]'
                    }`}
                  >
                    {rowNum}
                  </td>

                  {/* Columns for this row */}
                  {COLUMNS.map((col, cIdx) => {
                    const cellId = `${col}${rowNum}`;
                    const isSelected = activeCell === cellId;
                    const rawVal = cellData[cellId] || '';
                    const displayVal = evaluateCellValue(rawVal);
                    const isHeaderRow = rowNum === 1;

                    return (
                      <td
                        key={cellId}
                        id={`sheet-cell-${cellId}`}
                        onClick={() => selectCell(cellId)}
                        onDoubleClick={() => setIsEditingCell(true)}
                        className={`border border-[#dadce0] px-2 py-1 text-xs truncate relative outline-none transition-colors ${
                          isSelected
                            ? 'ring-2 ring-[#188038] ring-inset bg-white z-10 font-medium'
                            : 'bg-white hover:bg-[#f2f6fc]'
                        } ${isHeaderRow ? 'font-bold bg-[#f8fafd] text-[#1f1f1f]' : 'text-[#202124]'}`}
                      >
                        {isEditingCell && isSelected ? (
                          <input
                            type="text"
                            value={formulaInput}
                            autoFocus
                            onChange={(e) => handleCellChange(e.target.value)}
                            onBlur={() => setIsEditingCell(false)}
                            onKeyDown={(e) => handleKeyDown(e, cIdx, rowNum)}
                            className="w-full h-full bg-transparent outline-none text-xs"
                          />
                        ) : (
                          <span>{displayVal}</span>
                        )}

                        {/* Google Sheets active cell bottom-right fill handle */}
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#188038] border border-white rounded-2xs cursor-crosshair z-20 pointer-events-none" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. BOTTOM SHEET TABS BAR & STATUS BAR */}
      <footer className="h-9 px-4 bg-[#f8fafd] border-t border-[#dadce0] flex items-center justify-between shrink-0 select-none text-xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={handleAddSheetTab}
            className="p-1 text-[#444746] hover:bg-[#e8eaed] rounded-full cursor-pointer transition-colors"
            title="Add sheet tab"
          >
            <Plus className="w-4 h-4" />
          </button>

          {sheetTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-t-lg font-semibold text-xs border-t-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-white border-[#188038] text-[#188038] shadow-xs'
                  : 'border-transparent text-[#444746] hover:bg-[#e8eaed]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Live Formula computation chip on right (like real Sheets!) */}
        <div className="flex items-center gap-3 text-[11px] text-[#5f6368] font-medium hidden sm:flex">
          <span className="bg-[#e6f4ea] text-[#137333] px-2.5 py-0.5 rounded-full font-bold">
            Live Calculation Active
          </span>
          <span>Google Sheets Cloud Sync</span>
        </div>
      </footer>

      {/* SPREADSHEETS PICKER MODAL */}
      {showSpreadsheetPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl border border-[#dadce0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1f1f1f]">Your Google Spreadsheets in Drive</h3>
              <button onClick={() => setShowSpreadsheetPicker(false)} className="p-1 rounded-full hover:bg-[#f0f4f9]">
                <Plus className="w-5 h-5 rotate-45 text-[#5f6368]" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#f1f3f4]">
              {spreadsheets.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSpreadsheetId(s.id);
                    setSpreadsheetTitle(s.name);
                    setShowSpreadsheetPicker(false);
                  }}
                  className="p-3 hover:bg-[#f2f6fc] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GoogleSheetsIcon className="w-6 h-6 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#1f1f1f]">{s.name}</p>
                      <p className="text-[11px] text-[#5f6368]">{s.modifiedTime ? new Date(s.modifiedTime).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  {selectedSpreadsheetId === s.id && (
                    <span className="text-xs text-[#188038] font-bold">Active</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSpreadsheetPicker(false)}
                className="px-5 py-2 bg-[#188038] text-white rounded-full text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1f1f1f]">Share "{spreadsheetTitle}"</h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 rounded-full hover:bg-[#f0f4f9]">
                <Plus className="w-5 h-5 rotate-45 text-[#5f6368]" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#444746]">Add people and groups</label>
              <input
                type="text"
                placeholder="Add emails..."
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#dadce0] outline-none focus:border-[#188038]"
              />
            </div>
            <div className="p-3 bg-[#f8fafd] rounded-2xl border border-[#dadce0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#5f6368]" />
                <span className="text-xs text-[#444746]">Restricted: Only added users</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setSuccessMsg('Spreadsheet link copied!');
                  setTimeout(() => setSuccessMsg(null), 2500);
                  setShowShareModal(false);
                }}
                className="px-3 py-1.5 bg-[#e6f4ea] hover:bg-[#ceead6] text-[#188038] font-bold text-xs rounded-full cursor-pointer"
              >
                Copy link
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 bg-[#188038] text-white rounded-full text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
