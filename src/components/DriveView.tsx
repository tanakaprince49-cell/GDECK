import React, { useState, useEffect, useRef } from 'react';
import { WorkspaceFocusTarget } from '../types/focus';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  ExternalLink,
  Trash2,
  Search,
  RefreshCw,
  UploadCloud,
  ArrowLeft,
  Plus,
  FolderPlus,
  X,
  CheckCircle2,
  Info,
  Download,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  HardDrive,
  Users,
  Clock,
  Star,
  RotateCcw,
  Upload,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileCode,
  Menu,
} from 'lucide-react';
import { DriveFile, DriveStorageQuota } from '../types/workspace';
import {
  listDriveFiles,
  deleteDriveFile,
  uploadDriveFile,
  downloadDriveFile,
  toggleStarDriveFile,
  trashDriveFile,
  restoreDriveFile,
  emptyDriveTrash,
  getDriveStorageQuota,
  createDriveFolder,
  createDriveFile,
} from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import {
  GmailIcon,
  GoogleDriveIcon,
  GoogleDocsIcon,
  GoogleSheetsIcon,
  GoogleSlidesIcon,
  GoogleFormsIcon,
  GoogleCalendarIcon,
  GoogleTasksIcon,
  GoogleKeepIcon,
  GoogleMeetIcon,
} from './GoogleIcons';

interface DriveViewProps {
  token: string;
  onBackToOverview?: () => void;
  onNavigateTab?: (tab: string) => void;
  /** File to select straight away (from Omni-Search). */
  focusTarget?: WorkspaceFocusTarget | null;
  onFocusHandled?: () => void;
}

type DriveNavSection = 'my-drive' | 'shared' | 'recent' | 'starred' | 'trash';

