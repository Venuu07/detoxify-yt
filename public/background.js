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
        const storage = await chrome.storage.local.get(['geminiApiKey', 'allowedCategories', 'filterEnabled']);
        
        if (!storage.filterEnabled || !storage.geminiApiKey || !storage.allowedCategories) {
            console.log("Brain bypassed: Filter Off or Missing Key/Categories.");
            return titles.map(() => "keep");
        }

        console.log("Brain contacting Gemini API...");

        const prompt = `
        You are a strict productivity and focus filter.
        The user is ONLY allowed to watch videos about these topics: ${storage.allowedCategories}
        
        Evaluate the following list of YouTube video titles. 
        Return ONLY a valid JSON array of strings. 
        Each string must be exactly "keep" (if it matches the topics) or "block" (if it is distracting, entertainment, or irrelevant).
        The output array MUST have exactly ${titles.length} items, matching the order of the input.
        
        Input Titles:
        ${JSON.stringify(titles)}
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${storage.geminiApiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        
        console.log("Gemini Raw Response:", rawText);
        
        const decisions = JSON.parse(rawText);
        
        // Safety check  Making  sure Gemini didn't mess up the array length
        if (decisions.length !== titles.length) {
            console.warn("Gemini returned wrong array size! Padding with 'keep'.");
            while(decisions.length < titles.length) decisions.push("keep");
            return decisions.slice(0, titles.length);
        }

        return decisions;
        
    } catch (error) {
        console.error("Evaluate function crashed:", error);
        throw error;
    }
}