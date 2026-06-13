

console.log("Detoxify YT: Advanced Detox Engine Loaded");

/* =========================================================
   GLOBAL CSS INJECTION
========================================================= */

const style = document.createElement("style");

style.textContent = `

.detox-pending {
    position: relative !important;
    overflow: hidden !important;
    border-radius: 16px !important;
    background: #18181b !important;
    pointer-events: none !important;

}

.detox-pending > * {
    opacity: 0 !important;
}

.detox-pending::before{
    content: "" !important;
    position: absolute !important;
    inset: 0 !important;

    background:
        linear-gradient(
            90deg,
            
            #18181b 25%,
            #27272a 50%,
            #18181b 75%
        ) !important;

    background-size: 200% 100% !important;
    animation: detox-shimmer 1.2s linear infinite !important;
    z-index: 10 !important;
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

@keyframes detox-shimmer {
    0%{
        background-position: 200% 0;
    }
    100%{
        background-position: -200% 0;
    }
}

/* =========================================================
   HIDE SHORTS SHELVES (FEED & SEARCH)
========================================================= */
ytd-reel-shelf-renderer,
ytd-rich-shelf-renderer[is-shorts] {
    display: none !important;
}

/* OVERLAY FOR SHORTS PAGE */
#detox-shorts-block-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #0f0f0f !important;
    color: white !important;
    z-index: 9999999 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    font-family: sans-serif !important;
}

`;


document.documentElement.appendChild(style);


/* =========================================================
   CACHE
========================================================= */

const decisionCache = new Map();

const VIDEO_CARD_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-rich-grid-media",
    "ytd-reel-item-renderer",
    "ytd-rich-grid-slim-media"
].join(",");

function isShortsPage() {
    // Check if the current URL path starts with /shorts/
    return window.location.pathname.startsWith("/shorts/");
}

function blockShortsPage() {
    const existingOverlay = document.getElementById("detox-shorts-block-overlay");

    // If we're not on a shorts page, remove the overlay if it exists
    if (!isShortsPage()) {
        if (existingOverlay) {
            existingOverlay.remove();
        }
        return;
    }

    // If we are on a shorts page and the overlay isn't there, create it
    if (!existingOverlay) {
        const overlay = document.createElement("div");
        overlay.id = "detox-shorts-block-overlay";
        overlay.innerHTML = `
            <div>
                <h1 style="margin-bottom: 16px;">🚫 Shorts Blocked</h1>
                <p style="color: #a1a1aa; margin-bottom: 24px;">Shorts are disabled to protect your focus.</p>
                <button onclick="window.location.href='/'" style="padding: 10px 20px; background: #fafafa; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Go to Home</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Pause the short video in the background
        const videoElements = document.querySelectorAll("video");
        videoElements.forEach(v => v.pause());
    }
}

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
        img.removeAttribute("src");
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
    content.style.gap = "10px"
    content.style.textAlign = "center";
    content.style.padding = "20px";

    const shield = document.createElement("div");

    shield.innerText ="🛡";

    shield.style.fontSize = "42px"

    const heading = document.createElement("div");

    heading.innerText = "Focus Protected";

    heading.style.color ="#fafafa"
    heading.style.fontSize = "18px"
    heading.style.fontWeight = "600"

    const subtitle = document.createElement("div");

    subtitle.innerText = "Distracting content blocked"

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
    videoElement.classList.remove("detox-pending");

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

    videoElement.classList.remove("detox-pending");
    videoElement.classList.add("detox-safe");

    videoElement.setAttribute("data-detox-status", "safe");
}

/* =========================================================
   GET ALL VIDEO CARDS
========================================================= */

function getAllVideoCards() {

    return Array.from(document.querySelectorAll(VIDEO_CARD_SELECTOR));
}

/* =========================================================
   PROCESS VIDEOS
========================================================= */

async function processVideos(cards = null) {

    const allCards = cards || getAllVideoCards();

    const unprocessedCards = allCards.filter(
        card => !card.hasAttribute("data-detox-status")
    );

    if (!unprocessedCards.length) return;

    const cardsByTitle = new Map();

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

        const matchingCards = cardsByTitle.get(titleText) || [];
        matchingCards.push(card);
        cardsByTitle.set(titleText, matchingCards);
    });

    const titlesToEvaluate = Array.from(cardsByTitle.keys());

    if (!titlesToEvaluate.length) return;

    console.log("Evaluating:", titlesToEvaluate);

    try {

        const response = await chrome.runtime.sendMessage({
            action: "evaluateVideos",
            videoTitles: titlesToEvaluate
        });

        if (
            !Array.isArray(response?.decisions) ||
            response.decisions.length !== titlesToEvaluate.length
        ) {

            cardsByTitle.forEach(cardsForTitle => {
                cardsForTitle.forEach(allowVideo);
            });

            return;
        }

        titlesToEvaluate.forEach((title, index) => {
            const decision = response.decisions[index];
            const normalizedDecision = decision === "block" ? "block" : "keep";
            const cardsForTitle = cardsByTitle.get(title) || [];

            decisionCache.set(title, normalizedDecision);

            cardsForTitle.forEach(video => {
                if (normalizedDecision === "block") {
                    applyOverlay(video);
                } else {
                    allowVideo(video);
                }
            });
        });

    } catch (error) {

        console.error("Background error:", error);

        // Fail-safe
        cardsByTitle.forEach(cardsForTitle => {
            cardsForTitle.forEach(allowVideo);
        });
    }
}

/* =========================================================
   MUTATION OBSERVER
========================================================= */


let processingTimeout = null;

const observer = new MutationObserver((mutations) => {

    const addedVideoCards = new Set();

    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {

            if (!(node instanceof HTMLElement)) return;

            if (node.matches(VIDEO_CARD_SELECTOR)) {
                addedVideoCards.add(node);
            }

            node.querySelectorAll(VIDEO_CARD_SELECTOR).forEach(card => {
                addedVideoCards.add(card);
            });
        });
    });

    if (!addedVideoCards.size) return;

    clearTimeout(processingTimeout);
    //reduced from 0(n) to 0(k) where k is number of added cards in mutation batch
    processingTimeout = setTimeout(() => {
        processVideos(Array.from(addedVideoCards));
    }, 300);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/* =========================================================
   SPA NAVIGATION LISTENERS & INITIAL LOAD
========================================================= */

// YouTube uses custom events for its Single Page Application navigation
window.addEventListener("yt-navigate-finish", () => {
    blockShortsPage();
    // processVideos will automatically be called by the MutationObserver when elements load,
    // but running it here helps catch things quickly.
    processVideos();
});

// Fallback for popstate (browser back/forward button)
window.addEventListener("popstate", () => {
    blockShortsPage();
});

blockShortsPage();

setTimeout(() => {
    processVideos();
}, 500);
