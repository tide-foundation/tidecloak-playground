/**
 * 
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




const appService = {
    getUsers,
}

export default appService;