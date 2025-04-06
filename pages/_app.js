import "../styles/globals.css";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="msapplication-TileImage" content="/favicon.png" />
        <title>阿西读书</title>
        <meta name="description" content="阿西的阅读清单" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
