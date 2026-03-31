import { motion, AnimatePresence } from "framer-motion";
import { Copy, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  original: string;
  translation: string;
  isLoading: boolean;
  imagePreview?: string | null;
  onClose: () => void;
}

export default function ImageTranslateResult({ original, translation, isLoading, imagePreview, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translation);
    setCopied(true);
    toast.success("คัดลอกแล้ว");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoading && !original && !translation) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="mt-4 rounded-2xl bg-card p-5 shadow-card relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            📷 แปลจากรูปภาพ
          </span>
        </div>

        {imagePreview && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border">
            <img
              src={imagePreview}
              alt="ภาพที่เลือก"
              className="w-full max-h-60 object-contain bg-muted/30"
            />
          </div>
        )}

        {isLoading ? (
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            {original && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">ข้อความต้นฉบับ</p>
                <p className="font-body text-sm text-foreground">{original}</p>
              </div>
            )}
            {translation && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">คำแปล</p>
                <p className="font-body text-base text-foreground">{translation}</p>
                <button
                  onClick={handleCopy}
                  className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy size={14} />
                  {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
