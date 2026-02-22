require('dotenv').config({ path: '.env.local' });

async function testSpontaneousChat() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set in .env.local");
        return;
    }

    const payload = {
        auctionTitle: "色違 閃光 固執 巨金怪",
        recentChat: "路人A: 真的好帥\n小智: 準備好點數了",
        currentPrice: 12500,
        timeRemaining: "熱烈進行中"
    };

    console.log("Testing Spontaneous Chat API...");
    console.log("Payload:", payload);

    try {
        // Since we are not running the Next.js server, we'll mock the handler logic directly here
        // for a quicker test of the prompt and gemini connection.
        
        const chatbotNameOptions = ["小智", "色違獵人", "VGC選手", "Red", "圖鑑收集狂", "孵蛋廢人", "路人A", "大佬", "新手報到", "想抽籤的非洲人"];
        const chatbotName = chatbotNameOptions[Math.floor(Math.random() * chatbotNameOptions.length)];

        const strategies = [
            `【驚呼價格】：針對目前的價格 ${payload.currentPrice} 點發表看法（覺得太貴、覺得還行、或是覺得自己買不起）。`,
            `【寶可夢點評】：針對這隻寶可夢的稀有度、價值或是外觀特色發表一句簡單的評論。`,
            `【時間緊迫感】：針對剩餘時間 ${payload.timeRemaining} 表達緊張、期待或是猶豫要不要下手的感覺。`,
            `【吃瓜群眾】：表現出自己只是來湊熱鬧、看大老神仙打架的心態。`,
            `【疑問或自言自語】：對場上的人或這隻寶可夢隨口丟出一個開放式問題，像是自言自語。`
        ];
        const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];

        const systemPrompt = `你是 Pokémon 競標拍賣大廳裡的一名資深玩家或路過群眾（你的聊天室 ID 是：${chatbotName}）。
你現在正在觀看對【${payload.auctionTitle}】的競標。

你的目標是：在沒有人跟你說話的情況下，針對眼前的拍賣狀況自發性地點評一句話。

【當前拍賣狀況】
- 競標物：${payload.auctionTitle}
- 目前最高標價：${payload.currentPrice} 點
- 剩餘時間狀態：${payload.timeRemaining}
${payload.recentChat ? `- 最近聊天室的氣氛：\n${payload.recentChat}` : ""}

【語氣與人設規則】
1. 使用口語化的台灣繁體中文，可以適度使用標點符號（!、?、...）和少量 Emoji，就像真人在聊天室隨口碎碎念一樣。
2. 字數控制在 10 ~ 25 字左右，非常精簡。
3. 不要使用「哈囉」、「大家好」之類的開場白，因為你只是突然冒出一句話。
4. 你必須採用以下指定的策略來做為這次發言的核心：
本次採用的策略：${selectedStrategy}`;

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
             console.error("Gemini API Error:", await response.text());
             return;
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        console.log("\n=============================");
        console.log("Mocked Identity:", chatbotName);
        console.log("Mocked Strategy:", selectedStrategy);
        console.log("Generated Reply:", reply);
        console.log("=============================\n");
        
    } catch (err) {
        console.error("Test fetch error:", err);
    }
}

testSpontaneousChat();
