import "./tailwind.css";
import { Provider } from "./context/context";
import Nav from "./components/nav";
import Footer from "./components/footer";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white">
        <Provider>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>TideCloak Demo</title>
          <Nav/>
          {children}
          <Footer/>
        </Provider>
      </body>
    </html>
  );
}
