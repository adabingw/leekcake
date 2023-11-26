chrome.runtime.onInstalled.addListener(({reason}) => {
    // if (reason === 'install') {
    //   chrome.tabs.create({
    //     url: "www.google.com"
    //   });
    // }
});  

chrome.tabs.onCreated.addListener(function(tab) {         
    console.log("new tab created")
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url.includes("leetcode")) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.jpg',
            title: `leet-checkout is tracking your question`,
            message: changeInfo.url,
            priority: 1
        });
    }
}); 
 
chrome.tabs.onActivated.addListener(function(activeInfo) {
    // how to fetch tab url using activeInfo.tabid
    chrome.tabs.get(activeInfo.tabId, function(tab){
        if (tab.url.includes("leetcode")) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.jpg',
                title: `leet-checkout is continuing to track your question`,
                message: tab.url,
                priority: 1
            });
        }
        Array.from(document.getElementsByTagName("button"))
            .forEach(b => {
                b.setAttribute("id", b.innerText);
            })
    });
});
