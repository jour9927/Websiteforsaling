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

        const prompt = `你是一個寶可夢配布競標網站的普通用戶，正在看一場「${auctionTitle}」的競標。

有人在聊天室說了：「${userComment}」

${recentChat ? `最近的聊天紀錄：\n${recentChat}\n` : ""}

請用一句話自然地回覆這則留言。要求：
- 用繁體中文，口語化、年輕人的語氣
- 像 PTT、巴哈、Discord 的短回覆風格
- 不要超過 20 個字
- 不要用引號
- 不要太正式，要像朋友之間的對話
- 可以適當用 emoji 但不要太多
- 回覆要跟對方說的內容有關聯
- 只回覆一句話，不要多餘的解釋`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 50,
                        topP: 0.95,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                    ],
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
