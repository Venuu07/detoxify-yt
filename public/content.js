

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
    background: #09090b !important;
    pointer-events: none !important;
}

.detox-pending > * {
    opacity: 0 !important;
}

.detox-pending::before {
    content: "" !important;
    position: absolute !important;
    inset: 0 !important;
    background: linear-gradient(90deg, #09090b 25%, #18181b 50%, #09090b 75%) !important;
    background-size: 200% 100% !important;
    animation: detox-shimmer 1.4s linear infinite !important;
    z-index: 10 !important;
}

.detox-safe {
    opacity: 1 !important;
    pointer-events: auto !important;
}

.detox-blocked {
    opacity: 1 !important;
    pointer-events: none !important;
}

.detox-decoy-title {
    color: #52525b !important;
    font-size: 13px !important;
    line-height: 18px !important;
    font-weight: 500 !important;
    margin-top: 6px !important;
    pointer-events: none !important;
    user-select: none !important;
    font-style: italic !important;
}

.detox-hidden-title {
    display: none !important;
}

@keyframes detox-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

@keyframes detox-fade-in {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
}

@keyframes detox-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
}

ytd-reel-shelf-renderer,
ytd-rich-shelf-renderer[is-shorts] {
    display: none !important;
}

#detox-shorts-block-overlay {
    position: fixed !important;
    inset: 0 !important;
    background: radial-gradient(ellipse at 50% 40%, #0f0a1e 0%, #09090b 65%) !important;
    z-index: 9999999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    animation: detox-fade-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards !important;
}

#detox-shorts-block-overlay .detox-card {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(139,92,246,0.2) !important;
    border-radius: 28px !important;
    padding: 52px 44px !important;
    max-width: 420px !important;
    width: 88% !important;
    text-align: center !important;
    box-shadow: 0 0 0 1px rgba(139,92,246,0.08), 0 32px 64px rgba(0,0,0,0.6) !important;
    backdrop-filter: blur(24px) !important;
}

#detox-shorts-block-overlay .detox-icon {
    font-size: 60px !important;
    display: block !important;
    margin-bottom: 22px !important;
    filter: drop-shadow(0 0 24px rgba(139,92,246,0.7)) !important;
    animation: detox-float 3.5s ease-in-out infinite !important;
}

#detox-shorts-block-overlay h1 {
    color: #fafafa !important;
    font-size: 30px !important;
    font-weight: 700 !important;
    letter-spacing: -0.03em !important;
    margin: 0 0 12px !important;
}

#detox-shorts-block-overlay p {
    color: #71717a !important;
    font-size: 15px !important;
    line-height: 1.65 !important;
    margin: 0 0 32px !important;
}

#detox-shorts-block-overlay .detox-btn {
    display: inline-block !important;
    background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    color: #fff !important;
    border: none !important;
    border-radius: 14px !important;
    padding: 13px 30px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    letter-spacing: -0.01em !important;
    box-shadow: 0 4px 24px rgba(99,102,241,0.35) !important;
    transition: transform 0.15s ease, box-shadow 0.15s ease !important;
}

#detox-shorts-block-overlay .detox-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 32px rgba(99,102,241,0.45) !important;
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

    if (!existingOverlay) {
        const overlay = document.createElement("div");
        overlay.id = "detox-shorts-block-overlay";
        overlay.innerHTML = `
            <div class="detox-card">
                <span class="detox-icon">🛡</span>
                <h1>Shorts Blocked</h1>
                <p>YouTube Shorts are disabled to keep you focused and protect your time.</p>
                <button class="detox-btn" onclick="window.location.href='/'">← Return to Feed</button>
            </div>
        `;
        document.body.appendChild(overlay);

        document.querySelectorAll("video").forEach(v => v.pause());
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

    const overlay = document.createElement("div");
    overlay.className = "detox-overlay";
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #09090b 0%, #0f0a1e 50%, #09090b 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        z-index: 999999;
        cursor: not-allowed;
        border: 1px solid rgba(99,102,241,0.15);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 32px rgba(0,0,0,0.4);
        animation: detox-fade-in 0.25s ease-out forwards;
    `;

    overlay.innerHTML = `
        <div style="
            display:flex; flex-direction:column;
            align-items:center; gap:8px;
            padding:16px; text-align:center;
        ">
            <span style="
                font-size:32px;
                filter: drop-shadow(0 0 14px rgba(139,92,246,0.65));
            ">🛡</span>
            <div style="
                color:#fafafa; font-size:14px;
                font-weight:700; letter-spacing:-0.02em;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            ">Focus Protected</div>
            <div style="
                color:#52525b; font-size:11px;
                line-height:1.4;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            ">Blocked by Detoxify YT</div>
        </div>
    `;

    overlay.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }, true);

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
