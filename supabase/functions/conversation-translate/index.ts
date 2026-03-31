import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build dynamic translation instructions based on user's language selections
    let translationRule: string;
    if (sourceLang && targetLang) {
      translationRule = `The source language is "${sourceLang}" and the target language is "${targetLang}". Translate accordingly.`;
    } else if (sourceLang && !targetLang) {
      translationRule = `The source language is "${sourceLang}". Detect a suitable target language: if source is Thai, translate to English; if source is English, translate to Thai; otherwise translate to English.`;
    } else if (!sourceLang && targetLang) {
      translationRule = `Detect the source language automatically. Translate the text into "${targetLang}".`;
    } else {
      translationRule = `Detect the source language automatically.
- If the detected language is Thai, translate to English.
- If the detected language is English, translate to Thai.
- For any other language, translate to Thai first (default).`;
    }

    const systemPrompt = `You are a language detection and translation assistant.

Given the user's text:
1. Detect the language of the text (or use the specified source language).
2. ${translationRule}

Reply ONLY with valid JSON in this exact format:
{"detectedLang":"<iso 639-1 code>","targetLang":"<iso 639-1 code>","translation":"<the translated text>"}

Rules:
- Use natural, fluent sentences — never translate word by word.
- detectedLang and targetLang must be ISO 639-1 codes (e.g. "th", "en", "zh", "ja", "ko", "fr", "de", "es", etc.)
- Do NOT include any text outside the JSON object.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";

    let result = { detectedLang: sourceLang || "??", targetLang: targetLang || "en", translation: rawContent };
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.translation) {
          result = {
            detectedLang: parsed.detectedLang || sourceLang || "??",
            targetLang: parsed.targetLang || targetLang || "en",
            translation: parsed.translation,
          };
        }
      }
    } catch {
      // fallback: use raw content
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("conversation-translate error:", e);
    const msg = e instanceof Error && e.name === "AbortError" ? "Request timeout" : e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
