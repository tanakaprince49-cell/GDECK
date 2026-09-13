import React from 'react';
import {
  GraduationCap,
  Plus,
  ExternalLink,
  ArrowLeft,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { GoogleClassroomIcon } from './GoogleIcons';

interface ClassroomViewProps {
  onBackToOverview?: () => void;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({ onBackToOverview }) => {
  return (
    <div id="classroom-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-emerald-500/10 border border-emerald-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleClassroomIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Classroom</h2>
            <p className="text-sm text-slate-500">Curriculum management, class streams, assignments & grading</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://classroom.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <span>Open Classroom Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Truthful Not Connected / Empty State */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <GoogleClassroomIcon className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            No Active Google Classroom Courses Found
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            You are not currently enrolled in or instructing any active courses on this Google Account. Google Classroom connects teachers and students to organize classwork and submit assignments.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Getting started with Google Classroom</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Visit <strong>Google Classroom</strong> in your browser.</li>
            <li>Click the <strong className="text-emerald-700">+</strong> icon in the top corner.</li>
            <li>Select <strong>Create Class</strong> to teach or <strong>Join Class</strong> using a teacher's class code.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://classroom.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to Google Classroom</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
