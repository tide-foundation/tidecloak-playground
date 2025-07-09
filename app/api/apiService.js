/**
 * POST - /realms/master/protocol/openid-connect/token
 * Get the master token from the default TideCloak client, admin-cli
 * @param {String} baseURL - url body provided in the apiConfigs.js
 * @returns {String} - master token
 */
async function getMasterToken(baseURL) {

    // If the credentials aren't provided in .env use defaults values for local hosting TideCloak.
    const envConfig = {
        USERNAME: process.env.KC_USERNAME ?? (() => {
            console.log("KC_USERNAME not set in .env, using default set in apiService getMasterToken().");
            return "admin";
        })(),
        PASSWORD: process.env.KC_PASSWORD ?? (() => {
            console.log("KC_PASSWORD not set in .env, using default set in apiService getMasterToken().");
            return "password";
        })(),
        GRANTTYPE: process.env.GRANT_TYPE ?? (() => {
            console.log("GRANT_TYPE not set in .env, using default set in apiService getMasterToken().");
            return "password";
        })(),
        CLIENTID: process.env.CLIENT_ID ?? (() => {
            console.log("CLIENT_ID not set in .env, using default set in apiService getMasterToken().");
            return "admin-cli";
        })()
    };

    const response = await fetch(`${baseURL}/realms/master/protocol/openid-connect/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            "username": envConfig.USERNAME,
            "password": envConfig.PASSWORD,
            "grant_type": envConfig.GRANTTYPE,
            "client_id": envConfig.CLIENTID
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
 * POST - /admin/realms
 * Create the realm for the demo
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} token - master token
 * @param {JSON} settings - imported settings from the tidecloak-demo-realm.json
 * @returns {Promise<Object>} - response status object based on the result of creating the realm
 */
async function createDefaultRealm(baseURL, settings, token) {
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
        throw new Error("Realm already exists. Deleting realm and restarting initializer.");
    }

    if (!response.ok) {
        return new Error("Failed to create realm.");
    }

    return { ok: true, status: response.status };
};


/**
 * DELETE - /admin/realms/{realm}/identity-provider/instances/{alias}
 * Delete the IDP for the initialiser if an error occurs along the initializer steps
 * Needs to run before deleting the realm
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - response status based on whether deletion of IDP was successful. 
 */
async function deleteIDP(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/identity-provider/instances/tide`, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    // Account for if the IDP already doesn't exist, delete realm anyways
    if (response.status === 404) {
        console.log("Failed to delete IDP, IDP not found. Attempting to delete realm.");
        const deleteRealmResp = await deleteRealm(baseURL, realm, token);
        if (!deleteRealmResp.ok) {
            throw new Error("Failed to delete realm. Manual deletion of realm required via Keycloak.");
        }
        else {
            return { ok: true, status: deleteRealmResp.status };
        }
    } else if (!response.ok) {
        throw new Error("Failed to delete IDP. Manual deletion of IDP then realm via Keycloak required.");
    };

    return { ok: true, status: response.status };
};

/**
 * DELETE - /admin/realms/{realm}
 * Delete the realm for initialiser upon an error occuring along the initializer steps
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response object for whether deletion of realm succeeded
 */
async function deleteRealm(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}`, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (response.status === 404) {
        console.log("Realm not found. Possibly already deleted.");
        return { ok: true, status: 200 };
    }

    if (!response.ok) {
        return new Error("Failed to delete the realm. Manual deletion of realm required via Keycloak.");
    }

    return { ok: true, status: response.status };
};

/**
 * POST - /admin/realms/{realm}/users
 * Create the demo user and dummy users during initialization
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @param {string} username - user's username in the dummy data of the createUsers endpoint
 * @param {string} dob - user's dob in the dummy data of the createUsers endpoint
 * @param {string} cc - user's cc in the dummy data of the createUsers endpoint
 * @returns {Promise<Object>} - response status object for creating each user
 */
async function createUser(baseURL, realm, token, username, dob, cc) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            "username": username,
            "email": "testuser@tidecloak.com",
            "attributes": {
                "dob": dob,
                "cc": cc,
            },
            "requiredActions": [],
            "emailVerified": false,
            "groups": [],
            "enabled": true
        })
    });

    // Conflict case, but there should only be one user on initialisation.
    if (response.status === 409) {
        throw new Error("User already exists.");
    }

    if (!response.ok) {
        throw new Error("Failed to create demo user.");
    }

    return { ok: true, status: response.status };
};

/**
 * GET - /admin/realms/${realm}/users
 * Get the demo user object via parameter search
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {String} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - response status with demo user's object
 */
async function getDemoUser(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users?username=demouser`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get the demo user.");
    }

    const demoUser = await response.json();

    if (demoUser.length === 0) {
        throw new Error("User not found. Check user exists in Keycloak.");
    }

    return { ok: true, status: 200, body: demoUser[0] };
};

