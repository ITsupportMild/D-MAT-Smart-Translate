import { ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

export const LANGUAGES = [
  { code: "auto", label: "ตรวจจับอัตโนมัติ" },
  { code: "th", label: "ไทย" },
  { code: "en", label: "อังกฤษ (English)" },
  { code: "zh", label: "จีน (中文)" },
  { code: "ja", label: "ญี่ปุ่น (日本語)" },
  { code: "ko", label: "เกาหลี (한국어)" },
  { code: "my", label: "พม่า (Myanmar)" },
  { code: "vi", label: "เวียดนาม (Tiếng Việt)" },
  { code: "fr", label: "ฝรั่งเศส (Français)" },
  { code: "de", label: "เยอรมัน (Deutsch)" },
  { code: "es", label: "สเปน (Español)" },
  { code: "pt", label: "โปรตุเกส (Português)" },
  { code: "ru", label: "รัสเซีย (Русский)" },
  { code: "ar", label: "อาหรับ (العربية)" },
  { code: "hi", label: "ฮินดี (हिन्दी)" },
  { code: "id", label: "อินโดนีเซีย (Bahasa)" },
  { code: "ms", label: "มาเลย์ (Melayu)" },
  { code: "it", label: "อิตาลี (Italiano)" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

interface Props {
  source: LangCode;
  target: LangCode;
  onSourceChange: (code: LangCode) => void;
  onTargetChange: (code: LangCode) => void;
  onSwap: () => void;
}

export default function LanguageSelector({
  source,
  target,
  onSourceChange,
  onTargetChange,
  onSwap,
}: Props) {
  const sourceLabel = LANGUAGES.find((l) => l.code === source)?.label ?? source;
  const targetLabel = LANGUAGES.find((l) => l.code === target)?.label ?? target;

  return (
    <div className="flex items-center gap-2">
      {/* Source */}
      <div className="relative flex-1">
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value as LangCode)}
          className="w-full appearance-none rounded-xl bg-card px-4 py-3 font-display text-sm font-medium text-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Swap */}
      <motion.button
        whileTap={{ rotate: 180 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onSwap}
        disabled={source === "auto"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card disabled:opacity-40"
      >
        <ArrowRightLeft size={18} />
      </motion.button>

      {/* Target */}
      <div className="relative flex-1">
        <select
          value={target}
          onChange={(e) => onTargetChange(e.target.value as LangCode)}
          className="w-full appearance-none rounded-xl bg-card px-4 py-3 font-display text-sm font-medium text-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
