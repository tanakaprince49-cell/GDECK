import React, { useState } from 'react';
import {
  Languages,
  ArrowRightLeft,
  Copy,
  Volume2,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GoogleTranslateIcon } from './GoogleIcons';

interface TranslateViewProps {
  onBackToOverview?: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

const DICTIONARY_MOCK: Record<string, Record<string, string>> = {
  'hello': {
    es: 'Hola',
    fr: 'Bonjour',
    de: 'Hallo',
    it: 'Ciao',
    ja: 'こんにちは',
    zh: '你好',
    pt: 'Olá',
    ar: 'مرحبا',
    hi: 'नमस्ते',
  },
  'welcome to google workspace': {
    es: 'Bienvenido a Google Workspace',
    fr: 'Bienvenue sur Google Workspace',
    de: 'Willkommen bei Google Workspace',
    it: 'Benvenuti in Google Workspace',
    ja: 'Google Workspace へようこそ',
    zh: '欢迎使用 Google Workspace',
    pt: 'Bem-vindo ao Google Workspace',
    ar: 'مرحبًا بك في Google Workspace',
    hi: 'Google Workspace में आपका स्वागत है',
  },
};

export const TranslateView: React.FC<TranslateViewProps> = ({ onBackToOverview }) => {
  const [sourceLang, setSourceLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('es');
  const [inputText, setInputText] = useState<string>('Welcome to Google Workspace');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute translation
  const getTranslation = (): string => {
    if (!inputText.trim()) return '';
    const key = inputText.trim().toLowerCase();
    if (DICTIONARY_MOCK[key] && DICTIONARY_MOCK[key][targetLang]) {
      return DICTIONARY_MOCK[key][targetLang];
    }
    // Simple mock translation generator for phrases
    return `[${targetLang.toUpperCase()}] ${inputText}`;
  };

  const translatedText = getTranslation();

  const handleSwap = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText.replace(/^\[[A-Z]+\]\s*/, ''));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div id="translate-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-blue-500/10 border border-blue-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleTranslateIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Translate</h2>
            <p className="text-sm text-slate-500">Real-time multi-language neural translation & voice audio</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://translate.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <span>Open Google Translate</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Translation Dual-Pane Workspace */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-6 space-y-4">
        {/* Language Selectors Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs focus:outline-hidden"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
            title="Swap Languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 flex-1 max-w-xs justify-end">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs focus:outline-hidden"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Box */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste text here to translate..."
                rows={8}
                className="w-full p-4 bg-white/90 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-inner resize-none"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(inputText)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Listen"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 px-1">
              <span>{inputText.length} characters</span>
            </div>
          </div>

          {/* Target Box */}
          <div className="space-y-2">
            <div className="relative">
              <div className="w-full h-[208px] p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-slate-900 text-sm overflow-y-auto font-medium">
                {translatedText || <span className="text-slate-400">Translation will appear here</span>}
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(translatedText)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg cursor-pointer"
                  title="Listen Translation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg cursor-pointer flex items-center gap-1 text-xs"
                  title="Copy Translation"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
