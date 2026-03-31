import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toneInstructions: Record<string, string> = {
  formal: "Use formal, polite, and professional language.",
  casual: "Use casual, friendly, and informal language.",
  written: "Use literary/written style suitable for documents and articles.",
  spoken: "Use colloquial, conversational spoken language.",
  neutral: "",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, engine, source, target, tone } = await req.json();

    if (!text || !engine || !target) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text, engine, target" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const modelMap: Record<string, string> = {
      google: "google/gemini-2.5-flash-lite",
      gemini: "google/gemini-3-flash-preview",
      gpt: "openai/gpt-5-mini",
    };

    const model = modelMap[engine] || "google/gemini-3-flash-preview";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sourceLang = source === "auto" ? "auto-detected language" : source;
    const toneInstruction = toneInstructions[tone || "neutral"] || "";
    const toneClause = toneInstruction ? ` ${toneInstruction}` : "";

    const systemPrompt =
      `You are a professional translator. Translate the given text from ${sourceLang} to ${target} as a COMPLETE, NATURAL sentence or paragraph — NOT word-by-word.${toneClause}

Reply ONLY with valid JSON in this exact format:
{"translation":"<the full translated text>","alignment":[{"src":"<source word/phrase>","tgt":"<translated word/phrase>"},...]}

Rules:
- The "translation" must be a fluent, natural sentence/paragraph in ${target}. Never translate word-by-word.
- The "alignment" array maps key source words/phrases to their corresponding translated parts (5-10 entries max for readability).
- Do NOT include any text outside the JSON object.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "เครดิตหมด กรุณาเติมเครดิตในระบบ" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";

    // Try to parse structured JSON response
    let translation = rawContent;
    let alignment: Array<{ src: string; tgt: string }> = [];
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.translation) {
          translation = parsed.translation;
          alignment = Array.isArray(parsed.alignment) ? parsed.alignment : [];
        }
      }
    } catch {
      // Fallback: use raw content as translation
      translation = rawContent;
    }

    return new Response(
      JSON.stringify({ translation, alignment }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("translate error:", e);
    const msg = e instanceof Error && e.name === "AbortError" ? "Request timeout" : e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
