// app/layout.js
import "./tailwind.css";
import "./components/spinKit.css";  // Import your spinKit styles
import { Provider } from "./context/context";
import Nav from "./components/nav";
import Footer from "./components/footer";

/**
 * Similar to index.js in React, this provides the root entry point of the application, sharing components across all wrapped pages.
 * @param {React.ReactNode} children - Child components rendered within layout (/, /users, /admin, nav, footer etc).
 * @returns {JSX.Element} - The general layout wrapping all child components to share common style, nav and footer.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>TideCloak Demo</title>
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
