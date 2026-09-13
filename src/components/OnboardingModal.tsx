import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Briefcase,
  Layers,
  Layout,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  GoogleDriveIcon,
  GoogleSheetsIcon,
  GmailIcon,
  GoogleCalendarIcon,
  GoogleTasksIcon,
  GoogleChatIcon,
  GoogleContactsIcon,
  GoogleMeetIcon,
  GoogleFormsIcon,
  GoogleKeepIcon,
  GoogleMessagesIcon,
} from './GoogleIcons';

export interface OnboardingPreferences {
  userName: string;
  role: string;
  tabCount: string;
  anchorTools: string[];
  defaultView: string;
  theme: 'light';
  highDensity: boolean;
  completed: boolean;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (prefs: OnboardingPreferences) => void;
  onClose?: () => void;
  initialTheme?: string;
}

const ROLES = [
  {
    id: 'founder',
    title: 'Startup Founder / Executive',
    subtitle: 'Default layout: Overview & Calendar focus',
    defaultTools: ['calendar', 'gmail', 'drive'],
  },
  {
    id: 'developer',
    title: 'Software Engineer / Developer',
    subtitle: 'Default layout: Tasks, Sheets & Drive focus',
    defaultTools: ['tasks', 'sheets', 'drive'],
  },
  {
    id: 'pm',
    title: 'Project / Product Manager',
    subtitle: 'Default layout: Tasks, Chat & Meet focus',
    defaultTools: ['tasks', 'chat', 'meet'],
  },
  {
    id: 'ops',
    title: 'Operations / Admin',
    subtitle: 'Default layout: Forms, Contacts & Gmail focus',
    defaultTools: ['forms', 'contacts', 'gmail'],
  },
  {
    id: 'other',
    title: 'Other',
    subtitle: 'Custom flexible workflow setup',
    defaultTools: ['calendar', 'tasks', 'gmail'],
  },
];

const TAB_OPTIONS = [
  {
    id: '1-5',
    label: '1–5 tabs',
    desc: 'Light daily browsing overhead',
  },
  {
    id: '6-15',
    label: '6–15 tabs',
    desc: 'Frequent window swapping across tools',
  },
  {
    id: '16+',
    label: '16+ tabs',
    desc: 'Severe context-switching & browser memory strain',
    highDensityTrigger: true,
  },
];

const WORKSPACE_TOOLS = [
  { id: 'calendar', name: 'Google Calendar', icon: GoogleCalendarIcon },
  { id: 'tasks', name: 'Google Tasks', icon: GoogleTasksIcon },
  { id: 'gmail', name: 'Gmail', icon: GmailIcon },
  { id: 'messages', name: 'Google Messages', icon: GoogleMessagesIcon },
  { id: 'drive', name: 'Google Drive', icon: GoogleDriveIcon },
  { id: 'sheets', name: 'Google Sheets', icon: GoogleSheetsIcon },
  { id: 'meet', name: 'Google Meet', icon: GoogleMeetIcon },
  { id: 'chat', name: 'Google Chat', icon: GoogleChatIcon },
  { id: 'contacts', name: 'Google Contacts', icon: GoogleContactsIcon },
  { id: 'forms', name: 'Google Forms', icon: GoogleFormsIcon },
  { id: 'keep', name: 'Google Keep', icon: GoogleKeepIcon },
];

