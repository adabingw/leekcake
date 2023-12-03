chrome.runtime.onInstalled.addListener(({reason}) => {
    // link to github auth
});  

function logCookie(cookie, key) {
    if (cookie) {
        chrome.storage.local.set({ [key]: cookie.value }).then(() => {
            console.log("Value is set");
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
        }
    });
});

function handleMessage(request) {
    if (request && request.closeWebPage === true && request.isSuccess === true) {
        /* Set username */
        // chrome.storage.local.set({ leethub_username: request.username },
        //     () => {
        //         window.localStorage.leethub_username = request.username;
        //     },
        // );
    
        /* Set token */
        chrome.storage.local.set({ github_token: request.token }, () => {
            window.localStorage[request.KEY] = request.token;
        });
    
        /* Close pipe */
        chrome.storage.local.set({ leetcake_pipe: false }, () => {
            console.log('Closed pipe.');
        });
    
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.remove(tab.id);
        });
    
        /* Go to onboarding for UX */
        // const urlOnboarding = chrome.runtime.getURL('welcome.html');
        // chrome.tabs.create({ url: urlOnboarding, active: true }); // creates new tab
    } else if (request && request.closeWebPage === true && request.isSuccess === true) {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.remove(tab.id);
        });
    }
}
  
chrome.runtime.onMessage.addListener(handleMessage);
  