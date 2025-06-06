// app/layout.js
import "./styles/tailwind.css";
import "./styles/spinKit.css"; 
import "./styles/loading.css"
import { Provider } from "./context/context";
import Nav from "./components/nav";
import Footer from "./components/footer";

export const metadata = {
  title: 'TideCloak Demo',
  description: 'The TideCloak Next.js Demo',
  authors: [{ name: 'TideCloak' }],
  robots: 'index, follow',
};

/**
 * Similar to index.js in React, this provides the root entry point of the application, sharing components across all wrapped pages.
 * @param {React.ReactNode} children - Child components rendered within layout (/, /users, /admin, nav, footer etc).
 * @returns {JSX.Element} - The general layout wrapping all child components to share common style, nav and footer.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white">
        <div id="loading-overlay-root" className="pointer-events-none fixed inset-0 z-50" />
        <Provider>
          <Nav />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Provider>
      </body>
    </html>
  );
}