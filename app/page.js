'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AccordionBox from './components/accordionBox';
import Button from './components/button';
import LoadingPage from './components/LoadingPage';
import EmailInvitation from './components/emailInvitation';
import { LoadingSquareFullPage } from './components/loadingSquare';
import {
  FaExclamationCircle,
  FaChevronDown,
  FaCheckCircle,
} from 'react-icons/fa';
import { useAppContext } from './context/context';
import IAMService from '../lib/IAMService';
import appService from '../lib/appService';

/**
 * Hook: load TideCloak config and track initialization state.
 *
 * - kcData === undefined → still fetching
 * - kcData === {}        → empty config → show initializer
 * - kcData is object    → valid config → proceed
 */
function useTideConfig(authenticated) {
  const [kcData, setKcData] = useState(undefined);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        const res = await fetch('/api/tidecloakConfig');
        const data = await res.json();
        if (cancelled) return;

        if (!data || Object.keys(data).length === 0) {
          // Empty config → trigger initializer
          setKcData({});
          setIsInitializing(true);
        } else {
          // Got real config
          setKcData(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[Login] Config load failed:', err);
          setKcData({});
          setIsInitializing(true);
        }
      }
    }

    fetchConfig();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  return { kcData, isInitializing, setKcData, setIsInitializing };
}

/**
 * Hook: demo invite/link flow.
 * - Detects ?linkedTide=true → shows success message
 * - Fetches /api/inviteUser to get invite URL or detect linked users
 */
function useTideLink(baseURL, setOverlayLoading) {
  const [isLinked, setIsLinked] = useState(true);
  const [inviteLink, setInviteLink] = useState('');
  const [showLinkedMsg, setShowLinkedMsg] = useState(false);

  const updateDomain = useCallback(async () => {
    const res = await fetch('/api/updateCustomDomainURL');
    if (!res.ok) throw new Error('Failed to update domain');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkLinkParams() {
      const params = new URLSearchParams(window.location.search);
      if (params.get('linkedTide') === 'true') {
        setShowLinkedMsg(true);
        try { await updateDomain(); } catch {}
        params.delete('linkedTide');
        const qs = params.toString();
        window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
      }
    }

    async function fetchInvite() {
      try {
        const res = await fetch('/api/inviteUser');
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.inviteURL) {
          setInviteLink(data.inviteURL);
          setIsLinked(false);
          setOverlayLoading(false);

        } else {
          setIsLinked(true);
          setOverlayLoading(false);
        }
      } catch (err) {
        if (!cancelled) console.error('[Login] Invite fetch failed:', err);
        setIsLinked(true);
      }
    }

    if (baseURL) {
      checkLinkParams();
      fetchInvite();
    }

    return () => {
      cancelled = true;
    };
  }, [baseURL, updateDomain]);

  return { isLinked, inviteLink, showLinkedMsg };
}

