import { Copy, Volume2, Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { TranslateEngine } from "./EngineSwitcher";

interface Props {
  result: string;
  engine: TranslateEngine;
  isLoading: boolean;
}

const engineMeta: Record<TranslateEngine, { label: string; icon: string; colorClass: string }> = {
  google: { label: "Google Translate", icon: "🌐", colorClass: "text-primary" },
  gemini: { label: "Gemini AI", icon: "✨", colorClass: "text-secondary" },
  gpt: { label: "ChatGPT", icon: "🤖", colorClass: "text-secondary" },
};

export default function TranslateResult({ result, engine, isLoading }: Props) {
  const [copied, setCopied] = useState(false);
  const meta = engineMeta[engine];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: result });
    }
  };

  if (!result && !isLoading) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={engine}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="rounded-2xl bg-card shadow-elevated overflow-hidden"
      >
        {/* Engine badge */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <span className="text-base">{meta.icon}</span>
          <span className={`font-display text-xs font-semibold uppercase tracking-wider ${meta.colorClass}`}>
            {meta.label}
          </span>
        </div>

        {/* Result text */}
        <div className="px-5 pb-4 min-h-[80px]">
          {isLoading ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
            </div>
          ) : (
            <p className="font-body text-base leading-relaxed text-foreground whitespace-pre-wrap">
              {result}
            </p>
          )}
        </div>

        {/* Actions */}
        {result && !isLoading && (
          <div className="flex items-center justify-end gap-1 border-t border-border px-3 py-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span className="text-xs font-display">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Volume2 size={16} />
              <span className="text-xs font-display">ฟัง</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Share2 size={16} />
              <span className="text-xs font-display">แชร์</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
