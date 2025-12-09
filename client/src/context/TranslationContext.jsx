// src/context/TranslationContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const TranslationContext = createContext();

export const useTranslation = () => useContext(TranslationContext);

export function TranslationProvider({ children, availableStringFiles = {} }) {
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en');
  const [translations, setTranslations] = useState(() => {
    try {
      const raw = localStorage.getItem('translations');
      console.log('Hydrating translations from localStorage:', raw);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Error parsing localStorage translations:', err);
      return {};
    }
  });

  const [dynamicTranslations, setDynamicTranslations] = useState(() => {
    try {
      const raw = localStorage.getItem('dynamicTranslations');
      console.log('Hydrating dynamicTranslations from localStorage:', raw);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Error parsing localStorage dynamicTranslations:', err);
      return {};
    }
  });


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getOriginal = (pageKey) => availableStringFiles[pageKey] || {};

  const translatePage = async (pageKey, targetLang) => {
    const originals = getOriginal(pageKey);
    const keys = Object.keys(originals);
    if (keys.length === 0) return {};
    

    console.log(`Translating page "${pageKey}" to "${targetLang}"`);
    if (targetLang === 'en') return originals;

    const texts = keys.map(k => originals[k]);
    console.log('Texts to translate:', texts);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: texts,
          target: targetLang
        })
      });
      const data = await res.json();
      console.log('API response:', data);

      if (!res.ok) throw new Error(data.error || 'Translation API error');

      const translated = {};
      data.translations.forEach((t, i) => {
        translated[keys[i]] = t.translatedText;
      });
      console.log(`Translated page "${pageKey}":`, translated);

      return translated;
    } catch (err) {
      console.error('translatePage error:', err);
      throw err;
    }
  };

  const translateDynamicContent = async (texts, cacheKey, targetLang) => {
    console.log(`Translating dynamic content with key "${cacheKey}" to "${targetLang}"`);
    if (targetLang === 'en') return texts;
 
    const cached = dynamicTranslations[targetLang]?.[cacheKey];
    if(cached) {
      console.log(`Using cached dynamic translations for key "${cacheKey}"`);
      return cached;
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          text: texts,
          target: targetLang
        })
      });
      const data = await res.json();
      console.log('API response for dynamic content:', data);

      if (!res.ok) throw new Error(data.error || 'Translation API error');

      const translatedTexts = data.translations.map(t => t.translatedText);
      console.log(`Translated dynamic content for key "${cacheKey}":`, translatedTexts);

      const newDynamicTranslations = {
        ...(dynamicTranslations || {}),
        [targetLang]: {
          ...(dynamicTranslations[targetLang] || {}),
          [cacheKey]: translatedTexts
        }
      };

      setDynamicTranslations(newDynamicTranslations);
      localStorage.setItem('dynamicTranslations', JSON.stringify(newDynamicTranslations));
      console.log('Persisted dynamic translations to localStorage');

      return translatedTexts;
    } catch (err) {
      console.error('translateDynamicContent error:', err);
      throw err;
    }
  };
    
  const setAppLanguage = async (targetLang, pageKeys = Object.keys(availableStringFiles)) => {
    console.log(`Setting app language to "${targetLang}" for pages:`, pageKeys);
    setLoading(true);
    setError(null);

    try {
      const newTranslations = { ...(translations || {}) };

      console.log('Current translations state before update:', newTranslations);

      await Promise.all(pageKeys.map(async (pageKey) => {
        const originals = getOriginal(pageKey);
        const originalKeys = Object.keys(originals);
        const cached = newTranslations[targetLang]?.[pageKey];
        
        // Check if cache exists AND has all current keys
        if (cached && originalKeys.every(key => key in cached)) {
          console.log(`Using cached translations for page "${pageKey}"`);
          return;
        }
        
        const pageTranslated = await translatePage(pageKey, targetLang);
        newTranslations[targetLang] = newTranslations[targetLang] || {};
        newTranslations[targetLang][pageKey] = pageTranslated;
        console.log(`Saved translations for page "${pageKey}"`);
      }));

      setTranslations(newTranslations);
      console.log('Updated translations state:', newTranslations);
      localStorage.setItem('translations', JSON.stringify(newTranslations));
      console.log('Persisted translations to localStorage');

      setLanguage(targetLang);
      localStorage.setItem('lang', targetLang);
      console.log(`Language set to "${targetLang}" in state and localStorage`);
    } catch (err) {
      console.error('setAppLanguage error:', err);
      setError(err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const getStringsForPage = (pageKey) => {
    if (language === 'en') return getOriginal(pageKey);
    const pageStrings = (translations[language] && translations[language][pageKey]) || getOriginal(pageKey);
    console.log(`getStringsForPage("${pageKey}") returning:`, pageStrings);
    return pageStrings;
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang && savedLang !== 'en') {
      console.log(`Auto-translating previously saved language: "${savedLang}"`);
      setAppLanguage(savedLang, Object.keys(availableStringFiles));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TranslationContext.Provider value={{
      language,
      setAppLanguage,
      getStringsForPage,
      translateDynamicContent,
      loading,
      error,
    }}>
      {children}
    </TranslationContext.Provider>
  );
}