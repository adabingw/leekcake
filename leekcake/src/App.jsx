/*global chrome*/

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Terminal from "./Terminal"
import './App.css'
import Auth from './Auth';
import Home from './Home';
import Linkage from './Linkage';
import PAT from './PAT';

function App() {

	let navigate = useNavigate()

	useEffect(() => {
		chrome.storage.local.get('github_token', (data) => {
			const token = data.github_token;
			if (token === null || token === undefined) {
				navigate('/auth')
			} else {
				chrome.storage.local.get('personal_token', (data) => {
					const pat = data.personal_token;
					if (pat == null || pat === undefined) {
						navigate('/PAT');
					} else {
						const AUTHENTICATION_URL = 'https://api.github.com/user';
						const xhr = new XMLHttpRequest();
						xhr.addEventListener('readystatechange', function () {
							if (xhr.readyState === 4) {
								if (xhr.status === 200) {
									checkRepo()
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
			}
		});
	}, [])

	const checkRepo = () => {
		chrome.storage.local.get('leekcake_repo', (data) => {
			const repo = data.leekcake_repo;
			if (repo == null || repo == undefined) {
				// navigate to linkage page
				navigate('/linkage')
			} else {
				// direct to terminal page
				navigate('/terminal')
			}
		});
	}

    return (
		<Routes>
			<Route path="/terminal" element={<Terminal />} />
			<Route path="/linkage" element={<Linkage />} />
			<Route path="/auth" element={<Auth />} />
			<Route path="/PAT" element={<PAT />} />
			<Route path="*" element={<Home />} />
		</Routes>
    )
}

export default App
