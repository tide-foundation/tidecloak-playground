// This file shares the common API parameters across the endpoints to conveniently change values such as the base URL.
import settings from "/test-realm.json";

// Realm name containing the Admin Console
const realm = settings.realm;
// Used in every API fetch call
const baseURL = "http://localhost:8080";
// The Admin Console's client name
const clientName = settings.clients[0].clientId;
// Used as Custom Domain URL for the enclave to work
const customURL = "http://localhost:3000";

const configs = {
    realm,
    baseURL,
    clientName,
    customURL
  };
  
  export default configs;