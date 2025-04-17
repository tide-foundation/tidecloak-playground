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

/////////////////////////////////////////////////////////////// TIDE CUSTOM ENDPOINTS ////////////////////////////////////////////////////////////////



const appService = {
    getUsers,
    updateUser,
    getRealmManagementId,
    getTideAdminRole,
    assignClientRole,

}

export default appService;