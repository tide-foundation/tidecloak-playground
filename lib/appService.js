/////////////////////////////////////////////////////////////// KEYCLOAK ENDPOINTS ////////////////////////////////////////////////////////////////

// DPoP-aware fetch, injected by the AuthProvider via appService.setSecureFetch().
// TideCloak access tokens are DPoP-bound (sender-constrained), so they cannot be
// sent to keycloak as a plain `Authorization: Bearer <token>` — that yields 401.
// The SDK's secureFetch rewrites `Bearer <token>` -> `DPoP <token>`, attaches a
// per-request DPoP proof, and handles the resource-server DPoP-Nonce challenge.
// Until injected it falls back to the global fetch.
let secureFetch = (...args) => fetch(...args);
function setSecureFetch(fn) {
    secureFetch = typeof fn === "function" ? fn : (...args) => fetch(...args);
}

/**
 * Get all realm users
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} token - shared  access token from the context
 * @returns {array} - all realm users
 */
async function getUsers(baseURL, realm, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok){
            throw new Error("Fetch Error: Unable to get users.")
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return []; // Return empty array instead of undefined
    }
}
/**
 * Get all realm user by vuid
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} token - shared  access token from the context
 * @param {string} vuid - vuid of the user
 * @returns {array} - all realm users
 */
async function getUserByVuid(baseURL, realm, token, vuid){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users?q=vuid:${vuid}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok){
            throw new Error("Fetch Error: Unable to get users.")
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Error fetching user by vuid:", error);
        return []; // Return empty array instead of undefined
    }
} 


/**
 * Update the user object to be sent back to TideCloak
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} user - object representation of the user being updated
 * @param {string} token - shared  access token from the context
 * @returns {Promise<Object>} - status response 
 */
async function updateUser(baseURL, realm, user, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users/${user.id}`, { 
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(user)
        });
        
        if (!response.ok){
            throw("Fetch Error: Unable to update user.")
        }

        return response;
    }
    catch (error){
        console.log(error);
    }
}

/**
 * Get the client realm ID to assign tide-admin role
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} token - shared access token from the context
 * @returns {string} - default client realm management's ID
 */
async function getRealmManagementId(baseURL, realm, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/clients`, { 
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });
    
        if (!response.ok) {
           throw ("Unable to get Realm Management's ID");
        }
    
        const allClients = await response.json();
        // Find this client which manages the tide-realm-admin role
        const client = allClients.find((client) => client.clientId === "realm-management");
        return client.id;
    }
    catch (error) {
        console.log(error);
    }
}


/**
 * Get all roles available to be assigned to user and find specifically the object representation of the tide-realm-admin role
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} userId - user's ID
 * @param {string} clientId - default realm-management ID
 * @param {string} token - shared access token from the context
 * @returns {object} - the object represenation of Tide admin role
 */
async function getTideAdminRole(baseURL, realm, userId, clientId, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}/available`, { 
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });
    
        if (!response.ok) {
            throw ("Unable to get the tide-realm-admin role.");
        }
    
        const availableRoles = await response.json(); 
        const tideAdminRole = availableRoles.find((role) => role.name === "tide-realm-admin");
        return tideAdminRole;
    } 
    catch (error) {
        console.log(error);
    }
}

/**
 * Assign client role to the demo user, in this case tide-realm-admin role
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} userId - user's ID
 * @param {string} clientId - default realm-management ID
 * @param {object} role - the object representation of tide-admin-realm role
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response  
 */
async function assignClientRole(baseURL, realm, userId, clientId, role, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify([{
                "id": role.id,
                "name": role.name
            }])
        });
    
        if (!response.ok){
            throw ("Unable to assign the client role to user."); 
        }
    
        return response;
    } 
    catch (error) {
        console.log(error);
    }
    
}

/**
 * Check if logged user has the tide-realm-admin role to be an admin
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} userId - user's ID
 * @param {string} clientId - default realm-management ID
 * @param {string} token - shared access token from context
 * @returns {boolean} - whether logged in user is an admin
 */
async function checkUserAdminRole(baseURL, realm, userId, clientId, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`, { 
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });
    
        if (!response.ok) {
            throw ("Unable to check user for admin role.");
        }

        const assignedRoles = await response.json();
    
        const adminRole = assignedRoles.find((role) => role.name === "tide-realm-admin");
        if (adminRole){
            return true;
        }
        else {
            return false;
        }
    } 
    catch (error) {
        console.log(error);
    }
}

/**
 * Get the realm role to be assigned
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} roleName - the role's name
 * @param {string} token - shared access token from context
 * @returns {object} - realm role's object representation
 */
