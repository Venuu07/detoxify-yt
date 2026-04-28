console.log("Detoxify Brain : Service Worker Initialized.");

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{

    if(request.action==='evaluateVideos'){
        console.log("Received videos to evalute : ",request.videoTitles);

        const mockDecisions=request.videoTitles.map(title=>{

            return Math.random()>0.5 ?"keep":"block";

        })

        sendResponse({decisions:mockDecisions  })
        
    }

    return true;
})