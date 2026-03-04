import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    try {
        const { userComment, auctionTitle, recentChat, userSummary, userCollectionCount, customSystemPrompt } = await request.json();

        if (!userComment || !auctionTitle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 隨機抽選一位虛擬發言人的名字，讓語氣更真實
        const chatbotNameOptions = ["王**", "李**", "張**", "陳**", "林**", "黃**", "周**", "謝**", "劉**", "趙**", "江**", "羅**", "L***", "K***", "M***", "S***", "T***", "A***", "J***", "D***", "色違獵人", "孵蛋廢人", "圖鑑收集狂", "搶標新手", "潛水路人", "小資族玩家", "非洲人日常", "收藏控"];
        const chatbotName = chatbotNameOptions[Math.floor(Math.random() * chatbotNameOptions.length)];

        // 隨機選擇回覆策略（導入心理學原理）
        const styles = [
            "【FOMO 錯失恐懼】：暗示這隻寶可夢非常稀有、錯過這次不知要等多久，製造稀缺感。例如：「這隻現在超難找，錯過真的會捶心肝...」",
            "【社會認同 Social Proof】：提及其他人也很想要這隻、或者國外論壇行情很高，讓玩家覺得標下去是有價值的。例如：「昨天看 Reddit 也有人在懸賞這隻，難怪大家搶成這樣🔥」",
            "【好奇心懸念 Curiosity Gap】：暗示這隻寶可夢有某種隱藏價值或特色，但不完全點破。例如：「你們有注意到這隻的隱藏亮點嗎？懂的人自然懂...」",
            "【正向強化 Positive Reinforcement】：稱讚目前的出價者很有眼光，或是鼓勵繼續加碼。例如：「這位兄弟懂標喔，這個價位拿下絕對不虧！」",
            "【蔡加尼克效應 (未完成感)】：針對快要結標的情境，暗示就差一點點就能拿下了，放棄很可惜。例如：「都追到這裡了，現在放棄真的好嗎？再拼一下吧！」",
            "【幽默自嘲】：以自己沒錢或運氣不好的角度，襯托其他出價者的財力或幸運。例如：「看看這精美的價格，窮人家如我還是旁邊玩沙就好🥲」",
        ];
        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        // 組裝用戶摘要上下文（如果有的話）
        let userContext = "";
        if (customSystemPrompt) {
            // 管理員對此用戶設定了專屬指令，優先使用
            userContext = `\n\n【管理員對此用戶的專屬指令】\n${customSystemPrompt}`;
            if (userCollectionCount) userContext += `\n- 已收藏 ${userCollectionCount} 隻配布`;
        } else if (userSummary || userCollectionCount) {
            userContext = `\n\n【關於這位玩家的背景】`;
            if (userSummary) userContext += `\n- 自我介紹：${userSummary}`;
            if (userCollectionCount) userContext += `\n- 已收藏 ${userCollectionCount} 隻配布`;
            userContext += `\n（你可以根據這些資訊，讓回覆更自然、更有針對性。例如收藏多的可以稱讚「大佬」，新手可以鼓勵。但不要刻意提到你知道對方的資料，要像是從對方的發言判斷出來的。）`;
        }

        const systemPrompt = `你是 Pokémon 競標拍賣大廳裡的一名資深玩家（你的聊天室 ID 是：${chatbotName}）。
你正在觀看大家對【${auctionTitle}】的競標與討論。

你的目標是：活絡競標室氣氛、刺激其他玩家的競標意願、自然地帶動情緒。

【語氣與人設規則】
1. 使用台灣年輕遊戲玩家的繁中慣用語，極度精簡，像在 PTT 或 Discord 聊天一樣。
2. 字數 **嚴格限制在 3 到 15 個字以內**。越短越好，不要長篇大論。
3. 如果有人說話了，直接接話，不用打招呼，也不要講大道理。
4. 拒絕做作的驚嘆或刻意的懸疑（例如不要說「好像有點東西喔...還有沒被發現的嗎？」這種裝神弄鬼的話）。
5. 視情況隨口加上一句語助詞或一個 emoji 即可（如：笑死、靠、真假、喔、這到底... 😂）。
6. 你必須採用以下指定的心理學策略來作為本次發言的核心驅動力：

本次採用的策略：${selectedStyle}${userContext}`;

        const userMsg = `[當前競標物：${auctionTitle}]\n有一位真實玩家發言說：${userComment}${recentChat ? `\n\n（近期的聊天紀錄參考：\n${recentChat}\n）` : ""}\n\n請以你的身分（${chatbotName}）和指定策略，隨口回覆一句話。`;

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

        // 清理回覆（去掉可能的引號、多餘空白、HTML 標籤）
        const cleanReply = reply
            .replace(/^[「『"'"]+/, "")
            .replace(/[」』"'"]+$/, "")
            .replace(/<[^>]*>/g, "")   // 移除 HTML 標籤
            .replace(/\*+/g, "")       // 移除 markdown 粗體
            .trim()
            .slice(0, 50); // 限制長度

        return NextResponse.json({ reply: cleanReply });
    } catch (error) {
        console.error("Generate reply error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
