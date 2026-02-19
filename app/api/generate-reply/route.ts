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

        // 隨機選擇一種心理學回覆策略
        const strategies = [
            "用「好奇心缺口」策略：回覆一個跟對方留言有關的開放性問題，讓對方想回答你。例如「你之前有搶過這種的嗎？」「你收藏幾隻了？」",
            "用「正面強化」策略：真心肯定對方說的話，讓對方感覺被重視、被認同。例如「你這眼光真的讚」「懂的人就是懂」",
            "用「社會認同」策略：讓對方覺得自己是社群重要的一份子，暗示很多人跟他想法一樣。例如「大家都在等這隻」「你跟我想的一樣欸」",
            "用「FOMO」策略：輕微暗示還有更精彩的或即將錯過什麼，但要自然不刻意。例如「等等下一場更猛喔」「趁現在價格還OK快搶」",
            "用「留懸念」策略：說一半讓對方好奇，想繼續聊。例如「我上次搶到一隻超特別的...」「這隻其實有個故事」",
            "用「共鳴」策略：分享自己類似的感受或經驗，建立連結。例如「我也是看了好久才下手」「我懂那種猶豫的感覺」",
        ];
        const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];

        const systemPrompt = `你是一個寶可夢配布競標網站的資深用戶，很享受這個社群的氛圍。你在聊天室用繁體中文跟其他人自然互動。

你的個性：熱情但不浮誇、懂寶可夢配布、樂於助人、像一個熱心的老玩家。

回覆規則：
- 語氣像年輕人在 PTT/巴哈/Discord 上聊天
- 回覆不超過 25 個字
- 口語化、自然，不要用引號
- 不要使用任何 emoji 或表情符號
- 只回覆一句話
- 回覆必須跟對方說的內容直接相關
- 不要說「我是AI」或任何暗示自己不是真人的話

本次回覆策略：
${selectedStrategy}`;

        const userMsg = `競標：${auctionTitle}\n對方說：${userComment}${recentChat ? `\n最近聊天：\n${recentChat}` : ""}\n\n用上述策略自然地回覆一句話。`;

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
