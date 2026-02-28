import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { disease, remedies } = body;

    // Get credentials from environment variables
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { error: "Telegram credentials not configured" },
        { status: 500 }
      );
    }

    // Format remedies list
    const remediesList = remedies
      .slice(0, 5) // Limit to first 5 to avoid message being too long
      .map((remedy: any, index: number) => {
        const benefits = remedy.benefits?.slice(0, 2).join(", ") || "";
        return `\n${index + 1}. ${remedy.icon} ${remedy.name} (${remedy.sanskrit})\n   📝 ${remedy.desc.slice(0, 80)}...\n   ✅ ${benefits}`;
      })
      .join("\n");

    const moreRemedies = remedies.length > 5 ? `\n\n... and ${remedies.length - 5} more remedies` : "";

    // Format the message
    const message = `🌿 Dhanvantari - Ayurvedic Remedies 🪷\n\n✨ New Remedy Request:\n📋 Condition: ${disease}\n💊 Remedies Found: ${remedies.length}\n\n${"=" .repeat(30)}\n${remediesList}${moreRemedies}\n${"-".repeat(30)}\n\n🕉️ Ancient wisdom for modern wellness\n⏰ Generated at: ${new Date().toLocaleString()}`;

    // Send message via Telegram Bot API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error("Telegram API error:", data);
      return NextResponse.json(
        { error: "Failed to send Telegram notification", details: data },
        { status: 500 }
      );
    }

    console.log(`[${new Date().toLocaleTimeString()}] Telegram notification sent for: ${disease}`);

    return NextResponse.json({
      success: true,
      message: "Telegram notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return NextResponse.json(
      { error: "Failed to send Telegram notification" },
      { status: 500 }
    );
  }
}