interface UploadItem {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export const DriveView: React.FC<DriveViewProps> = ({ token, onBackToOverview, onNavigateTab, focusTarget, onFocusHandled }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeNav, setActiveNav] = useState<DriveNavSection>('my-drive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInfoPane, setShowInfoPane] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Storage Quota
  const [storageQuota, setStorageQuota] = useState<DriveStorageQuota>({});

  // Downloading State
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Uploading queue & state
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [showUploadWidget, setShowUploadWidget] = useState<boolean>(false);
  const [isUploadWidgetMinimized, setIsUploadWidgetMinimized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // New Folder state
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // "+ New" dropdown menu state
  const [showNewMenu, setShowNewMenu] = useState<boolean>(false);

  // Selected file for details inspector
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isPermanentDelete, setIsPermanentDelete] = useState<boolean>(false);

  // Empty Trash modal state
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState<boolean>(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState<boolean>(false);

  // Load Files based on section, search query, and category
  const loadFiles = async (query = searchQuery, category = selectedCategory, section = activeNav) => {
    setLoading(true);
    setError(null);
    try {
      let mimeFilter: string | undefined = undefined;
      if (category === 'documents') mimeFilter = 'document';
      else if (category === 'spreadsheets') mimeFilter = 'spreadsheet';
      else if (category === 'presentations') mimeFilter = 'presentation';
      else if (category === 'images') mimeFilter = 'image';
      else if (category === 'folders') mimeFilter = 'folder';

      const data = await listDriveFiles(token, query, mimeFilter, section);
      setFiles(data);
      if (data.length > 0) {
        setSelectedFile((prev) => (prev ? data.find((f) => f.id === prev.id) || data[0] : data[0]));
      } else {
        setSelectedFile(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Google Drive files');
    } finally {
      setLoading(false);
    }
  };

  // Load Storage Quota
  const loadStorage = async () => {
    try {
      const quota = await getDriveStorageQuota(token);
      setStorageQuota(quota);
    } catch (err) {
      console.warn('Storage quota fetch failed:', err);
    }
  };

  // Search hit -> show the file selected and inspected, with the list filtered to the phrase.
  useEffect(() => {
    if (!focusTarget || focusTarget.source !== 'drive') return;
    const file = focusTarget.item as DriveFile | null;
    const q = (focusTarget.query || '').trim();
    if (q) setSearchQuery(q);
    if (file) setSelectedFile(file);
    void loadFiles(q, 'all', 'my-drive');
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget]);

  useEffect(() => {
    loadFiles(searchQuery, selectedCategory, activeNav);
  }, [token, selectedCategory, activeNav]);

  useEffect(() => {
    loadStorage();
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery, selectedCategory, activeNav);
  };

  // Multiple files upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const filesToUpload = Array.from(fileList);
    await uploadMultipleFiles(filesToUpload);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const uploadMultipleFiles = async (filesList: File[]) => {
    setShowUploadWidget(true);
    setIsUploadWidgetMinimized(false);

    const newQueueItems: UploadItem[] = filesList.map((f) => ({
      id: Math.random().toString(36).substring(2) + Date.now(),
      name: f.name,
      size: f.size,
      status: 'uploading',
    }));

    setUploadQueue((prev) => [...newQueueItems, ...prev]);

    let successCount = 0;
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const queueId = newQueueItems[i].id;
      try {
        await uploadDriveFile(token, file);
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === queueId ? { ...item, status: 'done' } : item))
        );
        successCount++;
      } catch (err: any) {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? { ...item, status: 'error', error: err.message || 'Upload failed' }
              : item
          )
        );
      }
    }

    if (successCount > 0) {
      setSuccessMsg(
        successCount === 1
          ? `Uploaded "${filesList[0].name}" successfully!`
          : `Successfully uploaded ${successCount} files to Google Drive!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      loadFiles(searchQuery, selectedCategory, activeNav);
      loadStorage();
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      await uploadMultipleFiles(droppedFiles);
    }
  };

  // Download Handler
  const handleDownload = async (file: DriveFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setError('Folders cannot be downloaded directly. Open the folder to download individual files.');
      setTimeout(() => setError(null), 3500);
      return;
    }
    setDownloadingId(file.id);
    setError(null);
    try {
      const result = await downloadDriveFile(token, file);
      setSuccessMsg(`Downloaded "${result.filename}" successfully!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || `Failed to download "${file.name}"`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Star / Unstar Handler
  const handleToggleStar = async (file: DriveFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStarred = !file.starred;
    // Optimistic UI update
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, starred: nextStarred } : f)));
    if (selectedFile?.id === file.id) {
      setSelectedFile((prev) => (prev ? { ...prev, starred: nextStarred } : null));
    }
    try {
      await toggleStarDriveFile(token, file.id, nextStarred);
      setSuccessMsg(
        nextStarred ? `Added "${file.name}" to Starred` : `Removed "${file.name}" from Starred`
      );
      setTimeout(() => setSuccessMsg(null), 2500);
      if (activeNav === 'starred' && !nextStarred) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, starred: !nextStarred } : f)));
      setError(err.message || 'Failed to update star');
    }
  };

  // Move to Trash or Delete permanently
  const handleDeleteClick = (file: DriveFile, permanent = false, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget(file);
    setIsPermanentDelete(permanent || activeNav === 'trash');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (isPermanentDelete || activeNav === 'trash') {
        await deleteDriveFile(token, deleteTarget.id);
        setSuccessMsg(`Permanently deleted "${deleteTarget.name}"`);
      } else {
        await trashDriveFile(token, deleteTarget.id);
        setSuccessMsg(`Moved "${deleteTarget.name}" to Trash`);
      }
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      if (selectedFile?.id === deleteTarget.id) setSelectedFile(null);
      setDeleteTarget(null);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadStorage();
    } catch (err: any) {
      setError(err.message || 'Failed to process delete operation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Restore from Trash
  const handleRestore = async (file: DriveFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await restoreDriveFile(token, file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (selectedFile?.id === file.id) setSelectedFile(null);
      setSuccessMsg(`Restored "${file.name}" to Drive`);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadStorage();
    } catch (err: any) {
      setError(err.message || 'Failed to restore file');
    }
  };

  // Empty Trash
  const confirmEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      await emptyDriveTrash(token);
      setFiles([]);
      setSelectedFile(null);
      setShowEmptyTrashModal(false);
      setSuccessMsg('Google Drive Trash emptied successfully');
      setTimeout(() => setSuccessMsg(null), 3500);
      loadStorage();
    } catch (err: any) {
      setError(err.message || 'Failed to empty Trash');
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setIsCreatingFolder(true);
    setError(null);
    try {
      await createDriveFolder(token, folderName.trim());
      setSuccessMsg(`Folder "${folderName}" created successfully!`);
      setShowFolderModal(false);
      setFolderName('');
      loadFiles(searchQuery, selectedCategory, activeNav);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleQuickCreateDoc = async (type: 'doc' | 'sheet' | 'slide' | 'form') => {
    setShowNewMenu(false);
    setLoading(true);
    try {
      let mime = 'application/vnd.google-apps.document';
      let title = 'Untitled Document';
      if (type === 'sheet') {
        mime = 'application/vnd.google-apps.spreadsheet';
        title = 'Untitled Spreadsheet';
      } else if (type === 'slide') {
        mime = 'application/vnd.google-apps.presentation';
        title = 'Untitled Presentation';
      } else if (type === 'form') {
        mime = 'application/vnd.google-apps.form';
        title = 'Untitled Form';
      }
      const created = await createDriveFile(token, title, mime);
      setSuccessMsg(`Created new ${title}!`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setFiles((prev) => [created, ...prev]);
      setSelectedFile(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create Google Workspace file');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string, className = 'w-5 h-5') => {
    if (mimeType.includes('spreadsheet')) return <GoogleSheetsIcon className={className} />;
    if (mimeType.includes('document')) return <GoogleDocsIcon className={className} />;
    if (mimeType.includes('presentation')) return <GoogleSlidesIcon className={className} />;
    if (mimeType.includes('form')) return <GoogleFormsIcon className={className} />;
    if (mimeType.includes('folder')) return <Folder className={`${className} text-[#f29900] fill-[#fef7e0]`} />;
    if (mimeType.includes('image')) return <FileImage className={`${className} text-[#d93025]`} />;
    if (mimeType.includes('pdf')) return <FileText className={`${className} text-[#ea4335]`} />;
    if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json'))
      return <FileCode className={`${className} text-[#1a73e8]`} />;
    return <File className={`${className} text-[#5f6368]`} />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '0 B';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const usedBytes = parseInt(storageQuota.usage || '0', 10);
  const limitBytes = parseInt(storageQuota.limit || '16106127360', 10); // 15 GB default
  const percentUsed = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;

  const folders = files.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
  const regularFiles = files.filter((f) => f.mimeType !== 'application/vnd.google-apps.folder');

  const getSectionTitle = () => {
    switch (activeNav) {
      case 'shared':
        return 'Shared with me';
      case 'recent':
        return 'Recent';
      case 'starred':
        return 'Starred';
      case 'trash':
        return 'Trash';
      default:
        return 'My Drive';
    }
  };

  return (
    <div
      id="drive-view"
      className="flex flex-col h-full min-h-0 md:h-[calc(100dvh-5.5rem)] bg-[#f6f8fc] rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file & folder inputs */}
      <input
        id="drive-file-input"
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        id="drive-folder-input"
        type="file"
        ref={folderInputRef}
        onChange={handleFileUpload}
        {...({ webkitdirectory: '', directory: '' } as any)}
        className="hidden"
      />

      {/* AUTHENTIC GOOGLE DRIVE TOP BAR */}
      <header className="h-14 sm:h-16 px-2 sm:px-6 bg-[#f6f8fc] border-b border-[#dadce0]/80 flex items-center justify-between gap-1.5 sm:gap-4 shrink-0 gdeck-dense-toolbar min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            id="drive-mobile-menu-toggle"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer md:hidden"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {onBackToOverview && (
            <button
              id="drive-back-btn"
              onClick={onBackToOverview}
              className="hidden md:inline-flex p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onBackToOverview}>
            <GoogleDriveIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-[20px] sm:text-[22px] font-normal text-[#444746] tracking-tight hidden sm:inline">Drive</span>
          </div>
        </div>

        {/* Real Drive Search Box */}
        <div className="flex-1 min-w-0 max-w-2xl mx-1 sm:mx-2">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#5f6368] absolute left-3.5 sm:left-4 pointer-events-none" />
            <input
              id="drive-search-input"
              type="text"
              placeholder={`Search in ${getSectionTitle()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 sm:h-11 pl-10 sm:pl-12 pr-9 sm:pr-10 bg-[#eaf1fb] hover:bg-[#e1eaf5] focus:bg-white text-xs sm:text-sm text-[#1f1f1f] rounded-full border border-transparent focus:border-[#dadce0] focus:shadow-md outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadFiles('', selectedCategory, activeNav);
                }}
                className="absolute right-3 p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Action icons & Upload quick button */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            id="drive-top-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-full transition-all shadow-xs cursor-pointer"
            title="Upload file to Google Drive"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            id="drive-view-mode-btn"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className={`p-1.5 sm:p-2 rounded-full hover:bg-[#e8eaed] text-[#444746] transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#e8eaed]' : ''
            }`}
            title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? <ListIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            id="drive-toggle-info-btn"
            onClick={() => setShowInfoPane(!showInfoPane)}
            className={`p-1.5 sm:p-2 rounded-full hover:bg-[#e8eaed] text-[#444746] transition-colors cursor-pointer hidden xs:block ${
              showInfoPane ? 'bg-[#e8eaed] text-[#1a73e8]' : ''
            }`}
            title="Toggle details pane"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            id="drive-refresh-btn"
            onClick={() => {
              loadFiles(searchQuery, selectedCategory, activeNav);
              loadStorage();
            }}
            disabled={loading}
            className="p-1.5 sm:p-2 text-[#444746] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Refresh files"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin text-[#1a73e8]' : ''}`} />
          </button>

          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#444746] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer hidden md:block"
            title="Open official Google Drive web app"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[300px] max-w-[85vw] bg-[#f6f8fc] h-full shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]">
                <div className="flex items-center gap-2">
                  <GoogleDriveIcon className="w-7 h-7" />
                  <span className="text-lg font-medium text-[#444746]">Drive</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 hover:bg-[#e8eaed] rounded-full text-[#5f6368] cursor-pointer"
                  title="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Big "+ New" Action Button */}
              <div className="space-y-2">
                <button
                  id="mobile-drawer-new-btn"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setShowNewMenu(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-[#f8fafd] active:bg-[#edf2fa] text-[#1f1f1f] border border-[#dadce0] rounded-2xl font-semibold text-sm transition-all shadow-xs cursor-pointer select-none"
                >
                  <Plus className="w-5 h-5 text-[#1a73e8] stroke-[2.5]" />
                  <span>New item</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      setShowFolderModal(true);
                    }}
                    className="flex items-center gap-2 p-2 bg-white rounded-xl border border-[#dadce0] text-xs font-semibold text-[#1f1f1f] hover:bg-[#f0f4f9] transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-[#f29900]" />
                    <span>New folder</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 p-2 bg-white rounded-xl border border-[#dadce0] text-xs font-semibold text-[#1f1f1f] hover:bg-[#f0f4f9] transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-[#1a73e8]" />
                    <span>Upload file</span>
                  </button>
                </div>
              </div>

              {/* Drive Navigation Sections */}
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Drive Locations</p>
                <nav className="space-y-0.5">
                  {[
                    { id: 'my-drive', label: 'My Drive', icon: <HardDrive className="w-4 h-4" /> },
                    { id: 'shared', label: 'Shared with me', icon: <Users className="w-4 h-4" /> },
                    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
                    { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" /> },
                    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveNav(sec.id as DriveNavSection);
                        setSelectedFile(null);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        activeNav === sec.id
                          ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                          : 'text-[#444746] hover:bg-[#e8eaed]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {sec.icon}
                        <span>{sec.label}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* File Category Filters */}
              <div className="space-y-1 pt-2 border-t border-[#dadce0]/70">
                <p className="px-3 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">File Types</p>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'All files', icon: <File className="w-4 h-4 text-[#1a73e8]" /> },
                    { id: 'documents', label: 'Google Docs', icon: <GoogleDocsIcon className="w-4 h-4" /> },
                    { id: 'spreadsheets', label: 'Google Sheets', icon: <GoogleSheetsIcon className="w-4 h-4" /> },
                    { id: 'presentations', label: 'Google Slides', icon: <GoogleSlidesIcon className="w-4 h-4" /> },
                    { id: 'images', label: 'Photos & Images', icon: <FileImage className="w-4 h-4 text-[#d93025]" /> },
                    { id: 'folders', label: 'Folders', icon: <Folder className="w-4 h-4 text-[#f29900]" /> },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#e8f0fe] text-[#1a73e8] font-bold'
                          : 'text-[#444746] hover:bg-[#e8eaed]'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Google Workspace Apps Switcher */}
              {onNavigateTab && (
                <div className="space-y-1 pt-2 border-t border-[#dadce0]/70">
                  <p className="px-3 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Google Workspace Apps</p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      { id: 'gmail', label: 'Gmail', icon: <GmailIcon className="w-4 h-4" /> },
                      { id: 'docs', label: 'Docs', icon: <GoogleDocsIcon className="w-4 h-4" /> },
                      { id: 'sheets', label: 'Sheets', icon: <GoogleSheetsIcon className="w-4 h-4" /> },
                      { id: 'calendar', label: 'Calendar', icon: <GoogleCalendarIcon className="w-4 h-4" /> },
                      { id: 'slides', label: 'Slides', icon: <GoogleSlidesIcon className="w-4 h-4" /> },
                      { id: 'forms', label: 'Forms', icon: <GoogleFormsIcon className="w-4 h-4" /> },
                      { id: 'tasks', label: 'Tasks', icon: <GoogleTasksIcon className="w-4 h-4" /> },
                      { id: 'meet', label: 'Meet', icon: <GoogleMeetIcon className="w-4 h-4" /> },
                    ].map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onNavigateTab(app.id);
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl text-xs text-[#444746] hover:bg-[#e8eaed] font-medium transition-colors cursor-pointer"
                      >
                        {app.icon}
                        <span className="truncate">{app.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Google Storage Info */}
            <div className="p-3 bg-white rounded-2xl border border-[#dadce0] text-[11px] text-[#5f6368] space-y-1.5 mt-4">
              <div className="flex justify-between font-medium">
                <span className="text-[#1f1f1f] font-semibold">Storage</span>
                <span className="text-[#1a73e8] font-semibold">{storageQuota.limit ? formatBytes(storageQuota.limit) : '15 GB'} Plan</span>
              </div>
              <div className="w-full h-1.5 bg-[#e0e2ec] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1a73e8] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, percentUsed)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#747775]">
                {storageQuota.usage ? formatBytes(storageQuota.usage) : '0 GB'} of{' '}
                {storageQuota.limit ? formatBytes(storageQuota.limit) : '15 GB'} used ({percentUsed}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DRAG AND DROP OVERLAY */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#e8f0fe]/90 backdrop-blur-xs flex flex-col items-center justify-center p-8 border-4 border-dashed border-[#1a73e8] rounded-2xl pointer-events-none">
          <UploadCloud className="w-16 h-16 text-[#1a73e8] animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-[#1a73e8]">Drop files to upload instantly to Google Drive</h3>
          <p className="text-sm text-[#5f6368] mt-1">Supports multiple files & documents</p>
        </div>
      )}

      {/* ERROR & SUCCESS TOASTS */}
      {error && (
        <div className="px-6 py-2.5 bg-[#fce8e6] border-b border-[#f5c2c7] text-[#c5221f] text-xs font-medium flex items-center justify-between shrink-0">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </span>
          <button onClick={() => setError(null)} className="underline cursor-pointer text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div className="px-6 py-2.5 bg-[#e6f4ea] border-b border-[#b7e1cd] text-[#137333] text-xs font-medium flex items-center justify-between shrink-0">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg(null)} className="underline cursor-pointer text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN DOCK: LEFT SIDEBAR + CANVAS + RIGHT INFO PANE */}
      <div className="flex flex-1 overflow-hidden">
        {/* AUTHENTIC GOOGLE DRIVE LEFT SIDEBAR */}
        <aside className="w-60 shrink-0 p-3 flex flex-col justify-between hidden md:flex bg-[#f6f8fc]">
          <div className="space-y-4">
            {/* Big "+ New" Dropdown Button */}
            <div className="relative">
              <button
                id="drive-new-menu-btn"
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="inline-flex items-center gap-3 px-5 py-4 bg-white hover:bg-[#f8fafd] hover:shadow-md border border-[#dadce0] rounded-2xl text-[#1f1f1f] font-semibold text-sm transition-all shadow-xs cursor-pointer select-none"
              >
                <Plus className="w-6 h-6 text-[#1a73e8] stroke-[2.5]" />
                <span>New</span>
              </button>

              {showNewMenu && (
                <div className="absolute top-16 left-0 z-50 w-64 bg-white rounded-2xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] py-2 overflow-hidden animate-in fade-in">
                  <button
                    id="drive-new-folder-menu-item"
                    onClick={() => {
                      setShowNewMenu(false);
                      setShowFolderModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f4f9] text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                  >
                    <FolderPlus className="w-5 h-5 text-[#f29900]" />
                    <span>New folder</span>
                  </button>
                  <div className="h-px bg-[#dadce0] my-1" />
                  <button
                    id="drive-file-upload-menu-item"
                    onClick={() => {
                      setShowNewMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f4f9] text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                  >
                    <UploadCloud className="w-5 h-5 text-[#1a73e8]" />
                    <span>File upload</span>
                  </button>
                  <button
                    id="drive-folder-upload-menu-item"
                    onClick={() => {
                      setShowNewMenu(false);
                      folderInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f4f9] text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                  >
                    <Folder className="w-5 h-5 text-[#5f6368]" />
                    <span>Folder upload</span>
                  </button>
                  <div className="h-px bg-[#dadce0] my-1" />
                  <button
                    onClick={() => handleQuickCreateDoc('doc')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                  >
                    <GoogleDocsIcon className="w-5 h-5" />
                    <span>Google Docs</span>
                  </button>
                  <button
                    onClick={() => handleQuickCreateDoc('sheet')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                  >
                    <GoogleSheetsIcon className="w-5 h-5" />
                    <span>Google Sheets</span>
                  </button>
                  <button
                    onClick={() => handleQuickCreateDoc('slide')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                  >
                    <GoogleSlidesIcon className="w-5 h-5" />
                    <span>Google Slides</span>
                  </button>
                  <button
                    onClick={() => handleQuickCreateDoc('form')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                  >
                    <GoogleFormsIcon className="w-5 h-5" />
                    <span>Google Forms</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drive Navigation Tree (Selectors 1-6) */}
            <nav className="space-y-0.5 pr-2 text-xs">
              <button
                id="drive-nav-my-drive"
                onClick={() => {
                  setActiveNav('my-drive');
                  setSelectedFile(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-r-full font-semibold cursor-pointer transition-colors ${
                  activeNav === 'my-drive'
                    ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>My Drive</span>
              </button>

              <button
                id="drive-nav-shared"
                onClick={() => {
                  setActiveNav('shared');
                  setSelectedFile(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-r-full font-semibold cursor-pointer transition-colors ${
                  activeNav === 'shared'
                    ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Shared with me</span>
              </button>

              <button
                id="drive-nav-recent"
                onClick={() => {
                  setActiveNav('recent');
                  setSelectedFile(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-r-full font-semibold cursor-pointer transition-colors ${
                  activeNav === 'recent'
                    ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Recent</span>
              </button>

              <button
                id="drive-nav-starred"
                onClick={() => {
                  setActiveNav('starred');
                  setSelectedFile(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-r-full font-semibold cursor-pointer transition-colors ${
                  activeNav === 'starred'
                    ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Starred</span>
              </button>

              <button
                id="drive-nav-trash"
                onClick={() => {
                  setActiveNav('trash');
                  setSelectedFile(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-r-full font-semibold cursor-pointer transition-colors ${
                  activeNav === 'trash'
                    ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Trash</span>
              </button>
            </nav>
          </div>

          {/* Real Storage Breakdown Bar (Selector 7) */}
          <div
            id="drive-storage-box"
            className="p-3 bg-white rounded-2xl border border-[#dadce0] text-[11px] text-[#5f6368] space-y-1.5 shadow-2xs"
          >
            <div className="flex justify-between font-medium">
              <span className="text-[#1f1f1f] font-semibold">Storage</span>
              <span className="text-[#1a73e8] font-bold">
                {storageQuota.limit ? formatBytes(storageQuota.limit) : '15 GB'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e0e2ec] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a73e8] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, percentUsed)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#747775]">
              {storageQuota.usage ? formatBytes(storageQuota.usage) : '0 GB'} of{' '}
              {storageQuota.limit ? formatBytes(storageQuota.limit) : '15 GB'} used ({percentUsed}%)
            </p>
          </div>
        </aside>

        {/* CENTER WHITE DRIVE FILE EXPLORER CANVAS */}
        <main className="flex-1 flex flex-col bg-white rounded-2xl m-2 overflow-hidden shadow-xs border border-[#dadce0]">
          {/* Breadcrumb Header & Category Filter Chips */}
          <div className="px-6 py-3 border-b border-[#dadce0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1f1f]">
              <span className="text-[#1f1f1f] font-bold">{getSectionTitle()}</span>
              {selectedCategory !== 'all' && (
                <>
                  <ChevronRight className="w-4 h-4 text-[#747775]" />
                  <span className="text-xs text-[#747775] font-normal capitalize">
                    {selectedCategory}
                  </span>
                </>
              )}
            </div>

            {/* Filter chips & Trash actions */}
            <div className="flex items-center gap-2">
              {activeNav === 'trash' ? (
                <button
                  id="drive-empty-trash-btn"
                  onClick={() => setShowEmptyTrashModal(true)}
                  disabled={files.length === 0}
                  className="px-4 py-1.5 bg-[#d93025] hover:bg-[#b3261e] disabled:opacity-40 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty trash</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'All files' },
                    { id: 'documents', label: 'Docs' },
                    { id: 'spreadsheets', label: 'Sheets' },
                    { id: 'presentations', label: 'Slides' },
                    { id: 'images', label: 'Photos' },
                    { id: 'folders', label: 'Folders' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                        selectedCategory === cat.id
                          ? 'bg-[#c2e7ff] text-[#001d35] border-transparent font-bold'
                          : 'border-[#dadce0] text-[#444746] hover:bg-[#f0f4f9]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE SELECTION TOOLBAR (Google Drive style banner when a file is selected) */}
          {selectedFile && (
            <div className="px-6 py-2 bg-[#edf2fa] border-b border-[#dadce0] flex items-center justify-between text-xs text-[#1f1f1f] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileIcon(selectedFile.mimeType, 'w-4 h-4 shrink-0')}
                <span className="font-semibold truncate max-w-sm">{selectedFile.name}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Download Button */}
                {selectedFile.mimeType !== 'application/vnd.google-apps.folder' && (
                  <button
                    id="drive-selected-download-btn"
                    onClick={(e) => handleDownload(selectedFile, e)}
                    disabled={downloadingId === selectedFile.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-bold shadow-xs transition-colors cursor-pointer"
                    title="Download this file"
                  >
                    {downloadingId === selectedFile.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingId === selectedFile.id ? 'Downloading...' : 'Download'}</span>
                  </button>
                )}

                {/* Star Button */}
                <button
                  onClick={(e) => handleToggleStar(selectedFile, e)}
                  className={`p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer ${
                    selectedFile.starred ? 'text-[#f29900]' : 'text-[#5f6368]'
                  }`}
                  title={selectedFile.starred ? 'Remove star' : 'Add star'}
                >
                  <Star className={`w-4 h-4 ${selectedFile.starred ? 'fill-current' : ''}`} />
                </button>

                {/* Web Link */}
                {selectedFile.webViewLink && (
                  <a
                    href={selectedFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-black/5 rounded-full transition-colors"
                    title="Open in Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* Restore / Delete */}
                {activeNav === 'trash' ? (
                  <>
                    <button
                      onClick={(e) => handleRestore(selectedFile, e)}
                      className="p-1.5 text-[#137333] hover:bg-[#e6f4ea] rounded-full transition-colors cursor-pointer"
                      title="Restore from Trash"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(selectedFile, true, e)}
                      className="p-1.5 text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                      title="Delete forever"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => handleDeleteClick(selectedFile, false, e)}
                    className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TRASH DISCLAIMER BANNER */}
          {activeNav === 'trash' && (
            <div className="px-6 py-2.5 bg-[#fef7e0] border-b border-[#fce8b2] text-[#b06000] text-xs flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>Items in trash are deleted forever after 30 days.</span>
              </span>
              <button
                onClick={() => setShowEmptyTrashModal(true)}
                className="font-bold underline hover:text-[#7f4300] cursor-pointer ml-4"
              >
                Empty trash now
              </button>
            </div>
          )}

          {/* MAIN SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-24 text-center text-[#5f6368]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1a73e8]" />
                <p className="text-sm font-medium">Syncing with Google Drive...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-24 text-center text-[#5f6368] space-y-3">
                <Folder className="w-16 h-16 stroke-1 mx-auto text-[#dadce0]" />
                <h3 className="text-base font-semibold text-[#1f1f1f]">
                  {activeNav === 'trash'
                    ? 'Trash is empty'
                    : activeNav === 'starred'
                    ? 'No starred files yet'
                    : activeNav === 'shared'
                    ? 'No files shared with you'
                    : 'A place for all your files'}
                </h3>
                <p className="text-xs text-[#747775]">
                  {activeNav === 'trash'
                    ? 'Deleted files will appear here.'
                    : activeNav === 'starred'
                    ? 'Add stars to things that you want to easily find later.'
                    : 'Upload documents, spreadsheets, and files from your computer.'}
                </p>
                {activeNav !== 'trash' && (
                  <button
                    id="drive-empty-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-full transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Folders Section */}
                {folders.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#444746] uppercase tracking-wider">
                      Folders ({folders.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {folders.map((folder) => {
                        const isSelected = selectedFile?.id === folder.id;
                        return (
                          <div
                            key={folder.id}
                            id={`drive-folder-${folder.id}`}
                            onClick={() => setSelectedFile(folder)}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#c2e7ff]/40 border-[#1a73e8] shadow-xs'
                                : 'bg-[#f8fafd] border-[#dadce0] hover:bg-[#eef2f8]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Folder className="w-5 h-5 text-[#f29900] fill-[#fef7e0] shrink-0" />
                              <span className="text-xs font-medium text-[#1f1f1f] truncate">
                                {folder.name}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleToggleStar(folder, e)}
                              className={`p-1 hover:bg-black/5 rounded-full shrink-0 ${
                                folder.starred ? 'text-[#f29900]' : 'text-transparent hover:text-[#5f6368]'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${folder.starred ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Files Section */}
                {regularFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#444746] uppercase tracking-wider">
                      Files ({regularFiles.length})
                    </h4>

                    {viewMode === 'grid' ? (
                      /* GRID VIEW (Authentic Google Drive Cards) */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {regularFiles.map((file) => {
                          const isSelected = selectedFile?.id === file.id;
                          const isDownloading = downloadingId === file.id;

                          return (
                            <div
                              key={file.id}
                              id={`drive-card-${file.id}`}
                              onClick={() => setSelectedFile(file)}
                              className={`group rounded-2xl border overflow-hidden cursor-pointer transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#c2e7ff]/30 border-[#1a73e8] shadow-md ring-2 ring-[#1a73e8]/20'
                                  : 'bg-white border-[#dadce0] hover:shadow-md hover:border-[#b0b3b8]'
                              }`}
                            >
                              {/* Card Header with Icon and Title */}
                              <div className="p-3.5 flex items-center justify-between gap-2 border-b border-[#f1f3f4]">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {getFileIcon(file.mimeType, 'w-5 h-5 shrink-0')}
                                  <span className="text-xs font-semibold text-[#1f1f1f] truncate group-hover:text-[#1a73e8]">
                                    {file.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => handleToggleStar(file, e)}
                                    className={`p-1 rounded-full hover:bg-[#e8eaed] transition-colors ${
                                      file.starred
                                        ? 'text-[#f29900]'
                                        : 'text-[#5f6368] opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={file.starred ? 'Starred' : 'Add star'}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${file.starred ? 'fill-current' : ''}`} />
                                  </button>
                                  {file.webViewLink && (
                                    <a
                                      href={file.webViewLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors"
                                      title="Open in web"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Card Body Preview Simulation */}
                              <div className="h-28 bg-[#f8fafd] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                                {file.thumbnailLink ? (
                                  <img
                                    src={file.thumbnailLink}
                                    alt={file.name}
                                    className="h-full max-w-full object-contain rounded"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="space-y-1.5 flex flex-col items-center">
                                    {getFileIcon(file.mimeType, 'w-8 h-8 opacity-75')}
                                    <span className="text-[10px] text-[#747775]">
                                      {file.mimeType.replace('application/vnd.google-apps.', 'Google ')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Card Footer: Metadata + Download & Delete actions */}
                              <div className="px-3.5 py-2.5 bg-white border-t border-[#f1f3f4] flex items-center justify-between text-[11px] text-[#5f6368]">
                                <span>
                                  {file.modifiedTime
                                    ? new Date(file.modifiedTime).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : formatFileSize(file.size)}
                                </span>

                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  {/* Download Button */}
                                  <button
                                    id={`drive-card-download-${file.id}`}
                                    onClick={(e) => handleDownload(file, e)}
                                    disabled={isDownloading}
                                    className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                                    title="Download"
                                  >
                                    {isDownloading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Trash / Delete Button */}
                                  {activeNav === 'trash' ? (
                                    <>
                                      <button
                                        onClick={(e) => handleRestore(file, e)}
                                        className="p-1.5 text-[#5f6368] hover:text-[#137333] hover:bg-[#e6f4ea] rounded-full transition-colors cursor-pointer"
                                        title="Restore"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => handleDeleteClick(file, true, e)}
                                        className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                                        title="Delete forever"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={(e) => handleDeleteClick(file, false, e)}
                                      className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                                      title="Move to Trash"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* LIST VIEW (Authentic Google Drive Table) */
                      <div className="border border-[#dadce0] rounded-2xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#f8fafd] text-[#444746] font-semibold border-b border-[#dadce0]">
                            <tr>
                              <th className="py-3 px-4">Name</th>
                              <th className="py-3 px-4 hidden sm:table-cell">Owner</th>
                              <th className="py-3 px-4 hidden md:table-cell">Last modified</th>
                              <th className="py-3 px-4 hidden lg:table-cell">File size</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f1f3f4]">
                            {regularFiles.map((file) => {
                              const isSelected = selectedFile?.id === file.id;
                              const isDownloading = downloadingId === file.id;
                              return (
                                <tr
                                  key={file.id}
                                  id={`drive-row-${file.id}`}
                                  onClick={() => setSelectedFile(file)}
                                  className={`hover:bg-[#f2f6fc] cursor-pointer transition-colors ${
                                    isSelected ? 'bg-[#c2e7ff]/30 font-medium' : ''
                                  }`}
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={(e) => handleToggleStar(file, e)}
                                        className={`p-1 rounded-full hover:bg-[#e8eaed] transition-colors shrink-0 ${
                                          file.starred ? 'text-[#f29900]' : 'text-[#dadce0] hover:text-[#5f6368]'
                                        }`}
                                        title={file.starred ? 'Starred' : 'Add star'}
                                      >
                                        <Star className={`w-3.5 h-3.5 ${file.starred ? 'fill-current' : ''}`} />
                                      </button>
                                      {getFileIcon(file.mimeType, 'w-5 h-5 shrink-0')}
                                      <span className="font-semibold text-[#1f1f1f] truncate max-w-xs md:max-w-md">
                                        {file.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-[#5f6368] hidden sm:table-cell">
                                    {file.owners?.[0]?.displayName || 'me'}
                                  </td>
                                  <td className="py-3 px-4 text-[#5f6368] hidden md:table-cell">
                                    {file.modifiedTime
                                      ? new Date(file.modifiedTime).toLocaleDateString([], {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })
                                      : '—'}
                                  </td>
                                  <td className="py-3 px-4 text-[#5f6368] hidden lg:table-cell">
                                    {formatFileSize(file.size)}
                                  </td>
                                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                      {/* Download Button */}
                                      <button
                                        id={`drive-row-download-${file.id}`}
                                        onClick={(e) => handleDownload(file, e)}
                                        disabled={isDownloading}
                                        className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                                        title="Download"
                                      >
                                        {isDownloading ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
                                        ) : (
                                          <Download className="w-3.5 h-3.5" />
                                        )}
                                      </button>

                                      {/* Open Web Link */}
                                      {file.webViewLink && (
                                        <a
                                          href={file.webViewLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors"
                                          title="Open in Drive"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}

                                      {/* Delete / Trash / Restore */}
                                      {activeNav === 'trash' ? (
                                        <>
                                          <button
                                            onClick={(e) => handleRestore(file, e)}
                                            className="p-1.5 text-[#5f6368] hover:text-[#137333] hover:bg-[#e6f4ea] rounded-full transition-colors cursor-pointer"
                                            title="Restore"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => handleDeleteClick(file, true, e)}
                                            className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                                            title="Delete forever"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={(e) => handleDeleteClick(file, false, e)}
                                          className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                                          title="Move to Trash"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* AUTHENTIC GOOGLE DRIVE RIGHT DETAILS & ACTIVITY INSPECTOR PANE */}
        {showInfoPane && selectedFile && (
          <aside className="w-72 shrink-0 bg-white rounded-2xl m-2 ml-0 p-4 border border-[#dadce0] shadow-xs flex flex-col justify-between hidden xl:flex">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f4]">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile.mimeType, 'w-5 h-5')}
                  <span className="text-xs font-bold text-[#1f1f1f] truncate max-w-[160px]">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  onClick={() => setShowInfoPane(false)}
                  className="p-1 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Large Preview Card */}
              <div className="h-36 bg-[#f8fafd] rounded-xl border border-[#dadce0] flex flex-col items-center justify-center p-4">
                {selectedFile.thumbnailLink ? (
                  <img
                    src={selectedFile.thumbnailLink}
                    alt={selectedFile.name}
                    className="max-h-full max-w-full object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    {getFileIcon(selectedFile.mimeType, 'w-12 h-12')}
                    <span className="text-[11px] font-medium text-[#444746] text-center line-clamp-2">
                      {selectedFile.name}
                    </span>
                  </div>
                )}
              </div>

              {/* File Attributes */}
              <div className="space-y-2.5 text-xs">
                <h5 className="font-bold text-[#1f1f1f]">File Details</h5>
                <div className="space-y-1.5 text-[#5f6368]">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-semibold text-[#1f1f1f] text-right truncate max-w-[130px]">
                      {selectedFile.mimeType.replace('application/vnd.google-apps.', 'Google ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span className="font-semibold text-[#1f1f1f]">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Starred</span>
                    <span className="font-semibold text-[#1f1f1f] flex items-center gap-1">
                      {selectedFile.starred ? (
                        <span className="text-[#f29900] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Yes
                        </span>
                      ) : (
                        'No'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span className="font-semibold text-[#1f1f1f]">{getSectionTitle()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner</span>
                    <span className="font-semibold text-[#1f1f1f]">
                      {selectedFile.owners?.[0]?.displayName || 'me'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modified</span>
                    <span className="font-semibold text-[#1f1f1f]">
                      {selectedFile.modifiedTime
                        ? new Date(selectedFile.modifiedTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Download, Open, Trash */}
            <div className="pt-4 border-t border-[#f1f3f4] space-y-2">
              {/* Prominent Download Button */}
              {selectedFile.mimeType !== 'application/vnd.google-apps.folder' && (
                <button
                  id="drive-details-download-btn"
                  onClick={() => handleDownload(selectedFile)}
                  disabled={downloadingId === selectedFile.id}
                  className="w-full py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  {downloadingId === selectedFile.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{downloadingId === selectedFile.id ? 'Downloading file...' : 'Download'}</span>
                </button>
              )}

              {/* Open in Google Drive button */}
              {selectedFile.webViewLink && (
                <a
                  href={selectedFile.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-[#f0f4f9] hover:bg-[#e1eaf5] text-[#1f1f1f] rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5f6368]" />
                </a>
              )}

              {/* Trash / Delete / Restore */}
              {activeNav === 'trash' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(selectedFile)}
                    className="flex-1 py-2 border border-[#b7e1cd] hover:bg-[#e6f4ea] text-[#137333] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(selectedFile, true)}
                    className="flex-1 py-2 border border-[#f5c6cb] hover:bg-[#fce8e6] text-[#d93025] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDeleteClick(selectedFile, false)}
                  className="w-full py-2 border border-[#f5c6cb] hover:bg-[#fce8e6] text-[#d93025] rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* FLOATING REAL GOOGLE DRIVE UPLOAD WIDGET (Bottom Right) */}
      {showUploadWidget && uploadQueue.length > 0 && (
        <div
          id="drive-upload-widget"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 z-50 w-auto sm:w-96 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-[#dadce0] overflow-hidden animate-in slide-in-from-bottom-5"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#1f1f1f] text-white flex items-center justify-between text-xs">
            <span className="font-semibold">
              {uploadQueue.some((i) => i.status === 'uploading')
                ? `Uploading ${uploadQueue.filter((i) => i.status === 'uploading').length} item(s)...`
                : `${uploadQueue.length} upload(s) complete`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsUploadWidgetMinimized(!isUploadWidgetMinimized)}
                className="p-1 hover:bg-white/10 rounded cursor-pointer"
                title={isUploadWidgetMinimized ? 'Expand' : 'Minimize'}
              >
                {isUploadWidgetMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowUploadWidget(false)}
                className="p-1 hover:bg-white/10 rounded cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isUploadWidgetMinimized && (
            <div className="max-h-60 overflow-y-auto divide-y divide-[#f1f3f4] p-1 text-xs">
              {uploadQueue.map((item) => (
                <div key={item.id} className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <File className="w-4 h-4 text-[#5f6368] shrink-0" />
                    <span className="truncate text-[#1f1f1f] font-medium">{item.name}</span>
                  </div>
                  <div className="shrink-0">
                    {item.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-[#1a73e8] animate-spin" />
                    )}
                    {item.status === 'done' && (
                      <CheckCircle2 className="w-4 h-4 text-[#137333]" />
                    )}
                    {item.status === 'error' && (
                      <span title={item.error || 'Upload error'}>
                        <AlertCircle className="w-4 h-4 text-[#d93025]" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW FOLDER MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-[#dadce0] space-y-4"
          >
            <h3 className="text-base font-bold text-[#1f1f1f]">New folder</h3>
            <input
              type="text"
              placeholder="Untitled folder"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 text-xs bg-white border-2 border-[#1a73e8] rounded-xl outline-none font-medium"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#444746] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderName.trim() || isCreatingFolder}
                className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
              >
                {isCreatingFolder ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={isPermanentDelete ? 'Delete forever?' : 'Move to Trash?'}
        description={
          isPermanentDelete
            ? `"${deleteTarget?.name}" will be deleted forever and you won't be able to restore it.`
            : `Move "${deleteTarget?.name}" to trash? Items in trash are deleted after 30 days.`
        }
        confirmLabel={isPermanentDelete ? 'Delete forever' : 'Move to trash'}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* EMPTY TRASH MODAL */}
      <ConfirmModal
        isOpen={showEmptyTrashModal}
        title="Empty trash?"
        description="All items in trash will be permanently deleted and cannot be restored."
        confirmLabel="Empty trash"
        isDestructive={true}
        isLoading={isEmptyingTrash}
        onConfirm={confirmEmptyTrash}
        onCancel={() => setShowEmptyTrashModal(false)}
      />
    </div>
  );
};
