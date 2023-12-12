/*global chrome*/
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { checkFetcher, gql, useQuery } from '@apollo/client';
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

    /**
     * getting list of submissions for a questionslug to get the submission id
     */
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
        }
    `

    /**
     * take the latest submission and use its id to get the submission details
     */
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
        }
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
        }
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
        }
    });

    // if user clears console, set path to filename (default)
    useEffect(() => {
        if (path.length == 0) {
            let directory = question + ext
            setPath(directory)
        }
        if (path.length != 0) {
            checkfile()
        }
    }, [path])

    // when user puts in link, stitch link to get problem name
    useEffect(() => {
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
            fetchSubmissionList(question)
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
                        checkfile()
                        if (state == 'submit') {
                            let submissionId = submission["id"]
                            setSub(submissionId)
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
                setError(`error fetching question`);
            }
        }
    }, [listData])

    useEffect(() => {
        if (subLoading) console.log(`loading`);
        if (subError) console.log(`error fetching ${subError} with variables ${JSON.stringify(subVariables)}`);
        if (subData == undefined || subData == null) console.log("subData null")
        else {
            if (subData["submissionDetails"] != null && subData["submissionDetails"]["code"].length != 0) {
                let code = subData["submissionDetails"]["code"]
                if (code != null) {
                    uploadGit(
                        window.btoa(encodeURIComponent(code)),
                        `${question}${ext} commit`,
                        () => {
                            console.log("code uploaded!")
                        },
                    );
                }
            } else {
                // smth went wrong
            }
        }
    }, [subData])

    /* Try to get file to see if it exists */
    const checkfile = () => {
        chrome.storage.local.get(["github_username"]).then((result) => {
            let username = result.github_username;
            if (username) {
                console.log(`github user ${username}`)
                chrome.storage.local.get(["leekcake_repo"]).then((result) => {
                    let repo = JSON.parse(result.leekcake_repo);
                    if (repo) {
                        console.log(`github repo ${repo}`)
                        chrome.storage.local.get(["github_token"]).then((result) => {
                            let token = result.github_token;
                            if (token) {
                                const URL = `https://api.github.com/repos/${username}/${repo.name}/contents/${path}`;
                                console.log(`url: ${URL}`)
                            
                                const xhr = new XMLHttpRequest();
                                xhr.addEventListener('readystatechange', function () {
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200 || xhr.status === 201) {
                                        // file exists
                                        console.log(`${path} exists`)
                                        setWarning(`warning: file already exists. if you submit, you'll be 
                                                    overwriting the existing file. \n
                                                    consider using a different name.`)
                                        return true
                                    } else if (xhr.status == 404) {
                                        // file doesn't exist
                                        setWarning('')
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
        chrome.storage.local.get(["LEETCODE_SESSION"]).then((result) => {
            document.cookie = `LEETCODE_SESSION=${result["LEETCODE_SESSION"]}; SameSite=None; Secure; HttpOnly`;
            chrome.storage.local.get(["csrftoken"]).then(async (result) => {
                document.cookie = `csrftoken=${result["csrftoken"]}; SameSite=None; Secure; HttpOnly`;
                listRefetch({
                    questionSlug: questionSlug, 
                })
            });
        });
    }

    const handleKeyDown = (e) => {
        // check if link is empty
        if (e.key != 'Enter') return;
        if (link == '') return;
        else {
            let linkArr = link.split('/').filter(x => x);
            let questionSlug = ""
            for (var i = 0; i < linkArr.length; i++) {
                if (linkArr[i] == 'problems' && linkArr.length > i + 1) {
                    questionSlug = linkArr[i + 1]
                }
            }
            setQuestion(questionSlug)
            handleSubmit()
            // fetchSubmissionList(questionSlug)
        }
    }

    const handleSubmit = () => {
        setState('submit')
    }

    const handeRelink = () => {
        navigate('/linkage')
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
	const update = (code, sha, msg, cb = undefined,) => {
        chrome.storage.local.get(["github_username"]).then((result) => {
            let username = result.github_username;
            if (username) {
                chrome.storage.local.get(["leekcake_repo"]).then((result) => {
                    let repo = JSON.parse(result.leekcake_repo);
                    if (repo) {
                        chrome.storage.local.get(["github_token"]).then((result) => {
                            let token = result.github_token;
                            if (token) {
                                const URL = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
                                let data = {
                                    message: msg,
                                    content: code,
                                    sha,
                                };
                                data = JSON.stringify(data);
                        
                                const xhr = new XMLHttpRequest();
                                xhr.addEventListener('readystatechange', function () {
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200 || xhr.status === 201) {
                                        const updatedSha = JSON.parse(xhr.responseText).content.sha; // get updated SHA.
                                
                                        chrome.storage.local.get('stats', (data2) => {
                                            let { stats } = data2;
                                            if (stats == null || Object.keys(stats).length === 0 || stats === undefined) {
                                                stats = {};
                                                stats.sha = {};
                                            }
                                            stats.sha[path] = updatedSha; // update sha key.
                                            chrome.storage.local.set({ stats }, () => {
                                                console.log(`committed ${path} to github`,);
                                                if (cb !== undefined) {
                                                    cb();
                                                }
                                            });
                                        });
                                    }
                                }
                                });
                                xhr.open('PUT', URL, true);
                                xhr.setRequestHeader('Authorization', `token ${token}`);
                                xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
                                xhr.send(data);
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
	};

    /* Main function for uploading code to GitHub repo, and callback cb is called if success */
	const upload = (code, sha, msg, cb = undefined,) => {
        chrome.storage.local.get(["github_username"]).then((result) => {
            let username = result.github_username;
            if (username) {
                chrome.storage.local.get(["leekcake_repo"]).then((result) => {
                    let repo = JSON.parse(result.leekcake_repo);
                    if (repo) {
                        chrome.storage.local.get(["github_token"]).then((result) => {
                            let token = result.github_token;
                            if (token) {
                                const URL = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
                                let data = {
                                    message: msg,
                                    content: code,
                                    sha,
                                };
                                data = JSON.stringify(data);
                          
                                const xhr = new XMLHttpRequest();
                                xhr.addEventListener('readystatechange', function () {
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200 || xhr.status === 201) {
                                        const updatedSha = JSON.parse(xhr.responseText).content.sha; // get updated SHA.
                                
                                        chrome.storage.local.get('stats', (data2) => {
                                            let { stats } = data2;
                                            if (stats == null || Object.keys(stats).length === 0 || stats === undefined) {
                                                stats = {};
                                                stats.sha = {};
                                            }
                                            stats.sha[path] = updatedSha; // update sha key.
                                            chrome.storage.local.set({ stats }, () => {
                                                console.log(`committed ${path} to github`,);                                
                                                if (cb !== undefined) {
                                                    cb();
                                                }
                                            });
                                        });
                                    }
                                }
                                });
                                xhr.open('PUT', URL, true);
                                xhr.setRequestHeader('Authorization', `token ${token}`);
                                xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
                                xhr.send(data);
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
	};
  
	function uploadGit(code, msg, cb = undefined) {
        if (token) {
            chrome.storage.local.get('stats', (s) => {
                const { stats } = s;
                let sha = null;
                if (
                    stats !== undefined &&
                    stats.sha !== undefined &&
                    stats.sha[path] !== undefined
                ) {
                    sha = stats.sha[path];
                }

                if (repo) {
                    /* Upload to git. */
                    upload(
                        code,
                        sha,
                        msg,
                        cb,
                    );
                }
            });
        }
	}

    return (
        <div className="flex flex-col h-fit max-h-fit">
            <div className="flex flex-row justify-between">
                <Button onClick={() => console.log("logout")} text="logout" />
                <Button onClick={() => handeRelink()} text="relink repo" />
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
                <div className="text-red-500">{error}</div>
                <div className="text-orange-500">{warning}</div>
            </div>
            
            }
            
        </div>
    )
}
