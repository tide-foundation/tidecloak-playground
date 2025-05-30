'use client';

import { Provider } from './context/context';

/**
 * Wraps the server‐rendered layout so that context (and its client hooks)
 * only run on the client.
 */
export default function ClientProvider({ children }) {
  return <Provider>{children}</Provider>;
}
