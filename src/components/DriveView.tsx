import React, { useState, useEffect, useRef } from 'react';
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
  Filter,
} from 'lucide-react';
import { DriveFile } from '../types/workspace';
import { listDriveFiles, deleteDriveFile, uploadDriveFile, createDriveFolder } from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleDriveIcon } from './GoogleIcons';

interface DriveViewProps {
  token: string;
  onBackToOverview?: () => void;
}

export const DriveView: React.FC<DriveViewProps> = ({ token, onBackToOverview }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Folder state
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // File Details Preview Modal
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadFiles = async (query?: string, category = selectedCategory) => {
    setLoading(true);
    setError(null);
    try {
      let mimeFilter: string | undefined = undefined;
      if (category === 'documents') mimeFilter = 'document';
      else if (category === 'spreadsheets') mimeFilter = 'spreadsheet';
      else if (category === 'presentations') mimeFilter = 'presentation';
      else if (category === 'images') mimeFilter = 'image';
      else if (category === 'folders') mimeFilter = 'folder';

      const data = await listDriveFiles(token, query, mimeFilter);
      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Google Drive files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(searchQuery, selectedCategory);
  }, [token, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery, selectedCategory);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadDriveFile(token, file);
      setSuccessMsg(`Successfully uploaded "${file.name}" to Google Drive!`);
      loadFiles(searchQuery, selectedCategory);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file to Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFileUpload(file);
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
      loadFiles(searchQuery, selectedCategory);
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(token, deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      if (previewFile?.id === deleteTarget.id) setPreviewFile(null);
      setDeleteTarget(null);
      setSuccessMsg('File deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('spreadsheet'))
      return <FileSpreadsheet className="w-5 h-5 text-[#188038]" />;
    if (mimeType.includes('document')) return <FileText className="w-5 h-5 text-[#1a73e8]" />;
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-[#f29900] fill-[#fef7e0]" />;
    if (mimeType.includes('image')) return <FileImage className="w-5 h-5 text-[#d93025]" />;
    return <File className="w-5 h-5 text-[#5f6368]" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      id="drive-view"
      className="space-y-6"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Google Drive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="drive-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1f1f1f] hover:text-[#1a73e8] bg-[#f0f4f9] hover:bg-[#e8f0fe] border border-[#dadce0] rounded-full transition-all cursor-pointer shrink-0"
              title="Return to Workspace Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-[#5f6368]" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="p-2 bg-[#f8fafd] border border-[#dadce0] rounded-2xl shrink-0 flex items-center justify-center">
            <GoogleDriveIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1f1f1f] tracking-tight font-['Google_Sans',Roboto,sans-serif]">Google Drive</h2>
            <p className="text-xs text-[#5f6368]">Cloud storage files, documents & file upload</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="drive-upload-file-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-full shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>

          <button
            id="drive-new-folder-btn"
            onClick={() => setShowFolderModal(true)}
            className="px-3.5 py-2 bg-[#f0f4f9] hover:bg-[#e8f0fe] text-[#1f1f1f] text-xs font-semibold rounded-full border border-[#dadce0] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-[#f29900]" />
            <span>New Folder</span>
          </button>

          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full border border-[#dadce0] transition-colors cursor-pointer"
            title="Open official Google Drive Web App"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Drag & Drop Overlay Banner */}
      {isDragging && (
        <div className="p-6 bg-[#e8f0fe] border-2 border-dashed border-[#1a73e8] rounded-3xl text-center text-[#1a73e8] font-semibold text-sm animate-pulse">
          Drop files here to upload directly to Google Drive!
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#fce8e6] border border-[#f5c6cb] text-[#d93025] rounded-2xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#e6f4ea] border border-[#ceead6] text-[#188038] rounded-2xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="underline font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#dadce0]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'documents', label: 'Docs' },
            { id: 'spreadsheets', label: 'Sheets' },
            { id: 'presentations', label: 'Slides' },
            { id: 'images', label: 'Images' },
            { id: 'folders', label: 'Folders' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#c2e7ff] text-[#001d35]'
                  : 'bg-[#f0f4f9] text-[#444746] hover:bg-[#e8f0fe]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#5f6368] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="drive-search-input"
              type="text"
              placeholder="Search in Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-1.5 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#1a73e8] rounded-full text-[#1f1f1f] placeholder:text-[#5f6368] focus:bg-white transition-all outline-none"
            />
          </div>
          <button
            id="drive-refresh-btn"
            type="button"
            onClick={() => loadFiles(searchQuery, selectedCategory)}
            disabled={loading}
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer shrink-0"
            title="Refresh Drive files"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1a73e8]' : ''}`} />
          </button>
        </form>
      </div>

      {/* Files list */}
      <div className="bg-white rounded-3xl border border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#5f6368]">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1a73e8]" />
            <p className="text-sm font-medium">Loading Google Drive files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center text-[#5f6368]">
            <Folder className="w-12 h-12 stroke-1 mx-auto mb-3 text-[#9aa0a6]" />
            <p className="text-sm font-semibold text-[#1f1f1f]">No files found</p>
            <p className="text-xs text-[#5f6368] mt-1">
              {searchQuery ? 'Try a different search query' : 'Upload a file or create a folder to get started!'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-[#1a73e8] text-white text-xs font-semibold rounded-full hover:bg-[#1557b0] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" /> Upload First File
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafd] text-[#444746] text-xs font-semibold border-b border-[#dadce0]">
                <tr>
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-4 hidden md:table-cell">Last Modified</th>
                  <th className="py-3 px-4 hidden sm:table-cell">File Size</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    id={`drive-file-${file.id}`}
                    onClick={() => setPreviewFile(file)}
                    className="hover:bg-[#f8fafd] transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-[#f8fafd] rounded-xl border border-[#dadce0]">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-[#1f1f1f] group-hover:text-[#1a73e8] transition-colors block truncate max-w-xs md:max-w-md">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-[#5f6368] truncate block">
                            {file.mimeType.replace('application/vnd.google-apps.', 'Google ')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5f6368] text-xs hidden md:table-cell">
                      {file.modifiedTime
                        ? new Date(file.modifiedTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#5f6368] text-xs hidden sm:table-cell">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          id={`delete-file-${file.id}`}
                          onClick={() => setDeleteTarget(file)}
                          className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File Details Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#f1f3f4] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f8fafd] rounded-2xl border border-[#dadce0]">
                  {getFileIcon(previewFile.mimeType)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1f1f1f] truncate max-w-xs">{previewFile.name}</h3>
                  <p className="text-xs text-[#5f6368]">
                    {previewFile.mimeType.replace('application/vnd.google-apps.', 'Google ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-[#5f6368] hover:text-[#1f1f1f] p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#444746]">
              <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                <span className="font-semibold text-[#5f6368]">File ID:</span>
                <span className="font-mono text-[11px] truncate max-w-[200px]">{previewFile.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                <span className="font-semibold text-[#5f6368]">File Size:</span>
                <span>{formatFileSize(previewFile.size)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                <span className="font-semibold text-[#5f6368]">Last Modified:</span>
                <span>
                  {previewFile.modifiedTime
                    ? new Date(previewFile.modifiedTime).toLocaleString()
                    : '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setDeleteTarget(previewFile);
                  setPreviewFile(null);
                }}
                className="px-3 py-2 text-xs font-semibold text-[#d93025] hover:bg-[#fce8e6] rounded-full border border-[#f5c6cb]"
              >
                Delete File
              </button>
              {previewFile.webViewLink && (
                <a
                  href={previewFile.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-full flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in Drive
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-sm bg-white rounded-3xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-3">
              <h3 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#f29900]" /> Create New Folder
              </h3>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="text-[#5f6368] hover:text-[#1f1f1f] p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#444746] mb-1">
                Folder Name
              </label>
              <input
                type="text"
                placeholder="New Folder"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                className="w-full px-4 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#1a73e8] rounded-full focus:bg-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-slate-100 rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderName.trim() || isCreatingFolder}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full disabled:opacity-50"
              >
                {isCreatingFolder ? 'Creating...' : 'Create Folder'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation modal for file deletion */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Google Drive File"
        description={`Are you sure you want to delete "${deleteTarget?.name}" from Google Drive? This will move the item to the trash.`}
        confirmLabel="Yes, Delete File"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
