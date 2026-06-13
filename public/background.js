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


        const response = await fetch(
            "http://localhost:3000/evaluate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    titles: uncachedTitles,
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