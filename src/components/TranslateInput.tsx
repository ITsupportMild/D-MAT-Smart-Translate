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

// --- ปรับปรุงการดีเทคภาษาให้แม่นยำขึ้น ---
function detectLangClient(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  
  // เช็กตามลำดับความสำคัญของตัวอักษร
  if (/[\u0E00-\u0E7F]/.test(t)) return "ไทย";
  if (/[\u4E00-\u9FFF]/.test(t)) return "中文";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) return "日本語";
  if (/[\u1100-\u11FF\uAC00-\uD7AF]/.test(t)) return "한국어";
  if (/[\u0400-\u04FF]/.test(t)) return "Русский";
  
  // ถ้ามีแต่ภาษาอังกฤษหรือตัวเลข
  if (/^[a-zA-Z0-9\s.,!?-]+$/.test(t)) return "English";
  
  return "อัตโนมัติ";
}

export default function TranslateInput({ value, onChange, onClear, onTranslate, onImageCapture, isLoading }: Props) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const detectedLang = useMemo(() => detectLangClient(value), [value]);

  const handleCameraClick = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera 
      });
      if (image.base64String) {
        onImageCapture(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (error) {
      console.log("User cancelled camera");
    }
  };

  const toggleSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("ระบบไม่รองรับการพิมพ์ด้วยเสียง");
      return;
    }

    const recognition = new SpeechRecognition();
    // ปิด continuous เพื่อลดปัญหาคำเบิ้ลสะสม และเพิ่มความแม่นยำในการตัดประโยค
    recognition.continuous = false; 
    recognition.interimResults = false; // เอาเฉพาะผลลัพธ์สุดท้ายที่ชัวร์แล้วเท่านั้น แก้ปัญหาคำเบิ้ล
    recognition.lang = 'th-TH'; 
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      // ดึงคำพูดเฉพาะประโยคล่าสุดที่พูดจบจริงๆ
      const transcript = event.results[0][0].transcript;
      
      if (transcript) {
        onChange(transcript); // เขียนทับหรือต่อท้ายแบบสะอาดๆ
        
        // ดีเลย์นิดนึงเพื่อให้ State อัปเดตก่อนสั่งแปล
        setTimeout(() => {
          onTranslate();
        }, 300);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative rounded-2xl bg-card shadow-card border border-border/50">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onTranslate();
          }
        }}
        placeholder="กดไมค์แล้วพูดได้เลย..."
        rows={5}
        className="w-full resize-none rounded-2xl bg-transparent px-5 pt-5 pb-14 font-body text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      {value && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {detectedLang && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-display font-semibold text-primary">
              <Globe size={10} /> {detectedLang}
            </span>
          )}
          <button onClick={onClear} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <button
          onClick={toggleSpeech}
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
            isListening ? "bg-destructive text-white scale-110 shadow-lg" : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
        </button>

        <button
          onClick={handleCameraClick}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
        >
          <Camera size={20} />
        </button>
      </div>

      <div className="absolute bottom-3 right-3">
        <button
          onClick={onTranslate}
          disabled={!value.trim() || isLoading}
          className="rounded-xl bg-primary px-5 py-2 font-display text-sm font-medium text-primary-foreground shadow-card transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? "..." : "แปล"}
        </button>
      </div>
    </div>
  );
}
