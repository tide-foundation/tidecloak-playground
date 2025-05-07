/**
 * 
 * @param {*} URL - Keycloak's base URL; not client's
 * @returns 
 */
async function getMasterToken(baseURL){
    const response = await fetch(`${baseURL}/realms/master/protocol/openid-connect/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            "username": process.env.KC_USERNAME,
            "password": process.env.KC_PASSWORD,
            "grant_type": process.env.GRANT_TYPE,
            "client_id": process.env.CLIENT_ID
        })
    });
    
    if (!response.ok) {
        throw new Error(response.status + ": Unable to fetch master token")
    } 
    
    //Converting from a ReadableStream to access the master token.
    const data = await response.json(); 
    return data.access_token;

}

/**
 * 
 * @param {*} baseURL 
 * @param {*} settings 
 * @param {*} token 
 * @returns 
 */
async function createDefaultRealm(baseURL, settings, token){
    const response = await fetch(`${baseURL}/admin/realms`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(
            settings
        )
    });

    if (response.status === 409) {
        throw new Error("Realm already exists.")
    }

    if (!response.ok) {
        return new Error("Failed to create realm.");
    }

    return {ok: true, status: response.status};
};


/* TIDE CUSTOM ENDPOINTS */

/**
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} token 
 * @returns 
 */
async function getUsersChangeRequests(baseURL, realm, token){
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/users/requests`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok){
        return new Response(JSON.stringify({error: response.statusText + ": Unable to get users change requests.", status: response.status}));
    }

    const usersChangeReq = await response.json();

    return new Response(JSON.stringify({ok: true, status: response.status, body: usersChangeReq}));
}

/**
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} usersChangeReq 
 * @param {*} token 
 * @returns 
 */
async function signUsersChangeRequest(baseURL, realm, usersChangeReq, token){
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/sign`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            "actionType": usersChangeReq[0].actionType,
            "changeSetId": usersChangeReq[0].draftRecordId,
            "changeSetType": usersChangeReq[0].changeSetType

        })
    });

    if (!response.ok){
        return new Response(JSON.stringify({error: response.statusText + ": Unable to sign change request for user.", status: response.status}));
    }

    return new Response(JSON.stringify({ok: true, status: response.status}));
}

/**
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} usersChangeReq 
 * @param {*} token 
 * @returns 
 */
async function commitUsersChangeRequest(baseURL, realm, usersChangeReq, token){
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/commit`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            "actionType": usersChangeReq[0].actionType,
            "changeSetId": usersChangeReq[0].draftRecordId,
            "changeSetType": usersChangeReq[0].changeSetType

        })
    });

    if (!response.ok){
        return new Response(JSON.stringify({error: response.statusText + ": Unable to commit change request for user.", status: response.status}));
    }

    return new Response(JSON.stringify({ok: true, status: response.status}));
}

const apiService = {
    getMasterToken,
    getUsersChangeRequests,
    signUsersChangeRequest,
    commitUsersChangeRequest,
    createDefaultRealm,

}

export default apiService;