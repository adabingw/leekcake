/*global chrome*/

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Terminal from "./Terminal"
import './App.css'
import Auth from './Auth';
import Home from './Home';

function App() {

	let navigate = useNavigate()

	useEffect(() => {
		console.log("in useeffect")
		chrome.storage.local.get('github_token', (data) => {
			console.log("getting github token on startup")
			const token = data.github_token;
			if (token === null || token === undefined) {
				console.log("unauthorized, redirecting to /auth")
				navigate('/auth')
				// link to auth
			} else {
				const AUTHENTICATION_URL = 'https://api.github.com/user';
				const xhr = new XMLHttpRequest();
				xhr.addEventListener('readystatechange', function () {
					if (xhr.readyState === 4) {
						if (xhr.status === 200) {
							// direct to terminal page
							navigate('/terminal')
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

    return (
		<Routes>
			<Route path="/terminal" element={<Terminal />} />
			<Route path="/auth" element={<Auth />} />
			<Route path="*" element={<Home />} />
		</Routes>
    )
}

export default App
