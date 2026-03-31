import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const ENGINES = [
  { key: "google", label: "Google", fill: "hsl(var(--engine-google))" },
  { key: "gemini", label: "Gemini", fill: "hsl(var(--engine-gemini))" },
  { key: "gpt", label: "GPT", fill: "hsl(var(--engine-gpt))" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoteStats({ isOpen, onClose }: Props) {
  const [stats, setStats] = useState<{ engine: string; votes: number; fill: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    Promise.all(
      ENGINES.map(async ({ key, label, fill }) => {
        const { count } = await (supabase.from as any)("translation_votes")
          .select("*", { count: "exact", head: true })
          .eq("engine", key);
        return { engine: label, votes: count || 0, fill };
      })
    ).then((data) => {
      setStats(data);
      setTotal(data.reduce((s, d) => s + d.votes, 0));
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="w-full max-w-lg rounded-t-3xl bg-card p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="font-display font-bold text-lg text-foreground">สถิติการโหวต</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-body">ยังไม่มีข้อมูลการโหวต</p>
            <p className="text-xs text-muted-foreground mt-1 font-body">กด Like ที่คำแปลที่ชอบเพื่อเริ่มสะสมสถิติ</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 font-body">
              รวมทั้งหมด <span className="font-bold text-foreground">{total}</span> โหวต
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="engine" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Percentage breakdown */}
            <div className="mt-4 flex gap-2">
              {stats.map((s) => (
                <div key={s.engine} className="flex-1 rounded-xl bg-muted p-3 text-center">
                  <p className="font-display text-xs text-muted-foreground">{s.engine}</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {total > 0 ? Math.round((s.votes / total) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
