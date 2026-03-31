import { useMemo } from "react";

const COMMON_PHRASES: Record<string, string[]> = {
  // Thai
  "สวัส": ["สวัสดี", "สวัสดีครับ", "สวัสดีค่ะ"],
  "ขอบ": ["ขอบคุณ", "ขอบคุณครับ", "ขอบคุณค่ะ", "ขอบใจ"],
  "ขอโ": ["ขอโทษ", "ขอโทษครับ", "ขอโทษค่ะ"],
  "ยินด": ["ยินดีที่ได้รู้จัก", "ยินดีต้อนรับ"],
  "อรุ": ["อรุณสวัสดิ์"],
  "ราต": ["ราตรีสวัสดิ์"],
  "ช่วย": ["ช่วยด้วย", "ช่วยแปลให้หน่อย"],
  "ไม่เ": ["ไม่เข้าใจ", "ไม่เป็นไร"],
  "เท่า": ["เท่าไหร่", "เท่าไร"],
  // English
  "hel": ["hello", "help me", "hello world"],
  "how": ["how are you?", "how much?", "how do you say"],
  "tha": ["thank you", "thanks"],
  "goo": ["good morning", "good night", "goodbye"],
  "wha": ["what is this?", "what does it mean?", "what time?"],
  "whe": ["where is", "where are you?"],
  "ple": ["please", "pleased to meet you"],
  "exc": ["excuse me"],
  "sor": ["sorry"],
  "i d": ["i don't understand", "i don't know"],
  "can": ["can you help me?", "can you translate?"],
  // Japanese
  "こん": ["こんにちは", "こんばんは"],
  "あり": ["ありがとう", "ありがとうございます"],
  "すみ": ["すみません"],
  // Korean
  "안녕": ["안녕하세요"],
  "감사": ["감사합니다"],
  // Chinese
  "你好": ["你好吗？"],
  "谢谢": ["谢谢你"],
};

interface Props {
  inputText: string;
  onSelect: (text: string) => void;
}

export default function TypingSuggestions({ inputText, onSelect }: Props) {
  const suggestions = useMemo(() => {
    if (!inputText || inputText.length < 2) return [];
    const lower = inputText.toLowerCase().trim();
    const lastWord = lower.split(/\s+/).pop() || lower;

    const matches: string[] = [];
    for (const [prefix, phrases] of Object.entries(COMMON_PHRASES)) {
      if (lastWord.startsWith(prefix.toLowerCase()) || prefix.toLowerCase().startsWith(lastWord)) {
        matches.push(...phrases);
      }
    }
    return [...new Set(matches)].slice(0, 4);
  }, [inputText]);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-1 py-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-body text-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