/** 
 * GET - /admin/realms/{realm}/clients
 * Get all the realm clients to find the client ID of realm-management client
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} token - master token
 * @returns {Promise<Object>} - A response object with the realm management client object
 */
async function getRealmManagement(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/clients`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(": Unable to get clients.");
    }

    const clients = await response.json();
    // Find this client which manages the tide-realm-admin role
    const realmManagementClient = clients.find((client) => client.clientId === "realm-management");

    return { ok: true, status: response.status, body: realmManagementClient };
}

/**
 * Get all realm roles that can be assigned to the demo user
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} userId - demo user's ID
 * @param {string} token - master token
 * @returns {Promise<Object>} - response object with an array of available realm roles
 */
async function getAvailableRealmRoles(baseURL, realm, userId, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/realm/available`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get available realm roles.")
    }

    const availableRoles = await response.json();

    return { ok: true, status: response.status, body: availableRoles };
}

/**
 * Assign the realm role to the demo user
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} userId - demo user's ID
 * @param {object} role - represenation of the role to be assigned
 * @param {string} token - master token
 * @returns {Promise<Object>} - response object of whether role assigned successfully
 */
async function assignRealmRole(baseURL, realm, userId, role, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/realm`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify([{
            "id": role.id,
            "name": role.name
        }])
    });

    if (!response.ok) {
        throw new Error("Failed to assign realm role to user.");
    }

    return { ok: true, status: response.status };
}

/**
 * GET - /admin/realms/{realm}/clients
 * Get the client ID of the demo using the provided client name in tidecloak-demo-realm.json
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} clientName - client name (ID) from the tidecloak-demo-realm.json 
 * @param {string} token - master token
 * @returns {Promise<Object>} - response status with client ID
 */
async function getClientID(baseURL, realm, clientName, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/clients?clientId=${clientName}`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(": Unable to find client.")
    }

    const client = await response.json();
    return { ok: true, status: response.status, body: client[0].id };
};

/**
 * GET - /admin/realms/{realm}/vendorResources/get-installations-provider
 * Get the adapter configurations for the client specified in the tidecloak-demo-realm.json, these configurations will be written to tidecloak.json.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} clientID - client Id from getClientID()
 * @param {string} token - master token
 * @returns {Promise<Object>} - response status with string of configurations
 */
async function getClientAdapter(baseURL, realm, clientID, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/vendorResources/get-installations-provider?clientId=${clientID}&providerId=keycloak-oidc-keycloak-json`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get client adapter.");
    }

    const configsJSON = await response.json();
    const configsString = JSON.stringify(configsJSON);

    return { ok: true, status: response.status, body: configsString };
};

/**
 * Get all users of the realm
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {array} - all users existing in the realm
 */
async function getUsers(baseURL, realm, token) {

    const response = await fetch(`${baseURL}/admin/realms/${realm}/users`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get users.")
    }

    const data = await response.json();
    return data;
}

/* TIDE CUSTOM ENDPOINTS */

/**
 * Get all USER change requests for realm roles
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response based on whether fetching the change requests succeeded
 */
async function getUsersChangeRequests(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/users/requests`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get Users change requests.");
    }

    const usersChangeReq = await response.json();

    return { ok: true, status: response.status, body: usersChangeReq };
};

/**
 * Approve the USER change request for realm roles
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {object} usersChangeReq - representation of the user change request 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response of the approve on that change request
 */
async function signChangeRequest(baseURL, realm, usersChangeReq, token) {
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

    if (!response.ok) {
        throw new Error("Failed to sign change request for user.");
    }

    return { ok: true, status: response.status };
};

/**
 * Commit a USER change request for realm roles
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {object} usersChangeReq - representation of the user change request 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response of the Commit on that change request
 */
async function commitChangeRequest(baseURL, realm, usersChangeReq, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/commit`, {
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

    if (!response.ok) {
        throw new Error(": Unable to commit change request for user.");
    }

    return { ok: true, status: response.status };
};

/** TIDE CUSTOM ENDPOINT
 * POST - /admin/realms/{realmName}/vendorResources/setUpTideRealm
 * Activate the IDP License with a default email
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response
 */
async function activateIDPLicense(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/vendorResources/setUpTideRealm`, {
        method: 'POST',
        headers: {
            "authorization": `Bearer ${token}`,
        },
        body: new URLSearchParams({
            "email": "email=email@tide.org",
        })
    });

    if (!response.ok) {
        throw new Error("Failed to activate IDP license");
    }

    return { ok: true, status: response.status };
};

/** TIDE CUSTOM ENDPOINT
 * POST - /admin/realms/{realm}/tideAdminResources/toggle-iga
 * Toggle IGA on once the IDP License is activated for the enclave to work
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response
 */
