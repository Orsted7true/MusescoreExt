const scoresUrls = new Set();

chrome.webRequest.onCompleted.addListener(
    (details) => {

        if (/score_\d+\.svg/.test(details.url)) {

            if (!scoresUrls.has(details.url)) {
                scoresUrls.add(details.url);

                console.log("NEW SVG:", details.url);
            }
        }

    },
    {
        urls: [
            "https://musescore.com/*",
            "https://*.musescore.com/*"
        ]
    }
);

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.type === "GET_SCORES") {
            sendResponse([...scoresUrls]);
        }

    }
);
