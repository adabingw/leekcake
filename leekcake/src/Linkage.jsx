/*global chrome*/
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

export default function Linkage() {

    const [repos, setRepos] = useState([])
    const [search, setSearch] = useState('')
	const [repoIndex, setRepoIndex] = useState(0)
	const [show, setShow] = useState(false)
	const navigate = useNavigate();

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
						console.log('status: ', xhr.readyState)
						if (xhr.status === 200) {
							chrome.storage.local.get('leekcake_repo', (data) => {
								const repo = data.leekcake_repo;
								if (repo == null || repo == undefined) {
									// navigate to linkage page
									setShow(false)
								} else {
									setShow(true)
								}
							});
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
							let repoList = []
                            for (var repo of JSON.parse(xhr2.responseText)) {
								repoList.push({
									name: repo['name'],
									url: repo['html_url']
								})
                            }
							setRepos(repoList)
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

	const submitRepo = () => {
		localStorage.setItem('leekcake_repo', JSON.stringify(repos[repoIndex]));
		chrome.storage.local.set({ leekcake_repo: JSON.stringify(repos[repoIndex]) }, () => {
			console.log("leekcake repo set")
        });
		navigate('/terminal')
	}

	const handleBack = () => {
		navigate('/terminal')
	}

    return (
        <div className="flex flex-col justify-start align-top h-screen">
			{show && <div onClick={() => handleBack()}>back</div>}
			select repo to link to
            <input type="text" placeholder="or search for it" 
                className="focus:outline-none px-3 py-2 bg-inherit text-orange-400" onChange={(e) => setSearch(e.target.value)}/>
            <div className="justify-start">
                {repos.map((value, index) => {
                    return (search == '' || value['name'].includes(search)) ?
						<div className={repoIndex == index ? "text-orange-400 my-1 px-1" : "text-white my-1 px-1"} 
							onClick={(e) => setRepoIndex(index)}>
							{value['name']}
						</div> : <div></div>
				})}
            </div>
			<div className="mt-3 rounded-lg border-orange-400" onClick={() => submitRepo()}>link</div>
        </div>
    )
}
