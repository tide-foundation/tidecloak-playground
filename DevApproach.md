# Creating a NextJS Application Secured by TideCloak

This is the proposed approach to easily secure a NextJS application with TideCloak.

Prerequisites:
It's recommended to use these files from the demo as a basis with the NextJS files.
- IAMService.js to interact with the TideCloak instance (found at /lib/IAMService.js).
- tideJWT.js to verify the access token from TideCloak (found at /lib/tideJWT.js).
- middleware.js to enforce the tideJWT.js token verification on every navigation (found at /middleware.js).
- heimdall.js to interact with the Tide Enclave (found at /tide-modules/heimdall.js). 
- tidecloak.json to import the client adapter from TideCloak (found at /data/tidecloak.json). 

Developer Note: The adapter would be different to this demo, and should be replaced every time a new client is created. It's placed here instead of the root for the production build to work. For that reason, this endpoint is also a prerequisite.
- tidecloakConfig endpoint to read the tidecloak.json for the client adapter configurations from TideCloak (found at /app/api/tidecloakConfig/route.js).
This guide assumes that a TideCloak server is already running with an existing realm, Tide Identity Provider (IDP) with a license, Identity Governance Administration (IGA) toggled on, and client adapter already copied to tidecloak.json.

Steps to easily secure the NextJS application with TideCloak:
1. Initiate TideCloak within a Context (/app/context/context.js):
The moment the application is opened in the browser, securing the application with TideCloak starts in the context by loading the client adapter and initiating a single instance of TideCloak. 
The middleware enforces a valid access token immediately after an account linked with Tide is logged in, and constantly checks if it's expired when receiving the next user action; ensuring an authentic session and used with authenticated TideCloak endpoints. It's not initiated multiple times (for example, on every page) to avoid unexpected behaviours. 

Developer Note:
- IAMService.loadConfig() - fetches the tidecloakConfig endpoint to read the adapter configurations in tidecloak.json.
- IAMService.initIAM() - after the adapter configurations are loaded, this initiates the single TideCloak instance that will manage authentication of the user with an access token.
- This context is ideal for sharing states such as "authenticated" with other application components, and "contextLoading" to provide a delay for the TideCloak instance and access token to load before rendering. 

2. Redirecting based on Authentication (/app/auth/redirect/page.js):
With the ability to share state variables, redirection should be implemented next, because the redirect page handles where the user should be navigated based on the authenticated state from the context. It's called when a Tide account logs in, when logging out, and when the middleware detects the expiry of the token. If authenticated is false, where the token from the TideCloak instance expired or no longer exists, the user is redirected to the login screen so they may reauthenticate. If authenticated is true, proceed with the user action, such as navigating to the User page of the demo after the Tide user logged in. 

Developer Note: 
- The context reloads for auth/redirect due to the navigation methods of different server components that access it. For example, when logging in and out the IAMService's navigation method forces a context reload, which is the same when the access token expiring is detected by the middle and redirection is called. This ensures that the shared authenticated state is valid.
- Parameters can be passed to the auth/redirect page to trigger actions. For example, in the demo the middleware can attach an "auth" parameter in the URL to flag whether the token has expired. The auth/redirect page can read the parameter using URLSearchParams() (don't use useSearchParams() here as it causes production build errors) to set a cookie to display the token expired message on login screen when redirected there.
- Every time context reloads, it takes on 3.5 seconds to load on average then an access token can be found.
- The access token contains the realm roles committed to the logged in user and affects what they can do on the demo's User page.

3. User Actions based on their Permissions (/app/user/page.js):
Now that authentication is established, Tide actions can be performed with the logged in Tide user, such as data encryption (to write data to TideCloak) and decryption (to read data from TideCloak) as demonstrated in the demo's User page for date of birth and credit card number. To present the user their own data in a readable form the user must have read permissions, and for them to update their own data and save to TideCloak they must have write permissions. 

Developer Note:
- IAMService.doDecrypt() - decrypts an encrypted string only if the user has the realm role, so that it can be displayed for user to read. For example, to read Date of Birth the user must have the realm role "_tide_dob.selfdecrypt".
- IAMSevice.doEncrypt() - encrypts raw or decrypted string only if the user has the realm role, so that it can be stored in TideCloak encrypted. For example, to write Date of Birth data, the user must have "_tide_dob.selfencrypt".
- Both of these functions can take an object array with the data strings and tags to decrypt or encrypt multiple values at once for faster load times, by reaching the ORK servers just once each.
- These fields are populated by encrypted user data within a standards-based Identity Token.
- These fields are readable and writable based on the user permissions contained within their Access Token.

Relevant TideCloak endpoints:
- Get all realm users to save the logged in user's object representation with their Tide VUID. It was used in the demo to confirm that they're a Tide user and display their encrypted data in the accordions directly from the database (GET /admin/realms/{realm}/users).
- Update user's data such as when saving their date of birth and credentials in this demo (PUT /admin/realms/{realm}/users/{user.id}).

Ideally user data in the database is always stored encrypted as shown in the Database Exposure page. These factors results in users' data being secured by TideCloak, without requiring a complex orchestrated effort.

4. Database Exposure based on User Permissions (/app/databaseExposure/page.js):
While all data is stored encrypted, if the user has the realm role to self-decrypt their own data for a field, they should only be able to read their own data and not others'. This is demonstrated on the Database Exposure table, where all users' encrypted data is fetched and displayed directly from TideCloak. This strict design prevents unwanted data exposure and is further managed on the admin page of the demo.

Developer Note & relevant TideCloak endpoints:
- Get all realm users to display their encrypted data directly from the database, including the demo user's instead of via their ID token (GET /admin/realms/{realm}/users).

5. Managing Users' Permissions (/app/admin/page.js):
The Admin page of the demo demonstrates how these user permissions are managed by TideCloak administrators, based on a quorum threshold. The demo shows a quorum of 5 administrators with a threshold of 3, meaning three administrators must approve of a change request for it to be committed. A change request in this demo is assigning or unassigning a realm role for the logged in user; giving them permission or removing it for reading or writing the date of birth or credit card data fields. Change requests starts off as a draft, which gets approved or denied, and only when the change request is committed, would the permission be assigned or unassigned to the user.

Developer Notes:
- Administrators are Tide accounts with the client role "tide-realm-admin", a composite role which gives them all child roles under it for the purpose of managing the realm.
- Only one change request is active at a time in this demo on purpose, because committing a request updates the user context, meaning if two active change requests are approved and one is committed, the other needs to reset back to draft.

Relevant TideCloak endpoints: 
- Get the representation object of the default realm-management client used to find the client's ID and tide-realm-role (GET /admin/realms/{realm}/clients).
- Get the client roles available to find the tide-realm-role using the realm-management's client ID (GET /admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}/available).
- Get the user's client roles to check if they've been assigned the tide-realm-admin role (to be an admin) (GET /admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}).
- Assign the tide-realm-role to the demo user (POST /admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}).
- Assign a realm role (POST /admin/realms/{realm}/users/${userID}/role-mappings/realm).
- Unassign a realm role (DELETE /admin/realms/{realm}/users/{userID}/role-mappings/realm).
Tide Custom Endpoints:
- Get all user change requests to display and manage (GET /admin/realms/{realm}/tide-admin/change-set/users/requests).
- Open up the Tide Enclave to review a change request (POST /admin/realms/${realm}/tide-admin/change-set/sign).
- Deny a change request (POST /admin/realms/${realm}/tideAdminResources/add-rejection).
- Approve a change request (POST /admin/realms/${realm}/tideAdminResources/add-authorization).

