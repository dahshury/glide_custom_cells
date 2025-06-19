import type { AppProps } from "next/app";
import "@glideapps/glide-data-grid/dist/index.css";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "@eonasdan/tempus-dominus/dist/css/tempus-dominus.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/globals.css";
import { FullscreenProvider } from "../components/contexts/FullscreenContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <FullscreenProvider>
      <Component {...pageProps} />
    </FullscreenProvider>
  );
} 