// src/context/TranslationContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import API_URL from '../config/api';

const TranslationContext = createContext();

export const useTranslation = () => useContext(TranslationContext);

export function TranslationProvider({ children, availableStringFiles = {} }) {
  // availableStringFiles example:
  // { landing: landingStrings, kiosk: kioskStrings, staff: staffStrings }
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en');
  const [translations, setTranslations] = useState(() => {
    // try to hydrate cached translations (in localStorage) at startup
    try {
      const raw = localStorage.getItem('translations');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // helper to get original strings for a page
  const getOriginal = (pageKey) => availableStringFiles[pageKey] || {};

  // fetch translations for a single page (batched)
  // In TranslationContext.jsx, update the translatePage function:
  const translatePage = async (pageKey, targetLang) => {
    const originals = getOriginal(pageKey);
    const keys = Object.keys(originals);
    if (keys.length === 0) return {};

    // If targetLang is 'en', just return originals
    if (targetLang === 'en') return originals;

    const texts = keys.map(k => originals[k]);

    try {
      // Use configured API URL when available (build-time or runtime fallback).
      const endpoint = (API_URL || '') + '/api/translate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texts, target: targetLang })
      });

      // Be robust: read text first, handle empty response or non-JSON gracefully
      const raw = await res.text();
      if (!raw) {
        const err = new Error(`Empty response from translation API (status ${res.status})`);
        console.error('translatePage error', err);
        throw err;
      }

      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        const err = new Error('Invalid JSON from translation API');
        console.error('translatePage error - invalid JSON', parseErr, 'raw=', raw);
        throw err;
      }

      if (!res.ok) {
        const err = new Error(data?.error || `Translation API error (status ${res.status})`);
        console.error('translatePage error', err, data);
        throw err;
      }

      if (!data.translations || !Array.isArray(data.translations)) {
        const err = new Error('Unexpected translation API response shape');
        console.error('translatePage error', err, data);
        throw err;
      }

      const translated = {};
      data.translations.forEach((t, i) => {
        translated[keys[i]] = t.translatedText || t.text || '';
      });

      return translated;
    } catch (err) {
      console.error('translatePage error', err);
      throw err;
    }
  };

  // Public: set app language and translate selected pages (or all)
  const setAppLanguage = async (targetLang, pageKeys = Object.keys(availableStringFiles)) => {
    setLoading(true);
    setError(null);
    try {
      // if targetLang is already set and translations exist, just set language
      if (targetLang === language && translations[targetLang]) {
        setLanguage(targetLang);
        localStorage.setItem('lang', targetLang);
        setLoading(false);
        return;
      }

      const newTranslations = { ...(translations || {}) };

      // translate pages in parallel but keep each page batched
      await Promise.all(pageKeys.map(async (pageKey) => {
        // reuse cached translations if available
        if (newTranslations[targetLang] && newTranslations[targetLang][pageKey]) return;
        const pageTranslated = await translatePage(pageKey, targetLang);
        newTranslations[targetLang] = newTranslations[targetLang] || {};
        newTranslations[targetLang][pageKey] = pageTranslated;
      }));

      setTranslations(newTranslations);
      // persist translations to localStorage (for offline fast reload)
      localStorage.setItem('translations', JSON.stringify(newTranslations));
      setLanguage(targetLang);
      localStorage.setItem('lang', targetLang);
    } catch (err) {
      setError(err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  // get translated strings for a page (fallback to original)
  const getStringsForPage = (pageKey) => {
    if (language === 'en') return getOriginal(pageKey);
    return (translations[language] && translations[language][pageKey]) || getOriginal(pageKey);
  };

  useEffect(() => {
    // optionally auto-translate previously saved language on mount
    const savedLang = localStorage.getItem('lang');
    if (savedLang && savedLang !== 'en') {
      // translate only the pages you expect immediate use of, e.g., landing
      setAppLanguage(savedLang, Object.keys(availableStringFiles));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TranslationContext.Provider value={{
      language,
      setAppLanguage,
      getStringsForPage,
      loading,
      error,
    }}>
      {children}
    </TranslationContext.Provider>
  );
}