const LAYOUT_PREFERENCES = [
  {
    id: 'overview',
    title: 'Pinned Executive Deck',
    desc: 'Display only your favored, pinned tools with live action cards and quick sync.',
  },
  {
    id: 'high-density',
    title: 'High-Density Command Center',
    desc: 'Compact layouts with maximum information density across all services.',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  // Answers State
  const [userName, setUserName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('founder');
  const [selectedTabCount, setSelectedTabCount] = useState<string>('6-15');
  const [selectedAnchorTools, setSelectedAnchorTools] = useState<string[]>([
    'calendar',
    'gmail',
    'tasks',
  ]);
  const [selectedDefaultView, setSelectedDefaultView] = useState<string>('overview');

  if (!isOpen) return null;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const roleObj = ROLES.find((r) => r.id === roleId);
    if (roleObj && roleObj.defaultTools) {
      setSelectedAnchorTools(roleObj.defaultTools);
    }
  };

  const handleToggleTool = (toolId: string) => {
    if (selectedAnchorTools.includes(toolId)) {
      setSelectedAnchorTools(selectedAnchorTools.filter((id) => id !== toolId));
    } else {
      if (selectedAnchorTools.length >= 3) {
        setSelectedAnchorTools([...selectedAnchorTools.slice(1), toolId]);
      } else {
        setSelectedAnchorTools([...selectedAnchorTools, toolId]);
      }
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const finishOnboarding = () => {
    const prefs: OnboardingPreferences = {
      userName,
      role: selectedRole,
      tabCount: selectedTabCount,
      anchorTools: selectedAnchorTools,
      defaultView: selectedDefaultView,
      theme: 'light',
      highDensity: selectedTabCount === '16+' || selectedDefaultView === 'high-density',
      completed: true,
    };
    onComplete(prefs);
  };

  return (
    <div
      id="onboarding-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        id="onboarding-modal-container"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Progress Bar */}
        <div className="p-6 sm:p-7 border-b border-slate-100 relative bg-slate-50/50">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  Workspace Setup
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Tailor Your GDECK Experience
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
                Step {step} of {totalSteps}
              </span>
              {onClose && (
                <button
                  id="onboarding-close-btn"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-colors cursor-pointer"
                  title="Close and finish later"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#fbe618] to-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Modal Body - Step Contents */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Primary Role & Use Case */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5" /> Question 1 of 4
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="E.g. Sarah"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all mb-4 text-xs font-medium"
                  />
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  Primary Role & Daily Workflow
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  What best describes how you utilize Google Workspace?
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      id={`onboarding-role-${role.id}`}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-400 shadow-xs text-slate-900'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-bold ${
                              isSelected ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            {role.title}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{role.subtitle}</p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-amber-500 bg-[#fbe618] text-[#0B0F17]'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Tab Overhead */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" /> Question 2 of 4
                </div>
                <h4 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                  Tab Overhead & Multitasking
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  How many Google Workspace tabs do you typically keep open simultaneously?
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {TAB_OPTIONS.map((opt) => {
                  const isSelected = selectedTabCount === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`onboarding-tab-${opt.id}`}
                      onClick={() => setSelectedTabCount(opt.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-400 shadow-xs text-slate-900'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-base font-bold ${
                            isSelected ? 'text-amber-800' : 'text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-amber-500 bg-[#fbe618] text-[#0B0F17]'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}

                {selectedTabCount === '16+' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <Zap className="w-4 h-4 text-amber-600" />
                      High-Density Command Layout Enabled
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      GDECK will automatically apply high-density layouts to consolidate all your tasks, calendar events, and drive docs into a unified workspace.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Primary Anchor Tools */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" /> Question 3 of 4
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                    Primary Anchor Tools
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Which Google Workspace tools do you live in most?
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                    {selectedAnchorTools.length}/3 selected
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 pt-2">
                {WORKSPACE_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isChecked = selectedAnchorTools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      id={`onboarding-tool-${tool.id}`}
                      onClick={() => handleToggleTool(tool.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-amber-50/70 border-amber-400 shadow-xs text-slate-900'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-6 h-6 shrink-0 object-contain" />
                        <span className="text-xs font-bold truncate">{tool.name}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-[#fbe618] border-amber-500 text-[#0B0F17]'
                            : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Default Deck Organization */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <Layout className="w-3.5 h-3.5" /> Question 4 of 4
                </div>
                <h4 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                  Dashboard Organization
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Select your preferred deck presentation mode:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {LAYOUT_PREFERENCES.map((layout) => {
                  const isSelected = selectedDefaultView === layout.id;
                  return (
                    <button
                      key={layout.id}
                      id={`onboarding-layout-${layout.id}`}
                      onClick={() => setSelectedDefaultView(layout.id)}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-400 shadow-xs text-slate-900'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="space-y-1">
                          <p
                            className={`text-sm font-bold ${
                              isSelected ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            {layout.title}
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed">{layout.desc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-amber-500 bg-[#fbe618] text-[#0B0F17]'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="w-full p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-600">
                        <span>Workspace Mode</span>
                        <div className="w-2 h-2 rounded-full bg-[#fbe618]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-5 sm:p-6 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <button
            id="onboarding-back-btn"
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              step === 1
                ? 'opacity-0 pointer-events-none'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            <button
              id="onboarding-skip-btn"
              onClick={finishOnboarding}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-200/50 font-semibold transition-colors cursor-pointer"
            >
              Skip & Start
            </button>
            <button
              id="onboarding-next-btn"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-[#fbe618] hover:bg-[#ffe600] text-[#0B0F17] font-black text-xs flex items-center gap-2 shadow-[0_4px_16px_rgba(251,230,24,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {step === totalSteps ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Launch GDECK
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
