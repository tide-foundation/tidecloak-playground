// This file shares the common API parameters across the endpoints to conveniently change values such as the base URL.
// Default values are used for local hosting TideCloak when .env isn't provided.
import settings from "/test-realm.json";

const envConfig = {
  BASEURL: process.env.BASE_URL ?? (() =>{
    console.log("BASE_URL not set in .env, using default set in apiConfigs.js.");
    return "http://localhost:8080";
  })(),
  CUSTOMURL: process.env.CUSTOM_URL ?? (() =>{
    console.log("CUSTOM_URL not set in .env, using default set in apiConfigs.js.");
    return "http://localhost:3000";
  })()
};

// Realm name containing the demo client
const realm = settings.realm;
// Used in every API fetch call
const baseURL = envConfig.BASEURL;
// The Admin Console's client name
const clientName = settings.clients[0].clientId;
// Used as Custom Domain URL for the enclave to work
const customURL = envConfig.CUSTOMURL;


const configs = {
    realm,
    baseURL,
    clientName,
    customURL
  };
  
  export default configs;