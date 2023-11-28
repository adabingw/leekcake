/*global chrome*/
import { useState, useEffect } from "react";
import axios from "axios";

export default function CLI() {

    const [link, setLink] = useState('');
    const [ext, setExt] = useState('.txt');
    const [name, setName] = useState('')
    const [token, setToken] = useState('')
    const [session, setSession] = useState('')

    let url = `https://leetcode.com/graphql`;

    useEffect(() => {
        let linkArr = link.split('/').filter(x => x);
        console.log(linkArr)
        let questionSlug = ""
        for (var i = 0; i < linkArr.length; i++) {
            if (linkArr[i] == 'problems' && linkArr.length > i + 1) {
                questionSlug = linkArr[i + 1]
            }
        }
        setName(questionSlug)
    }, [link])

    const fetchSubmission = () => {

    }

    const fetchSubmissionList = async (questionSlug) => {
        let query = `
            questionSubmissionList(
               offset: 0,
               limit: 20,
               questionSlug: ${questionSlug}
             ) {
                lastKey
                hasNext
                submissions {
                    id
                    title
                    titleSlug
                    status
                    statusDisplay
                    lang
                    langName
                    runtime
                    timestamp
                    url
                    isPending
                    memory
                    hasNotes
                    notes
                }
            }
        }
        `
        chrome.storage.local.get(["LEETCODE_SESSION"]).then((result) => {
            console.log("LEETCODE_SESSION - " + JSON.stringify(result));
            setSession(result["LEETCODE_SESSION"])
            document.cookie = `LEETCODE_SESSION=${result["LEETCODE_SESSION"]}; SameSite=None; Secure`;
        });
        chrome.storage.local.get(["csrftoken"]).then((result) => {
            console.log("csrftoken - " + JSON.stringify(result));
            setToken(result["csrftoken"])
            document.cookie = `crftoken=${result["crftoken"]}; SameSite=None; Secure`;
        });
        print(document.cookie)
        await axios.post(url, {
            query: JSON.stringify(query)
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            withCredentials: true
        }).then(res => res.json()).then(data => console.log(data))
    }

    const handleKeyDown = (e) => {
        // check if link is empty
        if (e.key != 'Enter') return;
        if (link == '') return;
        else {
            let linkArr = link.split('/').filter(x => x);
            console.log(linkArr)
            let questionSlug = ""
            for (var i = 0; i < linkArr.length; i++) {
                if (linkArr[i] == 'problems' && linkArr.length > i + 1) {
                    questionSlug = linkArr[i + 1]
                }
            }
            setName(questionSlug)
            console.log(questionSlug)
            fetchSubmissionList(questionSlug)
        }
    }

    return (
        <div className="flex flex-col">
            enter link to leetcode question
            <input type="text" placeholder="leetcode q" 
                className="focus:outline-none px-3 py-2 bg-inherit text-orange-400" onChange={(e) => setLink(e.target.value)}/>
            {link != '' &&             
            <div className="flex flex-col justify-center">
            enter folder and file name to commit to. empty is default.
            <input type="text" placeholder={`src/${name}${ext}`} 
                className="focus:outline-none px-3 py-2 bg-inherit" onKeyDown={(e) => handleKeyDown(e)}/>
            </div>
            }
        </div>
    )
}
