import { Trash2, Clock, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TranslationRecord } from "@/hooks/useTranslationHistory";
import { LANGUAGES } from "./LanguageSelector";

const engineIcons: Record<string, string> = {
  google: "🌐",
  gemini: "✨",
  gpt: "🤖",
};

interface Props {
  history: TranslationRecord[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onReuse: (record: TranslationRecord) => void;
}

export default function TranslationHistory({
  history,
  isOpen,
  onClose,
  onClear,
  onRemove,
  onReuse,
}: Props) {
  const getLangLabel = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.label ?? code;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-background shadow-elevated overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <h2 className="font-display text-base font-bold text-foreground">
                ประวัติการแปล
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 font-display text-xs text-muted-foreground">
                {history.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClear}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-display text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                  ล้างทั้งหมด
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[calc(85vh-64px)] px-4 py-3">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Clock size={40} className="mb-3 opacity-30" />
                <p className="font-display text-sm">ยังไม่มีประวัติการแปล</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <motion.div
                    key={record.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="group rounded-2xl bg-card p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Engine + Languages */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">
                            {engineIcons[record.engine]}
                          </span>
                          <span className="font-display text-xs text-muted-foreground">
                            {getLangLabel(record.source)} → {getLangLabel(record.target)}
                          </span>
                          <span className="font-display text-xs text-muted-foreground/60">
                            {new Date(record.timestamp).toLocaleString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        {/* Input */}
                        <p className="font-body text-sm text-foreground line-clamp-2 mb-1">
                          {record.inputText}
                        </p>
                        {/* Result */}
                        <p className="font-body text-sm text-muted-foreground line-clamp-2">
                          {record.result}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onReuse(record)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="ใช้ซ้ำ"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          onClick={() => onRemove(record.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
