// 
// Tide Protocol - Infrastructure for a TRUE Zero-Trust paradigm
// Copyright (C) 2022 Tide Foundation Ltd
// 
// This program is free software and is subject to the terms of 
// the Tide Community Open Code License as published by the 
// Tide Foundation Limited. You may modify it and redistribute 
// it in accordance with and subject to the terms of that License.
// This program is distributed WITHOUT WARRANTY of any kind, 
// including without any implied warranty of MERCHANTABILITY or 
// FITNESS FOR A PARTICULAR PURPOSE.
// See the Tide Community Open Code License for more details.
// You should have received a copy of the Tide Community Open 
// Code License along with this program.
// If not, see https://tide.org/licenses_tcoc2-0-0-en
//

export class Heimdall{
    /**
     * 
     * @param {string} authorizedOrkURL 
     * @param {string[]} acceptedAdminIds 
     */
    constructor(authorizedOrkURL, acceptedAdminIds){
        this.authorizedOrkURL = authorizedOrkURL;
        this.authorizedOrkOrigin = new URL(this.authorizedOrkURL).origin;
        this.enclaveWindow = undefined;
        this.enclaveFunction = "standard";
        this.enclaveType = "standard";
        this.acceptedAdminIds = acceptedAdminIds;
    }

    getFullAuthorizedOrkUrl(){
        const u = new URL(this.authorizedOrkURL);
        u.searchParams.set("type", "approval");
        u.searchParams.set("acceptedIds", JSON.stringify(this.acceptedAdminIds));
        return this.authorizedOrkOrigin + u.pathname + u.search;
    }

    AddTideButton(tideButtonAction, actionParameter=null){ // action parameter can be null for PerformTideAuth 1 Step
        const button = document.createElement('button');
      
        //button styling
        button.textContent = "";
        button.innerHTML='<img src ="https://tide.org/assets/images/logo-tide-white.png"/>';
        button.type="image";
        button.style.background="orange";
        button.style.color="white";
        button.style.fontSize="13px";
        button.style.padding="6px 40px";
        button.style.borderColor="white";
        button.style.borderRadius="6px";
      
        button.addEventListener('click', async () => {
            tideButtonAction(actionParameter);
        });
        document.body.appendChild(button); // add button to page
        return button;
    }

    async sayHello(){
        const pre_response = this.waitForMessage("hello");

        this.sendMessage({
            type: "hello",
            message: "howdy! nice to see ya "
        });

        const response = await pre_response;
        console.log(response);
    }

    async getAuthorizerApproval(draftToApprove, modelId, expiry, encoding="bytes"){
        // ready to accept reply
        const pre_response = this.waitForMessage("approval");

        // send to enclave
        this.sendMessage({
            type: "approval",
            message: {
                draftToAuthorize: {
                    data: draftToApprove,
                    encoding: encoding
                },
                modelId: modelId,
                expiry: expiry
            }
        });

        // wait for response - this does not mean that enclave it closed, just that the admin has responded to the approval request from the enclave
        return await pre_response;
    }

    async getAuthorizerAuthentication(){
        // ready to accept reply
        const pre_response = this.waitForMessage("authentication");

        // send to enclave
        this.sendMessage({
            type: "authentication",
            message: "pretty please"
        });

        // wait for response - this does not mean that enclave it closed, just that the admin has responded to the approval request from the enclave
        return await pre_response;
    }

    async openEnclave(){
        this.enclaveWindow = window.open(this.getFullAuthorizedOrkUrl(), new Date().getTime(), 'width=800,height=800'); // is date correct to use here??????????????????????????????????????????
        await this.waitForMessage("pageLoaded"); // we need to wait for the page to load before we send sensitive data
    }

    closeEnclave(){
        this.enclaveWindow.close();
    }

    async waitForMessage(responseTypeToAwait) {
        return new Promise((resolve) => {
            const handler = (event) => {
                const response = this.processEvent(event.data, event.origin, responseTypeToAwait);
                if(response.ok){
                    resolve(response.message);
                    window.removeEventListener("message", handler);
                }else{
                    console.log(response.error);
                }
            };
            window.addEventListener("message", handler, false);
        });
    }

    sendMessage(message){
        this.enclaveWindow.postMessage(message, this.authorizedOrkOrigin);
    }
    /**
     * 
     * @param {string} data 
     * @param {string} origin
     * @param {string} expectedType
    */
    processEvent(data, origin, expectedType){
        if (origin !== this.authorizedOrkOrigin) {
            // Something's not right... The message has come from an unknown domain... 
            return {ok: false, error: "WRONG WINDOW SENT MESSAGE"};
        }
        const enclaveResponse = data;

        let response = "";
        switch (enclaveResponse.type) {
            case "authentication":
                response = enclaveResponse.message;
                break;
            case "hello":
                response = enclaveResponse.message;
                break;
            case "approval":
                response = enclaveResponse.message;
                break;
            case "newORKUrl":
                this.authorizedOrkOrigin = new URL(enclaveResponse.url).origin;
                break;
            case "pageLoaded":
                break;
            default:
                throw Error("Expected type of " + enclaveResponse.type + " is not part of types we can process");
        }

        // perform line below as there are some listeners that heimdall requires to function properyl such as newORKUrl
        if(expectedType !== enclaveResponse.type) return {ok: false, error: "Received " + enclaveResponse.type + " but waiting for " + expectedType};

        return {ok: true, message: response}
    }
}