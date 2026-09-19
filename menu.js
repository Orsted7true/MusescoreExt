const button = document.getElementById("scanButton");
const status = document.getElementById("status");

button.addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    const currentTab = tabs[0];
    status.textContent = currentTab.id;

    const response = await chrome.scripting.executeScript({
        target: {
            tabId: currentTab.id,
            //allFrames: true
        },

        func: () => {

            const items = performance
                .getEntriesByType("resource")
                .map(resource => resource.name)
                .find(url => /score_\d+\.svg/.test(url));

            console.log("Found items:", items);
            return items;
        }


    });

    const firstScore = response[0].result;
    const scores = await chrome.runtime.sendMessage({
        type: "GET_SCORES",
        tabId: currentTab.id
    });

    scores.push(firstScore);
    scores.sort((a, b) => {

        const pageA =
            Number(a.match(/score_(\d+)\.svg/)[1]);

        const pageB =
            Number(b.match(/score_(\d+)\.svg/)[1]);

        return pageA - pageB;
    });

    console.log("Scores:", scores);
});