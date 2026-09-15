export interface SlideElement {
  id: string;
  type: 'title' | 'subtitle' | 'body' | 'image' | 'shape';
  content: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SlideItem {
  id: string;
  layout: 'title-slide' | 'section-header' | 'title-body' | 'two-columns' | 'blank' | 'big-number';
  title: string;
  subtitle?: string;
  bodyText?: string;
  col2Text?: string;
  bigNumber?: string;
  bigNumberLabel?: string;
  speakerNotes?: string;
  backgroundColor?: string;
  themeId: string;
}

export interface SlideTheme {
  id: string;
  name: string;
  bgColor: string;
  titleColor: string;
  bodyColor: string;
  accentColor: string;
  fontFamily: string;
}

export const SLIDE_THEMES: SlideTheme[] = [
  {
    id: 'simple-light',
    name: 'Simple Light',
    bgColor: '#ffffff',
    titleColor: '#202124',
    bodyColor: '#5f6368',
    accentColor: '#1a73e8',
    fontFamily: 'Arial',
  },
  {
    id: 'streamline',
    name: 'Streamline',
    bgColor: '#f8fafd',
    titleColor: '#0b57d0',
    bodyColor: '#444746',
    accentColor: '#1a73e8',
    fontFamily: 'Roboto',
  },
  {
    id: 'slate',
    name: 'Slate Dark',
    bgColor: '#202124',
    titleColor: '#ffffff',
    bodyColor: '#bdc1c6',
    accentColor: '#8ab4f8',
    fontFamily: 'Google Sans',
  },
  {
    id: 'coral',
    name: 'Coral Warm',
    bgColor: '#fff8f6',
    titleColor: '#b3261e',
    bodyColor: '#49454f',
    accentColor: '#ea4335',
    fontFamily: 'Georgia',
  },
  {
    id: 'focus-amber',
    name: 'Focus Amber',
    bgColor: '#fef7e0',
    titleColor: '#b06000',
    bodyColor: '#3c4043',
    accentColor: '#f29900',
    fontFamily: 'Montserrat',
  },
  {
    id: 'mint',
    name: 'Mint Fresh',
    bgColor: '#e6f4ea',
    titleColor: '#137333',
    bodyColor: '#1e8e3e',
    accentColor: '#34a853',
    fontFamily: 'Open Sans',
  },
];

export const INITIAL_SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    layout: 'title-slide',
    title: 'Click to add title',
    subtitle: 'Click to add subtitle',
    speakerNotes: '',
    themeId: 'simple-light',
  },
  {
    id: 'slide-2',
    layout: 'title-body',
    title: 'Click to add title',
    bodyText: '• Click to add text\n• Second bullet point\n• Third bullet point',
    speakerNotes: '',
    themeId: 'simple-light',
  },
];
