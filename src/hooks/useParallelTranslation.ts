import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TranslateTone } from "@/components/ToneSelector";
import type { LangCode } from "@/components/LanguageSelector";

export interface WordAlignment {
  src: string;
  tgt: string;
}

export interface EngineResult {
  text: string;
  loading: boolean;
  error: string | null;
  alignment: WordAlignment[];
}

export type ParallelResults = Record<"google" | "gemini" | "gpt", EngineResult>;

const EMPTY: EngineResult = { text: "", loading: false, error: null, alignment: [] };

export function useParallelTranslation() {
  const [results, setResults] = useState<ParallelResults>({
    google: { ...EMPTY },
    gemini: { ...EMPTY },
    gpt: { ...EMPTY },
  });

  const translate = useCallback(
    (text: string, source: LangCode, target: LangCode, tone: TranslateTone) => {
      const engines = ["google", "gemini", "gpt"] as const;

      engines.forEach((engine) => {
        setResults((prev) => ({
          ...prev,
          [engine]: { text: "", loading: true, error: null, alignment: [] },
        }));

        supabase.functions
          .invoke("translate", {
            body: { text, engine, source, target, tone },
          })
          .then(({ data, error }) => {
            if (error || data?.error) {
              setResults((prev) => ({
                ...prev,
                [engine]: {
                  text: "",
                  loading: false,
                  error: data?.error || error?.message || "เกิดข้อผิดพลาด",
                  alignment: [],
                },
              }));
            } else {
              setResults((prev) => ({
                ...prev,
                [engine]: {
                  text: data.translation,
                  loading: false,
                  error: null,
                  alignment: Array.isArray(data.alignment) ? data.alignment : [],
                },
              }));
            }
          })
          .catch((err) => {
            setResults((prev) => ({
              ...prev,
              [engine]: { text: "", loading: false, error: err.message || "Timeout", alignment: [] },
            }));
          });
      });
    },
    []
  );

  const clear = useCallback(() => {
    setResults({
      google: { ...EMPTY },
      gemini: { ...EMPTY },
      gpt: { ...EMPTY },
    });
  }, []);

  const anyLoading = results.google.loading || results.gemini.loading || results.gpt.loading;
  const hasResults = !!(results.google.text || results.gemini.text || results.gpt.text || anyLoading);

  return { results, translate, clear, anyLoading, hasResults };
}
