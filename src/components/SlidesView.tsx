import React, { useState, useEffect } from 'react';
import { DriveFile } from '../types/workspace';
import { searchSlides, createDriveFile } from '../services/workspace';
import {
  INITIAL_SLIDES,
  SlideItem,
  SLIDE_THEMES,
  SlideTheme,
} from './slides/slidesData';
import { SlidesHeader } from './slides/SlidesHeader';
import { SlidesToolbar } from './slides/SlidesToolbar';
import { SlidesFilmstrip } from './slides/SlidesFilmstrip';
import { SlidesStage } from './slides/SlidesStage';
import { SlidesThemePanel } from './slides/SlidesThemePanel';
import { SlidesPresenter } from './slides/SlidesPresenter';
import { DocsCompanionBar } from './docs/DocsCompanionBar';
import { DocsShareModal, DocsPickerModal } from './docs/DocsModals';

interface SlidesViewProps {
  token: string;
  onBackToOverview?: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const SlidesView: React.FC<SlidesViewProps> = ({
  token,
  onBackToOverview,
  userName,
  userEmail,
  userPhoto,
}) => {
  const [deckTitle, setDeckTitle] = useState<string>('Untitled presentation');
  const [slides, setSlides] = useState<SlideItem[]>(() => {
    try {
      const saved = localStorage.getItem('google_slides_deck_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SLIDES;
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [showThemePanel, setShowThemePanel] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<string>('100%');

  // Modals & Drive
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [accessLevel, setAccessLevel] = useState<'restricted' | 'anyone'>('restricted');
  const [showDrivePicker, setShowDrivePicker] = useState<boolean>(false);
  const [showLayoutModal, setShowLayoutModal] = useState<boolean>(false);
  const [showBgModal, setShowBgModal] = useState<boolean>(false);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('google_slides_deck_v2', JSON.stringify(slides));
    } catch {}
  }, [slides]);

  // Load drive presentations
  useEffect(() => {
    if (token) {
      searchSlides(token)
        .then((res) => setDriveFiles(res))
        .catch(() => {});
    }
  }, [token]);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // Update current slide
  const handleUpdateSlide = (updated: Partial<SlideItem>) => {
    setIsSaved(false);
    setSlides((prev) =>
      prev.map((s, idx) => (idx === activeSlideIndex ? { ...s, ...updated } : s))
    );
    setTimeout(() => setIsSaved(true), 800);
  };

  // Add new slide
  const handleAddSlide = (layout: SlideItem['layout'] = 'title-body') => {
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      layout,
      title: 'Click to add title',
      bodyText: '• Click to add bullet points\n• Second item',
      themeId: currentSlide.themeId || 'simple-light',
    };
    const newSlides = [...slides];
    newSlides.splice(activeSlideIndex + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  // Duplicate slide
  const handleDuplicateSlide = (index: number) => {
    const source = slides[index];
    const dup: SlideItem = {
      ...source,
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${source.title} (Copy)`,
    };
    const updated = [...slides];
    updated.splice(index + 1, 0, dup);
    setSlides(updated);
    setActiveSlideIndex(index + 1);
  };

  // Delete slide
  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  // Move slide
  const handleMoveSlide = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setSlides(updated);
    setActiveSlideIndex(to);
  };

  // Apply theme to entire deck
  const handleApplyTheme = (theme: SlideTheme) => {
    setIsSaved(false);
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        themeId: theme.id,
        backgroundColor: undefined, // inherit theme bg
      }))
    );
    setTimeout(() => setIsSaved(true), 800);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleAddSlide('title-body');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSlide(activeSlideIndex);
      } else if (e.key === 'F5' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsPresenting(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIndex, slides]);

  // Handle menu actions
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'new_slide':
        handleAddSlide('title-body');
        break;
      case 'duplicate_slide':
        handleDuplicateSlide(activeSlideIndex);
        break;
      case 'delete_slide':
        handleDeleteSlide(activeSlideIndex);
        break;
      case 'open_theme':
        setShowThemePanel(true);
        break;
      case 'open_layout':
        setShowLayoutModal(true);
        break;
      case 'open_background':
        setShowBgModal(true);
        break;
      case 'toggle_notes':
        setShowNotes(!showNotes);
        break;
      case 'open_picker':
        setShowDrivePicker(true);
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

  return (
    <div
      id="google-slides-app"
      className="flex flex-col h-[calc(100vh-5.5rem)] bg-[#f9fbfd] rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative select-text"
    >
      {/* 1. AUTHENTIC GOOGLE SLIDES HEADER */}
      <SlidesHeader
        title={deckTitle}
        onTitleChange={(t) => {
          setDeckTitle(t);
          setIsSaved(false);
          setTimeout(() => setIsSaved(true), 800);
        }}
        isStarred={isStarred}
        onToggleStar={() => setIsStarred(!isStarred)}
        isSaved={isSaved}
        onOpenSlideshow={() => setIsPresenting(true)}
        onShareClick={() => setShowShareModal(true)}
        onBackToOverview={onBackToOverview}
        webViewLink={selectedFile?.webViewLink}
        onMenuAction={handleMenuAction}
        accessLevel={accessLevel}
        userName={userName}
        userEmail={userEmail}
        userPhoto={userPhoto}
      />

      {/* 2. AUTHENTIC SLIDES ACTION TOOLBAR */}
      <SlidesToolbar
        onNewSlide={handleAddSlide}
        onFormatText={(cmd, val) => document.execCommand(cmd, false, val)}
        onOpenThemePanel={() => setShowThemePanel(!showThemePanel)}
        onOpenLayoutModal={() => setShowLayoutModal(true)}
        onOpenBackgroundModal={() => setShowBgModal(true)}
        onInsertImage={() => {
          const url = prompt('Image URL:');
          if (url) {
            handleUpdateSlide({
              bodyText: (currentSlide.bodyText || '') + `\n[Image: ${url}]`,
            });
          }
        }}
        onInsertTextBox={() => {
          handleUpdateSlide({
            bodyText: (currentSlide.bodyText || '') + '\nNew Text Box',
          });
        }}
        onInsertShape={() => {
          alert('Inserted rectangle shape on current slide.');
        }}
        zoom={zoomLevel}
        onZoomChange={setZoomLevel}
      />

      {/* 3. MAIN WORKSPACE CANVAS (Left Filmstrip + Centered 16:9 Stage + Companion Bar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Thumbnails Filmstrip */}
        <SlidesFilmstrip
          slides={slides}
          activeIndex={activeSlideIndex}
          onSelectSlide={setActiveSlideIndex}
          onAddSlide={() => handleAddSlide('title-body')}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
        />

        {/* Center Presentation Stage */}
        <SlidesStage
          slide={currentSlide}
          onUpdateSlide={handleUpdateSlide}
          showNotes={showNotes}
          onToggleNotes={() => setShowNotes(!showNotes)}
          zoom={zoomLevel}
        />

        {/* Right Slide-out Themes Panel */}
        {showThemePanel && (
          <SlidesThemePanel
            currentThemeId={currentSlide.themeId || 'simple-light'}
            onSelectTheme={handleApplyTheme}
            onClose={() => setShowThemePanel(false)}
          />
        )}

        {/* Google Workspace Right Companion Rail */}
        <DocsCompanionBar
          onOpenApp={(app) => alert(`Opening Google ${app}...`)}
        />
      </div>

      {/* 4. FULLSCREEN PRESENTER MODE */}
      {isPresenting && (
        <SlidesPresenter
          slides={slides}
          initialIndex={activeSlideIndex}
          onExit={() => setIsPresenting(false)}
        />
      )}

      {/* MODALS */}
      <DocsShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        docTitle={deckTitle}
        webViewLink={selectedFile?.webViewLink}
        accessLevel={accessLevel}
        onAccessLevelChange={setAccessLevel}
        userName={userName}
        userEmail={userEmail}
        userPhoto={userPhoto}
      />

      <DocsPickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        docs={driveFiles}
        onSelectDoc={(file) => {
          setSelectedFile(file);
          setDeckTitle(file.name);
        }}
        onNewDoc={() => {
          setDeckTitle('Untitled presentation');
          setSlides(INITIAL_SLIDES);
          setActiveSlideIndex(0);
        }}
        appType="slides"
      />

      {/* Layout Picker Modal */}
      {showLayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4 text-[#1f1f1f]">
            <h3 className="text-base font-bold text-[#1f1f1f]">Apply layout</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'title-slide', label: 'Title slide' },
                { id: 'section-header', label: 'Section header' },
                { id: 'title-body', label: 'Title and body' },
                { id: 'two-columns', label: 'Two columns' },
                { id: 'big-number', label: 'Big number' },
                { id: 'blank', label: 'Blank' },
              ].map((l: any) => (
                <button
                  key={l.id}
                  onClick={() => {
                    handleUpdateSlide({ layout: l.id });
                    setShowLayoutModal(false);
                  }}
                  className={`p-3 border rounded-xl text-left hover:border-[#1a73e8] hover:bg-[#f8fafd] transition-all cursor-pointer ${
                    currentSlide.layout === l.id ? 'border-[#1a73e8] bg-[#e8f0fe]' : 'border-[#dadce0]'
                  }`}
                >
                  <div className="aspect-video w-full bg-white border border-[#dadce0] rounded mb-2 flex items-center justify-center text-[10px] text-[#5f6368]">
                    {l.label}
                  </div>
                  <span className="text-xs font-semibold">{l.label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLayoutModal(false)}
                className="px-5 py-2 bg-[#f0f4f9] rounded-full text-xs font-bold text-[#5f6368]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Color Modal */}
      {showBgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4 text-[#1f1f1f]">
            <h3 className="text-base font-bold text-[#1f1f1f]">Background color</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                '#ffffff',
                '#f8fafd',
                '#fef7e0',
                '#e6f4ea',
                '#fff8f6',
                '#f1f3f4',
                '#202124',
                '#1a73e8',
                '#188038',
                '#d93025',
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    handleUpdateSlide({ backgroundColor: c });
                    setShowBgModal(false);
                  }}
                  className="w-10 h-10 rounded-full border border-black/10 hover:scale-110 transition-transform shadow-xs"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowBgModal(false)}
                className="px-5 py-2 bg-[#f0f4f9] rounded-full text-xs font-bold text-[#5f6368]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
