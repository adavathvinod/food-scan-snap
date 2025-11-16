import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { TranslationProvider } from "./contexts/TranslationContext";
import { prefetchCommonRoutes } from "./lib/routePrefetch";

// Prefetch commonly used routes after initial render
setTimeout(prefetchCommonRoutes, 2000);

createRoot(document.getElementById("root")!).render(
  <TranslationProvider>
    <App />
  </TranslationProvider>
);
