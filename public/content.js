

console.log("Detoxify YT: Advanced Detox Engine Loaded");

/* =========================================================
   GLOBAL CSS INJECTION
========================================================= */

const style = document.createElement("style");

style.textContent = `

.detox-pending {
    opacity : 0 !important;
    pointer-events: none !important;
    transition : opacity 0.18s ease-in-out !important;
}

/* =========================================================
   SAFE VIDEOS
========================================================= */

.detox-safe {
    opacity: 1 !important;
    pointer-events: auto !important;
}

/* =========================================================
   BLOCKED VIDEOS
========================================================= */

.detox-blocked {
    opacity: 1 !important;
    pointer-events: none !important;
}

/* =========================================================
   BLOCKED TITLE STYLE
========================================================= */

.detox-decoy-title {
    color: #71717a !important;
    font-size: 14px !important;
    line-height: 20px !important;
    font-weight: 500 !important;
    margin-top: 8px !important;
    pointer-events: none !important;
    user-select: none !important;
}

/* =========================================================
   REMOVE ORIGINAL TITLE VISUALLY
========================================================= */

.detox-hidden-title {
    display: none !important;
}

`;

document.documentElement.appendChild(style);


/* =========================================================
   CACHE
========================================================= */

const decisionCache = new Map();

/* =========================================================
   TITLE REPLACEMENT
========================================================= */

function replaceBlockedTitle(videoElement) {

    const possibleTitles = videoElement.querySelectorAll(`
        h3,
        h3 a,
        #video-title-link,
        #video-title,
        yt-formatted-string,
        .yt-core-attributed-string
    `);

    if (!possibleTitles.length) {
        console.log("NO TITLE FOUND:", videoElement);
        return;
    }

    possibleTitles.forEach(node => {

        const text = node.innerText?.trim();

        if (!text || text.length < 5) return;

        if (node.dataset.detoxified) return;

        node.dataset.detoxified = "true";

        // Hide original title
        node.classList.add("detox-hidden-title");

        const parent = node.parentElement;

        if (!parent) return;

        if (parent.querySelector(".detox-decoy-title")) return;

        // Create fake title
        const fakeTitle = document.createElement("div");

        fakeTitle.className = "detox-decoy-title";

        fakeTitle.innerText = "Distracting Content Blocked";

        parent.appendChild(fakeTitle);
    });
}

/* =========================================================
   BLOCK THUMBNAIL
========================================================= */

function blockThumbnail(videoElement) {

    const thumbnail = videoElement.querySelector(`
        ytd-thumbnail,
        ytd-thumbnail-view-model,
        .ytLockupViewModelContentImage,
        a#thumbnail
    `);

    if (!thumbnail) return;

    if (thumbnail.querySelector(".detox-overlay")) return;

    thumbnail.style.position = "relative";

    // Hide images
    const imgs = thumbnail.querySelectorAll("img");

    imgs.forEach(img => {
        img.src = "";
        img.style.display = "none";
        img.style.visibility = "hidden";
    });

    // Overlay
    const overlay = document.createElement("div");

    overlay.className = "detox-overlay";

    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";

    overlay.style.width = "100%";
    overlay.style.height = "100%";

    overlay.style.backgroundColor = "#18181b";

    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    overlay.style.borderRadius = "12px";

    overlay.style.zIndex = "999999";

    overlay.style.cursor = "not-allowed";

    overlay.addEventListener(
        "click",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        },
        true
    );

    const content = document.createElement("div");

    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.alignItems = "center";
    content.style.justifyContent = "center";
    content.style.gap = "`10px"
    content.style.textAlign = "center";
    content.style.padding = "20px";

    const shield = document.createElement("div");

    shield.innerText ="🛡";

    shield.style.fontSize = "42px"

    const heading = document.createElement("div");

    heading.innerText = "Focus Protected";

    heading.style.color ="fafafa"
    heading.style.fontSize = "18px"
    heading.style.fontWeight = "600"

    const subtitle = document.createElement("div");

    subtitle.innerText = "Distractiring content blocked"

    subtitle.style.color ="#71717a"
    subtitle.style.fontSize = "13px"
    subtitle.style.lineHeight = "18px"

    content.appendChild(shield);
    content.appendChild(heading);
    content.appendChild(subtitle);
    
    overlay.appendChild(content);

    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.border = "1px solid #27272a";
    overlay.style.boxShadow =
        "0 0 20px rgba(0,0,0,0.35)";

    thumbnail.appendChild(overlay);
}

