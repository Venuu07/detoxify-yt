console.log("Detoxify Brain: Service Worker Initialized (Module Mode).");


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'evaluateVideos') {
        console.log("Brain received batch of", request.videoTitles.length, "titles.");
        

        evaluateWithGemini(request.videoTitles)
            .then(decisions => {
                console.log("Brain sending decisions back to Hands:", decisions);
                sendResponse({ decisions: decisions });
            })
            .catch(err => {
                console.error("Shit something happend..", err);
                
                sendResponse({ decisions: request.videoTitles.map(() => "keep") });
            });

        return true; 
    }
});

async function evaluateWithGemini(titles) {

    try {

        const storage = await chrome.storage.local.get([
            'allowedCategories',
            'filterEnabled',
            'geminiApiKey'
        ]);

        if (
            !storage.filterEnabled ||
            !storage.allowedCategories ||
            !storage.geminiApiKey
        ) {
            console.log("Filter disabled, missing categories, or API key missing.");
            return titles.map(() => "keep");
        }

        console.log("Contacting backend server...");

        const decisions = []

        const uncachedTitles=[]
        
        const uncachedIndexes=[]

        // Fetch cache from session storage (survives service worker sleep)
        const sessionData = await chrome.storage.session.get('titleCache');
        const titleCache = sessionData.titleCache || {};

        titles.forEach((title,index) =>{
            if(titleCache[title]){
                decisions[index] = titleCache[title]
            } else {
                uncachedTitles.push(title)
                uncachedIndexes.push(index)
            }
        })

        if(uncachedTitles.length === 0){
            console.log("All titles were cached. Returning decisions:", decisions);
            return decisions;
        }


        const prompt = `
You are a strict productivity filter.
The user ONLY wants content related to: ${storage.allowedCategories}

Evaluate these YouTube titles.
Return ONLY a valid JSON array.

Rules:
- "keep" → relevant/productive
- "block" → distracting/irrelevant

The array length MUST exactly match input length.

Input titles:
${JSON.stringify(uncachedTitles)}
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${storage.geminiApiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        response_mime_type: "application/json"
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
        }

        const jsonResponse = await response.json();
        const rawText = jsonResponse.candidates[0].content.parts[0].text;
        const data = { decisions: JSON.parse(rawText) };

        console.log("Gemini API response:", data);

        // Get the freshest cache before updating
        const currentSession = await chrome.storage.session.get('titleCache');
        const currentCache = currentSession.titleCache || {};

        data.decisions.forEach((decision,index) => {

            const originalIndex = uncachedIndexes[index]

            const originalTitle = uncachedTitles[index]

            decisions[originalIndex] = decision

            currentCache[originalTitle] = decision;
        })
        
        // Save back to session storage
        await chrome.storage.session.set({ titleCache: currentCache });
        console.log(`updated cache size : ${Object.keys(currentCache).length}`)

            return decisions;

    } catch (error) {

        console.error("Backend request failed:", error);

        return titles.map(() => "keep");
    }
}