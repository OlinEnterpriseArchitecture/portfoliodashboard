import { useEffect } from 'react';

export function useScrollbarTheme(dark) {
  useEffect(() => {
    const styleId = 'phq-scrollbar-style';
    let el = document.getElementById(styleId);
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    const thumb   = dark ? 'rgba(148,163,184,0.38)' : 'rgba(100,116,139,0.28)';
    const thumbHv = dark ? 'rgba(148,163,184,0.58)' : 'rgba(100,116,139,0.48)';
    const track   = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    el.textContent = `
      ::-webkit-scrollbar { width: 7px; height: 7px; }
      ::-webkit-scrollbar-track { background: ${track}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${thumbHv}; }
      html { scrollbar-width: thin; scrollbar-color: ${thumb} ${track}; }
    `;
  }, [dark]);
}