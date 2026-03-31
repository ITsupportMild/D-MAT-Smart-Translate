import { useState, useCallback, useEffect } from "react";
import type { TranslateEngine } from "@/components/EngineSwitcher";
import type { LangCode } from "@/components/LanguageSelector";

export interface TranslationRecord {
  id: string;
  inputText: string;
  result: string;
  engine: TranslateEngine;
  source: LangCode;
  target: LangCode;
  timestamp: number;
}

const STORAGE_KEY = "translation_history";
const MAX_HISTORY = 50;

export function useTranslationHistory() {
  const [history, setHistory] = useState<TranslationRecord[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const addRecord = useCallback(
    (record: Omit<TranslationRecord, "id" | "timestamp">) => {
      const newRecord: TranslationRecord = {
        ...record,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const next = [newRecord, ...prev].slice(0, MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeRecord = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, addRecord, clearHistory, removeRecord };
}
