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
    }

    // With IGA enabled the delete is not applied - it is captured as a PENDING
    // change request (HTTP 202). Drain the inbox so the IDP is really gone
    // before the realm delete runs (firstAdmin / threshold-1 auto-commits).
    if (response.status === 202) {
        await drainChangeRequests(baseURL, realm);
        return { ok: true, status: 204 };
    }

    if (!response.ok) {
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

    // With IGA enabled the delete is not applied - it is captured as a PENDING
    // DELETE_REALM change request (HTTP 202). Approve it (firstAdmin /
    // threshold-1 auto-commits) so the realm is actually removed, then verify.
    if (response.status === 202) {
        const pending = await listPendingChangeRequests(baseURL, realm, token);
        const deleteCR = pending.find((cr) => cr.actionType === "DELETE_REALM");
        if (deleteCR) {
            await approveChangeRequest(baseURL, realm, deleteCR.id, token);
        }
        const check = await fetch(`${baseURL}/admin/realms/${realm}`, {
            headers: { "authorization": `Bearer ${token}` },
        });
        if (check.status !== 404) {
            return { ok: false, status: check.status };
        }
        return { ok: true, status: 204 };
    }

    if (!response.ok) {
        return { ok: false, status: response.status };
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
 * @param {boolean} [tideInvitable] - mark the user invitable: the new IGA only
 *        mints a link-tide-account invite link for users carrying
 *        tideInvitable=true (the demo user, so Login can link them)
 * @returns {Promise<Object>} - response status object for creating each user
 */
async function createUser(baseURL, realm, token, username, dob, cc, tideInvitable = false) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            "username": username,
            "email": `${username}@tidecloak.com`,
            "attributes": {
                "dob": dob,
                "cc": cc,
                ...(tideInvitable ? { "tideInvitable": "true" } : {}),
            },
            "requiredActions": [],
            "emailVerified": false,
            "groups": [],
            "enabled": true
        })
    });

    // Conflict case, but there should only be one user on initialisation.
    if (response.status === 409) {
        throw new Error(await response.text());
    }

    if (!response.ok) {
        throw new Error("Failed to create demo user.");
    }

    return { ok: true, status: response.status };
};

/**
 * GET - /admin/realms/{realm}/users then filter by the vuid attribute.
 * Server-side lookup of the logged-in user (the `?q=vuid:` attribute search is
 * unreliable, so list-and-filter like the pages used to do client-side).
 * Exists so browser users no longer need view-users: under the new IGA the
 * default-role composite must not carry realm-management roles (MF2 guard).
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} vuid - the Tide vuid attribute value to match
 * @param {string} token - master token
 * @returns {Promise<Object|null>} - the matching user representation or null
 */
async function getUserByVuid(baseURL, realm, vuid, token) {
    const users = await listUsers(baseURL, realm, token);
    return users.find((u) => u.attributes?.vuid?.[0] === vuid) || null;
};

/**
 * GET - /admin/realms/{realm}/users with the master token. Server-side
 * replacement for the browser-side list (users hold no view-users under the
 * new IGA MF2 guard).
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} token - master token
 * @returns {Promise<Array>} - user representations
 */
async function listUsers(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users?max=200`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
            "Cache-Control": "no-store",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to list users (HTTP ${response.status}).`);
    }

    const users = await response.json();
    return Array.isArray(users) ? users : [];
};

/**
 * GET - /admin/realms/{realm}/roles/{roleName} with the master token.
 * Server-side replacement for the browser-side role lookup (users hold no
 * view-realm under the new IGA MF2 guard).
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} roleName - the realm role name
 * @param {string} token - master token
 * @returns {Promise<Object>} - the role representation
 */
async function getRealmRoleByName(baseURL, realm, roleName, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/roles/${encodeURIComponent(roleName)}`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get realm role "${roleName}" (HTTP ${response.status}).`);
    }

    return await response.json();
};

/**
 * PUT - /admin/realms/{realm}/users/{id} with the master token, then drain the
 * change-request inbox: under IGA the PUT returns 204 but parks a
 * SET_USER_ATTRIBUTE change request, and browser users can neither perform the
 * PUT (no manage-users under the new MF2 guard) nor approve the CR (needs
 * manage-realm). firstAdmin / threshold-1 auto-commits on approve.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {object} user - full user representation to store
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response object
 */
