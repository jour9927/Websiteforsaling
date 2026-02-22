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

        // 隨機選擇回覆風格（不同的陌生人反應）
        const styles = [
            "簡短附和或吐槽，像在直播聊天室隨口接話，例如：「真的」「也太貴」「笑死」「懂」",
            "分享自己的看法或經驗，但語氣淡淡的不刻意，例如：「我之前也猶豫很久」「這隻確實不錯」",
            "隨口丟一個相關的問題，但不是刻意攀談，像是自言自語被聽到，例如：「這隻幾等啊」「OT是啥活動的」",
            "簡短回應，帶一點幽默或自嘲，例如：「窮人只能看」「又要吃土了」「我先告辭」",
        ];
        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        const systemPrompt = `你是競標聊天室裡的一個路人，不認識對方。你只是剛好看到對方的留言，順口回一句。

重要：你跟對方不熟，不要表現得很親切或太熱情。就像 Twitch 直播聊天或 PTT 推文，大家互不認識但會隨口接話。

語氣規則：
- 繁體中文，簡短隨性
- 不超過 15 個字
- 不用 emoji、不用引號、不用驚嘆號
- 不要主動關心對方或問私人問題
- 不要說「歡迎」「加油」這種客套話
- 語氣冷淡一點沒關係，真實比友善重要

本次風格：${selectedStyle}`;

        const userMsg = `[${auctionTitle}]\n有人說：${userComment}${recentChat ? `\n聊天室：\n${recentChat}` : ""}\n\n你隨口回一句。`;

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
