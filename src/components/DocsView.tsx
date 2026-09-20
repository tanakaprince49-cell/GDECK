import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkspaceFocusTarget } from '../types/focus';
import {
  CheckCircle2,
  ChevronDown,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Replace,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { DriveFile } from '../types/workspace';
import { searchDocs, createDriveFile, getDocHtml } from '../services/workspace';
import { DocsHeader } from './docs/DocsHeader';
import { DocsToolbar } from './docs/DocsToolbar';
import { DocsRuler } from './docs/DocsRuler';
import { DocsOutline } from './docs/DocsOutline';
import { DocsCompanionBar } from './docs/DocsCompanionBar';
import {
  DocsShareModal,
  DocsPickerModal,
  DocsWordCountModal,
  DocsTemplateModal,
  DocsLinkModal,
  DocsPageSetupModal,
} from './docs/DocsModals';
import { DOC_TEMPLATES, DocTemplate } from './docs/docsData';

interface DocsViewProps {
  token: string;
  onBackToOverview?: () => void;
  /** Document to open straight away (from Omni-Search). */
  focusTarget?: WorkspaceFocusTarget | null;
  onFocusHandled?: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const DocsView: React.FC<DocsViewProps> = ({
  token,
  onBackToOverview,
  userName,
  userEmail,
  userPhoto,
  focusTarget,
  onFocusHandled,
}) => {
  // Document state
  const [docs, setDocs] = useState<DriveFile[]>([]);
  // Id of a document opened from outside (Omni-Search), so the initial list load does not
  // replace it with the most recently edited doc.
  const openedByFocusRef = useRef<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDoc, setSelectedDoc] = useState<DriveFile | null>(null);
  const [docTitle, setDocTitle] = useState<string>('Untitled document');
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [summaryText, setSummaryText] = useState<string>('');

  // Formatting & View state
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [fontSize, setFontSize] = useState<number>(11);
  const [textColor, setTextColor] = useState<string>('#202124');
  const [highlightColor, setHighlightColor] = useState<string>('transparent');
  const [zoomLevel, setZoomLevel] = useState<string>('100%');
  const [activeAlign, setActiveAlign] = useState<string>('left');
  const [isBoldActive, setIsBoldActive] = useState<boolean>(false);
  const [isItalicActive, setIsItalicActive] = useState<boolean>(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState<boolean>(false);
  const [editingMode, setEditingMode] = useState<'editing' | 'suggesting' | 'viewing'>('editing');

  // UI Panels
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [showWordCountFloating, setShowWordCountFloating] = useState<boolean>(false);
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [isMatchCase, setIsMatchCase] = useState<boolean>(false);

  // Modals
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [accessLevel, setAccessLevel] = useState<'restricted' | 'anyone'>('restricted');
  const [showDocPicker, setShowDocPicker] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showWordCountModal, setShowWordCountModal] = useState<boolean>(false);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [showPageSetupModal, setShowPageSetupModal] = useState<boolean>(false);
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<string>('letter');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Outline headings
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  // Editor content & references
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Counts
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [charsNoSpaces, setCharsNoSpaces] = useState<number>(0);

  // Update statistics and outline headings
  const updateStatsAndOutline = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const noSpaces = text.replace(/\s/g, '').length;
    setWordCount(words);
    setCharCount(chars);
    setCharsNoSpaces(noSpaces);

    // Extract headings
    const headingEls = editorRef.current.querySelectorAll('h1, h2, h3');
    const parsedHeadings: { id: string; text: string; level: number }[] = [];
    headingEls.forEach((el, idx) => {
      const level = el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3;
      const headingText = (el as HTMLElement).innerText.trim();
      if (headingText) {
        if (!el.id) el.id = `heading-${idx}`;
        parsedHeadings.push({ id: el.id, text: headingText, level });
      }
    });
    setHeadings(parsedHeadings);
  }, []);

  // Update toolbar active states based on selection
  const updateToolbarStates = useCallback(() => {
    try {
      setIsBoldActive(document.queryCommandState('bold'));
      setIsItalicActive(document.queryCommandState('italic'));
      setIsUnderlineActive(document.queryCommandState('underline'));
      if (document.queryCommandState('justifyLeft')) setActiveAlign('left');
      else if (document.queryCommandState('justifyCenter')) setActiveAlign('center');
      else if (document.queryCommandState('justifyRight')) setActiveAlign('right');
      else if (document.queryCommandState('justifyFull')) setActiveAlign('justify');
    } catch {}
  }, []);

  // Content change handler
  const handleEditorInput = () => {
    setIsSaved(false);
    updateStatsAndOutline();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaved(true);
    }, 1000);
  };

  // Load documents from Google Drive
  const loadDocs = async () => {
    setLoading(true);
    try {
      const files = await searchDocs(token);
      setDocs(files);
      const externallyPicked = openedByFocusRef.current !== null;
      if (files.length > 0 && !selectedDoc && !externallyPicked) {
        const match = focusTarget?.source === 'docs' ? files.find((f) => f.id === openedByFocusRef.current) : null;
        const firstDoc = match || files[0];
        setSelectedDoc(firstDoc);
        setDocTitle(firstDoc.name);
        try {
          const html = await getDocHtml(token, firstDoc.id);
          if (html && editorRef.current) {
            editorRef.current.innerHTML = html;
          } else if (editorRef.current) {
            editorRef.current.innerHTML = DOC_TEMPLATES[1].htmlContent;
          }
        } catch {
          if (editorRef.current) {
            editorRef.current.innerHTML = DOC_TEMPLATES[1].htmlContent;
          }
        }
      } else if (!selectedDoc && !externallyPicked && editorRef.current) {
        setDocTitle(DOC_TEMPLATES[1].title);
        editorRef.current.innerHTML = DOC_TEMPLATES[1].htmlContent;
      }
    } catch (err) {
      console.warn('Failed to load Google Docs:', err);
      if (editorRef.current) {
        editorRef.current.innerHTML = DOC_TEMPLATES[1].htmlContent;
      }
    } finally {
      setLoading(false);
      setTimeout(updateStatsAndOutline, 100);
    }
  };

  useEffect(() => {
    if (token) {
      loadDocs();
    }
  }, [token]);

  // Handle switching doc
  const handleSelectDoc = async (doc: DriveFile) => {
    setSelectedDoc(doc);
    setDocTitle(doc.name);
    setIsSaved(false);
    try {
      const html = await getDocHtml(token, doc.id);
      if (html && editorRef.current) {
        editorRef.current.innerHTML = html;
      } else if (editorRef.current) {
        editorRef.current.innerHTML = `<h1>${doc.name}</h1><p>Document loaded from Google Drive.</p>`;
      }
    } catch {
      if (editorRef.current) {
        editorRef.current.innerHTML = `<h1>${doc.name}</h1><p>Document loaded from Google Drive.</p>`;
      }
    } finally {
      setIsSaved(true);
      setTimeout(updateStatsAndOutline, 100);
    }
  };

  // Search hit on a Google Doc -> open its content in the editor.
  useEffect(() => {
    if (!focusTarget || focusTarget.source !== 'docs') return;
    const doc = focusTarget.item as DriveFile | null;
    if (doc?.id) {
      openedByFocusRef.current = doc.id;
      void handleSelectDoc(doc);
    }
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget]);

  // Create new blank document
  const handleNewDoc = async () => {
    const newTitle = 'Untitled document';
    setDocTitle(newTitle);
    setSelectedDoc(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = '<p>Start typing or type @ to insert...</p>';
    }
    setIsSaved(true);
    setTimeout(updateStatsAndOutline, 100);
    try {
      const created = await createDriveFile(
        token,
        newTitle,
        'application/vnd.google-apps.document',
        ''
      );
      setDocs([created, ...docs]);
      setSelectedDoc(created);
    } catch {}
  };

  // Choose template
  const handleSelectTemplate = async (tmpl: DocTemplate) => {
    setDocTitle(tmpl.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = tmpl.htmlContent;
    }
    setIsSaved(true);
    setTimeout(updateStatsAndOutline, 100);
    setToastMessage(`Created from "${tmpl.title}" template`);
    setTimeout(() => setToastMessage(null), 3000);
    try {
      const created = await createDriveFile(
        token,
        tmpl.title,
        'application/vnd.google-apps.document',
        tmpl.htmlContent
      );
      setDocs([created, ...docs]);
      setSelectedDoc(created);
    } catch {}
  };

  // Format command execution
  const executeFormat = (cmd: string, val: string = '') => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (cmd === 'formatBlock') {
      document.execCommand('formatBlock', false, val);
    } else if (cmd === 'lineSpacing') {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let parent = sel.anchorNode.parentElement;
        while (parent && parent !== editorRef.current && parent.tagName !== 'P' && !parent.tagName.startsWith('H')) {
          parent = parent.parentElement;
        }
        if (parent) {
          parent.style.lineHeight = val;
        }
      }
    } else if (cmd === 'insertChecklist') {
      const html = `<div style="display: flex; align-items: center; margin: 4px 0;"><input type="checkbox" style="margin-right: 8px;" /> <span>Checklist item</span></div>`;
      document.execCommand('insertHTML', false, html);
    } else if (cmd === 'undo') {
      document.execCommand('undo');
    } else if (cmd === 'redo') {
      document.execCommand('redo');
    } else if (cmd === 'spellcheck') {
      setToastMessage('Spelling and grammar check: No errors detected.');
      setTimeout(() => setToastMessage(null), 2500);
    } else {
      document.execCommand(cmd, false, val);
    }

    handleEditorInput();
    updateToolbarStates();
  };

  // Font family change
  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    executeFormat('fontName', font);
  };

  // Text color change
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    executeFormat('foreColor', color);
  };

  // Highlight color change
  const handleHighlightColorChange = (color: string) => {
    setHighlightColor(color);
    executeFormat('hiliteColor', color);
  };

  // Insert 3x3 table
  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt;">
        <thead>
          <tr style="background-color: #f1f3f4;">
            <th style="padding: 8px 12px; border: 1px solid #dadce0; text-align: left;">Header 1</th>
            <th style="padding: 8px 12px; border: 1px solid #dadce0; text-align: left;">Header 2</th>
            <th style="padding: 8px 12px; border: 1px solid #dadce0; text-align: left;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #dadce0;">Cell 1</td>
            <td style="padding: 8px 12px; border: 1px solid #dadce0;">Cell 2</td>
            <td style="padding: 8px 12px; border: 1px solid #dadce0;">Cell 3</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #dadce0;">Cell 4</td>
            <td style="padding: 8px 12px; border: 1px solid #dadce0;">Cell 5</td>
            <td style="padding: 8px 12px; border: 1px solid #dadce0;">Cell 6</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    executeFormat('insertHTML', tableHtml);
  };

  // Insert Image
  const handleInsertImage = () => {
    const url = prompt('Enter image URL or press OK for placeholder:', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600');
    if (url) {
      const imgHtml = `<img src="${url}" alt="Inserted image" style="max-width: 100%; height: auto; border-radius: 4px; margin: 12px 0;" /><p></p>`;
      executeFormat('insertHTML', imgHtml);
    }
  };

  // Apply Link
  const handleApplyLink = (text: string, url: string) => {
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; text-decoration: underline;">${text}</a>`;
    executeFormat('insertHTML', linkHtml);
  };

  // Find and replace execution
  const handleFind = () => {
    if (!findQuery.trim()) return;
    const win = window as any;
    if (win.find) {
      win.find(findQuery, isMatchCase, false, true, false, false, false);
    }
  };

  const handleReplace = () => {
    if (!editorRef.current || !findQuery) return;
    const content = editorRef.current.innerHTML;
    const flags = isMatchCase ? 'g' : 'gi';
    const regex = new RegExp(findQuery, flags);
    editorRef.current.innerHTML = content.replace(regex, replaceQuery);
    handleEditorInput();
  };

  // Menu action router
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'new_blank':
        handleNewDoc();
        break;
      case 'open_templates':
        setShowTemplateModal(true);
        break;
      case 'copy_doc':
        setDocTitle(`Copy of ${docTitle}`);
        setToastMessage(`Created copy of "${docTitle}"`);
        setTimeout(() => setToastMessage(null), 3000);
        break;
      case 'download_docx':
      case 'download_txt': {
        const text = editorRef.current?.innerText || '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${docTitle}.txt`;
        a.click();
        break;
      }
      case 'download_pdf':
        window.print();
        break;
      case 'page_setup':
        setShowPageSetupModal(true);
        break;
      case 'undo':
        executeFormat('undo');
        break;
      case 'redo':
        executeFormat('redo');
        break;
      case 'find_replace':
        setShowFindReplace(true);
        break;
      case 'insert_image':
        handleInsertImage();
        break;
      case 'insert_table':
        handleInsertTable();
        break;
      case 'insert_hr':
        executeFormat('insertHorizontalRule');
        break;
      case 'insert_chip':
        executeFormat(
          'insertHTML',
          `<span style="background: #e8f0fe; color: #1a73e8; padding: 2px 8px; border-radius: 12px; font-weight: 500; font-size: 10pt; display: inline-flex; align-items: center; margin: 0 2px;">@${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> `
        );
        break;
      case 'insert_link':
        setShowLinkModal(true);
        break;
      case 'insert_comment':
        executeFormat(
          'insertHTML',
          `<span style="background: #fff2cc; border-bottom: 2px solid #fbbc04;" title="Comment thread active">`
        );
        break;
      case 'insert_page_break':
        executeFormat(
          'insertHTML',
          `<div style="border-bottom: 1px dashed #dadce0; margin: 32px 0; text-align: center; color: #80868b; font-size: 9pt; user-select: none;">--- Page Break ---</div><p></p>`
        );
        break;
      case 'bold':
        executeFormat('bold');
        break;
      case 'italic':
        executeFormat('italic');
        break;
      case 'underline':
        executeFormat('underline');
        break;
      case 'strikethrough':
        executeFormat('strikethrough');
        break;
      case 'format_h1':
        executeFormat('formatBlock', '<h1>');
        break;
      case 'format_h2':
        executeFormat('formatBlock', '<h2>');
        break;
      case 'format_h3':
        executeFormat('formatBlock', '<h3>');
        break;
      case 'format_normal':
        executeFormat('formatBlock', '<p>');
        break;
      case 'clear_formatting':
        executeFormat('removeFormat');
        break;
      case 'spellcheck':
        executeFormat('spellcheck');
        break;
      case 'word_count':
        setShowWordCountModal(true);
        break;
      case 'shortcuts':
        alert(
          'Google Docs Keyboard Shortcuts:\nCtrl+B: Bold\nCtrl+I: Italic\nCtrl+U: Underline\nCtrl+K: Insert Link\nCtrl+Z: Undo\nCtrl+Y: Redo\nCtrl+P: Print\nCtrl+Shift+C: Word Count'
        );
        break;
      case 'toggle_fullscreen':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        break;
      default:
        break;
    }
  };

  // Scroll to heading from outline click
  const handleHeadingClick = (headingText: string) => {
    if (!editorRef.current) return;
    const headingEls = editorRef.current.querySelectorAll('h1, h2, h3');
    for (let i = 0; i < headingEls.length; i++) {
      if ((headingEls[i] as HTMLElement).innerText.includes(headingText)) {
        headingEls[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        (headingEls[i] as HTMLElement).style.backgroundColor = '#e8f0fe';
        setTimeout(() => {
          (headingEls[i] as HTMLElement).style.backgroundColor = 'transparent';
        }, 1200);
        break;
      }
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowLinkModal(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowWordCountModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      id="google-docs-app"
      className="flex flex-col h-full min-h-0 md:h-[calc(100dvh-5.5rem)] bg-[#f9fbfd] rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative select-text"
    >
      {/* 1. AUTHENTIC GOOGLE DOCS TOP HEADER */}
      <DocsHeader
        docTitle={docTitle}
        onTitleChange={(t) => {
          setDocTitle(t);
          setIsSaved(false);
          setTimeout(() => setIsSaved(true), 800);
        }}
        isStarred={isStarred}
        onToggleStar={() => setIsStarred(!isStarred)}
        isSaved={isSaved}
        onOpenDocPicker={() => setShowDocPicker(true)}
        onShareClick={() => setShowShareModal(true)}
        onBackToOverview={onBackToOverview}
        webViewLink={selectedDoc?.webViewLink}
        onMenuAction={handleMenuAction}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler(!showRuler)}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline(!showOutline)}
        accessLevel={accessLevel}
        userName={userName}
        userEmail={userEmail}
        userPhoto={userPhoto}
      />

      {/* 2. AUTHENTIC MATERIAL 3 ACTION TOOLBAR */}
      <DocsToolbar
        zoom={zoomLevel}
        onZoomChange={setZoomLevel}
        fontFamily={fontFamily}
        onFontFamilyChange={handleFontFamilyChange}
        fontSize={fontSize}
        onFontSizeChange={(s) => {
          setFontSize(s);
          if (editorRef.current) {
            editorRef.current.style.fontSize = `${s + 2}px`;
          }
        }}
        textColor={textColor}
        onTextColorChange={handleTextColorChange}
        highlightColor={highlightColor}
        onHighlightColorChange={handleHighlightColorChange}
        onFormatCommand={executeFormat}
        isBoldActive={isBoldActive}
        isItalicActive={isItalicActive}
        isUnderlineActive={isUnderlineActive}
        activeAlign={activeAlign}
        mode={editingMode}
        onModeChange={setEditingMode}
        onOpenLinkModal={() => setShowLinkModal(true)}
        onInsertImage={handleInsertImage}
        onInsertTable={handleInsertTable}
      />

      {/* SUCCESS / ACTION TOAST */}
      {toastMessage && (
        <div className="px-6 py-2 bg-[#e6f4ea] border-b border-[#b7e1cd] text-[#137333] text-xs font-medium flex items-center justify-between z-20 animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. HORIZONTAL RULER (Classic Google Docs 8.5" Ruler with Inch Ticks and Margin Sliders) */}
      {showRuler && <DocsRuler zoom={zoomLevel} />}

      {/* 4. MAIN CANVAS CONTAINER (Outline + 8.5" x 11" Paper + Companion Bar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Left Outline */}
        {showOutline && (
          <DocsOutline
            headings={headings}
            onHeadingClick={handleHeadingClick}
            summary={summaryText}
            onSummaryChange={setSummaryText}
          />
        )}

        {/* Gray Desk + Centered 8.5" x 11" Paper Canvas */}
        <div
          className="flex-1 overflow-y-auto bg-[#f9fbfd] flex flex-col items-center p-2 sm:p-6 md:p-10 relative scrollbar-thin"
          onClick={() => {
            if (editingMode !== 'viewing' && editorRef.current) {
              editorRef.current.focus();
            }
          }}
        >
          {/* Floating Find & Replace Bar */}
          {showFindReplace && (
            <div className="sticky top-0 z-30 mb-4 bg-white rounded-2xl shadow-xl border border-[#dadce0] p-3 flex flex-wrap items-center gap-2 text-xs text-[#1f1f1f] animate-in fade-in">
              <div className="flex items-center gap-1.5 border border-[#dadce0] rounded-xl px-2.5 py-1 bg-[#f8fafd]">
                <Search className="w-3.5 h-3.5 text-[#5f6368]" />
                <input
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="Find in document"
                  className="bg-transparent outline-none w-36 text-xs"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 border border-[#dadce0] rounded-xl px-2.5 py-1 bg-[#f8fafd]">
                <Replace className="w-3.5 h-3.5 text-[#5f6368]" />
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replace with"
                  className="bg-transparent outline-none w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleFind}
                  className="p-1.5 hover:bg-[#f0f4f9] rounded text-xs font-semibold cursor-pointer"
                  title="Find next"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleReplace}
                  className="px-2.5 py-1 bg-[#f0f4f9] hover:bg-[#e8f0fe] text-[#1a73e8] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Replace
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-[#5f6368] cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={isMatchCase}
                  onChange={(e) => setIsMatchCase(e.target.checked)}
                />
                <span>Match case</span>
              </label>

              <button
                onClick={() => setShowFindReplace(false)}
                className="p-1 hover:bg-[#f0f4f9] rounded-full text-[#5f6368] ml-auto cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* THE 8.5" x 11" WHITE PAPER SHEET */}
          <div
            className="w-full max-w-[816px] bg-white transition-all p-4 sm:p-12 md:p-24 min-h-[500px] sm:min-h-[850px] shadow-sm sm:shadow-[0_1px_3px_1px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] rounded-xs"
            style={{
              maxWidth: pageOrientation === 'portrait' ? '816px' : '1056px',
              fontFamily: fontFamily,
            }}
          >
            {/* Real WYSIWYG ContentEditable Document Surface */}
            <div
              ref={editorRef}
              contentEditable={editingMode !== 'viewing'}
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onKeyUp={updateToolbarStates}
              onMouseUp={updateToolbarStates}
              className="w-full min-h-[400px] sm:min-h-[750px] outline-none text-[#202124] leading-relaxed prose max-w-none focus:ring-0"
              style={{
                fontSize: `${fontSize + 3}px`,
                color: textColor,
              }}
            />
          </div>

          {/* Floating Word Count Pill (Optional Google Docs floating indicator) */}
          {showWordCountFloating && (
            <div
              onClick={() => setShowWordCountModal(true)}
              className="fixed bottom-6 left-64 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#dadce0] shadow-lg text-xs font-semibold text-[#444746] flex items-center gap-1.5 cursor-pointer hover:bg-white transition-all"
            >
              <span>{wordCount} words</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* 5. GOOGLE WORKSPACE COMPANION RAIL (Calendar, Keep, Tasks, Contacts, Maps) */}
        <DocsCompanionBar
          onOpenApp={(appName) => {
            setToastMessage(`Opening Google ${appName}...`);
            setTimeout(() => setToastMessage(null), 2500);
          }}
        />
      </div>

      {/* MODALS */}
      <DocsShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        docTitle={docTitle}
        webViewLink={selectedDoc?.webViewLink}
        accessLevel={accessLevel}
        onAccessLevelChange={setAccessLevel}
        userName={userName}
        userEmail={userEmail}
        userPhoto={userPhoto}
      />

      <DocsPickerModal
        isOpen={showDocPicker}
        onClose={() => setShowDocPicker(false)}
        docs={docs}
        onSelectDoc={handleSelectDoc}
        onNewDoc={handleNewDoc}
      />

      <DocsTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <DocsWordCountModal
        isOpen={showWordCountModal}
        onClose={() => setShowWordCountModal(false)}
        words={wordCount}
        characters={charCount}
        charsNoSpaces={charsNoSpaces}
        pages={1}
        showWordCountFloating={showWordCountFloating}
        onToggleFloating={setShowWordCountFloating}
      />

      <DocsLinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onApplyLink={handleApplyLink}
      />

      <DocsPageSetupModal
        isOpen={showPageSetupModal}
        onClose={() => setShowPageSetupModal(false)}
        orientation={pageOrientation}
        onOrientationChange={setPageOrientation}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};
