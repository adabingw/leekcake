/*global chrome*/
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import { Octokit } from "octokit";
import {Buffer} from 'buffer';
import axios from 'axios';
import Button from "./Button";

export default function Terminal() {

    const [link, setLink] = useState('');
    const [ext, setExt] = useState('.txt');
    const [question, setQuestion] = useState('');
    const [sub, setSub] = useState(0);
    const [state, setState] = useState('init');
    const [path, setPath] = useState('');
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [update2, setUpdate] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const languages = {
        'Python': '.py',
        'Python3': '.py',
        'C++': '.cpp',
        'C': '.c',
        'Java': '.java',
        'C#': '.cs',
        'JavaScript': '.js',
        'Javascript': '.js',
        'Ruby': '.rb',
        'Swift': '.swift',
        'Go': '.go',
        'Kotlin': '.kt',
        'Scala': '.scala',
        'Rust': '.rs',
        'PHP': '.php',
        'TypeScript': '.ts',
        'MySQL': '.sql',
        'MS SQL Server': '.sql',
        'Oracle': '.sql',
    };

    // getting list of submissions for a questionslug to get the submission id
    let GET_SUB_LIST = gql`
        query submissionList($questionSlug: String!) {
            questionSubmissionList(
                offset: 0,
                limit: 20,
                questionSlug: $questionSlug
            ) {
                submissions {
                    id
                    title
                    titleSlug
                    statusDisplay
                    lang
                    langName
                    url
                }
            }
        }, 
    `

    // take the latest submission and use its id to get the submission details
    let GET_SUB = gql`
        query submissionDetails($submissionId: Int!) {
            submissionDetails(submissionId: $submissionId) {
                code
                timestamp
                statusCode
                user {
                    username
                }
                question {
                    questionId
                }
            }
        }, 
    `

    const { 
        loading: listLoading, 
        error: listError, 
        data: listData, 
        variables: listVariables, 
        refetch: listRefetch 
    } = useQuery(GET_SUB_LIST, {
        variables: { questionSlug: question },
        enabled: false, // disable this query from automatically running
        onError: ({ networkError, graphQLErrors }) => {
            console.log('graphQLErrors', graphQLErrors)
            console.log('networkError', networkError)
            if (graphQLErrors) {
                setError(`error fetching question. might not be a valid leetcode question`);
            }
        }, 
        fetchPolicy: 'no-cache'
    });


    const { 
        loading: subLoading, 
        error: subError, 
        data: subData, 
        variables: subVariables, 
        refetch: subRefetch 
    } = useQuery(GET_SUB, {
        variables: { submissionId: sub },
        enabled: false, // disable this query from automatically running
        onError: ({ networkError, graphQLErrors }) => {
            console.log('graphQLErrors', graphQLErrors)
            console.log('networkError', networkError)
            if (graphQLErrors) {
                setError(`error fetching question. might not be a valid leetcode question`);
            }
        }, 
        fetchPolicy: 'no-cache'
    });

    // if user clears console, set path to filename (default)
    useEffect(() => {
        if (path.length == 0) {
            let directory = question + ext
            setPath(directory)
        }
        if (path.length != 0) {
            checkfile(path)
        }
    }, [path])

    // when user puts in link, stitch link to get problem name
    useEffect(() => {
        setMessage('')
        if (!link.includes('leetcode.com/problems')) {
            setError('not a valid leetcode link')
        } else {
            setError('')
        }
        let linkArr = link.split('/').filter(x => x);
        let questionSlug = ""
        for (var i = 0; i < linkArr.length; i++) {
            if (linkArr[i] == 'problems' && linkArr.length > i + 1) {
                questionSlug = linkArr[i + 1]
            }
        }
        setQuestion(questionSlug)
        if (path == '') {
            setPath(questionSlug)
        }
        if (questionSlug.length != 0) {
            fetchSubmissionList(questionSlug)
        }
    }, [link])

    useEffect(() => {
        if (state == 'submit') {
            if (subData) {
                console.log(subData)
                if (subData["submissionDetails"] != null && subData["submissionDetails"]["code"].length != 0) {
                    let code = subData["submissionDetails"]["code"]
                    console.log(code)
                    if (code != null && state == 'submit') {
                        uploadGit(window.btoa(code), `${question}${ext} commit`,
                            () => {
                                console.log("code uploaded!")
                            },
                        );
                    }
                }
            } 
            setState('init')
        } else {
            console.log(`new state: ${state}`)
        }
    }, [state])

    useEffect(() => {
        if (listLoading) console.log(`loading`);
        if (listError) setError(`error fetching question`);
        if (!listData) console.log("listData null")
        else {
            if (listData["questionSubmissionList"] && listData["questionSubmissionList"]["submissions"]) {
                if (listData["questionSubmissionList"]["submissions"].length != 0) {
                    let submission = listData["questionSubmissionList"]["submissions"][0]
                    if (submission["statusDisplay"] == "Accepted") {
                        let lang = submission["langName"]
                        setExt(languages[lang])
                        setPath(`${path}${languages[lang]}`)
                        checkfile(`${path}${languages[lang]}`)
                        let submissionId = submission["id"]
                        setSub(submissionId)
                            
                        if (state == 'submit') {
                            subRefetch({
                                submissionId: submissionId
                            })
                        }
                    } else {
                        // latest submission was not accepted
                    }
                }
            } else {
                // smth went wrong
                setError(`error fetching question. Make sure you are logged in.`);
            }
        }
    }, [listData])

    useEffect(() => {
        console.log("subdata changed")
        if (subLoading) console.log(`loading`);
        if (subError) console.log(`error fetching ${subError} with variables ${JSON.stringify(subVariables)}`);
        if (subData == undefined || subData == null) console.log("subData null")
        else {
            console.log(subData)
            if (subData["submissionDetails"] != null && subData["submissionDetails"]["code"].length != 0) {
                let code = subData["submissionDetails"]["code"]
                console.log(code)
                if (code != null && state == 'submit') {
                    uploadGit(
                        window.btoa(code),
                        `${question}${ext} commit`,
                        () => {
                            console.log("code uploaded!")
                        },
                    );
                }
            } else {
                console.log("subdata error")
                // smth went wrong
            }
        }
    }, [subData])

    /* Try to get file to see if it exists */
    const checkfile = (p) => {
        chrome.storage.local.get(["github_username"]).then((result) => {
            let username = result.github_username;
            if (username) {
                console.log(`github user ${username}`)
                chrome.storage.local.get(["leekcake_repo"]).then((result) => {
                    let repo = JSON.parse(result.leekcake_repo);
                    if (repo) {
                        chrome.storage.local.get(["github_token"]).then((result) => {
                            let token = result.github_token;
                            if (token) {
                                const URL = `https://api.github.com/repos/${username}/${repo.name}/contents/${p}`;
                            
                                const xhr = new XMLHttpRequest();
                                xhr.addEventListener('readystatechange', function () {
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200 || xhr.status === 201) {
                                        // file exists
                                        console.log(`${p} exists`)
                                        setWarning(`warning: file already exists. if you submit, you'll be 
                                                    overwriting the existing file. \n
                                                    consider using a different name.`)
                                        setUpdate(true);
                                        return true
                                    } else if (xhr.status == 404) {
                                        // file doesn't exist
                                        setWarning('')
                                        setUpdate(false);
                                        return false
                                    }
                                }
                                });
                                xhr.open('GET', URL, true);
                                xhr.setRequestHeader('Authorization', `token ${token}`);
                                xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
                                xhr.send();
                            } else {
                                // smth went wrong
                            }
                        })
                    } else {
                        // smth went wrong
                    }
                })
            } else {
                // smth went wrong
            }
        })
    }


    /* start question fetching after submitting */
    const fetchSubmissionList = async (questionSlug) => {
        console.log(`fetchsubmission: ${questionSlug}`)
        chrome.storage.local.get(["LEETCODE_SESSION"]).then((result) => {
            document.cookie = `LEETCODE_SESSION=${result["LEETCODE_SESSION"]}; SameSite=None; Secure; HttpOnly`;
            chrome.storage.local.get(["csrftoken"]).then(async (result) => {
                document.cookie = `csrftoken=${result["csrftoken"]}; SameSite=None; Secure; HttpOnly`;
                if (listData && sub) {
                    console.log("sub refetching " + sub)
                    subRefetch({
                        submissionId: sub
                    })
                } else {
                    listRefetch({
                        questionSlug: questionSlug, 
                    })
                }
            });
        });
    }

    const handleKeyDown = (e) => {
        if (e.key != 'Enter') return;
        if (link == '') return;
        else {
            console.log("keydown enter")
            submit()
        }
    }

    const submit = () => {
        let linkArr = link.split('/').filter(x => x);
        let questionSlug = ""
        for (var i = 0; i < linkArr.length; i++) {
            if (linkArr[i] == 'problems' && linkArr.length > i + 1) {
                questionSlug = linkArr[i + 1]
            }
        }
        setQuestion(questionSlug)
        handleSubmit()
    }

    const handleSubmit = () => {
        setState('submit')
    }

    const handeRelink = () => {
        navigate('/linkage')
    }

    const handlePAT = () => {
        navigate('/PAT')
    }

    const handleLogout = () => {
        chrome.storage.local.get(["github_token"]).then(async (result) => {
            let token = result.github_token;
            if (token) {
                let CLIENT_ID = import.meta.env.VITE_CLIENT_ID
                let CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET
                const revokeAccess = await axios.delete(
                    `https://api.github.com/applications/${CLIENT_ID}/grant`,
                    {
                      headers: {
                        Authorization: `Basic ${Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')}`,
                        Accept: 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28',
                      },
                      data: {
                        access_token: token,
                      }
                    }
                );
                if (revokeAccess.status === 204) {
                    chrome.storage.local.set({ github_username: null }, () => {
                        console.log("wiped github name")
                    });    
                    chrome.storage.local.set({ github_token: null }, () => {
                        console.log("wiped github token");
                    });    
                    chrome.storage.local.set({ leekcake_repo: null }, () => {
                        console.log("wiped github repo")
                    });
                    chrome.storage.local.set({ stats: null }, () => {
                        console.log("wiped stats")
                    });
                    navigate('/auth')
                } else {
                    console.log("awww fuck")
                    setError('something went wrong. sorry!!!!!!!!!!! \n you can also manually revoke tokens on github')
                }
            } else {
                setError('something went wrong. sorry!!!!!!!!!!! \n you can also manually revoke tokens on github')
            }
        })
    }

    const handlePathChange = (p) => {
        setPath(p)
        if (p.length == 0) return;
        if (p[p.length - 1] == '/' || p[0] == '/') {
            setError('error: invalid file name')
        } else {
            setError('')
        }

        let parr = p.split('/').filter(x => x);
        console.log(parr)
        var re = new RegExp(/^[\w\-\.]+$/);
        for (var i = 0; i < parr.length; i++) {
            if (!re.test(parr[i])) {
                setError('error: invalid folder/file name or smth')
            }
        }
        // valid names: ^[\w-\.]+$
    }

    /* Main function for updating code to GitHub repo, and callback cb is called if success */
	const update = (code, msg, cb = undefined) => {
        chrome.storage.local.get(["github_username"]).then((result) => {
            let username = result.github_username;
            if (username) {
                chrome.storage.local.get(["leekcake_repo"]).then(async (result) => {
                    let repo = JSON.parse(result.leekcake_repo);
                    if (repo) {
                        chrome.storage.local.get(["personal_token"]).then(async (result) => {
                            let personal_token = result.personal_token;
                            if (personal_token) {
                                const octokit = new Octokit({
                                    auth: personal_token
                                })
                                const response1 = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                                    owner: username,
                                    repo: repo.name,
                                    path: path,
                                    headers: {
                                    'X-GitHub-Api-Version': '2022-11-28'
                                    }
                                });

                                let sha2 = "";
                                
                                if (response1.status == 200) {
                                    if (response1.data) sha2 = response1.data.sha;
                                }
                                
                                const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                                    owner: username,
                                    repo: repo.name,
                                    path: path,
                                    message: msg,
                                    content: code,
                                    sha: sha2,
                                    headers: {
                                        'X-GitHub-Api-Version': '2022-11-28'
                                    }
                                })
                                console.log(response)
                                if (response.status != 200 && response.status != 201) {
                                    setError('auth error: check if your personal access token is expired or correct')
                                } else if (response.status == 200 || response.status == 201) {
                                    setMessage('success!!!')
                                }
                            }
                        })
                    }
                })
            }
        })
	};

    /* Main function for uploading code to GitHub repo, and callback cb is called if success */
	const upload = (code, msg, cb = undefined) => {
        chrome.storage.local.get(["github_username"]).then((result) => {
            let username = result.github_username;
            if (username) {
                chrome.storage.local.get(["leekcake_repo"]).then(async (result) => {
                    let repo = JSON.parse(result.leekcake_repo);
                    if (repo) {
                        chrome.storage.local.get(["personal_token"]).then(async (result) => {
                            let personal_token = result.personal_token;
                            if (personal_token) {
                                const octokit = new Octokit({
                                    auth: personal_token
                                })
                                const response = await octokit.request(`PUT /repos/{username}/{repo}/contents/{path}`, {
                                    username: username,
                                    repo: repo.name,
                                    path: path,
                                    message: msg,
                                    content: code,
                                    headers: {
                                        'X-GitHub-Api-Version': '2022-11-28'
                                    }
                                })
                                console.log(response)
                                if (response.status != 200 && response.status != 201) {
                                    setError('auth error: check if your personal access token is expired or correct')
                                    
                                } else if (response.status == 200 || response.status == 201) {
                                    setMessage('success!!!')
                                }      
                                setState('init')
                            }
                        })
                    } 
                })
            }
        })
	};
  
	function uploadGit(code, msg, cb = undefined) {
        chrome.storage.local.get(["github_username"]).then((result) => {
            let username = result.github_username;
            if (username) {
                console.log(`github user ${username}`)
                chrome.storage.local.get(["leekcake_repo"]).then((result) => {
                    let repo = JSON.parse(result.leekcake_repo);
                    if (repo) {
                        chrome.storage.local.get(["github_token"]).then((result) => {
                            let token = result.github_token;
                            if (token) {
                                if (update2) update(code, msg, cb);
                                else upload(code, msg, cb,);
                            } 
                        })
                    } 
                })
            } 
        })
	}

    return (
        <div className="flex flex-col h-fit max-h-fit">
            <div className="flex flex-row justify-between">
                <Button onClick={() => handleLogout()} text="logout" />
                <Button onClick={() => handeRelink()} text="relink repo" />
                <Button onClick={() => handlePAT()} text="change PAT" />
            </div>
            enter link to leetcode question
            <input type="text" placeholder="leetcode q" 
                className="focus:outline-none px-3 py-2 bg-inherit text-orange-400" onChange={(e) => setLink(e.target.value)}/>
            {link != '' &&             
            <div className="flex flex-col justify-center">
                enter folder and file name to commit to. empty is default.
                <input type="text" placeholder={`${path}`} 
                    className="focus:outline-none px-3 py-2 bg-inherit" onKeyDown={(e) => handleKeyDown(e)}
                        onChange={(e) => handlePathChange(`${e.target.value}`)}
                    />
                <Button onClick={() => submit()} text="submit" />
                <div className="text-red-500">{error}</div>
                <div className="text-orange-500">{warning}</div>
                <div className="text-green-500">{message}</div>
            </div>
            }
        </div>
    )
}
