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
            'filterEnabled'
        ]);

        if (
            !storage.filterEnabled ||
            !storage.allowedCategories
        ) {

            console.log("Filter disabled.");

            return titles.map(() => "keep");
        }

        console.log("Contacting backend server...");

        const response = await fetch(
            "http://localhost:3000/evaluate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    titles,
                    categories: storage.allowedCategories
                })
            }
        );

        if (!response.ok) {

            throw new Error(
                `Backend error: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Backend response:", data);

        return data.decisions;

    } catch (error) {

        console.error("Backend request failed:", error);

        return titles.map(() => "keep");
    }
}