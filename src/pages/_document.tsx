import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="google-site-verification" content="SV56oBxOThPxRrhiJOM54a5rn3uq_z4Zg7hOtFBiGas" />
      </Head>
      <body>
        <Script src="https://assets.co.dev/files/codevscript.js" strategy="afterInteractive" />
        <Main />
        <Script src="https://assets.co.dev/files/codevscript.js" strategy="afterInteractive" />
        <NextScript />
      </body>
    </Html>
  );
}