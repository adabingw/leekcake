import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Button from "./Button";

function PAT() {
    const [pat, setPAT] = useState('');
    let navigate = useNavigate()

    const submitPat = () => {
        chrome.storage.local.set({ personal_token: pat }, () => {
            console.log("set pat");
        });
        navigate('/terminal');
    }

    return (
        <div className="flex flex-col h-fit max-h-fit">
        to allow leekcake to push to your repo, create and paste your personal access token (PAT) below. 
        <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens">
            Here's how you can create one.
        </a>
        <input type="text" placeholder="personal access token" 
            className="focus:outline-none px-3 py-2 bg-inherit text-orange-400" onChange={(e) => setPAT(e.target.value)}/>
        <Button onClick={() => submitPat()} text="oK" />
        </div>
    )
}

export default PAT;
