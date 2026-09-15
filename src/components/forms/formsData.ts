export interface FormOption {
  id: string;
  text: string;
}

export interface FormQuestion {
  id: string;
  title: string;
  type: 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'SHORT_ANSWER' | 'PARAGRAPH' | 'DROPDOWN' | 'LINEAR_SCALE';
  options: FormOption[];
  required: boolean;
  helpText?: string;
}

export interface FormThemeConfig {
  primaryColor: string;
  bgColor: string;
  fontFamily: string;
}

export const FORM_COLOR_PALETTES = [
  { name: 'Classic Purple', primary: '#673ab7', bg: '#f0ebf8' },
  { name: 'Indigo', primary: '#3f51b5', bg: '#eceef8' },
  { name: 'Google Blue', primary: '#1a73e8', bg: '#f0f4f9' },
  { name: 'Teal', primary: '#00796b', bg: '#e0f2f1' },
  { name: 'Green', primary: '#2e7d32', bg: '#e8f5e9' },
  { name: 'Amber Orange', primary: '#e65100', bg: '#fff3e0' },
  { name: 'Crimson', primary: '#c2185b', bg: '#fce4ec' },
  { name: 'Graphite Slate', primary: '#424242', bg: '#eeeeee' },
];

export const INITIAL_FORM_QUESTIONS: FormQuestion[] = [
  {
    id: 'q1',
    title: 'Untitled Question',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt-1', text: 'Option 1' },
    ],
    required: false,
  },
];

export interface FormResponseItem {
  id: string;
  timestamp: string;
  email?: string;
  answers: Record<string, string | string[]>;
}

export const INITIAL_FORM_RESPONSES: FormResponseItem[] = [];
