import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
import { PlanProvider } from './context/PlanContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlanProvider>
      <App />
    </PlanProvider>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);

