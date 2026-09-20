import React, { useState, useEffect } from 'react';
import { DriveFile } from '../types/workspace';
import { searchForms, createDriveFile } from '../services/workspace';
import {
  FormQuestion,
  INITIAL_FORM_QUESTIONS,
  FormResponseItem,
  INITIAL_FORM_RESPONSES,
} from './forms/formsData';
import { FormsHeader } from './forms/FormsHeader';
import { FormsFloatingBar } from './forms/FormsFloatingBar';
import { FormsQuestionCard } from './forms/FormsQuestionCard';
import { FormsResponsesTab } from './forms/FormsResponsesTab';
import { FormsSettingsTab } from './forms/FormsSettingsTab';
import { FormsThemePanel } from './forms/FormsThemePanel';
import { FormsPreviewModal } from './forms/FormsPreviewModal';
import { FormsSendModal } from './forms/FormsSendModal';
import { DocsPickerModal } from './docs/DocsModals';

interface FormsViewProps {
  token: string;
  onBackToOverview?: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const FormsView: React.FC<FormsViewProps> = ({
  token,
  onBackToOverview,
  userName,
  userEmail,
  userPhoto,
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'settings'>('questions');
  const [formTitle, setFormTitle] = useState<string>('Untitled form');
  const [formDescription, setFormDescription] = useState<string>('Form description');
  const [questions, setQuestions] = useState<FormQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('google_forms_questions_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FORM_QUESTIONS;
  });

  const [responses, setResponses] = useState<FormResponseItem[]>(() => {
    try {
      const saved = localStorage.getItem('google_forms_responses_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FORM_RESPONSES;
  });

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    questions[0]?.id || 'q1'
  );

  // Theme configuration
  const [primaryColor, setPrimaryColor] = useState<string>('#673ab7'); // Classic Google Forms purple
  const [bgColor, setBgColor] = useState<string>('#f0ebf8');
  const [fontFamily, setFontFamily] = useState<string>("'Google Sans', Roboto, sans-serif");
  const [confirmationMessage, setConfirmationMessage] = useState<string>(
    'Your response has been recorded.'
  );

  // Status and Modals
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [showThemePanel, setShowThemePanel] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [showDrivePicker, setShowDrivePicker] = useState<boolean>(false);
  const [accessLevel, setAccessLevel] = useState<'restricted' | 'anyone'>('restricted');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  // Drive integration
  const [driveForms, setDriveForms] = useState<DriveFile[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('google_forms_questions_v2', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  useEffect(() => {
    if (token) {
      searchForms(token)
        .then((res) => setDriveForms(res))
        .catch(() => {});
    }
  }, [token]);

  // Update question
  const handleUpdateQuestion = (qId: string, updated: Partial<FormQuestion>) => {
    setIsSaved(false);
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...updated } : q))
    );
    setTimeout(() => setIsSaved(true), 800);
  };