Implementing these 5 steps presents the basis of how to easily secure a NextJS application with TideCloak. However, for developmental purposes it may be inefficient to setup TideCloak from scratch every time it's required, such as for testing. 

6. Initialization (optional):
The initializer calls endpoints in order to setup a TideCloak for the NextJS app using a master token. It starts with the tidecloak.json object being empty. 

The minimum relevant endpoints in order of execution:
- Get a master token from the default realm-management client (POST /realms/master/protocol/openid-connect/token).
- Create the realm based on default settings within test-realm.json in this demo (POST /admin/realms).
- Create the Tide IDP and activate its license (POST /admin/realms/{realm}/vendorResources/setUpTideRealm).
- Toggle IGA on and leave it on (POST /admin/realms/{realm}/tideAdminResources/toggle-iga).
- Get all client change requests to approve of all default clients and contexts (GET /admin/realms/{realm}/tide-admin/change-set/clients/requests).
- Approve a change request (POST /admin/realms/{realm}/tide-admin/change-set/sign).
- Commit a change request (POST /admin/realms/{realm}/tide-admin/change-set/commit).
- Get Tide IDP settings (GET /admin/realms/{realm}/identity-provider/instances/tide).
- Update Tide IDP settings to set a custom domain URL for the Tide Enclave (PUT /admin/realms/{realm}/identity-provider/instances/tide).
- Sign the IDP settings (POST /admin/realms/{realm}/vendorResources/sign-idp-settings).
- Get the application's ID (GET /admin/realms/{realm}/clients).
- Get the client adapter using the application client ID to write to tidecloak.json (GET /admin/realms/${realm}/vendorResources/get-installations-provider).

Other useful endpoints:
- Create a realm user if populating the database is required (POST /admin/realms/{realm}/users).
- Get available realm roles that can be assigned to a user (GET /admin/realms/{realm}/users/{userId}/role-mappings/realm/available).
- Assign the user a realm role (POST /admin/realms/{realm}/users/${userId}/role-mappings/realm).
- Delete the Tide IDP (DELETE /admin/realms/{realm}/identity-provider/instances/tide).
- Delete the realm (DELETE /admin/realms/{realm}).

Other Developer Notes (good to knows): 
- Consider fetching the master token on every NextJS backend endpoint for the initializer to avoid master token expiring during long loads.
- Tide IDP must be deleted before a realm can be deleted.
- If there's only one Tide administrator and they're deleted from the realm, the realm must be recreated.
- While IGA is on, assigning user roles to create change requests without an existing Tide admin in the realm (a user with the tide-realm-admin client role), the change request still goes through IGA, but doesn't require admin approval i.e. Goes from Draft to Approved to Committed immediately. However, these endpoints still need to be called, like in the initializer.
- When deleting already assigned roles from the realm, it will create a Roles change request, but if they're not already assigned it will delete immediately.
- If a role needs to be unassignable in the application, don't import it under a composite realm when creating a realm. These must be assigned to the use individually in the application or through the initializer separately from the import.
- When assigning or unassigning a role from the logged in user, update their token as it's the source of truth. This also requires on average 3.5 seconds for the token to arrive.
- Browser navigation methods that cause destruction of all components (E.g. entering a URL into the browser or browser refresh), forces the context to reload.
- Give the application time to load the context (E.g. a loading screen), before other user actions to ensure a context with a TideCloak instance and access token is ready.
- To avoid unexpected behaviours when iterating through arrays with async and await keywords, use an indexed for-loop to respect those keywords

Other endpoints can be found here: https://www.keycloak.org/docs-api/latest/rest-api/index.html#_overview 