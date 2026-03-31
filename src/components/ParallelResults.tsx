import { useState } from "react";
import { ThumbsUp, Copy, Check, RotateCcw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParallelResults as ParallelResultsType, WordAlignment } from "@/hooks/useParallelTranslation";
import type { LangCode } from "@/components/LanguageSelector";
import type { TranslateTone } from "@/components/ToneSelector";
import WordLookup from "./WordLookup";

const ENGINE_META = {
  google: { label: "Google Translate", icon: "🌐", colorClass: "text-engine-google" },
  gemini: { label: "Gemini AI", icon: "✨", colorClass: "text-engine-gemini" },
  gpt: { label: "ChatGPT", icon: "🤖", colorClass: "text-engine-gpt" },
} as const;

type EngineKey = keyof typeof ENGINE_META;

const HIGHLIGHT_COLORS = [
  "bg-blue-100 dark:bg-blue-900/40",
  "bg-green-100 dark:bg-green-900/40",
  "bg-amber-100 dark:bg-amber-900/40",
  "bg-pink-100 dark:bg-pink-900/40",
  "bg-purple-100 dark:bg-purple-900/40",
  "bg-cyan-100 dark:bg-cyan-900/40",
  "bg-orange-100 dark:bg-orange-900/40",
  "bg-rose-100 dark:bg-rose-900/40",
];

interface Props {
  results: ParallelResultsType;
  sourceText: string;
  sourceLang: LangCode;
  targetLang: LangCode;
  tone: TranslateTone;
}

export default function ParallelResults({ results, sourceText, sourceLang, targetLang, tone }: Props) {
  const [liked, setLiked] = useState<string | null>(null);
  const [copiedEngine, setCopiedEngine] = useState<string | null>(null);
  const [backTranslations, setBackTranslations] = useState<Record<string, { text: string; loading: boolean }>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [hoveredAlign, setHoveredAlign] = useState<{ engine: string; index: number } | null>(null);

  const hasAny = Object.values(results).some((r) => r.text || r.loading);
  if (!hasAny) return null;

  const handleLike = async (engine: string) => {
    setLiked(engine);
    try {
      await (supabase.from as any)("translation_votes").insert({
        engine,
        source_text: sourceText.slice(0, 500),
        target_lang: targetLang,
        tone,
      });
      toast.success(`โหวตให้ ${ENGINE_META[engine as EngineKey].label} แล้ว!`);
    } catch {
      toast.error("โหวตไม่สำเร็จ");
    }
  };

  const handleCopy = async (text: string, engine: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedEngine(engine);
    setTimeout(() => setCopiedEngine(null), 2000);
  };

  const handleBackTranslate = async (engine: string, translatedText: string) => {
    setBackTranslations((prev) => ({ ...prev, [engine]: { text: "", loading: true } }));
    const backTarget = sourceLang === "auto" ? "en" : sourceLang;
    try {
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { text: translatedText, engine, source: targetLang, target: backTarget, tone: "neutral" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setBackTranslations((prev) => ({ ...prev, [engine]: { text: data.translation, loading: false } }));
    } catch {
      setBackTranslations((prev) => ({ ...prev, [engine]: { text: "เกิดข้อผิดพลาด", loading: false } }));
    }
  };

  const handleWordClick = (word: string) => {
    const clean = word.replace(/[^\w\u0E00-\u0E7Fก-๛a-zA-Z0-9]/g, "");
    if (clean.length > 0) setSelectedWord(clean);
  };

  const renderAlignmentChips = (alignment: WordAlignment[], engine: string) => {
    if (!alignment.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {alignment.map((a, i) => (
          <span
            key={i}
            onMouseEnter={() => setHoveredAlign({ engine, index: i })}
            onMouseLeave={() => setHoveredAlign(null)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-body border border-border transition-all cursor-default ${
              HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]
            } ${hoveredAlign?.engine === engine && hoveredAlign?.index === i ? "ring-2 ring-primary scale-105" : ""}`}
          >
            <span className="font-medium text-foreground">{a.src}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-foreground">{a.tgt}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {(["google", "gemini", "gpt"] as const).map((engine, idx) => {
          const r = results[engine];
          const meta = ENGINE_META[engine];
          const bt = backTranslations[engine];

          return (
            <motion.div
              key={engine}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 30 }}
              className={`rounded-2xl bg-card shadow-elevated overflow-hidden border-2 transition-colors ${
                liked === engine ? "border-primary" : "border-transparent"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <span className={`font-display text-xs font-semibold uppercase tracking-wider ${meta.colorClass}`}>
                    {meta.label}
                  </span>
                </div>
                {r.text && !r.loading && (
                  <button
                    onClick={() => handleLike(engine)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-display font-medium transition-all ${
                      liked === engine
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <ThumbsUp size={13} />
                    {liked === engine ? "Liked!" : "Like"}
                  </button>
                )}
              </div>

              {/* Translation text */}
              <div className="px-4 pb-2 min-h-[56px]">
                {r.loading ? (
                  <div className="flex items-center gap-2 py-3 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-body">กำลังแปล...</span>
                  </div>
                ) : r.error ? (
                  <p className="text-sm text-destructive py-2 font-body">{r.error}</p>
                ) : r.text ? (
                  <p className="text-base leading-relaxed font-body text-foreground py-1">
                    {r.text.split(/(\s+)/).map((seg, i) =>
                      seg.trim() === "" ? (
                        seg
                      ) : (
                        <span
                          key={i}
                          onClick={() => handleWordClick(seg)}
                          className="cursor-pointer hover:bg-accent/50 rounded px-0.5 transition-colors"
                        >
                          {seg}
                        </span>
                      )
                    )}
                  </p>
                ) : null}
              </div>

              {/* Word alignment chips */}
              {r.text && !r.loading && r.alignment.length > 0 && (
                <>
                  <div className="px-4 pb-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">
                      การจับคู่คำ (Word Alignment)
                    </p>
                  </div>
                  {renderAlignmentChips(r.alignment, engine)}
                </>
              )}

              {/* Actions */}
              {r.text && !r.loading && (
                <div className="flex items-center gap-1 border-t border-border px-3 py-2">
                  <button
                    onClick={() => handleCopy(r.text, engine)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-display text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {copiedEngine === engine ? <Check size={14} /> : <Copy size={14} />}
                    {copiedEngine === engine ? "คัดลอกแล้ว" : "คัดลอก"}
                  </button>
                  <button
                    onClick={() => handleBackTranslate(engine, r.text)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-display text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <RotateCcw size={14} />
                    ตรวจสอบ
                  </button>
                </div>
              )}

              {/* Back Translation */}
              {bt && (
                <div className="border-t border-border bg-muted/30 px-4 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display mb-1">
                    แปลกลับ (ตรวจสอบความถูกต้อง)
                  </p>
                  {bt.loading ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 size={12} className="animate-spin" />
                      กำลังตรวจสอบ...
                    </div>
                  ) : (
                    <p className="text-sm font-body text-foreground">{bt.text}</p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Word Lookup */}
      {selectedWord && <WordLookup word={selectedWord} onClose={() => setSelectedWord(null)} />}
    </div>
  );
}
