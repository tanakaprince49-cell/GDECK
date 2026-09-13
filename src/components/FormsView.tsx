import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { DriveFile, FormDetails, FormResponse } from '../types/workspace';
import { searchForms, getFormDetails, getFormResponses, createDriveFile } from '../services/workspace';
import { Plus, X, FileText as FormIcon } from 'lucide-react';
import { GoogleFormsIcon } from './GoogleIcons';

interface FormsViewProps {
  token: string;
  onBackToOverview?: () => void;
}

export const FormsView: React.FC<FormsViewProps> = ({ token, onBackToOverview }) => {
  const [forms, setForms] = useState<DriveFile[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [customIdInput, setCustomIdInput] = useState<string>('');

  const [formDetails, setFormDetails] = useState<FormDetails | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Form modal state
  const [showCreateFormModal, setShowCreateFormModal] = useState<boolean>(false);
  const [newFormTitle, setNewFormTitle] = useState<string>('');
  const [isCreatingForm, setIsCreatingForm] = useState<boolean>(false);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) return;
    setIsCreatingForm(true);
    setError(null);
    try {
      const created = await createDriveFile(
        token,
        newFormTitle.trim(),
        'application/vnd.google-apps.form'
      );
      setForms([created, ...forms]);
      setSelectedFormId(created.id);
      setSuccessMsg(`Form "${newFormTitle}" created!`);
      setShowCreateFormModal(false);
      setNewFormTitle('');
    } catch (err: any) {
      setError(err.message || 'Failed to create form');
    } finally {
      setIsCreatingForm(false);
    }
  };

  const loadForms = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await searchForms(token);
      setForms(data);
      if (data.length > 0 && !selectedFormId) {
        setSelectedFormId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list Google Forms');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [token]);

  useEffect(() => {
    if (!selectedFormId) return;

    const fetchForm = async () => {
      setLoadingDetails(true);
      setError(null);
      try {
        const [details, respList] = await Promise.all([
          getFormDetails(token, selectedFormId),
          getFormResponses(token, selectedFormId).catch(() => []),
        ]);
        setFormDetails(details);
        setResponses(respList);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch form structure and responses');
        setFormDetails(null);
        setResponses([]);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchForm();
  }, [selectedFormId, token]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let id = customIdInput.trim();
    const match = id.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      id = match[1];
    }
    if (id) {
      setSelectedFormId(id);
    }
  };

  return (
    <div id="forms-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="forms-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-purple-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-purple-500/10 border border-purple-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleFormsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Forms</h2>
            <p className="text-sm text-slate-500">Inspect survey forms, question items, and user submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateFormModal(true)}
            className="px-4 py-2 bg-[#7248b9] hover:bg-[#5c379a] text-white text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Form</span>
          </button>
          {selectedFormId && (
            <a
              href={`https://docs.google.com/forms/d/${selectedFormId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-slate-600 hover:text-purple-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
              title="Open Form in Google Forms"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={loadForms}
            disabled={loadingList}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Refresh forms"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin text-purple-600' : ''}`} />
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

      {/* Form selector */}
      <div className="bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select from your Drive forms:
            </label>
            <select
              id="form-select"
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="w-full text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl px-3.5 py-2.5 text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
            >
              {forms.length === 0 ? (
                <option value="">No forms found in Drive</option>
              ) : (
                forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="sm:w-72">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Or paste Form ID or URL:
            </label>
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input
                id="custom-form-id-input"
                type="text"
                placeholder="ID or forms URL..."
                value={customIdInput}
                onChange={(e) => setCustomIdInput(e.target.value)}
                className="flex-1 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl px-3.5 py-2.5 text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
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
      </div>

      {/* Form Content Display */}
      {loadingDetails ? (
        <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
          <p className="text-sm font-medium">Loading form questions and responses...</p>
        </div>
      ) : formDetails ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Questions column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] p-6 sm:p-7">
              <div className="border-b border-slate-200/60 pb-4 mb-4">
                <h3 className="text-xl font-bold text-slate-900">{formDetails.info.title}</h3>
                {formDetails.info.description && (
                  <p className="text-sm text-slate-600 mt-1.5">{formDetails.info.description}</p>
                )}
                {formDetails.responderUri && (
                  <div className="mt-3">
                    <a
                      href={formDetails.responderUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                    >
                      Fill Out Form Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Questions ({formDetails.items?.length || 0})
              </h4>

              <div className="space-y-3">
                {formDetails.items?.map((item, index) => (
                  <div
                    key={item.itemId}
                    className="p-4 rounded-2xl border border-white/80 bg-white/60 shadow-2xs space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono font-bold text-purple-600 px-2 py-0.5 bg-purple-50 rounded-lg border border-purple-200/60">
                        Q{index + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-800">
                        {item.title || '(Untitled Question)'}
                      </p>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 pl-7">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submissions column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-purple-600" /> Responses ({responses.length})
                </h4>
              </div>

              {responses.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <HelpCircle className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No responses recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Share your form link to collect responses
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto">
                  {responses.map((resp, idx) => (
                    <div
                      key={resp.responseId}
                      className="p-3.5 rounded-2xl border border-white/80 bg-white/60 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-medium text-slate-700">
                        <span className="font-bold text-purple-700">Submission #{idx + 1}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(resp.lastSubmittedTime).toLocaleString()}
                        </span>
                      </div>

                      {resp.answers && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                          {Object.entries(resp.answers).map(([qId, ans]: [string, any]) => (
                            <div key={qId} className="bg-white/80 p-2.5 rounded-xl border border-white/90">
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Question ID: {qId}
                              </span>
                              <p className="text-slate-800 font-medium">
                                {ans.textAnswers?.answers?.map((a: { value: string }) => a.value).join(', ') || '—'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No Google Form selected</p>
          <p className="text-xs text-slate-400 mt-1">
            Choose a form from your Drive list or paste a Form ID above
          </p>
        </div>
      )}
      {/* New Form Creation Modal */}
      {showCreateFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateForm}
            className="w-full max-w-sm bg-white rounded-3xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-3">
              <h3 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-2">
                <FormIcon className="w-4 h-4 text-[#7248b9]" /> Create New Google Form
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateFormModal(false)}
                className="text-[#5f6368] hover:text-[#1f1f1f] p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#444746] mb-1">
                Form Title
              </label>
              <input
                type="text"
                placeholder="Untitled Form"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                autoFocus
                className="w-full px-4 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#7248b9] rounded-full focus:bg-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateFormModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-slate-100 rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFormTitle.trim() || isCreatingForm}
                className="px-5 py-2 text-xs font-bold text-white bg-[#7248b9] hover:bg-[#5c379a] rounded-full disabled:opacity-50"
              >
                {isCreatingForm ? 'Creating...' : 'Create Form'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
