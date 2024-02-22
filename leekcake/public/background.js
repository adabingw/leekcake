// import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "./public/constants";

const localAuth = {
    init() {
        this.KEY = 'leekcake';
        this.ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
        this.AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';
        this.CLIENT_ID = CLIENT_ID;
        this.CLIENT_SECRET = CLIENT_SECRET;
        this.REDIRECT_URL = REDIRECT_URI;
        this.SCOPES = ['repo'];
    },
  
    parseAccessCode(url) {
        if (url.match(/\?error=(.+)/)) {
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.remove(tab.id, function () {});
            });
        } else {
            try {
                this.requestToken(url.match(/\?code=([\w\/\-]+)/)[1]);
            } catch (e) {
                console.log(`e: ${e}`)
            }
        }
    },
  
    requestToken(code) {
        console.log(`code: ${code}`)
        const data = new FormData();
        data.append('client_id', this.CLIENT_ID);
        data.append('client_secret', this.CLIENT_SECRET);
        data.append('code', code);

        fetch(this.ACCESS_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            body: data
        })
        .then(response => response.json())
        .then(response => {
            console.log(response)
            if (response["error"] != undefined) {

            } else if (response["access_token"] != undefined) {
                this.finish(response["access_token"])
            }
        })
        .catch(error => console.log('Error:', error));    
    },
  
    /**
     * Finish
     * @param token The OAuth2 token given to the application from the provider.
     */
    finish(token) {
        console.log(`token: ${token}`)
        const AUTHENTICATION_URL = 'https://api.github.com/user';

        fetch(AUTHENTICATION_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `token ${token}`
            }
        })
        .then(response => response.json())
        .then(response => {
            console.log(response)
            if (response["login"] == undefined) {

            } else {
                const username = response["login"];
                handleCreds({
                    closeWebPage: true,
                    isSuccess: true,
                    token: token,
                    username: username,
                    KEY: this.KEY,
                });
            }
        })
        .catch(error => console.log('Error:', error));
    },
};

function handleCreds(request) {
    if (request && request.closeWebPage === true && request.isSuccess === true) {
        chrome.storage.local.set({ github_username: request.username }, () => {
            console.log("set github username")
        });    
        chrome.storage.local.set({ github_token: request.token }, () => {
            console.log("set github token");
        });    
        chrome.storage.local.set({ leekcake_pipe: false }, () => {
            console.log('Closed pipe.');
        });
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.remove(tabs[0].id);
        });
    } else if (request && request.closeWebPage === true && request.isSuccess === true) {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.remove(tab.id);
        });
    }
}

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

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url.includes("github.com")) {
        console.log("tab is github")
        /* Check for open pipe */
        localAuth.init(); // load params.
        const link = tab.url;
        chrome.storage.local.get('leekcake_pipe', (data) => {
            if (data && data.leekcake_pipe) {
                console.log("leekcake pipe: ", data)
                localAuth.parseAccessCode(link);
            }
        });
    }
});
