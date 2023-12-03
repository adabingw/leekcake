chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
        if (request.context === "mod") {
            Array.from(document.getElementsByTagName("button")).forEach(b => {
                b.setAttribute("id", b.innerText);
            })
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.jpg',
                title: `getting cookies`,
                message: document.cookie,
                priority: 1
            });
            let submitButton = document.getElementById("Submit");
            submitButton.addEventListener("click", submitQuestion);
            sendResponse({ response: "Ok" });
        }
    }
);
