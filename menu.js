const button = document.getElementById("scanButton");
const status = document.getElementById("status");

async function createPdf(scores, title) {

    const { jsPDF } = window.jspdf;

    let pdf = null;

    for (let i = 0; i < scores.length; i++) {

        const url = scores[i];

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Failed to download SVG: ${response.status}`
            );
        }

        const svgText = await response.text();

        const svgDocument =
            new DOMParser().parseFromString(
                svgText,
                "image/svg+xml"
            );

        const svg = svgDocument.documentElement;

        width = parseFloat(
            svg.getAttribute("width")
        );

        height = parseFloat(
            svg.getAttribute("height")
        );

        const orientation =
            width > height
                ? "landscape"
                : "portrait";


        if (pdf === null) {

            pdf = new jsPDF({
                orientation: orientation,
                unit: "pt",
                format: [width, height]
            });

        } else {

            pdf.addPage(
                [width, height],
                orientation
            );
        }


        await pdf.svg(svg, {
            x: 0,
            y: 0,
            width: width,
            height: height
        });
    }


    pdf.save(`${title}.pdf`);
}

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

            const firstScore = performance
                .getEntriesByType("resource")
                .map(resource => resource.name)
                .find(url => /score_\d+\.svg/.test(url));

            console.log("Found first score:", firstScore);

            // Now we also get the title of the score from the page
            const title = document
                .querySelector("h1 span")
                ?.textContent
                ?.trim();
            return { firstScore, title };
        }


    });

    const firstScore = response[0].result.firstScore;
    const title = response[0].result.title;
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
    await createPdf(scores, title);
});