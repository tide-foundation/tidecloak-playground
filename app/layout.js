// app/layout.js
'use client';

import "./styles/tailwind.css";
import "./styles/spinKit.css";  // Import your spinKit styles
import "./styles/loading.css"
import { useEffect } from "react";
import { Provider } from "./context/context";
import Nav from "./components/nav";
import Footer from "./components/footer";

/**
 * Similar to index.js in React, this provides the root entry point of the application, sharing components across all wrapped pages.
 * @param {React.ReactNode} children - Child components rendered within layout (/, /users, /admin, nav, footer etc).
 * @returns {JSX.Element} - The general layout wrapping all child components to share common style, nav and footer.
 */
export default function RootLayout({ children }) {
  useEffect(() => {
    // Remove any unexpected extension classes (e.g., ClickUp)
    const body = document.querySelector('body');
    body.className = 'min-h-screen flex flex-col bg-white';
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>TideCloak Demo</title>
        {/* Add some basic SEO tags */}
        <meta name="description" content="The TideCloak Next.js Demo" />
        <meta name="author" content="TideCloak" />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen flex flex-col bg-white">
        <Provider>
          <Nav />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Provider>
      </body>
    </html>
  );
}
