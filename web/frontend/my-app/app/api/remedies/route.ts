import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { disease } = await req.json();

    if (!disease) {
      return NextResponse.json(
        { error: "Disease name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are Dhanvantari, the divine Ayurvedic physician. Provide 4-6 specific remedies for the given health condition.

For each remedy, provide:
1. An emoji icon (single emoji)
2. Name of the remedy/practice
3. Sanskrit name (in Devanagari script)
4. Brief description (one sentence)
5. 2-3 key benefits
6. When/how to use it

Format your response as a JSON array of objects with this structure:
[
  {
    "icon": "🌿",
    "name": "Remedy Name",
    "sanskrit": "संस्कृत नाम",
    "desc": "One sentence description",
    "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
    "when": "Usage instructions"
  }
]

Keep descriptions concise, practical, and rooted in Ayurvedic wisdom. Mix different categories: herbs, yoga, pranayama, diet, lifestyle.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Provide Ayurvedic remedies for: ${disease}` }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        stream: false,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return NextResponse.json(
        { error: "Failed to get remedy recommendations" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    
    let remedies = [];
    try {
      const parsed = JSON.parse(content);
      remedies = Array.isArray(parsed) ? parsed : (parsed.remedies || []);
    } catch (e) {
      console.error("Failed to parse remedies:", e);
      return NextResponse.json(
        { error: "Failed to parse remedy recommendations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ remedies, disease });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
