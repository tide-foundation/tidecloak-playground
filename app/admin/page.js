"use client"
import React, { useState, useEffect, useRef } from "react";
import IAMService from "../../lib/IAMService";
import appService from "../../lib/appService";
import { useAppContext } from "../context/context";
import { Heimdall } from "../../tide-modules/heimdall";

import AccordionBox from "../components/accordionBox";
import Button from "../components/button";
import { FaCheckCircle, FaChevronRight } from "react-icons/fa";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Admin() { 

  const pathname = usePathname();
  const router = useRouter();
 
  // Realm Management client ID to assign user the tide-realm-admin role if not yet assigned
 
  const {baseURL, realm, authenticated } = useAppContext();

  const [isTideAdmin, setIsTideAdmin] = useState(false);


  const [loggedUser, setLoggedUser] = useState(null);

  const [showAdminAccordion, setShowAdminAccordion] = useState(false);
  const [showChangeInfo, setShowChangeInfo] = useState(false);
  const [activeRequestIndex, setActiveRequestIndex] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState(0);

  //const [requestStatus, setRequestStatus ] = useState("Draft");

  const [loading, setLoading] = useState(true);

  const [hasChanges, setHasChanges] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isApproved, setIsApproved] = useState(false);

  const [showExplainer, setShowExplainer] = useState(false);
  const handleElevateClick = () => setShowExplainer(true);

  // Check Boxes
  const [hasDobReadPerm, setHasDobReadPerm] = useState(false);
  const [hasDobWritePerm, setHasDobWritePerm] = useState(false);
  const [hasCcReadPerm, setHasCcReadPerm] = useState(false);
  const [hasCcWritePerm, setHasCcWritePerm] = useState(false);

  const [hasUserApproved, setHasUserApproved] = useState(false);

  const [totalApproved, setTotalApproved] = useState(1);
 
  const ADMIN_NAMES = ["You", "Alice", "Ben", "Carlos", "Dana"];
      
  const [approvals, setApprovals] = useState([false, false, false, false, false]);

  const [pending, setPending] = useState(false);

  // State of whether the first QuorumDashBoard (card) has ran. It triggers based on how many cards is needed. 
  const quorumDashRef  = useRef(false);

  useEffect(() => {
    const storedApprovals = localStorage.getItem("approvals");
    // This is intended only for when refreshing browser, approvals[0] would be false then
    if (isApproved && approvals[0] === false){
      if (storedApprovals){
        setApprovals(JSON.parse(storedApprovals));
      }
      else {
        // Make up a new array of people who approved
        let approvals = [true, false, false, false, false]
        const others = [1, 2, 3, 4];
        const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 2);
        shuffled.forEach((index) => {
          approvals[index] = true;
        })
        
        setApprovals(approvals);
      }
    }
  }, [isApproved])

  // useEffect(() => {
  //   if (authenticated){
  //     getLoggedUser();
  //     if (isTideAdmin){
  //       getChangeRequests(); // Get existing requests to cancel them
  //     }
  //   }
  //   setLoading(false);
  // }, [])

  useEffect(() => {
    if (authenticated){
      getLoggedUser();
    }
    setLoading(false);
  }, [authenticated])

  // Get the currently assigned realm roles of the logged in user after they've been identified 
  useEffect(() => {
    if (loggedUser){ 
      checkAdminRole();  
    }
  }, [loggedUser])


  useEffect(() => {
      // Shouldn't need to get permissions if logged in user isn't an Admin; will need to elevate instead
      if (isTideAdmin){
        setUserPermissions();
        if (isTideAdmin){
          getChangeRequests(); // Get existing requests to cancel them
        }
      }
  }, [isTideAdmin])

  // Handles the state of the submit change button, disable if there's no change
  useEffect(() => {
    if (hasDobReadPerm === IAMService.hasOneRole("_tide_dob.read")
      && hasDobWritePerm === IAMService.hasOneRole("_tide_dob.write")
      && hasCcReadPerm === IAMService.hasOneRole("_tide_cc.read")
      && hasCcWritePerm === IAMService.hasOneRole("_tide_cc.write")){
        setHasChanges(false); 
    }
  }, [hasDobReadPerm, hasDobWritePerm, hasCcReadPerm, hasCcWritePerm])

  // Get current logged in user
  const getLoggedUser = async () => { 
    const token = await IAMService.getToken();
    const loggedVuid =  await IAMService.getValueFromToken("vuid");
    const users = await appService.getUsers(baseURL, realm, token);
    const loggedInUser = users.find(user => {
      if (user.attributes.vuid[0] === loggedVuid){
          return user;
      }
    });
    setLoggedUser(loggedInUser);
  };
  
  // Get the current user realm roles to prefill the boxes and for updating the permissions
  const setUserPermissions = async () => { 
    if (loggedUser){
      setHasDobReadPerm(IAMService.hasOneRole("_tide_dob.read"));
      setHasDobWritePerm(IAMService.hasOneRole("_tide_dob.write"));

      setHasCcReadPerm(IAMService.hasOneRole("_tide_cc.read"));
      setHasCcWritePerm(IAMService.hasOneRole("_tide_cc.write"));
    }
  };

  // On initial render check if logged user is admin to decide which components to show
  const checkAdminRole = async () => {
      const token = await IAMService.getToken();
      // Get Realm Management default client's ID
      const clientID = await appService.getRealmManagementId(baseURL, realm, token);
      // Check if user already has the role
      setIsTideAdmin(await appService.checkUserAdminRole(baseURL, realm, loggedUser.id, clientID, token));
  }

  // Assign this initial user the tide-realm-admin client role managed by the default client Realm Management
  const confirmAdmin = async () => {
    const token = await IAMService.getToken();

    if (!isTideAdmin){
        const RMClientID = await appService.getRealmManagementId(baseURL, realm, token);

        // Get the tide-realm-admin role to assign
        const tideAdminRole = await appService.getTideAdminRole(baseURL, realm, loggedUser.id, RMClientID, token);

        // Assign the tide-realm-admin role to the logged in user
        const assignResponse = await appService.assignClientRole(baseURL, realm, loggedUser.id, RMClientID, tideAdminRole, token);

        // Back end functionality required to approve and commit user with tide-realm-admin role using a master token
        const response = await fetch(`/api/commitAdminRole`);

        if (response.ok) {
            // Force update of token without logging out
            await IAMService.updateToken(-1); //-1 to update it immediately
            setIsTideAdmin(true); 
            console.log("Admin Role Assigned");
        }
    }
    else {
        setIsTideAdmin(true);
    }
  };

  // Get latest change requests for canceling and updating them
  const getChangeRequests = async () => {
    
    const token = await IAMService.getToken();
    const changeRequests = await appService.getUserRequests(baseURL, realm, token);
    // Remove Denied Requests
    const withoutDeniedReqs = changeRequests.filter((request) => 
      (request.deleteStatus !== "DENIED" && request.status !== "DENIED")
    )
    setRequests(withoutDeniedReqs);
   
    
  }

  // Assign or unassign the logged in user realm roles (pemissions)
  const handleAdminPermissionSubmit = async (e) => {
    e.preventDefault();
    const token = await IAMService.getToken();

    localStorage.removeItem("approvals");

    // Cancel all requests before assigning new ones.
    const allRequests = await appService.getUserRequests(baseURL, realm, token); // Including the denied requests
    await cancelRequests(allRequests);
    
    
    // Compare the current checkbox state with the current permissions. Note: token roles only update when a role change request COMMITS.
    // If the states don't match, a change request is required.
    // Date of Birth
    if (hasDobReadPerm !== IAMService.hasOneRole("_tide_dob.read")){
      
      const readRole = await appService.getRealmRole(baseURL, realm, "_tide_dob.read", token);
      if (hasDobReadPerm === true){
        await appService.assignRealmRole(baseURL, realm, loggedUser.id, readRole, token);
      }
      else {
        await appService.unassignRealmRole(baseURL, realm, loggedUser.id, readRole, token);
      }
    }

    if (hasDobWritePerm !== IAMService.hasOneRole("_tide_dob.write")){
      const writeRole = await appService.getRealmRole(baseURL, realm, "_tide_dob.write", token);
      if (hasDobWritePerm === true){
        await appService.assignRealmRole(baseURL, realm, loggedUser.id, writeRole, token);
      }
      else {
        await appService.unassignRealmRole(baseURL, realm, loggedUser.id, writeRole, token);
      }
    }

    // Credit Card
    if (hasCcReadPerm !== IAMService.hasOneRole("_tide_cc.read")){
      const readRole = await appService.getRealmRole(baseURL, realm, "_tide_cc.read", token);
      if (hasCcReadPerm === true){
        await appService.assignRealmRole(baseURL, realm, loggedUser.id, readRole, token);
      }
      else {
        await appService.unassignRealmRole(baseURL, realm, loggedUser.id, readRole, token);
      }
    }

    if (hasCcWritePerm !== IAMService.hasOneRole("_tide_cc.write")){
      const writeRole = await appService.getRealmRole(baseURL, realm, "_tide_cc.write", token);
      if (hasCcWritePerm === true){
        await appService.assignRealmRole(baseURL, realm, loggedUser.id, writeRole, token);
      }
      else {
        await appService.unassignRealmRole(baseURL, realm, loggedUser.id, writeRole, token);
      }
    }

    // Get the latest change requests
    getChangeRequests();

    // Set first change request as the one currently opened
    setActiveRequestIndex(0);
    setExpandedIndex(0);
    // Reset form state
    setHasChanges(false);
  };


  
  function QuorumDashboard({ request, onCommit }) {
      // const [requestStatus, setRequestStatus] = useState(""); 
      
      let requestStatus;
      if (request.deleteStatus){
        requestStatus = request.deleteStatus;
      }
      else { 
        requestStatus = request.status;
      }
    
      // When committed
      if (requestStatus === "Committed") {
        return (
          <div className="bg-white border rounded-lg p-6 shadow space-y-4 mt-8">

          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Change Request</h3>
          </div>
  
  
          <pre className="bg-gray-50 border text-sm rounded p-4 overflow-auto">
            {JSON.stringify(request.value, null, 2)}
          </pre>
          <div className="mt-4">
            <div className="text-sm text-gray-700 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Done! You can now explore the updated permissions.</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/user");
                }}
                className="text-blue-600 hover:underline font-medium whitespace-nowrap"
              >
                View on User Page →
              </a>
            </div>
          </div>
  
        </div>
        );
      }
      
      // Perform approval checks and commit checks everytime requests is updated from the enclave actions
      useEffect(() => {

        // Based on the status of the change request, trigger useEffect to update the current approvals on refresh
        if (requestStatus === "APPROVED"){
          setIsApproved(true);
        }

        // When Approving (Animation)
        if (hasUserApproved && quorumDashRef.current === false){
          quorumDashRef.current = true;
          
          const others = [1, 2, 3, 4];
          const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 2);
          let completed = 0;

          // Temporary array to update currently approved users for a change request and store locally
          const updated = [...approvals];
          shuffled.forEach((index, i) => {
            setTimeout(async() => {
              updated[index] = true;
              setApprovals([...updated]);

              // Update the UI's counter for number of people approved
              setTotalApproved(prev => prev + 1);
            
              // To break out of animation loop after the last animation and change status from PENDING
              completed++;
              if (completed === shuffled.length){
                setPending(false);
                setHasUserApproved(false);
                // Change the button to a Commit button based on the new status
                requestStatus = requests[activeRequestIndex].deleteStatus ? requests[activeRequestIndex].deleteStatus : requests[activeRequestIndex].status;
                // Allow next change request card to be used
                quorumDashRef.current = false;
                // Store locally for persistence through browser refresh
                localStorage.setItem("approvals", JSON.stringify(updated));
                  
              }
            }, (i + 1) * 900);
          });  
        }
      }, [hasUserApproved])
    
      // POST /tideAdminResources/add-rejection
      // Add denied status to change request 
      const addRejection = async (action, draftId, type) => {
        const token = await IAMService.getToken();    
        
        // Key value pairs
        const formData = new FormData();
        formData.append("actionType", action);
        formData.append("changeSetId", draftId);
        formData.append("changeSetType", type);
  
        const response = await appService.denyEnclave(baseURL, realm, formData, token);
        if (response.ok){
          setRequests(await appService.getUserRequests(baseURL, realm, token));
          setHasUserApproved(false);
          setActiveRequestIndex(prev => prev + 1);
          setExpandedIndex(prev => prev + 1);
        } 
      };
  
      //POST /tideAdminResources/add-authorization
      // Add approve status to change request
        const addApproval = async (action, draftId, type, authorizerApproval, authorizerAuthentication) => {
        const token = await IAMService.getToken();

        // Key value pairs
        const formData = new FormData();
        formData.append("actionType", action);
        formData.append("changeSetId", draftId);
        formData.append("changeSetType", type);
        formData.append("authorizerApproval", authorizerApproval);
        formData.append("authorizerAuthentication", authorizerAuthentication);
    
        const response = await appService.approveEnclave(baseURL, realm, formData, token);
        if (response.ok){
          // TideCloak keeps approved change requests so fetch new one and replace
          const updatedChangeReqs = await appService.getUserRequests(baseURL, realm, token);
          
          const updatedChangeReq = updatedChangeReqs.find(req => req.draftRecordId === draftId);
          requests[activeRequestIndex] = updatedChangeReq; 
        

          setApprovals([true, false, false, false, false]);
          setPending(true);
          setHasUserApproved(true);
        }
        
        };

        
  
      const handleUserApprove = async (changeRequest) => {
        const token = await IAMService.getToken();
        // Get popup data for the change request to know that it requires the enclave and pass data to the popup
        const response = await appService.reviewChangeRequest(baseURL, realm, changeRequest, token);
        const popupData = await response.json();
    
        if (popupData.requiresApprovalPopup === "true") {
          const vuid = await IAMService.getValueFromToken("vuid");
          const heimdall = new Heimdall(popupData.customDomainUri, [vuid]);
          await heimdall.openEnclave();
        
          // Waiting user response for auth approval
          const authorizerApproval = await heimdall.getAuthorizerApproval(popupData.changeSetRequests, "UserContext:1", popupData.expiry, "base64url");
          
          // If Deny is clicked
          if (authorizerApproval.accepted === false) {
            addRejection(changeRequest.actionType, changeRequest.draftRecordId, changeRequest.changeSetType);
            heimdall.closeEnclave(); 
           
          } else if (authorizerApproval.accepted === true) { // If Approve is clicked
            const authorizerAuthentication = await heimdall.getAuthorizerAuthentication();
            addApproval(changeRequest.actionType, changeRequest.draftRecordId, changeRequest.changeSetType, authorizerApproval.data, authorizerAuthentication);
            heimdall.closeEnclave();
           
          }
        };
      };

      
    
      return (
        <div className="bg-white border rounded-lg p-6 shadow space-y-4 mt-8">


        <pre className="bg-gray-50 border text-sm rounded p-4 overflow-auto">
          {JSON.stringify(request.value, null, 2)}
        </pre>

        <div className="flex justify-between items-center mt-6">
          {ADMIN_NAMES.map((name, idx) => (
            <div key={idx} className="relative flex flex-col items-center">
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-full border-4 transition-all duration-700 ease-in-out 
          ${approvals[idx] ? "border-green-500 shadow-md shadow-green-200" : "border-gray-300"}
        `}
              >
                <span className="font-semibold text-lg text-gray-700">{name[0]}</span>
              </div>
              <span className="text-xs mt-2 text-gray-600">{name}</span>

              {/* Tick overlay – doesn't shift layout */}
              {approvals[idx] && (
                <FaCheckCircle className="absolute top-0 right-0 text-green-500 w-4 h-4 transition-opacity duration-500 translate-x-2 -translate-y-2" />
              )}
            </div>
          ))}

        </div>

        <div className="pt-4">
          { request.deleteStatus !== "APPROVED" && request.status !== "APPROVED"? (
            <Button onClick={() => {handleUserApprove(request)}} disabled={pending}>
              Review
            </Button>

          ) : request.deleteStatus === "COMMITTED" || request.status === "COMMITTED"? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push("/user");
              }}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View on User Page →
            </a>

          ) : !pending && (request.deleteStatus === "APPROVED" || request.status === "APPROVED") ? (
            <Button className="bg-green-600 hover:bg-green-700" onClick={onCommit}>
              Commit
            </Button>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Awaiting quorum: <strong>{totalApproved} / 3</strong> approved
            </p>
          )}
        </div>

      </div >
    );
  }

    const addCommit = async (request) => {
        const token = await IAMService.getToken();

        const body = JSON.stringify({
          "actionType": request.actionType,
          "changeSetId": request.draftRecordId,
          "changeSetType": request.changeSetType
        });
        
        const response = await appService.commitChange(baseURL, realm, body, token);
        
        if (response.ok){
          // Hard code the change, because keycloak removes committed change requests
          if (requests[activeRequestIndex].deleteStatus){
            requests[activeRequestIndex].deleteStatus = "COMMITTED";
          }
          else {
            requests[activeRequestIndex].status = "COMMITTED";
          }
          
          // Reset states for next change request
          setApprovals([false, false, false, false, false]);
          setActiveRequestIndex(prev => prev + 1);
          setExpandedIndex(prev => prev + 1);

          // Clear the locally stored approved users array
          localStorage.removeItem("approvals");

          // Get a new token to have check the currently assigned roles to the logged in user
          await IAMService.updateToken(-1); //-1 to update it immediately
        }
    };

    // If submit button is pressed again, cancel all the change requests
    const cancelRequests = async (requests) => {
      const token = await IAMService.getToken();
      
        requests.map(async (request) => {
          const body = JSON.stringify({
            "actionType": request.actionType,
            "changeSetId": request.draftRecordId,
            "changeSetType": request.changeSetType
          });

          const response = await appService.cancelChange(baseURL, realm, body, token);
        })
      
    };

    return (
      !loading && IAMService.isLoggedIn()
      ?
      <main className="flex-grow w-full pt-6">
      <div className="w-full px-8 max-w-screen-md mx-auto flex flex-col items-start gap-8">
      <div className="w-full max-w-3xl">
        {pathname === "/admin" && (
            <div key="admin" className="space-y-6 relative">

              {/* Accordion Icon */}
              <button
                onClick={() => setShowAdminAccordion(prev => !prev)}
                className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                aria-label="Toggle explanation"
              >
                {showAdminAccordion ? "🤯" : "🤔"}
              </button>

              {/* Accordion Content */}
              <AccordionBox title="What makes TideCloak special?" isOpen={showAdminAccordion}>
                <ul className="list-disc list-inside">
                  <li><strong>Decentralized quorum-based approval</strong></li>
                  <li>Immutable audit logs</li>
                  <li>Granular control over sensitive fields</li>
                </ul>
                <p>
                  So you don’t worry about{" "}
                  <a href="#" className="text-blue-600 underline">permission sprawl</a>,{" "}
                  <a href="#" className="text-blue-600 underline">forgotten admin accounts</a>, or{" "}
                  <a href="#" className="text-blue-600 underline">over-permissioned users</a>.
                </p>
              </AccordionBox>



              {!isTideAdmin && (
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold mb-4">Administration</h2>
                  <p className="text-sm text-gray-600 mb-6">This page demonstrates how user privileges can be managed in App, and how the app is uniquely protected against a compromised admin.</p>
                  {!showExplainer ? (
                    <Button onClick={handleElevateClick}>Elevate to Admin Role</Button>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded space-y-3">
                      <p className="font-semibold text-yellow-800">“Yeah, but doesn't the fact you can do this undermine the whole 'quorum-enforced' thing?”</p>
                      <p className="text-sm text-yellow-900">
                        Can’t get anything past you! This ability highlights the usual flaw in IAM systems — that the system itself can assign powers at will.
                        With TideCloak, once hardened with a quorum, even the system can't unilaterally grant admin rights.
                        <br /><br /><strong>For this demo, you're a quorum of one.</strong>
                      </p>
                      <Button onClick={confirmAdmin}>Continue as Admin</Button>
                    </div>
                  )}
                </div>
              )}

              {isTideAdmin && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold mb-4">Administration</h2>
                  <p className="text-sm text-gray-700">
                    Change your permissions to demo the quorum-enforced workflow for change requests, then check out how the permission changes affect the User experience on the User page.
                  </p>
                  <form
                    onSubmit={handleAdminPermissionSubmit}
                    onChange={() => setHasChanges(true)}
                    className="space-y-6"
                  >
                    <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6">
                      <h4 className="text-xl font-bold text-gray-800">User Permissions</h4>

                      {/* Date of Birth */}
                      <div>
                        <label className="block font-semibold text-sm mb-1">Date of Birth</label>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" name="dob.read" checked={hasDobReadPerm} onChange={e => setHasDobReadPerm(e.target.checked)}/>
                            <span>Read</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" name="dob.write" checked={hasDobWritePerm} onChange={e => setHasDobWritePerm(e.target.checked)}/>
                            <span>Write</span>
                          </label>
                        </div>
                      </div>

                      {/* Credit Card Number */}
                      <div>
                        <label className="block font-semibold text-sm mb-1">Credit Card Number</label>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" name="cc.read" checked={hasCcReadPerm} onChange={e => setHasCcReadPerm(e.target.checked)}/>
                            <span>Read</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" name="cc.write" checked={hasCcWritePerm} onChange={e => setHasCcWritePerm(e.target.checked)}/>
                            <span>Write</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={!hasChanges}>Submit Changes</Button>
                  </form>



                  {requests[0] && (
                    <>
                      {/* Sub-heading + info toggle */}
                      <div className="relative mb-2">
                        <h3 className="text-xl font-semibold">Change Requests</h3>
                        <button
                          onClick={() => setShowChangeInfo(prev => !prev)}
                          className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                          aria-label="Toggle change-request info"
                        >
                          {showChangeInfo ? "🤯" : "🤔"}
                        </button>
                      </div>

                      {showChangeInfo && (
                        <AccordionBox title="Quorum-enforced permission changes" isOpen>
                          <p className="text-sm text-gray-600">
                            Each individual permission change must be reviewed and committed in turn. Click “Review” to open the full approval workflow.
                          </p>
                        </AccordionBox>
                      )}
                      <div className="space-y-4">

                        {/* each draft as row */}
                        {requests.map((req, idx, i) => {
                          const isActive = idx === activeRequestIndex;
                          const isExpanded = idx === expandedIndex;

                          return (
                            <div
                              key={idx}
                              onClick={() => setExpandedIndex(idx)}
                              className={`
      cursor-pointer border rounded p-3
      ${isActive ? "border-l-4 border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}
      transition-colors
    `}
                            >
                              {/* ─── Header Row ───────────────────────────────────────── */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {isActive && <FaChevronRight className="text-blue-500" />}
                                  <span className="font-medium">
                                    Change: {req.role} permission
                                  </span>
                                </div>
                                {
                                  pending && activeRequestIndex === idx
                                  ?
                                  <span className={`
                                    px-2 py-1 rounded-full text-xs
                                    ${
                                      "bg-yellow-100 text-yellow-800" 
                                      }
                                  `}>
                                    {"PENDING"}
                                  </span> 
                                  :
                                  req.deleteStatus
                                  ?
                                  <span className={`
                                    px-2 py-1 rounded-full text-xs
                                    ${req.deleteStatus === "DRAFT" ? "bg-gray-200 text-gray-800" :
                                        req.deleteStatus === "APPROVED" ? "bg-green-100 text-green-800" :
                                          "bg-blue-100 text-blue-800"}
                                  `}>
                                    {req.deleteStatus}
                                  </span>
                                  :
                                  <span className={`
                                    px-2 py-1 rounded-full text-xs
                                    ${req.status === "DRAFT" ? "bg-gray-200 text-gray-800" :
                                        req.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                          "bg-blue-100 text-blue-800"}
                                  `}>
                                    {req.status}
                                  </span>
                                }
                              </div>

                              {/* ─── Expanded Content ─────────────────────────────────── */}
                              {isExpanded && (
                                isActive
                                  ? <div className="mt-2">
                                    <QuorumDashboard
                                      request={req}
                                      onCommit={async () => await addCommit(req)}
                                    />
                                  </div>
                                  : <pre className="mt-2 bg-gray-50 border text-sm rounded p-4 overflow-auto">
                                    {req.userRecord[0].accessDraft}
                                  </pre>
                              )}
                            </div>
                          );
                        })}


                      </div>
                    </>
                  )}

                  

                </div>
              )}
            </div>
          )}
        </div>
        </div>
        </main>
        : null
    )
}