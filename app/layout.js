import "./tailwind.css";
import { Provider } from "./context/context";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>TideCloak Demo</title>
          </head>
          {children}
        </Provider>
      </body>
    </html>
  );
}