async function toggleIGA(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/toggle-iga`, {
        method: 'POST',
        headers: {
            "authorization": `Bearer ${token}`,
        },
        body: new URLSearchParams({
            "isIGAEnabled": true,
        })
    });

    if (!response.ok) {
        throw new Error("Failed to toggle IGA on.")
    }

    return { ok: true, status: response.status };
};

/** TIDE CUSTOM ENDPOINT
 * POST - /admin/realms/{realm}/tideAdminResources/get-required-action-link
 * Create a tide invite link to link new user accounts to their tide account
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} userID - default user's ID
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response with Tide invite link string
 */
async function createTideInvite(baseURL, realm, userID, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tideAdminResources/get-required-action-link?userId=${userID}&lifespan=43200`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(["link-tide-account-action"])
    });

    if (!response.ok) {
        throw new Error("Failed to create Tide Invite Link.")
    }

    const url = await response.text();

    return { ok: true, status: response.status, body: url }

};

/** TIDE CUSTOM ENDPOINT
 * GET - /admin/realms/{realm}/tide-admin/change-set/clients/requests
 * Get the change requests for clients to approve them with IGA
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response with an array of change requests
 */
async function getClientsChangeRequests(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/tide-admin/change-set/clients/requests`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(": Unable to get client change requests.");
    }

    const changeRequests = await response.json()

    return { ok: true, status: response.status, body: changeRequests };
}


/** TIDE CUSTOM ENDPOINT
 * GET /admin/realms/{realm}/identity-provider/instances/tide
 * Get the IDP settings for updating with a Custom Domain URL for  the enclave to work
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response with the IDP settings to be updated
 */
async function getIDPSettings(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/identity-provider/instances/tide`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch IDP Settings");
    }

    const settings = await response.json();
    return { ok: true, status: response.status, body: settings };
}

/** TIDE CUSTOM ENDPOINT
 * PUT - /admin/realms/{realm}/identity-provider/instances/tide
 * Update the IDP settings with the new custom domain URL for the enclave to work
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @param {Object} settings - object representation of IDP settings with a config field containing the new CustomAdminUIDomain property custom URL.
 * @returns {Promise<Object>} - status response
 */
async function updateIDPSettings(baseURL, realm, settings, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/identity-provider/instances/tide`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(
            settings
        )
    });

    if (!response.ok) {
        throw new Error(`Unable to update IDP Settings.`);
    }

    return { ok: true, status: response.status };
}

/** TIDE CUSTOM ENDPOINT
 * POST - /admin/realms/{realm}/vendorResources/sign-idp-settings
 * Sign new IDP settings, such as new custom domain URL for the approval enclave to work
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response
 */
async function signSettings(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/vendorResources/sign-idp-settings`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Unable to Sign Settings.")
    }

    return { ok: true, status: response.status };
}

/**
 * Upload images during initialization for enclave to use
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @param {*} formData - image body
 * @returns {Promise<Object>} - status response
 */
async function uploadImage(baseURL, realm, token, formData) {
    const url = `${baseURL}/admin/realms/${realm}/tide-idp-admin-resources/images/upload`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: formData,
    });

    if (!res.ok) {
        // pick JSON or text error body
        const isJson = res.headers.get('Content-Type')?.includes('application/json');
        const serverMsg = isJson
            ? await res.json().then(err => err.message ?? JSON.stringify(err))
            : await res.text();

        throw new Error(
            `Upload failed: ${res.status} ${res.statusText}` +
            (serverMsg ? ` — ${serverMsg}` : '')
        );
    }

    return { ok: true, status: res.status };
}

/**
 * Delete existing images on TideCloak to be replaced
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js 
 * @param {string} token - master token
 * @param {*} type - image type, URL path
 * @returns {Promise<Object>} - status response 
 */
async function deleteImage(baseURL, realm, token, type) {
    const url = `${baseURL}/admin/realms/${realm}/tide-idp-admin-resources/images/${type}/delete`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        throw new Error(`Unable to delete ${type} image from Tide IDP (status ${res.status}).`);
    }

    return { ok: true, status: res.status };
}


const apiService = {
    getMasterToken,
    getUsersChangeRequests,
    signChangeRequest,
    commitChangeRequest,
    createDefaultRealm,
    deleteIDP,
    deleteRealm,
    activateIDPLicense,
    toggleIGA,
    createUser,
    getDemoUser,
    createTideInvite,
    getRealmManagement,
    getAvailableRealmRoles,
    assignRealmRole,
    getClientsChangeRequests,
    getIDPSettings,
    updateIDPSettings,
    signSettings,
    getClientID,
    getClientAdapter,
    getUsers,
    uploadImage,
    deleteImage
}

export default apiService;