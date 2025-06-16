import { Html, Head, Main, NextScript } from "next/document";
import Document, { DocumentContext } from 'next/document';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          <div id="portal" style={{ position: "fixed", left: 0, top: 0, zIndex: 9999 }} />
        </body>
      </Html>
    );
  }
}