  // Add question
  const handleAddQuestion = () => {
    const newQ: FormQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: 'Untitled Question',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: `opt-1-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, text: 'Option 1' },
      ],
      required: false,
    };
    const activeIdx = questions.findIndex((q) => q.id === activeQuestionId);
    const updated = [...questions];
    if (activeIdx >= 0) {
      updated.splice(activeIdx + 1, 0, newQ);
    } else {
      updated.push(newQ);
    }
    setQuestions(updated);
    setActiveQuestionId(newQ.id);
  };

  // Duplicate question
  const handleDuplicateQuestion = (qId: string) => {
    const source = questions.find((q) => q.id === qId);
    if (!source) return;
    const dup: FormQuestion = {
      ...source,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${source.title} (Copy)`,
      options: source.options.map((o) => ({ ...o, id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` })),
    };
    const activeIdx = questions.findIndex((q) => q.id === qId);
    const updated = [...questions];
    updated.splice(activeIdx + 1, 0, dup);
    setQuestions(updated);
    setActiveQuestionId(dup.id);
  };

  // Delete question
  const handleDeleteQuestion = (qId: string) => {
    if (questions.length <= 1) return;
    const filtered = questions.filter((q) => q.id !== qId);
    setQuestions(filtered);
    setActiveQuestionId(filtered[0]?.id || '');
  };

  return (
    <div
      id="google-forms-app"
      className="flex flex-col h-full min-h-0 md:h-[calc(100dvh-5.5rem)] rounded-2xl overflow-hidden border border-[#dadce0] shadow-sm relative select-text"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* 1. AUTHENTIC GOOGLE FORMS HEADER (Logo, Title, Tabs, Palette, Preview, Undo, Send) */}
      <FormsHeader
        title={formTitle}
        onTitleChange={(t) => {
          setFormTitle(t);
          setIsSaved(false);
          setTimeout(() => setIsSaved(true), 800);
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        responseCount={responses.length}
        isStarred={isStarred}
        onToggleStar={() => setIsStarred(!isStarred)}
        isSaved={isSaved}
        onOpenThemePanel={() => setShowThemePanel(!showThemePanel)}
        onOpenPreview={() => setShowPreviewModal(true)}
        onOpenSendModal={() => setShowSendModal(true)}
        onBackToOverview={onBackToOverview}
        primaryColor={primaryColor}
        onOpenPicker={() => setShowDrivePicker(true)}
        accessLevel={accessLevel}
        userName={userName}
        userEmail={userEmail}
        userPhoto={userPhoto}
      />

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center relative">
        <div className="flex items-start gap-4 w-full max-w-[770px] relative">
          {/* TAB 1: QUESTIONS EDITOR */}
          {activeTab === 'questions' && (
            <div className="flex-1 space-y-4">
              {/* TOP HEADER CARD WITH THICK COLOR ACCENT */}
              <div className="bg-white rounded-xl border border-[#dadce0] shadow-2xs overflow-hidden">
                <div
                  className="h-2.5 w-full transition-colors"
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="p-6 space-y-3">
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      setIsSaved(false);
                      setTimeout(() => setIsSaved(true), 800);
                    }}
                    placeholder="Form title"
                    className="w-full text-3xl font-bold text-[#1f1f1f] bg-transparent outline-none border-b border-transparent focus:border-[#1a73e8] pb-1 transition-colors"
                  />
                  <textarea
                    value={formDescription}
                    onChange={(e) => {
                      setFormDescription(e.target.value);
                      setIsSaved(false);
                      setTimeout(() => setIsSaved(true), 800);
                    }}
                    placeholder="Form description"
                    rows={2}
                    className="w-full text-sm text-[#444746] bg-transparent outline-none border-b border-transparent focus:border-[#1a73e8] py-1 resize-none transition-colors leading-relaxed"
                  />
                </div>
              </div>

              {/* QUESTIONS CARDS LIST */}
              <div className="space-y-4">
                {questions.map((q) => (
                  <FormsQuestionCard
                    key={q.id}
                    question={q}
                    isActive={q.id === activeQuestionId}
                    onActivate={() => setActiveQuestionId(q.id)}
                    onUpdate={(updated) => handleUpdateQuestion(q.id, updated)}
                    onDuplicate={() => handleDuplicateQuestion(q.id)}
                    onDelete={() => handleDeleteQuestion(q.id)}
                    primaryColor={primaryColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RESPONSES DASHBOARD */}
          {activeTab === 'responses' && (
            <FormsResponsesTab
              questions={questions}
              primaryColor={primaryColor}
              responses={responses}
            />
          )}

          {/* TAB 3: SETTINGS DASHBOARD */}
          {activeTab === 'settings' && (
            <FormsSettingsTab
              confirmationMessage={confirmationMessage}
              onConfirmationMessageChange={setConfirmationMessage}
              primaryColor={primaryColor}
            />
          )}

          {/* THE SIGNATURE FLOATING RIGHT ACTION BAR (When on Questions Tab) */}
          {activeTab === 'questions' && (
            <FormsFloatingBar
              onAddQuestion={handleAddQuestion}
              onAddTitle={() => {
                setFormDescription((prev) => prev + '\n\nSection Title');
              }}
              onAddImage={() => {
                alert('Add image to form from Google Drive');
              }}
            />
          )}
        </div>

        {/* Right Slide-out Theme Options Panel */}
        {showThemePanel && (
          <FormsThemePanel
            currentColor={primaryColor}
            onColorChange={(p, b) => {
              setPrimaryColor(p);
              setBgColor(b);
            }}
            fontFamily={fontFamily}
            onFontChange={setFontFamily}
            onClose={() => setShowThemePanel(false)}
          />
        )}
      </div>

      {/* 3. MODALS */}
      <FormsPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={formTitle}
        description={formDescription}
        questions={questions}
        primaryColor={primaryColor}
        bgColor={bgColor}
        fontFamily={fontFamily}
        confirmationMessage={confirmationMessage}
      />

      <FormsSendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        formTitle={formTitle}
        primaryColor={primaryColor}
        accessLevel={accessLevel}
        onAccessLevelChange={setAccessLevel}
      />

      <DocsPickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        docs={driveForms}
        onSelectDoc={(file) => {
          setSelectedFile(file);
          setFormTitle(file.name);
        }}
        onNewDoc={() => {
          setFormTitle('Untitled form');
          setQuestions(INITIAL_FORM_QUESTIONS);
        }}
        appType="forms"
      />
    </div>
  );
};
