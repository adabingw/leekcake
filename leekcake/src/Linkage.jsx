/*global chrome*/
import { useState, useEffect } from "react";

export default function Linkage() {

    const [repos, setRepos] = useState([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        chrome.storage.local.get('github_token', (data) => {
			const token = data.github_token;
			if (token === null || token === undefined) {
				navigate('/auth')
			} else {
				const AUTHENTICATION_URL = 'https://api.github.com/user';
				const xhr = new XMLHttpRequest();
				xhr.addEventListener('readystatechange', function () {
					if (xhr.readyState === 4) {
						if (xhr.status === 200) {
							getRepos(token)
						} else if (xhr.status === 401) {
							chrome.storage.local.set({ github_token: null }, () => {
								console.log("bad auth, redirecting...");
								// back to auth
								navigate('/auth')
							});
						}
					}
				});
				xhr.open('GET', AUTHENTICATION_URL, true);
				xhr.setRequestHeader('Authorization', `token ${token}`);
				xhr.send();
			}
		});
    }, [])

    const getRepos = (token, username) => {
        chrome.storage.local.get('github_username', (data) => {
			const username = data.github_username;
			if (username === null || username === undefined) {
			} else {
                // TODO: this only lists public repos. List private ones
				const URL = `https://api.github.com/users/${username}/repos`
				const xhr2 = new XMLHttpRequest();
				xhr2.addEventListener('readystatechange', function () {
					if (xhr2.readyState === 4) {
						if (xhr2.status === 200) {
                            console.log("method 1")
							console.log(xhr2.responseText)
                            for (var repo of JSON.parse(xhr2.responseText)) {
                                console.log(`${repo['name']}`)
                            }
						} else if (xhr2.status === 401) {
							console.log("error getting repos")
						}
					}
				});
				xhr2.open('GET', URL, true);
				xhr2.setRequestHeader('Authorization', `token ${token}`);
				xhr2.send();
			}
		});
    }

    return (
        <div className="flex flex-col">
            select repo to link to
            <input type="text" placeholder="or search for it" 
                className="focus:outline-none px-3 py-2 bg-inherit text-orange-400" onChange={(e) => setSearch(e.target.value)}/>
            <div>
                {repos.map((value, index) => {
                    return (
                        <div>{value}</div>
                    )
                })}
            </div>
        </div>
    )
}
