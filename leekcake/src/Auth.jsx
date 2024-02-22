import Button from "./Button";

const oAuth2 = {
    init() {
        this.KEY = 'github_token';
        this.ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
        this.AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';
        this.CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
        this.CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET;
        this.REDIRECT_URL = import.meta.env.VITE_REDIRECT_URI;
        this.SCOPES = ['repo'];
    },
  
    begin() {
        this.init();
        let url = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri${this.REDIRECT_URL}&scope=`;
    
        for (let i = 0; i < this.SCOPES.length; i++) {
            url += this.SCOPES[i];
        }
    
        chrome.storage.local.set({ leekcake_pipe: true }, () => {
            // opening pipe temporarily
            chrome.tabs.create({ url, active: true }, function (tab) {});
        });
    },
};

function Auth() {
    return (
        <Button onClick={() => oAuth2.begin()} text="authenticate github" />
    )
}

export default Auth;
