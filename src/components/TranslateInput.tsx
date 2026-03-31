import { X, Mic, MicOff, Camera, Globe } from "lucide-react";
import { useState, useRef, useMemo } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  onTranslate: () => void;
  onImageCapture: (base64: string) => void;
  isLoading: boolean;
}

function detectLangClient(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (/[\u0E00-\u0E7F]/.test(t)) return "ไทย";
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(t)) return "中文";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) return "日本語";
  if (/[\uAC00-\uD7AF]/.test(t)) return "한국어";
  if (/[\u0600-\u06FF]/.test(t)) return "العربية";
  if (/[\u0900-\u097F]/.test(t)) return "हिन्दी";
  if (/[\u0400-\u04FF]/.test(t)) return "Русский";
  if (/[a-zA-Z]/.test(t)) return "English";
  return null;
}

export default function TranslateInput({ value, onChange, onClear, onTranslate, onImageCapture, isLoading }: Props) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseTextRef = useRef("");

  const detectedLang = useMemo(() => detectLangClient(value), [value]);

  const toggleSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("เบราว์เซอร์ไม่รองรับการพูดเป็นข้อความ");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "";

    baseTextRef.current = value;

    recognition.onresult = (event: any) => {
      let finalParts = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalParts += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const base = baseTextRef.current;
      const separator = base && !base.endsWith(" ") ? " " : "";
      onChange(base + separator + finalParts + interim);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onImageCapture(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="relative rounded-2xl bg-card shadow-card">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onTranslate();
          }
        }}
        placeholder="พิมพ์หรือวางข้อความที่นี่..."
        rows={5}
        className="w-full resize-none rounded-2xl bg-transparent px-5 pt-5 pb-14 font-body text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      {value && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {detectedLang && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-display font-semibold text-primary">
              <Globe size={10} />
              {detectedLang}
            </span>
          )}
          <button
            onClick={onClear}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <button
          onClick={toggleSpeech}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
          title="พูดเพื่อพิมพ์"
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="ถ่ายรูปหรือเลือกรูปเพื่อแปล"
        >
          <Camera size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      <div className="absolute bottom-3 right-3">
        <button
          onClick={onTranslate}
          disabled={!value.trim() || isLoading}
          className="rounded-xl bg-primary px-5 py-2 font-display text-sm font-medium text-primary-foreground shadow-card transition-all hover:shadow-elevated disabled:opacity-40 disabled:shadow-none"
        >
          {isLoading ? "กำลังแปล..." : "แปล"}
        </button>
      </div>
    </div>
  );
}
