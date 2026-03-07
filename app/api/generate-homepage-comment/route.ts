import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    try {
        const { recentChat, collectionContext, userSummary } = await request.json();

        // 隨機抽選一位虛擬發言人的名字
        const chatbotNameOptions = [
            "王**", "李**", "張**", "陳**", "林**", "黃**", "周**", "謝**",
            "劉**", "趙**", "江**", "羅**", "L***", "K***", "M***", "S***",
            "T***", "A***", "J***", "D***",
            "色違獵人", "孵蛋廢人", "圖鑑收集狂", "搶標新手",
            "潛水路人", "小資族玩家", "非洲人日常", "收藏控",
        ];
        const chatbotName = chatbotNameOptions[Math.floor(Math.random() * chatbotNameOptions.length)];

        // 根據是否有收藏上下文選擇不同策略
        const hasCollection = !!collectionContext;

        const collectionStyles = [
            "【稱讚收藏】：針對這位用戶精選收藏中的某一隻配布，表達由衷的讚嘆或羨慕。直接提到配布名稱。例如：「你那隻皮卡丘也太讚了吧」",
            "【討論配布】：針對精選收藏中某隻的點數、活動、年份發表意見。例如：「5000pts 的配布 真的猛」",
            "【色違相關】：如果有色違配布，表達對色違的驚嘆。例如：「色違的也太美了吧」",
            "【羨慕/想要】：看到收藏後表達自己也想擁有。例如：「好想要你那隻噴火龍」",
            "【互動提問】：針對收藏中的某隻配布提問或引發對話。例如：「那隻是哪場活動的啊」",
        ];

        const generalStyles = [
            "【日常閒聊】：像平常逛社群一樣，隨口聊聊最近的狀態、今天的心情，或提到寶可夢相關的話題。例如：「今天又來逛了 嘻嘻」",
            "【種草推薦】：提起某隻寶可夢的魅力或最近看到的好配布，引起其他人的興趣。例如：「最近那隻活動配布也太帥了吧」",
            "【自嘲/搞笑】：以輕鬆的口吻自嘲沒錢或運氣差，或分享搞笑日常。例如：「月底吃土 但還是想搶」",
            "【社群互動】：表達對社群的喜愛、問候大家、或提到最近的活動。例如：「好久不見大家～」",
            "【好奇/詢問】：對社群中的事物表達好奇或提問。例如：「有人知道下場什麼時候開嗎」",
        ];

        // 如果有收藏上下文，80% 用收藏策略，20% 用通用策略
        const styles = hasCollection
            ? (Math.random() < 0.8 ? collectionStyles : generalStyles)
            : generalStyles;
        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        const userSummaryBlock = userSummary
            ? `\n\n這位用戶的簡介/特色：${userSummary}\n（你可以適度參考這些資訊來讓留言更貼切，但不要刻意提及）`
            : "";

        const contextBlock = hasCollection
            ? `\n你正在瀏覽一位用戶的個人空間，看到了他的精選收藏：\n${collectionContext}${userSummaryBlock}\n\n你的留言應該要自然地提到他的收藏中的某隻配布。`
            : "\n你正在瀏覽首頁的即時留言區。";

        const systemPrompt = `你是 Pokémon 配布收藏社群網站裡的一名活躍會員（你的 ID 是：${chatbotName}）。
${contextBlock}

你的目標是：在留言區留下自然又有趣的一句話。

【語氣與人設規則】
1. 使用台灣年輕遊戲玩家的繁中慣用語，極度精簡，像在 PTT 或 Discord 聊天一樣。
2. 字數 **嚴格限制在 5 到 20 個字以內**。越短越好，不要長篇大論。
3. 不要打招呼，不要講大道理，就像是在看到別人收藏後隨口一句讚嘆或評論。
4. 拒絕做作的驚嘆或刻意的懸疑。
5. 視情況隨口加上一句語助詞或一個 emoji 即可（如：笑死、靠、真假、喔... 😂）。
6. 如果提到具體配布，直接使用配布的寶可夢名稱，不要用「你的收藏」這種泛指。
7. 你必須採用以下指定的策略來作為本次發言的核心驅動力：

本次採用的策略：${selectedStyle}`;

        const userMsg = hasCollection
            ? `請以你的身分（${chatbotName}），看到這位用戶的精選收藏後，留下一句自然的留言。`
            : `${recentChat ? `最近的留言區氣氛：\n${recentChat}\n\n` : ""}請以你的身分（${chatbotName}），在首頁留言區隨口說一句話。`;

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
                        maxOutputTokens: 60,
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

        // 清理回覆
        const cleanReply = reply
            .replace(/^[「『"'"]+/, "")
            .replace(/[」』"'"]+$/, "")
            .replace(/<[^>]*>/g, "")   // 移除 HTML 標籤
            .replace(/\*+/g, "")       // 移除 markdown 粗體
            .trim()
            .slice(0, 60);

        return NextResponse.json({ reply: cleanReply, simulatedName: chatbotName });
    } catch (error) {
        console.error("Generate homepage comment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
