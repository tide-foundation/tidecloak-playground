import "./tailwind.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>TideCloak Demo</title>
        </head>
        {children}
      </body>
    </html>
    
  );
}
