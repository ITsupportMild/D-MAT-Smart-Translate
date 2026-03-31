import { motion } from "framer-motion";

export type TranslateEngine = "google" | "gemini" | "gpt";

const engines: { id: TranslateEngine; label: string; icon: string }[] = [
  { id: "google", label: "Google", icon: "🌐" },
  { id: "gemini", label: "Gemini", icon: "✨" },
  { id: "gpt", label: "GPT", icon: "🤖" },
];

interface Props {
  active: TranslateEngine;
  onChange: (engine: TranslateEngine) => void;
}

export default function EngineSwitcher({ active, onChange }: Props) {
  return (
    <div className="relative flex rounded-full bg-muted p-1 font-display">
      {engines.map((e) => {
        const isActive = active === e.id;
        const isAI = e.id === "gemini" || e.id === "gpt";
        return (
          <button
            key={e.id}
            onClick={() => onChange(e.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors rounded-full ${
              isActive
                ? isAI
                  ? "text-secondary-foreground"
                  : "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="engine-pill"
                className={`absolute inset-0 rounded-full ${
                  isAI ? "bg-secondary" : "bg-primary"
                }`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-base">{e.icon}</span>
            <span className="relative z-10">{e.label}</span>
          </button>
        );
      })}
    </div>
  );
}
