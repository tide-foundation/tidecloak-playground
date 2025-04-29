"use client"
import React, { useState, useEffect } from "react";
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
  const searchParams = useSearchParams();
  // Realm Management client ID to assign user the tide-realm-admin role if not yet assigned
  const RMClientID = searchParams.get("clientID");
  const {baseURL, realm } = useAppContext();

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
  const [currentPermissions, setCurrentPermissions] = useState([]);
  
  const [showExplainer, setShowExplainer] = useState(false);
  const handleElevateClick = () => setShowExplainer(true);

  // Check Boxes
  const [hasDobReadPerm, setHasDobReadPerm] = useState(false);
  const [hasDobWritePerm, setHasDobWritePerm] = useState(false);
  const [hasCcReadPerm, setHasCcReadPerm] = useState(false);
  const [hasCcWritePerm, setHasCcWritePerm] = useState(false);

  //const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    IAMService.initIAM(() => {
      if (IAMService.isLoggedIn()){
        getLoggedUser();
      }
      setLoading(false);
    });
  }, [])

  // Get the currently assigned realm roles of the logged in user after they've been identified 
  useEffect(() => {
    if (loggedUser){ 
      checkAdminRole();  
    }
  }, [loggedUser])


  useEffect(() => {
      // Shouldn't need to get permissions if logged in user isn't an Admin; will need to elevate instead
      if (isTideAdmin){
        getUserPermissions();
      }
    
  }, [isTideAdmin])

  useEffect(() => {
    setHasDobReadPerm(currentPermissions.some(perm => perm.name === "_tide_dob.read"));
    setHasDobWritePerm(currentPermissions.some(perm => perm.name === "_tide_dob.write"));

    setHasCcReadPerm(currentPermissions.some(perm => perm.name === "_tide_dob.cc"));
    setHasCcWritePerm(currentPermissions.some(perm => perm.name === "_tide_dob.write"));
  }, [currentPermissions])


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
        // Get the tide-realm-admin role to assign
        const tideAdminRole = await appService.getTideAdminRole(baseURL, realm, loggedUser.id, RMClientID, token);

        // Assign the tide-realm-admin role to the logged in user
        const assignResponse = await appService.assignClientRole(baseURL, realm, loggedUser.id, RMClientID, tideAdminRole, token);

        // Back end functionality required to approve and commit user with tide-realm-admin role using a master token
        const response = await fetch(`/api/commitAdminRole`);

        if (response.ok) {
            setIsTideAdmin(true); 
            console.log("Admin Role Assigned");
            // Force update of token without logging out? IAMService => tidecloak updateToken() maybe.
        }
    }
    else {
        setIsTideAdmin(true);
    }
  };

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
  const getUserPermissions = async () => { 
    if (loggedUser){
      const token = await IAMService.getToken();
      const permissions = await appService.getAssignedRealmRoles(baseURL, realm, loggedUser.id, token);
      setCurrentPermissions(permissions.realmMappings);
      console.log(permissions.realmMappings);
    }
    
  };

  function QuorumDashboard({ request, onCommit }) {
      // const [requestStatus, setRequestStatus] = useState(""); 
      
      let requestStatus;
      if (request.deleteStatus){
        requestStatus = request.deleteStatus;
      }
      else { 
        requestStatus = request.status
      }
    
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
    
      const ADMIN_NAMES = ["You", "Alice", "Ben", "Carlos", "Dana"];
      const isCommitted = requestStatus === "Committed";
      const isApproved = requestStatus === "Approved" || isCommitted;
      const [hasUserApproved, setHasUserApproved] = useState(isCommitted || isApproved);
    
      const [approvals, setApprovals] = useState([false, false, false, false, false]);
      const [canCommit, setCanCommit] = useState(false);
    
      useEffect(() => {
        const isCommitted = requestStatus === "Committed";
        const isApproved = requestStatus === "Approved";
    
        if (isCommitted) {
          setHasUserApproved(true);
          setApprovals([true, true, true, true, true]);
          setCanCommit(false);
          return;
        }
    
        if (isApproved) {
          setHasUserApproved(true);
          setApprovals([true, true, true, false, false]);
          setCanCommit(true);
          return;
        }
    
        // Reset for new request
        setHasUserApproved(false);
        setApprovals([false, false, false, false, false]);
        setCanCommit(false);
      }, [request?.id]);
    
    
      useEffect(() => {
        if (hasUserApproved) {
          const others = [1, 2, 3, 4];
          const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 2);
    
          shuffled.forEach((index, i) => {
            setTimeout(() => {
              setApprovals(prev => {
                const updated = [...prev];
                updated[index] = true;
                //setRequests(appService.getUserRequests(baseURL, realm, jwt));
                // // 🟢 Check if quorum is reached and status needs to be bumped
                // const totalApproved = updated.filter(Boolean).length;
                // if (totalApproved >= 3 && requestStatus === "Approved") {
                  
                //   setRequests(appService.getUserRequests(baseURL, realm, jwt));
                  
                // }
    
    
                return updated;
              });
            }, (i + 1) * 900);
          });
    
          setTimeout(() => {
            setCanCommit(true);
          }, 3.2 * 1000);
          //setRequests(appService.getUserRequests(baseURL, realm, jwt));
        }
      }, [hasUserApproved]);
    
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
          //appService.getUserRequests(baseURL, realm, token);
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
            //appService.getUserRequests(baseURL, realm, token);
            
        }
        
        };

        
  
      const handleUserApprove = async (changeRequest) => {
        console.log(changeRequest);
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
            setHasUserApproved(false);
          } else if (authorizerApproval.accepted === true) { // If Approve is clicked
            const authorizerAuthentication = await heimdall.getAuthorizerAuthentication();
            addApproval(changeRequest.actionType, changeRequest.draftRecordId, changeRequest.changeSetType, authorizerApproval.data, authorizerAuthentication);
            heimdall.closeEnclave();
            setHasUserApproved(true);

            //appService.getUserRequests(baseURL, realm, token);
            //requestStatus = "Pending";
          }
        };
  
        setApprovals(prev => {
          const updated = [...prev];
          updated[0] = true;
          return updated;
        });
    
        //setHasUserApproved(true);
    
        // Let parent know we're reviewing (mark as "Pending")
        if (requestStatus === "Draft") {
          requestStatus = "Pending"; // this is ok temporarily for local display
        }
      };

      
    
      return (
        <div className="bg-white border rounded-lg p-6 shadow space-y-4 mt-8">


        <pre className="bg-gray-50 border text-sm rounded p-4 overflow-auto">
          {JSON.stringify(request.value, null, 2)}
        </pre>

        <div className="flex justify-between items-center mt-6">
          {ADMIN_NAMES.map((name, idx, j) => (
            <div key={j} className="relative flex flex-col items-center">
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
          {!hasUserApproved && !isCommitted ? (
            <Button onClick={() => {handleUserApprove(request)}}>
              Review
            </Button>

          ) : request?.status === "Committed" ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage("User");
              }}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View on User Page →
            </a>

          ) : canCommit ? (
            <Button className="bg-green-600 hover:bg-green-700" onClick={onCommit}>
              Commit
            </Button>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Awaiting quorum: <strong>{approvals.filter(Boolean).length} / 3</strong> approved
            </p>
          )}
        </div>

      </div >
    );
  }


  

    const handleAdminPermissionSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
  
      // // build the “updated” object from the form
      // const updated = { dob: { read: false, write: false }, cc: { read: false, write: false } };
      // for (let key of form.keys()) {
      //   let [field, mode] = key.split('.');
      //   updated[field][mode] = true;
      // }

      // // find which modes actually changed vs. the current assigned permissions
      // const diffs = [];
      // for (let field of ['dob', 'cc']) {
      //   for (let mode of ['read', 'write']) {
      //     const newValue = updated[field][mode];
      //     const oldValue = currentPermissions.some(perm => perm.name === `_tide_${field}.${mode}`);
      //     if (newValue !== oldValue) {
      //       diffs.push({ field, mode, value: newValue });
      //     }
      //   }
      // }

      // if (diffs.length === 0) {
      //   // no actual changes—drop any existing draft/pending/approved,
      //   // keep only the ones already committed (or just clear all)
      //   setRequests(rs => rs.filter(r => r.status === 'Committed'));
      //   setHasChanges(false);
      //   return;
      // }

      // setRequests(() => {
      //   // build exactly one draft per actual diff
      //   const newDrafts = diffs.map(diff => ({
      //     id: Date.now() + Math.random(),
      //     date: new Date().toLocaleDateString(),
      //     type: 'Permission Change',
      //     value: { [diff.field]: { [diff.mode]: diff.value } },
      //     status: 'Draft',
      //     field: diff.field,
      //     mode: diff.mode
      //   }));
  
      //   // discard *everything* else and show only the new drafts
      //   return newDrafts;
      // });

      // setActiveRequestIndex(0);
      // setHasChanges(false);

      const updated = {
        dob: { read: false, write: false },
        cc: { read: false, write: false }
      };
  
      for (let [key] of formData.entries()) {
        const [field, permission] = key.split(".");
        updated[field][permission] = true;
      }
  
      const isDifferent = Object.keys(updated).some(field => {
        return (
          updated[field].read !== IAMService.hasOneRole("_tide_" + field + ".read") ||
          updated[field].write !== IAMService.hasOneRole("_tide_" + field + ".write")
        );
      });
  
      if (isDifferent) {
  
        const token = await IAMService.getToken();
        Object.keys(updated).forEach(async (field) => {
          // Read fields 
          const readRole = await appService.getRealmRole(baseURL, realm, "_tide_" + field + ".read", token);
          if (updated[field].read !== IAMService.hasOneRole("_tide_" + field + ".read") && updated[field].read === false){
            const response = await appService.unassignRealmRole(baseURL, realm, loggedUser.id, readRole, token);
          }
          else if (updated[field].read !== IAMService.hasOneRole("_tide_" + field + ".read") && updated[field].read === true){
            const response = await appService.assignRealmRole(baseURL, realm, loggedUser.id, readRole, token);
          }
  
          // Write fields
          const writeRole = await appService.getRealmRole(baseURL, realm, "_tide_" + field + ".write", token);
          if (updated[field].write !== IAMService.hasOneRole("_tide_" + field + ".write") && updated[field].write === false){
            const response = await appService.unassignRealmRole(baseURL, realm, loggedUser.id, writeRole, token);
          }
          else if (updated[field].write !== IAMService.hasOneRole("_tide_" + field + ".write") && updated[field].write === true){
            const response = await appService.assignRealmRole(baseURL, realm, loggedUser.id, writeRole, token);
          }
  
          const changeRequests = await appService.getUserRequests(baseURL, realm, token);
          setRequests(changeRequests); // overwrite previous request
          console.log(changeRequests);

          setActiveRequestIndex(0);
          setHasChanges(false);
        });
      }
    };

    const addCommit = async (request) => {
        const token = await IAMService.getToken();

        // Key value pairs
        const body = JSON.stringify({
            "actionType": request.actionType,
            "changeSetId": request.draftRecordId,
            "changeSetType": request.changeSetType
        });
        
        const response = await appService.commitChange(baseURL, realm, body, token);
        //setActiveRequestIndex(1);
        if (response.ok){
            console.log("COMMITED!");
        }
    };

    return (
      !loading && IAMService.isLoggedIn()
      ?
      <div className="min-h-screen flex flex-col bg-white">
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



                  {/* {requests.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowChangeRequestAccordion(prev => !prev)}
                        className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                        aria-label="Toggle change request explainer"
                      >
                        {showChangeRequestAccordion ? "🤯" : "🤔"}
                      </button>

                      <AccordionBox title="Change Request Review" isOpen={showChangeRequestAccordion}>
                        <p className="text-sm text-gray-600 mb-4">
                          Admin privileges alone aren't enough. Permission changes are staged for review and must reach quorum before they can be committed.
                        </p>
                      </AccordionBox>
                      {
                        requests.map((request, i) => (
                          <QuorumDashboard
                            key={i}
                            request={request}
                            setRequests={setRequests}
                            onCommit={async () => {
                                await addCommit(request);
                                await IAMService.getToken();
                                console.log(await IAMService.hasOneRole("_tide_cc.write"));
                                // Update the logged in user's details to be shared across the application
                                //logUser();
                                
                              //router.push("/user"); // ensures return to Admin after commit
                            }}
                          />
                        ))
                      }
                    </div>
                  )} */}
                  {requests.length > 0 && (
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
                              key={i}
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
                                  req.deleteStatus
                                  ?
                                  <span className={`
                                    px-2 py-1 rounded-full text-xs
                                    ${req.deleteStatus === "Draft" ? "bg-gray-200 text-gray-800" :
                                      req.deleteStatus === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                        req.deleteStatus === "Approved" ? "bg-green-100 text-green-800" :
                                          "bg-blue-100 text-blue-800"}
                                  `}>
                                    {req.deleteStatus}
                                  </span>
                                  :
                                  <span className={`
                                    px-2 py-1 rounded-full text-xs
                                    ${req.status === "Draft" ? "bg-gray-200 text-gray-800" :
                                      req.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                        req.status === "Approved" ? "bg-green-100 text-green-800" :
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
        </div>
        : null
    )
}
