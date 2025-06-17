/////////////////////////////////////////////////////////////// KEYCLOAK ENDPOINTS ////////////////////////////////////////////////////////////////

/**
 * Get all realm users 
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {string} token - shared  access token from the context
 * @returns {array} - all realm users
 */
async function getUsers(baseURL, realm, token){
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users`, { 
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });
        
        if (!response.ok){
            throw("Fetch Error: Unable to get users.")
        }

        const data = await response.json();
        return data;
    } 
    catch (error) {
        console.log(error);
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users?q=vuid:${vuid}`, { 
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });
        
        if (!response.ok){
            throw("Fetch Error: Unable to get users.")
        }

        const data = await response.json();
        return data;
    } 
    catch (error) {
        console.log(error);
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${user.id}`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/clients`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}/available`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/roles/${roleName}`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userID}/role-mappings`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userID}/role-mappings/realm`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userID}/role-mappings/realm`, { 
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
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/users/requests`, { 
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
        });
    
        if (!response.ok) {
            throw ("Unable to get user change requests.");
        }
    
        const changeRequests = await response.json();
       
        return changeRequests;   
    }
    
    catch (error){ 
        console.log(error);
    }
}

/**
 * Open the Tide enclave for a user change request on the /admin page for "Review" button
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} usersChangeReq - a represenation of a single user change request
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response  
 */
async function reviewChangeRequest(baseURL, realm, usersChangeReq, token){
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/sign`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                "actionType": usersChangeReq.actionType,
                "changeSetId": usersChangeReq.draftRecordId,
                "changeSetType": usersChangeReq.changeSetType
    
            })
        });
        
        if (!response.ok){
            throw("Unable to sign change request for user.");
        }
    
        return response;

    } catch (error){
        console.log(error);
    }
}

/**
 * Approve a user change request in the Tide enclave
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} body - representation of the change request including authentication of authorizer and their approve action
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response  
 */
async function approveEnclave(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tideAdminResources/add-authorization`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: body
        });

        if (!response.ok) {
            throw ("Unable to add approval for enclave.")
        };

        const data = await response.text();
      
        return response;
        
    } catch (error) {
        console.log(error);
    }
};

/**
 * Deny a user change request in the Tide enclave
 * @param {string} baseURL - url body provided in the context
 * @param {string} realm - the realm name provided in the context
 * @param {object} body - representation of the change request including authentication of authorizer and their deny action
 * @param {string} token - shared access token from context
 * @returns {Promise<Object>} - status response   
 */
async function denyEnclave(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tideAdminResources/add-rejection`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: body
        });

        if (!response.ok) {
            throw ("Unable to add rejection for enclave.")
        };

        const data = await response.text();
        return response;
        
    } catch (error) {
        console.log(error);
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
async function commitChange(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/commit`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: body
        });

        if (!response.ok) {
            throw ("Unable to commit change.")
        };

        const data = await response.text();

        return response;
        
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
async function cancelChange(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/cancel`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: body
        });

        if (!response.ok) {
            throw ("Unable to cancel change request.")
        };

        const data = await response.text();

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
    checkPort
    //getRealmConfig,
    
}

export default appService;