async function updateUser(baseURL, realm, user, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${user.id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(user)
    });

    if (!response.ok) {
        throw new Error(`Failed to update user (HTTP ${response.status}).`);
    }

    // Commit the captured SET_USER_ATTRIBUTE change request so the write is live.
    await drainChangeRequests(baseURL, realm);

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
 * Get the tide-realm-admin client role available to assign to the user.
 * Runs with the master token because a not-yet-admin user has no permission to
 * read client role-mappings themselves.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} userId - the user to receive the role
 * @param {string} clientId - the realm-management client's ID
 * @param {string} token - master token
 * @returns {Promise<Object>} - response object; body is the role or undefined if not available
 */
async function getTideRealmAdminRole(baseURL, realm, userId, clientId, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}/available`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Unable to get available client roles.");
    }

    const availableRoles = await response.json();
    const tideAdminRole = availableRoles.find((role) => role.name === "tide-realm-admin");

    return { ok: true, status: response.status, body: tideAdminRole };
}

/**
 * GET - /admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}
 * True when the user already holds the named client role (direct mapping).
 * Used by the admin page's pre-admin check, server-side with the master token,
 * since browser users hold no view-users under the new IGA MF2 guard.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} userId - the user's id
 * @param {string} clientId - the client's uuid (e.g. realm-management)
 * @param {string} roleName - the client role name to look for
 * @param {string} token - master token
 * @returns {Promise<boolean>} - whether the user holds the role
 */
async function userHasClientRole(baseURL, realm, userId, clientId, roleName, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Unable to get assigned client roles (HTTP ${response.status}).`);
    }

    const roles = await response.json();
    return (Array.isArray(roles) ? roles : []).some((role) => role.name === roleName);
}

/**
 * Assign a client role to the user (creates an IGA change request under IGA).
 * Runs with the master token for the same reason as getTideRealmAdminRole.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} userId - the user to receive the role
 * @param {string} clientId - the realm-management client's ID
 * @param {object} role - representation of the client role to assign
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response
 */
async function assignClientRole(baseURL, realm, userId, clientId, role, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`, {
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
        throw new Error("Unable to assign the client role to user.");
    }

    return { ok: true, status: response.status };
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
 * Assign ONE realm role to the demo user. With IGA enabled the POST is
 * captured as a PENDING GRANT_ROLES change request (HTTP 202) on the user,
 * and any further role POST on the same user 409s with
 * PENDING_CHANGE_REQUEST_CONFLICT until that request resolves. Batching roles
 * in one POST does NOT help: the capture seam files one change request per
 * role and the request conflicts with its own first change request. So the
 * caller MUST drain the change-request inbox between assignments.
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
        throw new Error(`Failed to assign realm role "${role?.name}" to user (HTTP ${response.status}).`);
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
 * List PENDING IGA change requests (current iga-core native governance inbox).
 * Returns a bare JSON array; each item's id is `.id`. Replaces the legacy
 * type-segregated tide-admin/change-set/{users,clients}/requests endpoints.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} token - master token
 * @returns {Promise<Array>} - array of pending change requests
 */
async function listPendingChangeRequests(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/iga/change-requests?status=PENDING`, {
        method: 'GET',
        headers: {
            "authorization": `Bearer ${token}`,
            "Cache-Control": "no-store",
        },
    });

    if (response.status === 401 || response.status === 403) {
        // Never treat an auth failure as an empty inbox.
        throw new Error(`Change-request LIST returned HTTP ${response.status} - admin auth failed.`);
    }
    if (!response.ok) {
        throw new Error(`Unable to list change requests (HTTP ${response.status}).`);
    }

    const changeRequests = await response.json();
    return Array.isArray(changeRequests) ? changeRequests : [];
};

/**
 * Approve a single PENDING change request by id. In firstAdmin / threshold-1
 * mode (the playground demo never flips to multiAdmin), /approve records AND
 * auto-commits, so there is no separate commit call. Body is {} (JSON).
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} id - the change request id
 * @param {string} token - master token
 * @returns {Promise<number>} - HTTP status (caller tolerates 404/409/412)
 */