/* =========================================================
   DISABLE VIDEO
========================================================= */

function disableVideo(videoElement) {

    const links = videoElement.querySelectorAll("a");

    links.forEach(link => {

        link.removeAttribute("href");

        link.style.cursor = "not-allowed";

        const clone = link.cloneNode(true);

        if (link.parentNode) {
            link.parentNode.replaceChild(clone, link);
        }
    });

    videoElement.addEventListener(
        "click",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        },
        true
    );
}

/* =========================================================
   APPLY BLOCK
========================================================= */

function applyOverlay(videoElement) {

    if (videoElement.dataset.detoxApplied) return;

    videoElement.dataset.detoxApplied = "true";

    replaceBlockedTitle(videoElement);

    blockThumbnail(videoElement);

    disableVideo(videoElement);

    videoElement.classList.add("detox-blocked");

    videoElement.setAttribute("data-detox-status", "blocked");
}

/* =========================================================
   SHOW SAFE VIDEO
========================================================= */

function allowVideo(videoElement) {

    videoElement.classList.add("detox-safe");

    videoElement.setAttribute("data-detox-status", "safe");
}

/* =========================================================
   GET ALL VIDEO CARDS
========================================================= */

function getAllVideoCards() {

    return Array.from(
        document.querySelectorAll(`
            ytd-rich-item-renderer,
            ytd-video-renderer,
            ytd-grid-video-renderer,
            ytd-compact-video-renderer,
            ytd-rich-grid-media
        `)
    );
}

/* =========================================================
   PROCESS VIDEOS
========================================================= */

async function processVideos() {

    const allCards = getAllVideoCards();

    const unprocessedCards = allCards.filter(
        card => !card.hasAttribute("data-detox-status")
    );

    if (!unprocessedCards.length) return;

    const cardsToProcess = [];
    const titlesToEvaluate = [];

    unprocessedCards.forEach(card => {

        card.setAttribute("data-detox-status", "processing");

        card.classList.add("detox-pending");


        const titleElement = card.querySelector(`
            h3,
            h3 a,
            #video-title-link,
            #video-title,
            yt-formatted-string,
            .yt-core-attributed-string
        `);

        const titleText =
            titleElement?.innerText?.trim() ||
            card.innerText?.trim() ||
            "";

        if (!titleText) {
            allowVideo(card);
            return;
        }

        // Cache hit
        if (decisionCache.has(titleText)) {

            const decision = decisionCache.get(titleText);

            if (decision === "block") {
                applyOverlay(card);
            } else {
                allowVideo(card);
            }

            return;
        }

        cardsToProcess.push(card);

        titlesToEvaluate.push(titleText);
    });

    if (!cardsToProcess.length) return;

    console.log("Evaluating:", titlesToEvaluate);

    try {

        const response = await chrome.runtime.sendMessage({
            action: "evaluateVideos",
            videoTitles: titlesToEvaluate
        });

        if (!response?.decisions) {

            cardsToProcess.forEach(card => {
                allowVideo(card);
            });

            return;
        }

        cardsToProcess.forEach((video, index) => {

            video.classList.remove("detox-pending");

            const decision = response.decisions[index];

            const title = titlesToEvaluate[index];

            decisionCache.set(title, decision);

            if (decision === "block") {

                applyOverlay(video);

            } else {

                allowVideo(video);
            }
        });

    } catch (error) {

        console.error("Background error:", error);


        
        // Fail-safe
        cardsToProcess.forEach(card => {
            card.classList.remove("detox-pending");
            
            allowVideo(card);
        });
    }
}

/* =========================================================
   MUTATION OBSERVER
========================================================= */


let processingTimeout = null;

const observer = new MutationObserver(() => {

   clearTimeout(processingTimeout);
   
    processingTimeout = setTimeout(() => {
        processVideos();
    }, 300);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/* =========================================================
   INITIAL LOAD
========================================================= */

setTimeout(() => {
    processVideos();
}, 500);

