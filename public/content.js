console.log("Detoxify YT: content script actively watching ...")

function blockvideo(videoElement){
    const thumbnailContainer = videoElement.querySelector('ytd-thumbnail')
    const titleElement = videoElement.querySelector('#video-title')

    if(thumbnailContainer){
        const img = thumbnailContainer.querySelector('img')
        if(img) img.style.display = 'none'

        thumbnailContainer.style.backgroundColor = '#222'
        thumbnailContainer.style.display = 'flex'
        thumbnailContainer.style.alignItems = 'center'
        thumbnailContainer.style.justifyContent = 'center'

        if(!thumbnailContainer.querySelector('.detox-x')){
            const xMark = document.createElement('div')
            xMark.className = 'detox-x';
            xMark.innerText = 'x'
            xMark.style.color = '#444'
            xMark.style.fontSize = '48px'
            xMark.style.fontWeight = 'bold'
            thumbnailContainer.appendChild(xMark)
        }

        thumbnailContainer.style.pointerEvents = "none"
    }

    // Moved these outside the thumbnail check so they run independently
    if(titleElement){
        titleElement.innerText = "Distracting Content Blocked"
        titleElement.style.color = "#666"
        titleElement.style.pointerEvents = 'none'
    }

    // Mark as processed so the observer doesn't loop infinitely
    videoElement.dataset.detoxStatus = 'blocked'
}

function scanForVideos(){
    const unreviewedVideos = Array.from(document.querySelectorAll('ytd-rich-item-renderer:not([data-detox-status])'))
    
    if(unreviewedVideos.length ==0)return;
   
    unreviewedVideos.forEach(v=>v.dataset.detoxStatus='processing');

    const videoData = unreviewedVideos.map(video =>{
        const titleElement = video.querySelector('#video-title')
        return titleElement ? titleElement.innerText : "Unknown Title";
    })

    console.log("sending batch to Brain: ",videoData)

    try {
        
        const respone=await chrome.runtime.sendMessage({
            action:"evaluateVideos",
            videoTitles:videoData
         });

         if(respone && Response.decisions){
            unreviewedVideos.forEach((video,index)=>{
                const decision=respone.decisions[index]
                if (decision=='block') {
                    blockvideo(video)
                } else {
                    video.dataset.detoxStatus="safe"
                }
            })
         }

        
    } catch (error) {
        console.error("Error talking to Brain:",error)
    }
}

const observer = new MutationObserver((mutations) => {
    scanForVideos();
})

observer.observe(document.body, {
    childList: true,
    subtree: true
})

scanForVideos();