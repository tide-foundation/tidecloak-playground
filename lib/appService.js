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


const appService = {
    getUsers,
    updateUser,
}

export default appService;