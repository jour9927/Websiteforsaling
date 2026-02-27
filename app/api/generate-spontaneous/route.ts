import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    try {
        const { auctionTitle, recentChat, currentPrice, timeRemaining } = await request.json();

        if (!auctionTitle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 隨機抽選一位虛擬發言人的名字
        const chatbotNameOptions = ["王**", "李**", "張**", "陳**", "林**", "黃**", "周**", "謝**", "劉**", "趙**", "江**", "羅**", "L***", "K***", "M***", "S***", "T***", "A***", "J***", "D***", "會員#0892", "會員#1234", "會員#3456", "會員#5678", "會員#7890", "會員#0321", "會員#4399", "會員#9527"];
        const chatbotName = chatbotNameOptions[Math.floor(Math.random() * chatbotNameOptions.length)];

        // 隨機選擇自發性發言的策略
        const styles = [
            "【驚呼價格】",
            "【寶可夢點評】",
            "【時間緊迫感】",
            "【吃瓜群眾】",
            "【疑問或自言自語】"
        ];
        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        const systemPrompt = `你是 Pokémon 競標拍賣大廳裡的一名資深玩家或路過群眾（你的聊天室 ID 是：${chatbotName}）。
你現在正在觀看對【${auctionTitle}】的競標。

你的目標是：在沒有人跟你說話的情況下，針對眼前的拍賣狀況自發性地點評一句話。

【當前拍賣狀況】
- 競標物：${auctionTitle}
- 目前最高標價：${currentPrice} 點
- 剩餘時間狀態：${timeRemaining}
${recentChat ? `- 最近聊天室的氣氛：\n${recentChat}` : ""}

【語氣與人設規則】
1. 使用台灣網路社群（如巴哈、PTT）的玩家慣用語，極度精簡。
2. 字數 **嚴格限制在 3 到 12 個字以內**。越短越像真人在打字。
3. 嚴禁使用做作的讚嘆、刻意的懸疑或自問自答（例如絕對不要說「好像有點東西喔...還有沒被發現的嗎？」）。
4. 你只是在那邊碎碎念，不帶任何推銷感。
5. 適度使用一個常見的 emoji 或語助詞（如：笑死、真假、扯...）。
6. 你必須採用以下指定的策略來做為這次發言的核心：
本次採用的策略：${selectedStyle}`;

        const userMsg = `請根據現況，以（${chatbotName}）的身分隨口在聊天室發送一句話。`;

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

        const cleanReply = reply
            .replace(/^[「『"'"]+/, "")
            .replace(/[」』"'"]+$/, "")
            .trim()
            .slice(0, 50);

        return NextResponse.json({ reply: cleanReply, simulatedName: chatbotName });
    } catch (error) {
        console.error("Generate spontaneous error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
