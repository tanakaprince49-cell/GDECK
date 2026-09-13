import React from 'react';
import {
  Video,
  Plus,
  ExternalLink,
  ArrowLeft,
  PlaySquare,
  HelpCircle,
  UploadCloud,
} from 'lucide-react';
import { YouTubeStudioIcon } from './GoogleIcons';

interface YouTubeStudioViewProps {
  onBackToOverview?: () => void;
}

export const YouTubeStudioView: React.FC<YouTubeStudioViewProps> = ({ onBackToOverview }) => {
  return (
    <div id="youtube-studio-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-red-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-red-500/10 border border-red-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <YouTubeStudioIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">YouTube Studio</h2>
            <p className="text-sm text-slate-500">Channel analytics, video management & audience engagement</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://studio.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs border border-red-500/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <PlaySquare className="w-4 h-4" />
            <span>Open YouTube Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Truthful Not Connected State */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-xs">
          <YouTubeStudioIcon className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            No YouTube Channel Uploads Found
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            There are no uploaded videos or channel analytics detected for this Google Account. YouTube Studio is where creators publish content, review watch time, and interact with viewers.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-red-600" />
            <span>Manage your YouTube Channel</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Open <strong>YouTube Studio</strong> with your Google credentials.</li>
            <li>Click <strong>Create</strong> or <strong>Upload Video</strong> to publish your first video, Short, or Podcast.</li>
            <li>Monitor real-time audience views, retention graphs, and subscriber growth.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://studio.youtube.com/channel/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Video to YouTube</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://studio.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Open Studio Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  );
};
