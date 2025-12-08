import React, { useState } from 'react';
import '../styles/TranslateMenu.css';
import { useTranslation } from '../context/TranslationContext';

// Example language options
export const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
];

const TranslateMenu = ({ onTranslate }) => {
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const selectedLang = e.target.value;
    setLang(selectedLang);

    if (!onTranslate) return;

    setLoading(true);
    try {
      await onTranslate(selectedLang); // Trigger translation immediately
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="translate-menu">
      <select value={lang} onChange={handleChange} disabled={loading}>
        {LANG_OPTIONS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TranslateMenu;
