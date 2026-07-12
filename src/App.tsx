import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

function GlobalWave() {
  return (
    <svg
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, opacity: 0.18,
      }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="#d4af37" strokeWidth="0.12"/>
      <path d="M0,60 Q35,10 60,60 T100,60" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.8"/>
      <path d="M0,40 Q15,80 40,40 T100,40" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.65"/>
      <path d="M0,70 Q45,30 70,70 T100,70" fill="none" stroke="#d4af37" strokeWidth="0.09" opacity="0.5"/>
      <path d="M0,30 Q55,60 80,25 T100,30" fill="none" stroke="#d4af37" strokeWidth="0.09" opacity="0.4"/>
      <path d="M-10,110 C30,70 60,10 110,-10" fill="none" stroke="#d4af37" strokeWidth="0.15" opacity="0.3"/>
      <path d="M-10,90 C40,50 80,30 110,10" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.25"/>
      <path d="M10,100 C50,40 70,80 100,20" fill="none" stroke="#d4af37" strokeWidth="0.08" opacity="0.2"/>
    </svg>
  );
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <GlobalWave />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}