export default function Login() {

  const [overlayLoading, setOverlayLoading] = useState(true);

  // App context (overlayLoading and re-init are handled in LoadingPage)
  const { authenticated, baseURL, setIsInitialized} = useAppContext();

  // Config and initialization hook
  const { kcData, isInitializing, setKcData, setIsInitializing } = useTideConfig(authenticated);

  // Invite/link hook
  const { isLinked, inviteLink, showLinkedMsg } = useTideLink(baseURL, setOverlayLoading);

  // Local UI state
  const [showLoginAccordion, setShowLoginAccordion] = useState(false);
  const [showBackendDetails, setShowBackendDetails] = useState(false);
  const [showError, setShowError] = useState(false);
  const [portIsPublic, setPortIsPublic] = useState(null);


  const router = useRouter();
  const pathname = usePathname();

  // Redirect once we have real config and are authenticated
  useEffect(() => {
    if (kcData && Object.keys(kcData).length > 0 && authenticated) {
      router.push('/auth/redirect');
    }
  }, [kcData, authenticated, router]);

  // Token-expired banner and port check
  useEffect(() => {
    if (sessionStorage.getItem('tokenExpired')) {
      setShowError(true);
    }
    if (baseURL && kcData && Object.keys(kcData).length > 0) {
      (async () => {
        try {
          const url = `${baseURL}/realms/master/.well-known/openid-configuration`;
          const res = await appService.checkPort(url);
          setPortIsPublic(res.ok);
        } catch {
          setPortIsPublic(false);
        }
      })();
    }
  }, [baseURL, kcData]);

  // Login / link handler
  const handleLogin = async () => {
    sessionStorage.removeItem('tokenExpired');
    setPortIsPublic(true);
    try {
      const res = await fetch('/api/inviteUser');
      const data = await res.json();
      if (res.ok && data.inviteURL) {
        router.push(data.inviteURL);
      } else {
        IAMService.doLogin();
      }
    } catch (err) {
      console.error('[Login] handleLogin error:', err);
    }
  };

  // ── EARLY RETURNS ──

  // 1) Still fetching config
  if (kcData === undefined) {
    return <LoadingSquareFullPage />;
  }

  // 2) Config empty → show initializer (LoadingPage will call setIsInitialized)
  if (isInitializing) {
    return (
      <LoadingPage
        isInitializing={isInitializing}
        setIsInitializing={setIsInitializing}
        setKcData={setKcData}
        setIsInitialized={setIsInitialized}
        setOverlayLoading ={setOverlayLoading}
      />
    );
  }

  // 3) Demo user needs to link account
  if (!isLinked && !overlayLoading) {
    return <EmailInvitation inviteLink={inviteLink} />;
  }

  // 4) Context overlay still loading
  if (overlayLoading) {
    return <LoadingSquareFullPage />;
  }

  // ── MAIN LOGIN UI ──
  const adminAddress = kcData['auth-server-url'] || 'Need to setup backend first.';

  return (
    <main className="flex-grow w-full pt-6 pb-16">
      <div className="w-full px-8 max-w-screen-md mx-auto flex flex-col items-start gap-8">
        <div className="w-full max-w-3xl">
          {pathname === '/' && (
            <>
              {/* Explainer toggle */}
<div className="flex justify-end mb-2">
  <button
   onClick={() => setShowLoginAccordion(x => !x)}
   className="text-2xl hover:scale-110 transition-transform"
   aria-label="Toggle explainer"
  >
   {showLoginAccordion ? '🤯' : '🤔'}
  </button>
</div>

              <AccordionBox
  title="Why a breach no longer spirals into disaster"
  isOpen={showLoginAccordion}
>
  <p>
    TideCloak bakes <em>breach-assumed</em> security into your stack by locking
    data, identities, and access rights with keys no one will ever hold.
  </p>

  <ul className="list-disc pl-5 space-y-1 mt-2">
    <li>
      Digital authority becomes cryptographic keys - one per
      user, admin, or service.
    </li>
    <li>
      Ineffable Cryptography is used to operate those keys, forever in
      fragments across a decentralized Cybersecurity Fabric; peer-reviewed by
      RMIT University, Deakin, UoW, and others.
    </li>
    <li>
      No single fragment, user or server can authorize a login, decrypt data en mass, or change roles,
      so nothing useful is exposed even if a DB server, admin account, or vendor is
      breached.
    </li>
    <li>
      Users authenticate using a decentralized zero-knowledge mechanism known as PRISM. So, their secrets are never trusted to anyone, they cannot be impersonated, and no compromise of one user account will impact another.
    </li>
  </ul>

  <p className="mt-2">Same login flow, radically smaller blast radius.</p>
</AccordionBox>


              <div className="bg-blue-50 rounded shadow p-6 space-y-4">
                <img src="/playground-logo_nav.png" alt="Logo" className="h-10 w-auto" />
                <h2 className="text-3xl font-bold">
                  Welcome to the world of provable security
                </h2>
                <p>
                  <b>Picture this...</b> Your admin is <b>breached</b>. IAM vendor <b>compromised</b>. Cloud host <b>exposed</b>.<br/>
                  Yet, no data leaks, no identities stolen, no access abused. That's TideCloak.<br/>
                  Ship fast. Build trust. Sleep easy.
                </p>
                <hr className="my-6 border-t border-gray-200" />
                <h3 className="text-xl font-semibold">Secure “BYOiD” Login</h3>
                <p className="text-base">
                  Login like normal - But your password is never stored, shared, or exposed.
                </p>
                <Button onClick={handleLogin} className="hover:bg-red-700">
                  Login
                </Button>
                <p className="text-sm italic text-gray-600 mt-3">Identity for your eyes only.</p>

                {showError && (
                  <div className="mt-2 flex items-center text-red-600 text-sm">
                    <FaExclamationCircle className="mr-1" />
                    <span>Your session has expired. Please login again.</span>
                  </div>
                )}
                {portIsPublic === false && (
                  <div className="mt-2 flex items-center text-red-600 text-sm">
                    <FaExclamationCircle className="mr-1" />
                    <span>TideCloak port is private—make it public to connect.</span>
                  </div>
                )}
                {showLinkedMsg && (
                  <div className="mt-2 flex items-center text-green-600 text-sm">
                    <FaCheckCircle className="mr-1" />
                    <span>You’ve linked your Tide account! Please login.</span>
                  </div>
                )}
              </div>

              {/* Backend details */}
              <div className="pl-6 mt-2">
                <button
                  onClick={() => setShowBackendDetails(x => !x)}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-500 text-sm transition"
                >
                  <span>View TideCloak Backend</span>
                  <FaChevronDown
                    className={`transform transition-transform duration-300 ${
                      showBackendDetails ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {showBackendDetails && (
                  <AccordionBox title="TideCloak Administration" isOpen>
                    <p className="mb-4">TideCloak is built on RedHat's Keycloak a powerful, enterprise-grade IAM/SSO with everything you'd want in the box. In this demo we show how to engage with the backend via API, but you also have a fully-fledged admin console you can explore here:</p>
                    <div className="border border-dashed border-gray-500 p-4">
                      <ul className="list-disc list-inside">
                        <li>
                          Visit: <a href={adminAddress} className="text-blue-600">{adminAddress}</a>
                        </li>
                        <li>Credentials: admin / password</li>
                      </ul>
                    </div>
                  </AccordionBox>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="h-10" />
    </main>
  );
}
