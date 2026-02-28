"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Globe, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Supported languages ── */
const LANGUAGES = [
  { code: "en",    label: "English",    native: "English",    flag: "🇬🇧" },
  { code: "hi",    label: "Hindi",      native: "हिन्दी",       flag: "🇮🇳" },
  { code: "ta",    label: "Tamil",      native: "தமிழ்",       flag: "🇮🇳" },
  { code: "te",    label: "Telugu",     native: "తెలుగు",      flag: "🇮🇳" },
  { code: "kn",    label: "Kannada",    native: "ಕನ್ನಡ",       flag: "🇮🇳" },
  { code: "bn",    label: "Bengali",    native: "বাংলা",       flag: "🇮🇳" },
  { code: "mr",    label: "Marathi",    native: "मराठी",       flag: "🇮🇳" },
  { code: "gu",    label: "Gujarati",   native: "ગુજરાતી",     flag: "🇮🇳" },
  { code: "ml",    label: "Malayalam",  native: "മലയാളം",     flag: "🇮🇳" },
  { code: "pa",    label: "Punjabi",    native: "ਪੰਜਾਬੀ",      flag: "🇮🇳" },
  { code: "ur",    label: "Urdu",       native: "اردو",        flag: "🇵🇰" },
  { code: "sa",    label: "Sanskrit",   native: "संस्कृतम्",     flag: "🕉️"  },
  { code: "es",    label: "Spanish",    native: "Español",    flag: "🇪🇸" },
  { code: "fr",    label: "French",     native: "Français",   flag: "🇫🇷" },
  { code: "de",    label: "German",     native: "Deutsch",    flag: "🇩🇪" },
  { code: "ar",    label: "Arabic",     native: "العربية",     flag: "🇸🇦" },
  { code: "ja",    label: "Japanese",   native: "日本語",       flag: "🇯🇵" },
  { code: "zh-CN", label: "Chinese",    native: "中文",        flag: "🇨🇳" },
  { code: "ko",    label: "Korean",     native: "한국어",       flag: "🇰🇷" },
  { code: "pt",    label: "Portuguese", native: "Português",  flag: "🇧🇷" },
  { code: "ru",    label: "Russian",    native: "Русский",    flag: "🇷🇺" },
];

/* Tell TS about the Google Translate globals */
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: new (
          opts: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          el: string,
        ) => void;
      };
    };
  }
}

export function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Load Google Translate script once ── */
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGUAGES.filter((l) => l.code !== "en")
            .map((l) => l.code)
            .join(","),
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };

    if (!document.getElementById("gt-script")) {
      const s = document.createElement("script");
      s.id = "gt-script";
      s.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.body.appendChild(s);
    }

    /* Detect language from existing cookie on mount */
    const m = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (m && m[1]) setCurrent(m[1]);
  }, []);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      /* Auto-focus the search when panel opens */
      setTimeout(() => searchRef.current?.focus(), 120);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Trigger translation ── */
  const selectLanguage = useCallback((code: string) => {
    setCurrent(code);
    setOpen(false);
    setSearch("");

    const select = document.querySelector(
      ".goog-te-combo",
    ) as HTMLSelectElement | null;

    if (code === "en") {
      /* Reset to original — clear cookie + reload for clean state */
      if (select) {
        select.value = "";
        select.dispatchEvent(new Event("change"));
      }
      /* Cookie-based fallback in case the select trick doesn't fully revert */
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    } else if (select) {
      select.value = code;
      select.dispatchEvent(new Event("change"));
    }
  }, []);

  /* Filtered language list */
  const filtered = LANGUAGES.filter(
    (l) =>
      l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase()),
  );

  const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  return (
    <>
      {/* Hidden Google Translate injection point */}
      <div
        id="google_translate_element"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          visibility: "hidden",
        }}
      />

      {/* ── Floating Language Switcher ── */}
      <div ref={panelRef} className="gtranslate-wrapper">
        {/* Language panel (opens upward from the FAB) */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="gtranslate-panel"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
            >
              {/* Header */}
              <div className="gtranslate-header">
                <Globe className="w-4 h-4" style={{ color: "var(--teal)" }} />
                <span>Translate</span>
                <button
                  onClick={() => setOpen(false)}
                  className="gtranslate-close"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search */}
              <div className="gtranslate-search-wrap">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search language…"
                  className="gtranslate-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Language list */}
              <div className="gtranslate-list">
                {filtered.length === 0 && (
                  <p className="gtranslate-empty">No match found</p>
                )}
                {filtered.map((lang) => (
                  <button
                    key={lang.code}
                    className={`gtranslate-item ${current === lang.code ? "active" : ""}`}
                    onClick={() => selectLanguage(lang.code)}
                  >
                    <span className="gtranslate-flag">{lang.flag}</span>
                    <div className="gtranslate-text">
                      <span className="gtranslate-label">{lang.label}</span>
                      <span className="gtranslate-native">{lang.native}</span>
                    </div>
                    {current === lang.code && (
                      <Check
                        className="w-3.5 h-3.5 ml-auto flex-shrink-0"
                        style={{ color: "var(--teal)" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <motion.button
          onClick={() => setOpen((o) => !o)}
          className="gtranslate-fab"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Change language"
        >
          <Globe className="w-5 h-5" />
          {current !== "en" && (
            <span className="gtranslate-badge">{currentLang.flag}</span>
          )}
        </motion.button>
      </div>
    </>
  );
}
