"use client"
import { useState, useEffect, useRef } from "react";
import IAMService from "../../lib/IAMService";
import appService from "../../lib/appService";
import { useAppContext } from "../context/context";
import { Heimdall } from "../../tide-modules/heimdall";
import AccordionBox from "../components/accordionBox";
import Button from "../components/button";
import { FaCheckCircle, FaChevronRight } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSquareFullPage } from "../components/loadingSquare";
import "../styles/spinKit.css";
import "../styles/spinner.css";

/**
 * Admin page for elavating the demo user to a Tide admin and managing their read and write permissions for Date of Birth and Credit Card
 * @returns {JSX.Element} - HTML for the /admin path containing the permissions management via change requests
 */
export default function Admin() { 
  // Current path
  const pathname = usePathname();
  // Navigator
  const router = useRouter();
  // Shared context data
  const { baseURL, realm, authenticated, contextLoading } = useAppContext();
  // Admin state of the logged in demo user
  const [isTideAdmin, setIsTideAdmin] = useState(false);
  // Object representation of the logged in user
  const [loggedUser, setLoggedUser] = useState(null);

  // Extra information
  const [showAdminAccordion, setShowAdminAccordion] = useState(false);
  const [showChangeInfo, setShowChangeInfo] = useState(false);
  
  // Current change request being managed
  const [activeRequestIndex, setActiveRequestIndex] = useState(0);
  // Current change request being opened
  const [expandedIndex, setExpandedIndex] = useState(0);

  // Show page only if loaded
  const [loading, setLoading] = useState(true);
  // Loading overlay for the context
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  // Spinning loader and button manager
  const [loadingButton, setLoadingButton] = useState(false);

  // True when boxes don't match the token's roles
  const [hasChanges, setHasChanges] = useState(false);
  // All user change requests
  const [requests, setRequests] = useState([]);
  
  // Extra information on what elevating a user to Tide Admin does
  const [showExplainer, setShowExplainer] = useState(false);
  
  // This button only appears when logged in demo user doesn't have the  Tide Admin role yet
  const handleElevateClick = () => setShowExplainer(true);

  // Check Boxes
  const [hasDobReadPerm, setHasDobReadPerm] = useState(false);
  const [hasDobWritePerm, setHasDobWritePerm] = useState(false);
  const [hasCcReadPerm, setHasCcReadPerm] = useState(false);
  const [hasCcWritePerm, setHasCcWritePerm] = useState(false);

  // User's input state to the change request
  const [hasUserApproved, setHasUserApproved] = useState(false);
  // State of active change request based on quorum
  const [isApproved, setIsApproved] = useState(false);
  // How many admins approved
  const [totalApproved, setTotalApproved] = useState(1);
  // Demo data to simulate admins approving the active change request
  const ADMIN_NAMES = ["You", "Alice", "Ben", "Carlos", "Dana"];
  // Current hasUserApproved state for each admin    
  const [approvals, setApprovals] = useState([false, false, false, false, false]);
  // Once approved, change requests becomes pending as it waits for other admins to approve to a total threshold (3 for this demo)
  const [pending, setPending] = useState(false);

  // State of whether the first QuorumDashBoard (card) has ran. Used to prevent too many animations, only 3 is needed.
  const quorumDashRef  = useRef(false);

  const [dobWriteRole, setDobWriteRole] = useState();
  const [dobReadRole, setDobReadRole] = useState();
  const [ccWriteRole, setCcWriteRole] = useState();
  const [ccReadRole, setCcReadRole] = useState();

  // Wait for context to load first when refreshing browser or similar destruction of context
  useEffect(() => {
    if (!contextLoading){
      getRealmRoles();
    }
  }, [contextLoading])

  // For demo purposes, fetched stored or store data of admins who have approved locally
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

  // Run first
  useEffect(() => {
    if (authenticated){
      getLoggedUser();
    }
  }, [authenticated])

  // Then get the currently assigned realm roles of the logged in user after they've been identified 
  useEffect(() => {
    if (loggedUser){ 
      checkAdminRole();  
    }
  }, [loggedUser])

  // Then check if they're a Tide Admin to decide which components to render 
  useEffect(() => {
      // Shouldn't need to get permissions if logged in user isn't an Admin; will need to elevate instead
      if (isTideAdmin){
        setUserPermissions();
        if (isTideAdmin){
          getChangeRequests(); // Get existing requests to cancel them
        }
      }
  }, [isTideAdmin])

  // Get current logged in user
  const getLoggedUser = async () => { 
    const token = await IAMService.getToken();
    const loggedUserId =  IAMService.getValueFromToken("sub");
    const loggedInUser = await appService.getUser(baseURL, realm, token, loggedUserId);
    setLoggedUser(loggedInUser);
  };
  
  // Get the current user realm roles to prefill the boxes and for updating the permissions
  const setUserPermissions = async () => { 
    if (loggedUser){
      setHasDobReadPerm(IAMService.hasOneRole("_tide_dob.selfdecrypt"));
      setHasDobWritePerm(IAMService.hasOneRole("_tide_dob.selfencrypt"));

      setHasCcReadPerm(IAMService.hasOneRole("_tide_cc.selfdecrypt"));
      setHasCcWritePerm(IAMService.hasOneRole("_tide_cc.selfencrypt"));
    }
  };

  // On initial render check if logged user is admin to decide which components to show
  const checkAdminRole = async () => {
      const token = await IAMService.getToken();
      // Get Realm Management default client's ID
      const clientID = await appService.getRealmManagementId(baseURL, realm, token);
      // Check if user already has the role
      setIsTideAdmin(await appService.checkUserAdminRole(baseURL, realm, loggedUser.id, clientID, token));
      setLoading(false);
  }

  // Assign this initial user the tide-realm-admin client role managed by the default client Realm Management
  const confirmAdmin = async () => {
    setLoadingButton(true);
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
           
            await IAMService.updateToken();
            setIsTideAdmin(true); 
           
            console.log("Admin Role Assigned");
        }
    }
    else {
        setIsTideAdmin(true);
    }
    setLoadingButton(false);
  };

  // Get latest change requests to display and update when pressing commit
  const getChangeRequests = async () => {
    
    const token = await IAMService.getToken();
    const changeRequests = await appService.getUserRequests(baseURL, realm, token);
    // Remove Denied Requests
    const withoutDeniedReqs = changeRequests.filter((request) => 
      (request.deleteStatus !== "DENIED" && request.status !== "DENIED")
    )
    setRequests(withoutDeniedReqs);
  }

  // Fetch all realm role objects to assign to user based on check box states
  const getRealmRoles = async () => {
    const token = await IAMService.getToken();
    setDobWriteRole(await appService.getRealmRole(baseURL, realm, "_tide_dob.selfencrypt", token));
    setDobReadRole(await appService.getRealmRole(baseURL, realm, "_tide_dob.selfdecrypt", token));
    setCcReadRole(await appService.getRealmRole(baseURL, realm, "_tide_cc.selfdecrypt", token));
    setCcWriteRole(await appService.getRealmRole(baseURL, realm, "_tide_cc.selfencrypt", token));
  }

  /**
   * Assign or unassign the logged in user realm roles (pemissions)
   * @param {*} e - the form's event, when Submit Changes button is clicked
   */
  const handleAdminPermissionSubmit = async (e) => {
    e.preventDefault();

    const token = await IAMService.getToken();

    // Clear cached data of the demo admins who have approved for a reset
    localStorage.removeItem("approvals");

    // Get all then cancel all requests before assigning new ones
    const allRequests = await appService.getUserRequests(baseURL, realm, token); // Including the denied requests
    await cancelRequests(allRequests);
  
    // Compare the current checkbox state with the current permissions. Note: token roles only update when a role change request commits.
    // If the states don't match, a change request is required and made.
    const checkBoxPerms = [hasDobReadPerm, hasDobWritePerm, hasCcReadPerm, hasCcWritePerm];
    const roles = ["_tide_dob.selfdecrypt", "_tide_dob.selfencrypt", "_tide_cc.selfdecrypt", "_tide_cc.selfencrypt"];
    const rolesInfo = [dobReadRole, dobWriteRole, ccReadRole, ccWriteRole];

    for (let i = 0; i < checkBoxPerms.length; i++){
      if (checkBoxPerms[i] && !IAMService.hasOneRole(roles[i])){      
        await appService.assignRealmRole(baseURL, realm, loggedUser.id, rolesInfo[i], token);
      }
      else if (!checkBoxPerms[i] && IAMService.hasOneRole(roles[i])){
        await appService.unassignRealmRole(baseURL, realm, loggedUser.id, rolesInfo[i], token);
      }
    }

    // Get the latest change requests
    const newRequests = await appService.getUserRequests(baseURL, realm, token);
    setRequests(newRequests);

    // Set first change request as the one currently opened
    setActiveRequestIndex(0);
    setExpandedIndex(0);
    // Reset form state
    setHasChanges(false);
    setLoadingOverlay(false);
  }

  /**
   * Each is a card the represents the change request, its status, action, admins approved and user's action button
   * @param {Object} request - representation of the change request
   * @param {Function} onCommit - when the commit button is clicked run addCommit() for that change request
   * @returns {JSX.Element} - HTML of the card representation 
   */
  function QuorumDashboard({ request, onCommit }) {
      // Current request's status to be displayed
      let requestStatus;

      // The status can be represented by either deleteStatus or status fields of the change request object
      if (request.deleteStatus){
        requestStatus = request.deleteStatus;
      }
      else { 
        requestStatus = request.status;
      }
    
      // When committed
      if (requestStatus === "COMMITTED" && requests.length === activeRequestIndex + 1 ) {
        return (
          <div className="bg-white border rounded-lg p-6 shadow space-y-4 mt-8">

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
  
      // POST /tideAdminResources/add-authorization
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

        
      // When user presses Review button to show the Tide Enclave popup
      const handleUserApprove = async (changeRequest) => {
        const token = await IAMService.getToken();
        // Get popup data for the change request to know that it requires the enclave and pass data to the popup
        const response = await appService.reviewChangeRequest(baseURL, realm, changeRequest, token);
        const popupData = await response.json();
    
        if (popupData.requiresApprovalPopup === "true") {
          const vuid = IAMService.getValueFromToken("vuid");
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
          { request.deleteStatus === "DRAFT" || request.status === "DRAFT"? (
            <Button onClick={() => {handleUserApprove(request)}} disabled={pending}>
              Review
            </Button>

          ) : !pending && (request.deleteStatus === "APPROVED" || request.status === "APPROVED") ? (
            <div className="flex items-center gap-x-2">
              <Button className="bg-green-600 hover:bg-green-700" onClick={onCommit} disabled={loadingButton}>
                Commit
              </Button>
              {
                loadingButton 
                ? <div className="spinner--left"/>
                : null
              }
            </div>
            
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
      setLoadingButton(true);
      
      try{

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

          // Clear the locally stored approved users array
          localStorage.removeItem("approvals");
          
          // Get a new token to have check the currently assigned roles to the logged in user
          await IAMService.updateToken();

          
          // Reset states for next change request
          setApprovals([false, false, false, false, false]);
          setTotalApproved(1);
          if (requests.length !== activeRequestIndex + 1 ){
            setActiveRequestIndex(prev => prev + 1);
            setExpandedIndex(prev => prev + 1);
          }
        }
        
        setLoadingButton(false);
      }catch(e){
    
        setLoadingButton(false);
        throw e;
      }
    };

    // If submit button is pressed again, cancel all the change requests
    const cancelRequests = async (requests) => {
      const token = await IAMService.getToken();
        
      for (let i = 0; i < requests.length; i++) {
          const request = requests[i];
          
          const body = JSON.stringify({
            actionType: request.actionType,
            changeSetId: request.draftRecordId,
            changeSetType: request.changeSetType
          });

        const response = await appService.cancelChange(baseURL, realm, body, token);
      }
    };

    return (
      !loading
      ?
      <main className="flex-grow w-full pt-6">
      {loadingOverlay && LoadingSquareFullPage()}
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
              <AccordionBox
  title="Why 'root' no longer exists"
  isOpen={showAdminAccordion}
>
  <ul className="list-disc pl-5 space-y-1">
    <li><strong>BYOiD for admins.</strong> Even super-users authenticate through the decentralized Fabric - no password file or IdP root to hijack.</li>
    <li><strong>Ownerless root certificate.</strong> The Fabric holds the signing key; nobody - vendors included - can impersonate or escalate.</li>
    <li><strong>Every change = JWT-signed.</strong> A role lives only if the root cert endorses it; unsigned tweaks are ignored by the app and APIs.</li>
    <li><strong>Quorum-enforced governance.</strong> Adding or widening roles needs multi-admin approval, baked into the same root cert.</li>
    <li><strong>API-friendly.</strong> All of this is exposed as endpoints you can hit from the app.</li>
  </ul>
</AccordionBox>




              {!isTideAdmin && (
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold mb-4">Administration</h2>
                  <p className="text-sm text-gray-600 mb-6">This page demonstrates how user privileges can be managed in App, and how the app is uniquely protected against a compromised admin.</p>
                  {!showExplainer ? (
                    <Button className="hover:bg-red-700" onClick={handleElevateClick}>Elevate to Admin Role</Button>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded space-y-3">
                      <p className="font-semibold text-yellow-800">“Yeah, but doesn't the fact you can do this undermine the whole 'quorum-enforced' thing?”</p>
                      <p className="text-sm text-yellow-900">
                        Can't get anything past you! This ability highlights the usual flaw in IAM systems - that the system itself can assign powers at will.
                        With TideCloak, once hardened with a quorum, even the system can't unilaterally grant admin rights.
                        <br /><br /><strong>For this demo, you're a quorum of one.</strong>
                      </p>
                      <div className="flex items-center gap-x-4">
                        <Button className="hover:bg-red-700" onClick={confirmAdmin} disabled={loadingButton}>Continue as Admin</Button>
                        {
                          loadingButton
                          ? <div className="spinner--left"/>
                          : null
                        }
                      </div>
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

                    <Button className="hover:bg-red-700" type="submit" disabled={!hasChanges}>Submit Changes</Button>
                  </form>

                  {requests[0] && (
                    <>
                      {/* Sub-heading + info toggle */}
                      <div className="relative mb-2">
                        <h3 className="text-xl font-semibold">Change Requests</h3>
                        <p className="text-sm text-gray-700">Play your role as an admin in the quorum, by reviewing the Change Request. We'll simulate the others before you can then commit the change.</p>
                        <button
                          onClick={() => setShowChangeInfo(prev => !prev)}
                          className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                          aria-label="Toggle change-request info"
                        >
                          {showChangeInfo ? "🤯" : "🤔"}
                        </button>
                      </div>

                      {showChangeInfo && (
                        <AccordionBox
  title="How a change request becomes law"
  isOpen
>
  <ul className="list-disc pl-5 space-y-1">
    <li><strong>Draft → Quorum.</strong> Submit a draft; the Fabric locks it until T-of-N admins sign.</li>
    <li><strong>Fabric signs or refuses.</strong> Only after quorum does the ownerless root key sign the updated JWT template.</li>
    <li><strong>No backdoor 'commit'.</strong> The API call you're about to hit can't bypass quorum - the Fabric will flat-out reject it.</li>
    <li><strong>Immutable audit trail.</strong> Every signature and commit is hashed and stored; tampering is mathematically evident.</li>
  </ul>
  <p className="text-sm text-gray-600 mt-2">
    Click <em>Review</em> to approve as “You,” then watch the other simulated admins light up
    before the <strong>Commit</strong> button appears.
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
      ${isActive ? "border-l-4 border-red-500 bg-blue-50" : "border-gray-200 bg-white"}
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
        <div className="h-10"></div>
        </main>
        : <LoadingSquareFullPage/>
    )
}