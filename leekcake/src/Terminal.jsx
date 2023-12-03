/*global chrome*/
import { useState, useEffect } from "react";
import { gql, useQuery } from '@apollo/client';

export default function CLI() {

    const [link, setLink] = useState('');
    const [ext, setExt] = useState('.txt');
    const [name, setName] = useState('');
    const [sub, setSub] = useState(0);

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

    // let url = `https://leetcode.com/graphql`;
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
        variables: { questionSlug: name },
        enabled: false, // disable this query from automatically running
        onError: ({ networkError, graphQLErrors }) => {
            console.log('graphQLErrors', graphQLErrors)
            console.log('networkError', networkError)
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
        }
    });

    useEffect(() => {
        let linkArr = link.split('/').filter(x => x);
        let questionSlug = ""
        for (var i = 0; i < linkArr.length; i++) {
            if (linkArr[i] == 'problems' && linkArr.length > i + 1) {
                questionSlug = linkArr[i + 1]
            }
        }
        setName(questionSlug)
    }, [link])

    useEffect(() => {
        console.log(`new submission data: ${JSON.stringify(subData)}`)

        if (subLoading) console.log(`loading`);
        if (subError) console.log(`error fetching ${subError} with variables ${JSON.stringify(subVariables)}`);
        if (subData == undefined || subData == null) console.log("subData null")
        else {
            console.log("SUB DATA: ", subData)
            if (subData["submissionDetails"] != null && subData["submissionDetails"]["code"].length != 0) {
                let code = subData["submissionDetails"]["code"]
                console.log(`code: ${code}`)
            } else {
                // smth went wrong
            }
        }
    }, [subData])

    useEffect(() => {
        if (listLoading) console.log(`loading`);
        if (listError) console.log(`error fetching ${listError} with variables ${JSON.stringify(listVariables)}`);
        if (listData == undefined || listData == null) console.log("subData null")
        else {
            console.log("DATA: ", listData)
            if (listData["questionSubmissionList"] != null && listData["questionSubmissionList"]["submissions"].length != 0) {
                let submission = listData["questionSubmissionList"]["submissions"][0]
                console.log(`submission: ${JSON.stringify(submission)}`)
                if (submission["statusDisplay"] == "Accepted") {
                    let lang = submission["langName"]
                    setExt(languages[lang])
                    let submissionId = submission["id"]
                    setSub(submissionId)
                    console.log(`submission id: ${submissionId}`)
                    subRefetch({
                        submissionId: submissionId
                    })
                } else {
                    // latest submission was not accepted
                }
            } else if (listData["questionSubmissionList"]["submissions"].length != 0) {
                // no subs
            } else {
                // smth went wrong
            }
        }
    }, [listData])

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
            setName(questionSlug)
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
            {/* { data } */}
            </div>
            }
        </div>
    )
}
