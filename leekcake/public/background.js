chrome.runtime.onInstalled.addListener(({reason}) => {
    // link to github auth
});  

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        if (tab.url != null && tab.url != undefined && tab.url != '' && 
            tab.url.includes("leetcode.com/problems")) {
                let tabArray = tab.url.split('/')
                if (tabArray[tabArray.length - 1] != 'submissions') {
                    // chrome.notifications.create({
                    //     type: 'basic',
                    //     iconUrl: 'icon.jpg',
                    //     title: `leet-checkout is tracking your question`,
                    //     message: tab.url,
                    //     priority: 1
                    // });
                    const response = await chrome.tabs.sendMessage(tabId, {
                        context: "mod"
                    });
                    console.log(response);
                }
        }
    }
}); 

function logCookie(cookie, key) {
    if (cookie) {
        console.log(cookie.value);
        // chrome.notifications.create({
        //     type: 'basic',
        //     iconUrl: 'icon.jpg',
        //     title: `logging cookies`,
        //     message: cookie.value,
        //     priority: 1
        // });
        chrome.storage.local.set({ [key]: cookie.value }).then(() => {
            console.log("Value is set");
        });
    } else {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.jpg',
            title: `cookies not defined`,
            message: "",
            priority: 1
        });
    }
}
  
function getCookie(tabs, key) {
    if (typeof browser === "undefined") {
        var browser = chrome;
    }
    let getting = browser.cookies.get({
        url: tabs[0].url,
        name: key,
    });
    getting.then(function(cookie) { return logCookie(cookie, key); });
}
 
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async function(tab){
        if (tab.url.includes("leetcode.com/problems")) {
            if (typeof browser === "undefined") {
                var browser = chrome;
            }
            let getActive = browser.tabs.query({
                active: true,
                currentWindow: true,
            });
            getActive.then(function(tabs) { return getCookie(tabs, 'LEETCODE_SESSION'); });
            getActive.then(function(tabs) { return getCookie(tabs, 'csrftoken'); });
            const response = await chrome.tabs.sendMessage(tab.id, {
                context: "mod"
            });
            console.log(response);
        }
    });
});