async function getRealmRole(baseURL, realm, roleName, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/roles/${roleName}`, { 
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            }
        });
    
        if (!response.ok){
            throw ("Unable to get realm role."); 
        }
        
        const realmRole = await response.json();
    
        return realmRole;
    } 
    catch (error) {
        console.log(error);
    }
}

/**
 * Get all realm roles user has already assigned
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} userID - demo user's id
 * @param {string} token - shared access token from context
 * @returns {array} - all realm roles demo user has 
 */
async function getAssignedRealmRoles(baseURL, realm, userID, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users/${userID}/role-mappings`, { 
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            }
        });
    
        if (!response.ok){
            throw ("Unable to get assigned realm roles."); 
        }
        
        const assignedRealmRoles = await response.json();
    
        return assignedRealmRoles;
    } 
    catch (error) {
        console.log(error);
    }
}

/**
 * Assign the realm role to the demo user, for managing user permissions in the admin page
 * Creates a user change request to proceed with custom Tide endpoints
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} userID - demo user's id
 * @param {object} role - representation of the realm role
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response  
 */
async function assignRealmRole(baseURL, realm, userID, role, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users/${userID}/role-mappings/realm`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify([{
                "id": role.id,
                "name": role.name
            }])
        });

        // 409 = a change request for this user is already pending
        // (PENDING_CHANGE_REQUEST_CONFLICT): the new IGA files one change
        // request per role POST and refuses further writes on the same user
        // until it resolves. Skip quietly so multi-toggle submits still create
        // the first request; the rest can be re-submitted after approval.
        if (response.status === 409) {
            console.warn("Role change skipped: a change request for this user is already pending approval.");
            return response;
        }

        if (!response.ok){
            throw ("Unable to assign the realm role to user.");
        }

        return response;
    }
    catch (error) {
        console.log(error);
    }
};

/**
 * Unassign the realm role to the demo user, for managing user permissions in the admin page (unchecking a box then pressing submit)
 * Creates a user change request to proceed with custom Tide endpoints
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} userID - demo user's id
 * @param {object} role - representation of the realm role
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response  
 */
async function unassignRealmRole(baseURL, realm, userID, role, token){
    try {
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/users/${userID}/role-mappings/realm`, { 
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify([{
                "id": role.id,
                "name": role.name
            }])
        });

        // See assignRealmRole: one pending change request per user at a time.
        if (response.status === 409) {
            console.warn("Role change skipped: a change request for this user is already pending approval.");
            return response;
        }

        if (!response.ok){
            throw ("Unable to unassign the realm role to user.");
        }

        return response;
    }
    catch (error) {
        console.log(error);
    }
};

/////////////////////////////////////////////////////////////// TIDE CUSTOM ENDPOINTS ////////////////////////////////////////////////////////////////

/**
 * Get all User change requests to show on /admin page
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} token - shared access token from context
 * @returns {array} - all user change requests
 */
async function getUserRequests(baseURL, realm, token){
    try {
        // Native iga-core inbox (the legacy tide-admin/change-set/users/requests
        // endpoint is gone). Kept the legacy field aliases the admin page reads
        // (draftRecordId / changeSetType) on top of the native representation.
        const url = `${baseURL}/admin/realms/${realm}/iga/change-requests?status=PENDING`;

        const response = await secureFetch(url, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`getUserRequests failed: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Unable to get user change requests: ${response.status} ${response.statusText}`);
        }

        const changeRequests = await response.json();
        return (Array.isArray(changeRequests) ? changeRequests : [])
            .filter((cr) => cr.entityType === "USER")
            .map((cr) => ({
                ...cr,
                draftRecordId: cr.id,
                changeSetType: cr.entityType,
                // The cards switch on the legacy status vocabulary: DRAFT shows
                // the Review button, APPROVED shows Commit. The native API only
                // says PENDING (awaiting signatures) / APPROVED (already
                // applied), so translate: a PENDING request that has not reached
                // its threshold still needs reviewing, one at quorum is ready to
                // commit, and a natively APPROVED one has been applied already.
                status: cr.status === "PENDING"
                    ? (cr.readyToCommit ? "APPROVED" : "DRAFT")
                    : cr.status === "APPROVED" ? "COMMITTED" : cr.status,
            }));
    }

    catch (error){
        console.error("Error fetching user requests:", error);
        return []; // Return empty array instead of undefined
    }
}

/**
 * Get raw change set request data for approval (matching 's GetRawChangeSetRequest)
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} usersChangeReq - a represenation of a single user change request
 * @param {string} token - shared access token from context
 * @returns {Promise<Uint8Array>} - raw change set request bytes ready for approval
 */
