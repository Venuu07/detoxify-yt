console.log("Detoxify YT: Production Content Script Loaded.");


const decisionCache = new Map();

function applyOverlay(videoElement) {
const thumbnailContainer = videoElement.querySelector('ytd-thumbnail, ytd-thumbnail-view-model, .ytLockupViewModelContentImage, a#thumbnail');
    const titleElement = videoElement.querySelector('#video-title, .yt-core-attributed-string');
   
    const links = videoElement.querySelectorAll('a');
    links.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation(); 
        };
        link.style.pointerEvents = "none";
    });

   
    if (thumbnailContainer && !thumbnailContainer.querySelector('.detox-overlay')) {
        thumbnailContainer.style.position = 'relative'; 

        const imgs = thumbnailContainer.querySelectorAll('img');
        imgs.forEach(img => img.style.visibility = 'hidden');

        const overlay = document.createElement('div');
        overlay.className = 'detox-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#18181b'; 
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.borderRadius = '12px'; 

        const xMark = document.createElement('div');
        xMark.innerText = '✕';
        xMark.style.color = '#3f3f46';
        xMark.style.fontSize = '48px';
        xMark.style.fontWeight = 'bold';

        overlay.appendChild(xMark);
        thumbnailContainer.appendChild(overlay);
    }

    
    if (titleElement) {
        titleElement.innerText = "[ Content Filtered ]";
        titleElement.style.color = "#52525b";
    }

    
    videoElement.setAttribute('data-detox-status', 'blocked');
}

async function processVideos() {
    const unreviewedCards = Array.from(document.querySelectorAll('ytd-rich-item-renderer:not([data-detox-status])'));
    
    if (unreviewedCards.length === 0) return;

    const cardsToProcess = [];
    const titlesToEvaluate = [];

   
    unreviewedCards.forEach(card => {
        const titleElement = card.querySelector('#video-title ,.yt-core-attributed-string');
        const titleText = (titleElement && titleElement.innerText.trim() !== "") 
            ? titleElement.innerText.trim() 
            : card.textContent.trim();

        if (titleText !== "") {
           
            card.setAttribute('data-detox-status', 'processing');

            if (decisionCache.has(titleText)) {
                if (decisionCache.get(titleText) === 'block') {
                    applyOverlay(card);
                } else {
                    card.setAttribute('data-detox-status', 'safe');
                }
            } else {
                // We need to ask the Brain
                cardsToProcess.push(card);
                titlesToEvaluate.push(titleText);
            }
        }
    });

    if (cardsToProcess.length === 0) return;

    console.log("Sending NEW batch to Brain: ", titlesToEvaluate);

    try {
        const response = await chrome.runtime.sendMessage({
            action: "evaluateVideos",
            videoTitles: titlesToEvaluate
        });
        
        if (response && response.decisions) {
            cardsToProcess.forEach((video, index) => {
                const decision = response.decisions[index];
                const title = titlesToEvaluate[index];

                // Save to cache for the future
                decisionCache.set(title, decision);

                if (decision === 'block') {
                    applyOverlay(video);
                } else {
                    video.setAttribute('data-detox-status', 'safe');
                }
            });
        }
    } catch (error) {
        console.log("Brain communication paused (Context likely invalidated, please refresh page).");
    }
}


let scanTimeout = null;
const observer = new MutationObserver(() => {
    if (scanTimeout) clearTimeout(scanTimeout);
    
    scanTimeout = setTimeout(() => {
        processVideos();
    }, 500);
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
setTimeout(processVideos, 1000);