import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TranslateTone = "neutral" | "formal" | "casual" | "written" | "spoken";

const TONES: { value: TranslateTone; label: string; icon: string }[] = [
  { value: "neutral", label: "ปกติ", icon: "💬" },
  { value: "formal", label: "ทางการ", icon: "🎩" },
  { value: "casual", label: "กันเอง", icon: "😊" },
  { value: "written", label: "ภาษาเขียน", icon: "✍️" },
  { value: "spoken", label: "ภาษาพูด", icon: "🗣️" },
];

interface Props {
  value: TranslateTone;
  onChange: (tone: TranslateTone) => void;
}

export default function ToneSelector({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TranslateTone)}>
      <SelectTrigger className="rounded-xl bg-card border-border font-display text-sm">
        <SelectValue placeholder="เลือกโทนการแปล" />
      </SelectTrigger>
      <SelectContent>
        {TONES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            <span className="flex items-center gap-2">
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