async function reviewChangeRequest(baseURL, realm, usersChangeReq, token){
    try {
        // Phase 1 of the native /approve ceremony: for a multiAdmin CR the
        // server returns mode "needs-approval" with the base64 Policy:1
        // enclave carrier. For firstAdmin/Tideless CRs it records + commits
        // inline (mode "recorded") - return null so the caller skips the
        // enclave entirely.
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/iga/change-requests/${usersChangeReq.draftRecordId}/approve`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({})
        });

        if (!response.ok){
            const errorBody = await response.text();
            console.error(`Error starting approval ceremony: ${response.statusText}`);
            throw new Error(`Error starting approval ceremony: ${errorBody}`);
        }

        const data = await response.json();
        if (data.mode !== "needs-approval") {
            return null; // recorded (and possibly committed) inline - no enclave step
        }
        if (!data.requestModel) {
            throw new Error("Server requested enclave approval but returned no requestModel carrier.");
        }

        // Convert base64 carrier to bytes for the enclave
        const binaryString = atob(data.requestModel);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes;

    } catch (error){
        console.error("Error in reviewChangeRequest:", error);
        throw error;
    }
}

/**
 * Approve a user change request in the Tide enclave (matching 's AddApproval)
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} body - FormData with changeSetId, actionType, changeSetType, and requests (base64)
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response
 */
async function approveEnclave(baseURL, realm, changeRequestId, requestModel, token) {
    try {
        // Phase 2 of the native /approve ceremony: submit the enclave-signed
        // doken carrier (base64). Records toward the threshold and the server
        // AUTO-COMMITS at quorum.
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/iga/change-requests/${changeRequestId}/approve`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ requestModel })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error adding approval: ${response.statusText}`);
            throw new Error(`Unable to add approval for enclave: ${errorBody}`);
        };

        return response;

    } catch (error) {
        console.error("Error in approveEnclave:", error);
        throw error;
    }
};

/**
 * Deny a user change request in the Tide enclave (matching 's AddRejection)
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} body - FormData with actionType, changeSetId, and changeSetType
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response
 */
async function denyEnclave(baseURL, realm, changeRequestId, token) {
    try {
        // Native deny (204). Also used to cancel a pending change request
        // before new ones are created.
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/iga/change-requests/${changeRequestId}/deny`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error adding rejection: ${response.statusText}`);
            throw new Error(`Unable to add rejection for enclave: ${errorBody}`);
        };

        return response;

    } catch (error) {
        console.error("Error in denyEnclave:", error);
        throw error;
    }
};

/**
 * Action for the "Commit" button on the /admin page to commit an approved user change request
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} body - representation of the change request
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response  
 */
async function commitChange(baseURL, realm, changeRequestId, token) {
    try {
        // Native apply-only commit lane. Under the /approve auto-commit the CR
        // may already be applied when the Commit button is pressed - treat
        // "not PENDING any more" conflicts (404/409/412) as success so the
        // demo's separate Commit step stays idempotent.
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/iga/change-requests/${changeRequestId}/commit`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({})
        });

        const tolerated = [404, 409, 412].includes(response.status);
        if (!response.ok && !tolerated) {
            throw ("Unable to commit change.")
        };

        // Plain object so an already-committed CR still reads as ok to the page.
        return { ok: response.ok || tolerated, status: response.status };

    } catch (error) {
        console.log(error);
    }
};

/**
 * Cancel a current user change request on /admin page when user press the Submit to create new change requests
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} body - representation of the change request
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response   
 */
async function cancelChange(baseURL, realm, changeRequestId, token) {
    try {
        // The native API has no separate cancel lane - denying a PENDING
        // change request is the cancel. 404/409 (already resolved) tolerated.
        const response = await secureFetch(`${baseURL}/admin/realms/${realm}/iga/change-requests/${changeRequestId}/deny`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({})
        });

        if (!response.ok && ![404, 409].includes(response.status)) {
            throw ("Unable to cancel change request.")
        };

        return response;

    } catch (error) {
        console.log(error);
    }
};

/**
 * Fetch the configurations endpoint to check if the TideCloak port is public
 * @param {string} url - the configurations endpoint to ping
 * @returns {Promise<Object>} - status response of whether configuration was successfully fetched, it not it's private.
 */
async function checkPort(url){

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        }
    });

    return response;
}

const appService = {
    getUsers,
    getUserByVuid,
    updateUser,
    getRealmManagementId,
    getTideAdminRole,
    assignClientRole,
    checkUserAdminRole,
    getUserRequests,
    getRealmRole,
    assignRealmRole,
    unassignRealmRole,
    reviewChangeRequest,
    approveEnclave,
    denyEnclave,
    commitChange,
    getAssignedRealmRoles,
    cancelChange,
    checkPort,
    setSecureFetch
    //getRealmConfig,

}

export default appService;