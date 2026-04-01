import { X, Mic, MicOff, Camera, Globe } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  if (/[\u0400-\u04FF]/.test(t)) return "Русский";
  if (/[a-zA-Z]/.test(t)) return "English";
  return null;
}

export default function TranslateInput({ value, onChange, onClear, onTranslate, onImageCapture, isLoading }: Props) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const detectedLang = useMemo(() => detectLangClient(value), [value]);

  // --- ส่วนที่ 1: แก้ให้กล้องดีดออกมาทันที ---
  const handleCameraClick = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera // บังคับเปิดกล้องถ่ายสดเท่านั้น
      });

      if (image.base64String) {
        onImageCapture(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (error) {
      console.log("User cancelled or camera error");
    }
  };

  // --- ส่วนที่ 2: แก้ให้ไมค์เสถียรขึ้นบน Android ---
  const toggleSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("ระบบ Android ของเฮียยังไม่เปิดสิทธิ์การพิมพ์ด้วยเสียงครับ");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'th-TH'; // ตั้งค่าเริ่มต้นเป็นภาษาไทย
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let finalParts = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalParts += event.results[i][0].transcript;
        }
      }
      if (finalParts) {
        onChange(value + (value && !value.endsWith(" ") ? " " : "") + finalParts);
      }
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
    }
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
          <button onClick={onClear} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        {/* ปุ่มไมค์ */}
        <button
          onClick={toggleSpeech}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            isListening ? "bg-destructive text-white animate-pulse" : "bg-muted text-muted-foreground"
          }`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* ปุ่มกล้อง (เรียกใช้ฟังก์ชันใหม่) */}
        <button
          onClick={handleCameraClick}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
        >
          <Camera size={20} />
        </button>
      </div>

      <div className="absolute bottom-3 right-3">
        <button
          onClick={onTranslate}
          disabled={!value.trim() || isLoading}
          className="rounded-xl bg-primary px-5 py-2 font-display text-sm font-medium text-primary-foreground shadow-card transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "กำลังแปล..." : "แปล"}
        </button>
      </div>
    </div>
  );
}
