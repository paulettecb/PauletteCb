// Glyphs de pose (stick figures) usados en las tarjetas de la biblioteca, la
// ficha y el constructor de rutina. Son los mismos trazos del diseño hi-fi de
// Claude Design ("Exercise Hi-Fi"), extraídos aquí para reusarlos como fuente
// única. Cada valor es el innerHTML de un <svg viewBox="0 0 24 24">.
export const POSE_GLYPHS = {
  squat: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"></circle><path d="M12 6v4"></path><path d="M12 7.5 8.5 9"></path><path d="m12 7.5 3.5 1.5"></path><path d="M12 10 8.5 12.5 10 17"></path><path d="M12 10l3.5 2.5-1.5 4.5"></path></svg>',
  plank: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="9" r="2"></circle><path d="M6.5 10 20 15"></path><path d="M6.8 10.2 6 15"></path><path d="M13 12.3V16"></path><path d="M20 15v3"></path></svg>',
  lunge: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"></circle><path d="M11 6v4"></path><path d="M11 7.5 8 9"></path><path d="m11 7.5 3 1.5"></path><path d="M11 10 7 13.5 8 17"></path><path d="M11 10l5 3v4"></path></svg>',
  press: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"></circle><path d="M12 7v6"></path><path d="M12 8 8.5 4.5"></path><path d="m12 8 3.5-3.5"></path><path d="M12 13 9.5 20"></path><path d="m12 13 2.5 7"></path></svg>',
  row: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="6" r="2"></circle><path d="M8 7.5 15 11"></path><path d="M8.5 7.8 8 20"></path><path d="M8 13.5 14 17"></path><path d="M15 11l0.4-3"></path></svg>',
  bridge: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="14" r="2"></circle><path d="M5.5 13.5C10 9 12 9 14 11"></path><path d="M14 11l3 5"></path><path d="M14 11l0.5-2.5"></path><path d="M6 15v3"></path><path d="M17 16v2"></path></svg>',
}

export const glyphFor = (pose) => POSE_GLYPHS[pose] || POSE_GLYPHS.squat
