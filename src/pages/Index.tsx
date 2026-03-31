import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { History, TrendingUp, Languages, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LanguageSelector, { type LangCode } from "@/components/LanguageSelector";
import ToneSelector, { type TranslateTone } from "@/components/ToneSelector";
import TranslateInput from "@/components/TranslateInput";
import ParallelResults from "@/components/ParallelResults";
import TranslationHistory from "@/components/TranslationHistory";
import { useTranslationHistory } from "@/hooks/useTranslationHistory";
import { useParallelTranslation } from "@/hooks/useParallelTranslation";
import ImageTranslateResult from "@/components/ImageTranslateResult";
import TypingSuggestions from "@/components/TypingSuggestions";
import VoteStats from "@/components/VoteStats";
import ConversationMode from "@/components/ConversationMode";

type AppMode = "translate" | "conversation";

function ConversationHistoryView() {
  const [entries, setEntries] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("conversation_history") || "[]");
    } catch { return []; }
  });

  const LANG_NAMES: Record<string, string> = {
    th: "ไทย", en: "English", zh: "中文", ja: "日本語", ko: "한국어",
    fr: "Français", de: "Deutsch", es: "Español", auto: "Auto",
  };
  const getLang = (c: string) => LANG_NAMES[c] || c.toUpperCase();

  const removeEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem("conversation_history", JSON.stringify(updated));
  };

  const clearAll = () => {
    setEntries([]);
    localStorage.removeItem("conversation_history");
  };

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground font-body text-center py-4">ยังไม่มีประวัติการสนทนา</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="rounded-xl bg-muted/50 px-3 py-2 text-xs font-body">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-muted-foreground">{getLang(e.detectedLang)} → {getLang(e.targetLang)}</span>
              <p className="text-foreground mt-0.5">{e.original}</p>
              <p className="text-primary font-medium mt-0.5">{e.translated}</p>
            </div>
            <button onClick={() => removeEntry(e.id)} className="text-muted-foreground hover:text-destructive shrink-0">✕</button>
          </div>
        </div>
      ))}
      <button onClick={clearAll} className="w-full text-center text-xs text-destructive hover:underline font-body mt-2">ล้างประวัติทั้งหมด</button>
    </div>
  );
}

