import React, { useState } from "react";
import {
  FaDiscord,
  FaLinkedin,
  FaGithub,
  FaRegSmile
} from "react-icons/fa";
import { SiX } from "react-icons/si"; // Modern X (formerly Twitter) icon
import { FaSearch } from "react-icons/fa";


function Button({ children, onClick, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function App() {
  const [jwt, setJwt] = useState(null);
  const [page, setPage] = useState("Landing");
  const [showExplainer, setShowExplainer] = useState(false);
  const [requests, setRequests] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [activeRequest, setActiveRequest] = useState(null);
  const [expandedBlobs, setExpandedBlobs] = useState({});
  const [userFeedback, setUserFeedback] = useState("");



  const [formData, setFormData] = useState({
    dob: "",
    cc: ""
  });

  const [savedData, setSavedData] = useState({ dob: "", cc: "" });


  const handleUserFieldChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };


  const handleLogin = () => {
    setJwt({
      user: "you",
      role: "Standard",
      permissions: {
        dob: { read: true, write: true },
        cc: { read: false, write: true },
      },
    });
    setFormData({ dob: "1990-05-21", cc: "" });
    setSavedData({ dob: "1990-05-21", cc: "" });
    setPage("User");
  };


  const handleLogout = () => {
    setJwt(null);
    setPage("Landing");
    setRequests([]);
  };

  const handleElevateClick = () => setShowExplainer(true);

  const confirmAdmin = () => {
    setJwt(prev => ({
      ...prev,
      role: "Administrator",
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSavedData({ ...formData });
    setUserFeedback("Changes saved!");
    setTimeout(() => setUserFeedback(""), 3000); // clear after 3 seconds
  };
  

  const handleAdminPermissionSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const updated = {
      dob: { read: false, write: false },
      cc: { read: false, write: false }
    };

    for (let [key] of formData.entries()) {
      const [field, permission] = key.split(".");
      updated[field][permission] = true;
    }

    const current = jwt.permissions;
    const isDifferent = Object.keys(updated).some(field => {
      return (
        updated[field].read !== current[field].read ||
        updated[field].write !== current[field].write
      );
    });

    if (isDifferent) {
      const bundledRequest = {
        id: Date.now() + Math.random(),
        date: new Date().toLocaleDateString(),
        type: `Permission Bundle`,
        value: updated,
        status: "Draft",
        json: JSON.stringify(updated, null, 2),
        field: null // no individual field
      };

      setRequests(prev => [bundledRequest, ...prev]);
      setHasChanges(false);
    }

  };


  const handleReview = (id) => {
    setRequests(prev => {
      const updated = prev.map(req => {
        if (req.id !== id) return req;
        let nextStatus = req.status === "Draft" ? "Pending" :
          req.status === "Pending" ? "Approved" : req.status;
        return { ...req, status: nextStatus };
      });

      const approvedRequest = updated.find(r => r.id === id && r.status === "Approved");

      if (approvedRequest) {
        const merged = { ...jwt.permissions };

        if (approvedRequest.field) {
          merged[approvedRequest.field] = approvedRequest.value;
        } else {
          // Bundled request — merge all fields
          Object.entries(approvedRequest.value).forEach(([field, perms]) => {
            merged[field] = perms;
          });
        }

        setJwt(prev => ({
          ...prev,
          permissions: merged
        }));

        setTimeout(() => setPage("User"), 600);
      }

      return updated;
    });
  };


  const loggedIn = !!jwt;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {loggedIn && (
        <nav className="flex justify-start gap-4 px-8 py-4 border-b border-gray-200">
          <button
            onClick={() => setPage("User")}
            className={`px-4 py-2 rounded transition ${page === "User" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
          >
            User
          </button>
          <button
            onClick={() => setPage("Admin")}
            className={`px-4 py-2 rounded transition ${page === "Admin" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
          >
            Administration
          </button>
          <Button onClick={handleLogout}>Logout</Button>
        </nav>
      )}

      <main className="flex-grow w-full pt-6">
        <div className="w-full px-8 max-w-screen-2xl flex flex-col lg:flex-row items-start gap-8">
          <div className="w-full max-w-3xl">
            {page === "Landing" && (
              <div className="space-y-10">
                <div className="bg-blue-50 rounded shadow p-6 space-y-4">
                  <h2 className="text-3xl font-bold">Welcome to your demo app</h2>
                  <h3 className="text-xl font-semibold">BYOiD</h3>
                  <p className="text-base">Login or create an account to see the user experience demo.</p>
                  <Button onClick={handleLogin}>Login</Button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold mb-2">TideCloak Administration</h3>
                  <p className="mb-4">Check out the backend of TideCloak, your fully fledged IAM system.</p>
                  <div className="border border-dashed border-gray-500 p-4">
                    <ul className="list-disc list-inside">
                      <li>
                        Visit: <a href="http://xxxxxxxxxxxxxxxxxxxxx" className="text-blue-600">http://xxxxxxxxxxxxxxxxxxxxx</a>
                      </li>
                      <li>Use Credentials: admin / password</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {page === "User" && (
              <div className="space-y-4">
                <h2 className="text-3xl font-bold mb-4">User Information</h2>

                <form className="space-y-6" onSubmit={handleFormSubmit}>

                  {["dob", "cc"].map((field) => {
                    const perms = jwt.permissions[field];
                    const canRead = perms?.read;
                    const canWrite = perms?.write;
                    const label = field === "dob" ? "Date of Birth" : "Credit Card Number";
                    const encrypted = "0101ff7a9e3b1d...d5fbeea829c4"; // Simulated hash

                    if (!canRead && !canWrite) return null; // hide if no access

                    return (
                      <div key={field}>
                        <label className="block font-medium text-sm mb-1">{label}</label>

                        {canRead && canWrite && (
                          <input
                            type={field === "dob" ? "date" : "text"}
                            value={formData[field]}
                            onChange={handleUserFieldChange(field)}
                            className="border rounded px-3 py-2 w-full max-w-md"
                          />
                        )}

                        {canRead && !canWrite && (
                          <input
                            type="text"
                            value={savedData[field] || ""}
                            readOnly
                            className="border rounded px-3 py-2 w-full bg-gray-100 text-gray-700 max-w-md"
                          />
                        )}


                        {!canRead && canWrite && (
                          <input
                            type={field === "dob" ? "date" : "text"}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            value={formData[field]}
                            onChange={handleUserFieldChange(field)}
                            className="border rounded px-3 py-2 w-full max-w-md"
                          />
                        )}

                        <div className="flex gap-2 mt-2">
                          <td className="p-2 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canRead ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                            >
                              {canRead ? "✓" : "✕"} Read
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canWrite ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                            >
                              {canWrite ? "✓" : "✕"} Write
                            </span>
                          </td>

                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Value in Database:</span>{" "}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBlobs((prev) => ({ ...prev, [field]: !prev[field] }))
                            }
                            className="text-blue-600 underline"
                          >
                            {expandedBlobs[field]
                              ? "0101ff7a9e3b1d9adbeef8c3471a2c7e38cb43fcd74fdcadbea88d5fbeea829c4"
                              : "0101ff7a9e...829c4"}
                          </button>
                        </p>



                      </div>
                    );
                  })}

                  {(jwt.permissions.dob.write || jwt.permissions.cc.write) && (
                    <div className="flex items-center gap-3">
                    <Button type="submit">Save Changes</Button>
                    {userFeedback && (
                      <span className="text-sm text-green-600 font-medium">{userFeedback}</span>
                    )}
                  </div>
                  
                  )}
                </form>


              </div>

            )}

            {page === "Admin" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">User Admin Governance</h2>

                {jwt?.role === "Standard" && (
                  <div className="space-y-4">
                    <p>This page demonstrates how user privileges can be managed in App, and how the app is uniquely protected against a compromised admin.</p>
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

                {jwt?.role === "Administrator" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-700">
                      Change your permissions to demo the quorum-enforced workflow for change requests, then check out how the permission changes affect the User experience on the User page.
                    </p>
                    <form
                      onSubmit={handleAdminPermissionSubmit}
                      onChange={() => setHasChanges(true)}
                      className="space-y-6"
                    >
                      <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6">
                        <h4 className="text-lg font-semibold text-gray-800">User Permissions</h4>

                        {/* Date of Birth */}
                        <div>
                          <label className="block font-semibold text-sm mb-1">Date of Birth</label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" name="dob.read" defaultChecked={jwt.permissions.dob.read} />
                              <span>Read</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" name="dob.write" defaultChecked={jwt.permissions.dob.write} />
                              <span>Write</span>
                            </label>
                          </div>
                        </div>

                        {/* Credit Card Number */}
                        <div>
                          <label className="block font-semibold text-sm mb-1">Credit Card Number</label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" name="cc.read" defaultChecked={jwt.permissions.cc.read} />
                              <span>Read</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" name="cc.write" defaultChecked={jwt.permissions.cc.write} />
                              <span>Write</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={!hasChanges}>Submit Changes</Button>
                    </form>



                    {requests.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mt-6 mb-2">Change Requests</h3>
                        <table className="text-left border border-gray-200 rounded overflow-hidden text-sm w-full">

                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 w-1/4">Date</th>
                              <th className="p-2 w-full">Change Type</th>
                              <th className="p-2 text-right whitespace-nowrap w-32">Status</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y">
                            {requests.map((req) => (
                              <tr
                                key={req.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => setActiveRequest(req)}
                              >
                                <td className="p-2">{req.date}</td>
                                <td className="p-2">{req.type}</td>
                                <td className="p-2 text-right">
                                  <span
                                    className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-semibold ${req.status === "Draft"
                                      ? "bg-gray-200 text-gray-800"
                                      : req.status === "Pending"
                                        ? "bg-yellow-200 text-yellow-800"
                                        : req.status === "Approved"
                                          ? "bg-green-200 text-green-800"
                                          : "bg-red-200 text-red-800"
                                      }`}
                                  >
                                    {req.status}
                                    {req.status === "Approved" ? (
                                      <span className="text-sm">✓</span>
                                    ) : req.status === "Rejected" ? (
                                      <span className="text-sm">✕</span>
                                    ) : (
                                      <FaSearch className="text-sm" />
                                    )}
                                  </span>
                                </td>

                              </tr>
                            ))}
                          </tbody>

                        </table>

                        {activeRequest && (
                          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                            <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
                              <h3 className="text-lg font-semibold mb-2">Review Request</h3>
                              <div className="bg-gray-100 p-3 rounded text-xs mb-4">
                                <h4 className="font-semibold mb-2">Proposed Permissions:</h4>
                                <ul className="space-y-1">
                                  {Object.entries(activeRequest.value).map(([field, perms]) => (
                                    <li key={field}>
                                      <strong className="capitalize">{field}</strong>:
                                      Read = {perms.read ? "✓" : "✕"},
                                      Write = {perms.write ? "✓" : "✕"}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  className="bg-gray-300 text-gray-800 hover:bg-gray-400"
                                  onClick={() => setActiveRequest(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    handleReview(activeRequest.id);
                                    setActiveRequest(null);
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    setRequests(prev =>
                                      prev.map(req =>
                                        req.id === activeRequest.id ? { ...req, status: "Rejected" } : req
                                      )
                                    );
                                    setActiveRequest(null);
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    )}


                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="w-full lg:w-96 shrink-0 mt-4 lg:mt-0">
            <div className="p-6 bg-gray-100 rounded shadow-lg">
              <h3 className="text-xl font-semibold mb-2">What makes TideCloak special?</h3>
              <ul className="list-disc list-inside mb-4">
                <li>Decentralized quorum-based approval</li>
                <li>Immutable audit logs</li>
                <li>Granular control over sensitive fields</li>
              </ul>
              <div className="bg-white p-4 border rounded flex gap-3 items-start">
                <FaRegSmile className="text-blue-400 text-3xl mt-1" />
                <p className="text-sm">
                  So you don’t worry about
                  <a href="#" className="text-blue-600 ml-1">permission sprawl</a>,
                  <a href="#" className="text-blue-600 ml-1">forgotten admin accounts</a>, or
                  <a href="#" className="text-blue-600 ml-1">over-permissioned users</a>.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="p-4 bg-gray-100 flex flex-col md:flex-row justify-between items-center text-sm gap-2 md:gap-0">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
          <p>
            Secured by{" "}
            <a href="https://tide.org/tidecloak_product" className="text-blue-600 underline" target="_blank">TideCloak</a>
          </p>
          <a
            href="https://tide.org/beta"
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-blue-500 transition"
            target="_blank"
          >
            Join the Beta program
          </a>
        </div>
        <div className="flex gap-4 text-xl">
          <a
            href="https://discord.gg/XBMd9ny2q5"
            aria-label="Discord"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaDiscord />
          </a>
          <a
            href="https://twitter.com/tidefoundation"
            aria-label="X (formerly Twitter)"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <SiX />
          </a>
          <a
            href="https://www.linkedin.com/company/tide-foundation/"
            aria-label="LinkedIn"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://github.com/tide-foundation/tidecloakspaces"
            aria-label="GitHub"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaGithub />
          </a>
        </div>
      </footer>

    </div>
  );
}

export default App;
