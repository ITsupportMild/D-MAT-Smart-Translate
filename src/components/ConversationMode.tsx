import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Trash2, RotateCcw, ChevronDown, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationEntry {
  id: string;
  speaker: "left" | "right";
  original: string;
  translated: string;
  detectedLang: string;
  targetLang: string;
  timestamp: number;
}

const STORAGE_KEY = "conversation_history";
const MAX_HISTORY = 100;

const LANGUAGES = [
  { code: "auto", label: "ตรวจจับอัตโนมัติ", bcp47: "" },
  { code: "th", label: "ไทย", bcp47: "th-TH" },
  { code: "en", label: "อังกฤษ", bcp47: "en-US" },
  { code: "zh", label: "จีน", bcp47: "zh-CN" },
  { code: "ja", label: "ญี่ปุ่น", bcp47: "ja-JP" },
  { code: "ko", label: "เกาหลี", bcp47: "ko-KR" },
  { code: "my", label: "พม่า", bcp47: "my-MM" },
  { code: "vi", label: "เวียดนาม", bcp47: "vi-VN" },
  { code: "fr", label: "ฝรั่งเศส", bcp47: "fr-FR" },
  { code: "de", label: "เยอรมัน", bcp47: "de-DE" },
  { code: "es", label: "สเปน", bcp47: "es-ES" },
  { code: "pt", label: "โปรตุเกส", bcp47: "pt-BR" },
  { code: "ru", label: "รัสเซีย", bcp47: "ru-RU" },
  { code: "ar", label: "อาหรับ", bcp47: "ar-SA" },
  { code: "hi", label: "ฮินดี", bcp47: "hi-IN" },
  { code: "id", label: "อินโดนีเซีย", bcp47: "id-ID" },
  { code: "ms", label: "มาเลย์", bcp47: "ms-MY" },
  { code: "it", label: "อิตาลี", bcp47: "it-IT" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

function getLangLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label || code.toUpperCase();
}

function getBcp47(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.bcp47 || "";
}

function speakText(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getBcp47(lang) || lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

/* ── Language Picker (inline dropdown) ── */
function LangPicker({
  value,
  onChange,
  label,
}: {
  value: LangCode;
  onChange: (v: LangCode) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-display text-foreground hover:bg-muted/80 transition-colors"
      >
        <span className="truncate max-w-[80px]">{getLangLabel(value)}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-30 w-44 max-h-52 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onChange(lang.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-body hover:bg-muted transition-colors ${
                value === lang.code ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function ConversationMode() {
  const [entries, setEntries] = useState<ConversationEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [leftLang, setLeftLang] = useState<LangCode>("auto");
  const [rightLang, setRightLang] = useState<LangCode>("th");
  const [leftListening, setLeftListening] = useState(false);
  const [rightListening, setRightListening] = useState(false);
  const [leftInterim, setLeftInterim] = useState("");
  const [rightInterim, setRightInterim] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const leftRecRef = useRef<any>(null);
  const rightRecRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, leftInterim, rightInterim]);

  const saveEntries = useCallback((newEntries: ConversationEntry[]) => {
    const trimmed = newEntries.slice(-MAX_HISTORY);
    setEntries(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }, []);

  const translateAndAdd = useCallback(
    async (text: string, speaker: "left" | "right") => {
      if (!text.trim()) return;
      setIsTranslating(true);
      try {
        const speakerLang = speaker === "left" ? leftLang : rightLang;
        const otherLang = speaker === "left" ? rightLang : leftLang;

        const { data, error } = await supabase.functions.invoke("conversation-translate", {
          body: {
            text,
            sourceLang: speakerLang === "auto" ? undefined : speakerLang,
            targetLang: otherLang === "auto" ? undefined : otherLang,
          },
        });
        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          return;
        }

        const entry: ConversationEntry = {
          id: crypto.randomUUID(),
          speaker,
          original: text,
          translated: data.translation || text,
          detectedLang: data.detectedLang || "??",
          targetLang: data.targetLang || "??",
          timestamp: Date.now(),
        };

        saveEntries([...entries, entry]);
        speakText(entry.translated, entry.targetLang);
      } catch (err) {
        console.error(err);
        toast.error("เกิดข้อผิดพลาดในการแปล");
      } finally {
        setIsTranslating(false);
      }
    },
    [entries, saveEntries, leftLang, rightLang]
  );

  const startListening = useCallback(
    (side: "left" | "right") => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("เบราว์เซอร์ไม่รองรับการรู้จำเสียง");
        return;
      }

      if (side === "left" && rightListening) {
        rightRecRef.current?.stop();
        setRightListening(false);
        setRightInterim("");
      }
      if (side === "right" && leftListening) {
        leftRecRef.current?.stop();
        setLeftListening(false);
        setLeftInterim("");
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set recognition language for accuracy
      const langCode = side === "left" ? leftLang : rightLang;
      const bcp47 = getBcp47(langCode);
      if (bcp47) {
        recognition.lang = bcp47;
      }
      // If "auto", leave recognition.lang empty so the browser uses its default

      let finalText = "";

      recognition.onresult = (event: any) => {
        let interim = "";
        finalText = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (side === "left") setLeftInterim(finalText + interim);
        else setRightInterim(finalText + interim);
      };

      recognition.onend = () => {
        if (side === "left") {
          setLeftListening(false);
          setLeftInterim("");
        } else {
          setRightListening(false);
          setRightInterim("");
        }
        if (finalText.trim()) {
          translateAndAdd(finalText.trim(), side);
        }
      };

      recognition.onerror = () => {
        if (side === "left") {
          setLeftListening(false);
          setLeftInterim("");
        } else {
          setRightListening(false);
          setRightInterim("");
        }
      };

      if (side === "left") {
        leftRecRef.current = recognition;
        setLeftListening(true);
      } else {
        rightRecRef.current = recognition;
        setRightListening(true);
      }
      recognition.start();
    },
    [leftListening, rightListening, translateAndAdd, leftLang, rightLang]
  );

  const stopListening = useCallback((side: "left" | "right") => {
    if (side === "left") {
      leftRecRef.current?.stop();
      setLeftListening(false);
    } else {
      rightRecRef.current?.stop();
      setRightListening(false);
    }
  }, []);

  const clearHistory = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation display */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {entries.length === 0 && !leftInterim && !rightInterim && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="font-display text-sm mb-1">🎙️ โหมดสนทนา</p>
            <p className="font-body text-xs">
              เลือกภาษาของแต่ละฝั่ง แล้วกดปุ่มไมค์เพื่อเริ่มพูด
              <br />
              ระบบจะตรวจจับภาษาและแปลอัตโนมัติ
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${entry.speaker === "right" ? "flex-row-reverse" : "flex-row"} gap-2`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-card ${
                  entry.speaker === "left"
                    ? "bg-primary text-primary-foreground rounded-bl-md"
                    : "bg-secondary text-secondary-foreground rounded-br-md"
                }`}
              >
                <span
                  className={`inline-block text-[10px] font-display font-semibold uppercase tracking-wide mb-1 ${
                    entry.speaker === "left"
                      ? "text-primary-foreground/70"
                      : "text-secondary-foreground/70"
                  }`}
                >
                  🗣 {getLangLabel(entry.detectedLang)}
                </span>
                <p className="text-sm font-body leading-relaxed">{entry.original}</p>
                <div
                  className={`mt-2 pt-2 border-t ${
                    entry.speaker === "left"
                      ? "border-primary-foreground/20"
                      : "border-secondary-foreground/20"
                  }`}
                >
                  <span
                    className={`inline-block text-[10px] font-display font-semibold uppercase tracking-wide mb-1 ${
                      entry.speaker === "left"
                        ? "text-primary-foreground/70"
                        : "text-secondary-foreground/70"
                    }`}
                  >
                    → {getLangLabel(entry.targetLang)}
                  </span>
                  <p className="text-sm font-body font-medium leading-relaxed">{entry.translated}</p>
                </div>
                <div className="mt-1.5 flex items-center justify-end gap-1">
                  <button
                    onClick={() => speakText(entry.original, entry.detectedLang)}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    title="ฟังต้นฉบับ"
                  >
                    <Volume2 size={12} />
                  </button>
                  <button
                    onClick={() => speakText(entry.translated, entry.targetLang)}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    title="ฟังคำแปล"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {leftInterim && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-row gap-2">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-primary/20 px-4 py-3">
              <p className="text-sm font-body text-foreground animate-pulse">{leftInterim}</p>
            </div>
          </motion.div>
        )}
        {rightInterim && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-row-reverse gap-2">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-secondary/20 px-4 py-3">
              <p className="text-sm font-body text-foreground animate-pulse">{rightInterim}</p>
            </div>
          </motion.div>
        )}

        {isTranslating && (
          <div className="text-center text-xs text-muted-foreground animate-pulse font-body">
            กำลังแปล...
          </div>
        )}
      </div>

      {/* Clear button */}
      {entries.length > 0 && (
        <div className="px-4 pb-2 flex justify-center">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors font-body"
          >
            <Trash2 size={14} />
            ล้างประวัติ
          </button>
        </div>
      )}

      {/* Text input */}
      <TextInput onSend={(text, side) => translateAndAdd(text, side)} disabled={isTranslating} />

      {/* Dual Mic Buttons with Language Pickers */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-center justify-around gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <LangPicker value={leftLang} onChange={setLeftLang} label="ผู้พูด 1" />
            <button
              onClick={() => (leftListening ? stopListening("left") : startListening("left"))}
              disabled={isTranslating}
              className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                leftListening
                  ? "bg-primary text-primary-foreground shadow-elevated"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              } disabled:opacity-40`}
            >
              {leftListening && (
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
              )}
              {leftListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <span className="text-[10px] text-muted-foreground font-body">
              {leftListening ? "กำลังฟัง..." : "กดเพื่อพูด"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <RotateCcw size={14} className="text-muted-foreground/50" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <LangPicker value={rightLang} onChange={setRightLang} label="ผู้พูด 2" />
            <button
              onClick={() => (rightListening ? stopListening("right") : startListening("right"))}
              disabled={isTranslating}
              className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                rightListening
                  ? "bg-secondary text-secondary-foreground shadow-elevated"
                  : "bg-muted text-muted-foreground hover:bg-secondary/10 hover:text-secondary"
              } disabled:opacity-40`}
            >
              {rightListening && (
                <span className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-30" />
              )}
              {rightListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <span className="text-[10px] text-muted-foreground font-body">
              {rightListening ? "กำลังฟัง..." : "กดเพื่อพูด"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Text Input for typing ── */
function TextInput({
  onSend,
  disabled,
}: {
  onSend: (text: string, side: "left" | "right") => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const [side, setSide] = useState<"left" | "right">("left");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim(), side);
    setText("");
  };

  return (
    <div className="border-t border-border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSide(side === "left" ? "right" : "left")}
          className={`shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-display font-semibold transition-colors ${
            side === "left"
              ? "bg-primary/15 text-primary"
              : "bg-secondary/15 text-secondary-foreground"
          }`}
        >
          {side === "left" ? "ผู้พูด 1" : "ผู้พูด 2"}
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="พิมพ์ข้อความ..."
          disabled={disabled}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
