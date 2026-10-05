import { createContext, useContext, useState, useCallback } from "react";
import { translations } from "../i18n/translations.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLanguage = "EN" }) {
  const [language, setLanguage] = useState(initialLanguage);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[language] || translations.EN;
      const fallback = translations.EN;
      const resolve = (source) => key.split(".").reduce((obj, part) => obj?.[part], source);

      let value = resolve(dict);
      if (value === undefined) value = resolve(fallback);
      if (typeof value !== "string") return key;

      if (!vars) return value;
      return value.replace(/\{(\w+)\}/g, (match, name) => (vars[name] !== undefined ? vars[name] : match));
    },
    [language]
  );

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
