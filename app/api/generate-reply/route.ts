import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    try {
        const { userComment, auctionTitle, recentChat } = await request.json();

        if (!userComment || !auctionTitle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const systemPrompt = `你是一個寶可夢配布競標網站的普通用戶。你的角色是在聊天室用繁體中文跟其他人閒聊。
規則：
- 語氣像年輕人在 PTT/巴哈/Discord 上講話
- 回覆不超過 20 個字
- 口語化，不要用引號
- 可以適當用 emoji 但不要太多
- 只回覆一句話
- 回覆要跟對方說的內容有關聯`;

        const userMsg = `競標標題：${auctionTitle}\n用戶說：${userComment}${recentChat ? `\n最近聊天：\n${recentChat}` : ""}\n\n請用一句話自然地回覆。`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userMsg }] }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 50,
                        topP: 0.95,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API error:", errorText);
            return NextResponse.json({ error: "LLM API failed" }, { status: 502 });
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!reply) {
            return NextResponse.json({ error: "No reply generated" }, { status: 502 });
        }

        // 清理回覆（去掉可能的引號、多餘空白）
        const cleanReply = reply
            .replace(/^[「『"'"]+/, "")
            .replace(/[」』"'"]+$/, "")
            .trim()
            .slice(0, 50); // 限制長度

        return NextResponse.json({ reply: cleanReply });
    } catch (error) {
        console.error("Generate reply error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
