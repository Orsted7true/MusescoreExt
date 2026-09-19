//scores are now stored in session storage, as safety measure if the tab remains idle for too long and service workers is killed
//with all the data stored in memory

chrome.webRequest.onCompleted.addListener(
    async (details) => {

        if (!/score_\d+\.svg/.test(details.url)) {
            return;
        }

        if (details.tabId < 0) {
            return;
        }

        const key = `scores_${details.tabId}`;

        const result = await chrome.storage.session.get(key);

        const scores = new Set(result[key] || []);

        if (!scores.has(details.url)) {
            scores.add(details.url);

            await chrome.storage.session.set({
                [key]: [...scores]
            });
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
    async (message) => {

        if (message.type === "GET_SCORES") {

            const key = `scores_${message.tabId}`;

            const result = await chrome.storage.session.get(key);

            return result[key] || [];
        }
    }
);


// We do not need the data for a tab anymore when it is closed, so we can remove it from session storage
chrome.tabs.onRemoved.addListener(
    async (tabId) => {



        await chrome.storage.session.remove(
            `scores_${tabId}`
        );
    }
);