async function approveChangeRequest(baseURL, realm, id, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}/iga/change-requests/${id}/approve`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({})
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error(`Change-request approve ${id} returned HTTP ${response.status} - admin auth failed.`);
    }

    return response.status;
};

/**
 * Drain the PENDING IGA change-request inbox until empty (loop-until-empty,
 * because approving one CR can unblock its dependents). Refetches the master
 * token each round since it is short-lived (~60s). Mirrors the canonical
 * tcinit drain_change_requests helper.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @returns {Promise<Object>} - status response once the inbox is empty
 */
async function drainChangeRequests(baseURL, realm) {
    const MAX_ROUNDS = 12;
    let previousIds = null;
    for (let round = 0; round < MAX_ROUNDS; round++) {
        const token = await getMasterToken(baseURL);
        const pending = await listPendingChangeRequests(baseURL, realm, token);
        const ids = pending.map((cr) => cr.id).filter(Boolean);
        if (ids.length === 0) {
            return { ok: true, status: 200 };
        }
        // No-progress guard: if a round resolved nothing (same pending set as
        // last round - e.g. a change request whose replay permanently fails),
        // stop instead of burning the remaining rounds on it.
        const key = ids.slice().sort().join(",");
        if (key === previousIds) {
            console.log(`[drainChangeRequests] ${ids.length} change request(s) not resolving in realm ${realm}; giving up early.`);
            return { ok: true, status: 200, stuck: ids };
        }
        previousIds = key;
        for (let i = 0; i < ids.length; i++) {
            // 404/409/412 are benign here (already-committed / superseded / not-yet-approvable);
            // approveChangeRequest throws on 401/403 so an auth failure is never swallowed.
            await approveChangeRequest(baseURL, realm, ids[i], token);
        }
    }
    return { ok: true, status: 200 };
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
            "Content-Type": "application/x-www-form-urlencoded",
            "authorization": `Bearer ${token}`,
        },
        // setUpTideRealm mints the realm VRK on the Tide Cybersecurity Fabric.
        // isRagnarokEnabled=true keeps the realm off-boardable; skipLicense=false
        // performs the real license activation (matches the canonical tcinit flow).
        body: new URLSearchParams({
            "email": "email@tide.org",
            "isRagnarokEnabled": "true",
            "skipLicense": "false",
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
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        // Current iga-core expects a JSON body {"enabled":true}. The legacy
        // urlencoded `isIGAEnabled` form is no longer accepted. A 409 means IGA
        // is already enabled, which is fine for an idempotent re-run.
        body: JSON.stringify({ "enabled": true })
    });

    if (!response.ok && response.status !== 409) {
        throw new Error("Failed to toggle IGA on.")
    }

    return { ok: true, status: response.status };
};

/**
 * GET - /admin/realms/{realm}
 * Fetch the realm representation (used to stamp iga.attestor before enabling IGA)
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response with the realm representation
 */
async function getRealmRepresentation(baseURL, realm, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch realm representation.");
    }

    const settings = await response.json();
    return { ok: true, status: response.status, body: settings };
}

/**
 * PUT - /admin/realms/{realm}
 * Update the realm representation. Used to stamp iga.attestor=tide on the realm
 * BEFORE toggling IGA on, which the Tide enclave requires.
 * @param {string} baseURL - url body provided in the apiConfigs.js
 * @param {string} realm - the realm name provided in the apiConfigs.js
 * @param {Object} settings - the (mutated) realm representation to persist
 * @param {string} token - master token
 * @returns {Promise<Object>} - status response
 */
async function updateRealmRepresentation(baseURL, realm, settings, token) {
    const response = await fetch(`${baseURL}/admin/realms/${realm}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(settings)
    });

    if (!response.ok) {
        throw new Error("Failed to update realm representation.");
    }

    return { ok: true, status: response.status };
}

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
    listPendingChangeRequests,
    approveChangeRequest,
    drainChangeRequests,
    createDefaultRealm,
    deleteIDP,
    deleteRealm,
    activateIDPLicense,
    toggleIGA,
    getRealmRepresentation,
    updateRealmRepresentation,
    createUser,
    getDemoUser,
    getUserByVuid,
    listUsers,
    getRealmRoleByName,
    updateUser,
    createTideInvite,
    getRealmManagement,
    userHasClientRole,
    getTideRealmAdminRole,
    assignClientRole,
    getAvailableRealmRoles,
    assignRealmRole,
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