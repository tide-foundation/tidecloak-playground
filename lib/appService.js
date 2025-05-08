/////////////////////////////////////////////////////////////// KEYCLOAK ENDPOINTS ////////////////////////////////////////////////////////////////

/**
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} user 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} userId 
 * @param {*} clientId 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} userId 
 * @param {*} clientId 
 * @param {*} role 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} userId 
 * @param {*} clientId 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} roleName 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} userID 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} userID 
 * @param {*} role 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} userID 
 * @param {*} role 
 * @param {*} token 
 * @returns 
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} body 
 * @param {*} token 
 * @returns 
 */
async function approveEnclave(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tideAdminResources/add-authorization`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
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
 * 
 * @param {*} baseURL 
 * @param {*} realm 
 * @param {*} body 
 * @param {*} token 
 * @returns 
 */
async function denyEnclave(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tideAdminResources/add-rejection`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
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

async function commitChange(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/commit`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
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

async function cancelChange(baseURL, realm, body, token) {
    try {
        const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/cancel`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
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

//GET /admin/realms/{realm}/users/{user-id}
// async function getUserByID(baseURL, realm, userId, token) {
//     try {
//         const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}`, {
//             method: 'GET',
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${token}`,
//             }
//         });

//         if (!response.ok) {
//             throw ("Unable to get user.")
//         };

//         const data = await response.json();

//         return data;
        
//     } catch (error) {
//         console.log(error);
//     }
// };

const appService = {
    getUsers,
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
}

export default appService;