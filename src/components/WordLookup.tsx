import { useState, useEffect } from "react";
import { X, Loader2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface LookupResult {
  meaning: string;
  synonyms: string[];
  example: string;
}

interface Props {
  word: string;
  onClose: () => void;
}

export default function WordLookup({ word, onClose }: Props) {
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!word) return;
    setLoading(true);
    supabase.functions
      .invoke("word-lookup", { body: { word } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          setResult({ meaning: "ไม่สามารถค้นหาได้", synonyms: [], example: "" });
        } else {
          setResult(data);
        }
        setLoading(false);
      });
  }, [word]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-2xl bg-card shadow-elevated border border-border p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <h3 className="font-display font-bold text-foreground text-lg">{word}</h3>
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm font-body">กำลังค้นหา...</span>
        </div>
      ) : result ? (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mb-0.5">ความหมาย</p>
            <p className="text-sm font-body text-foreground">{result.meaning}</p>
          </div>
          {result.synonyms.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mb-1">คำพ้องความหมาย</p>
              <div className="flex flex-wrap gap-1.5">
                {result.synonyms.map((s) => (
                  <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-body text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.example && (
            <div>
              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mb-0.5">ตัวอย่างประโยค</p>
              <p className="text-sm font-body text-foreground italic">{result.example}</p>
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