export default function Index() {
  const [mode, setMode] = useState<AppMode>("translate");
  const [source, setSource] = useState<LangCode>("auto");
  const [target, setTarget] = useState<LangCode>("th");
  const [tone, setTone] = useState<TranslateTone>("neutral");
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showConvHistory, setShowConvHistory] = useState(false);
  const [imageResult, setImageResult] = useState<{ original: string; translation: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const { history, addRecord, clearHistory, removeRecord } = useTranslationHistory();
  const { results, translate, clear, anyLoading, hasResults } = useParallelTranslation();

  const handleTranslate = useCallback(() => {
    if (!inputText.trim()) return;
    translate(inputText, source, target, tone);
    // Add to history using first engine label
    addRecord({ inputText, result: "(เปรียบเทียบ 3 เครื่องมือ)", engine: "google", source, target });
  }, [inputText, source, target, tone, translate, addRecord]);

  const handleSwap = () => {
    if (source === "auto") return;
    const prevSource = source;
    setSource(target);
    setTarget(prevSource);
  };

  const handleClear = () => {
    setInputText("");
    clear();
    setImageResult(null);
    setImagePreview(null);
  };

  const handleImageCapture = useCallback(
    async (base64: string) => {
      setIsImageLoading(true);
      setImageResult(null);
      setImagePreview(base64);
      try {
        const { data, error } = await supabase.functions.invoke("translate-image", {
          body: { imageBase64: base64, target },
        });
        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          return;
        }
        setImageResult({ original: data.original || "", translation: data.translation || "" });
      } catch (err) {
        console.error(err);
        toast.error("เกิดข้อผิดพลาดในการแปลรูปภาพ");
      } finally {
        setIsImageLoading(false);
      }
    },
    [target]
  );

  const handleReuseHistory = (record: (typeof history)[0]) => {
    setInputText(record.inputText);
    setSource(record.source);
    setTarget(record.target);
    setShowHistory(false);
  };

  const [showChangelog, setShowChangelog] = useState(false);

  const changelog = [
    { version: "1.2", date: "2026-03-26", changes: [
      "เพิ่มช่องพิมพ์ข้อความในโหมดสนทนา",
      "เพิ่มเมนูเลือกภาษาในโหมดสนทนา",
      "ปรับสำเนียงการฟังให้แม่นยำตามภาษาที่เลือก",
      "แสดงชื่อภาษาที่ตรวจจับได้ในแต่ละ bubble",
      "เปลี่ยนชื่อเป็น D-MAT Translate",
    ]},
    { version: "1.1", date: "2026-03-25", changes: [
      "เพิ่มโหมดสนทนา (Interpreter Mode)",
      "แปลเปรียบเทียบ 3 AI พร้อมกัน (Google, Gemini, GPT)",
      "เพิ่ม Word Alignment แสดงการจับคู่คำ",
      "เพิ่มระบบ Like / Vote สถิติ AI",
      "เพิ่ม Tone selector (ทางการ/กันเอง/ภาษาเขียน/ภาษาพูด)",
    ]},
    { version: "1.0", date: "2026-03-24", changes: [
      "เปิดตัว D-MAT Translate",
      "แปลข้อความ + แปลรูปภาพ",
      "รองรับตรวจจับภาษาอัตโนมัติ",
      "ระบบ Text-to-Speech",
    ]},
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Languages size={24} className="text-primary" />
            <h1 className="font-display text-lg font-bold text-foreground">D-MAT Translate</h1>
          </div>
          <div className="flex items-center gap-1">
            {mode === "translate" && (
              <>
                <button
                  onClick={() => setShowStats(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <TrendingUp size={20} />
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <History size={20} />
                  {history.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {history.length > 9 ? "9+" : history.length}
                    </span>
                  )}
                </button>
              </>
            )}
            {mode === "conversation" && (
              <button
                onClick={() => setShowConvHistory(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <History size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="mx-auto max-w-lg px-4 pb-2">
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => setMode("translate")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-display font-medium transition-all ${
                mode === "translate"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Languages size={16} />
              แปลทั่วไป
            </button>
            <button
              onClick={() => setMode("conversation")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-display font-medium transition-all ${
                mode === "conversation"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare size={16} />
              สนทนา
            </button>
          </div>
        </div>
      </header>

      {mode === "translate" ? (
        <>
          {/* Main */}
          <main className="mx-auto max-w-lg px-4 pb-8 flex-1">
            <div className="mb-3">
              <ToneSelector value={tone} onChange={setTone} />
            </div>

            <div className="mb-4">
              <LanguageSelector
                source={source}
                target={target}
                onSourceChange={setSource}
                onTargetChange={setTarget}
                onSwap={handleSwap}
              />
            </div>

            <div className="mb-4" onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
              <TranslateInput
                value={inputText}
                onChange={setInputText}
                onClear={handleClear}
                onTranslate={handleTranslate}
                onImageCapture={handleImageCapture}
                isLoading={anyLoading}
              />
              <TypingSuggestions inputText={inputText} onSelect={setInputText} />
            </div>

            <ParallelResults results={results} sourceText={inputText} sourceLang={source} targetLang={target} tone={tone} />

            <ImageTranslateResult
              original={imageResult?.original || ""}
              translation={imageResult?.translation || ""}
              isLoading={isImageLoading}
              imagePreview={imagePreview}
              onClose={() => {
                setImageResult(null);
                setImagePreview(null);
              }}
            />

            {!hasResults && !anyLoading && !inputText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-center"
              >
                <p className="font-display text-sm text-muted-foreground">
                  เลือกโทนการแปล แล้วพิมพ์ข้อความเพื่อเปรียบเทียบ 3 AI พร้อมกัน
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {["สวัสดี", "Hello World", "ขอบคุณ", "How are you?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInputText(q)}
                      className="rounded-full border border-border bg-card px-4 py-2 font-body text-sm text-foreground shadow-card hover:shadow-elevated transition-shadow"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </main>
        </>
      ) : (
        <div className="flex-1 mx-auto max-w-lg w-full flex flex-col overflow-hidden">
          <ConversationMode />
        </div>
      )}

      {/* Conversation History Panel */}
      {showConvHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowConvHistory(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-elevated p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-bold text-foreground">📝 ประวัติการสนทนา</h2>
              <button onClick={() => setShowConvHistory(false)} className="text-muted-foreground hover:text-foreground text-xs font-body">ปิด</button>
            </div>
            <ConversationHistoryView />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center">
        <button
          onClick={() => setShowChangelog(true)}
          className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          Dev by Mildpachara Ratchanatskul 2026 build 1.2
        </button>
      </footer>

      {/* Changelog popup */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowChangelog(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-md max-h-[70vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-elevated p-5"
          >
            <h2 className="font-display text-base font-bold text-foreground mb-4">📋 Changelog</h2>
            <div className="space-y-4">
              {changelog.map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-display font-bold">
                      v{entry.version}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-body">{entry.date}</span>
                  </div>
                  <ul className="space-y-1 pl-3">
                    {entry.changes.map((c, i) => (
                      <li key={i} className="text-xs font-body text-foreground flex gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowChangelog(false)}
              className="mt-4 w-full rounded-xl bg-muted py-2 text-sm font-display text-foreground hover:bg-muted/80 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Panels */}
      <TranslationHistory
        history={history}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onClear={clearHistory}
        onRemove={removeRecord}
        onReuse={handleReuseHistory}
      />
      <VoteStats isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
}
