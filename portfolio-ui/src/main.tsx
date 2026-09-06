import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Loaded here, not via @import from index.css: there is no postcss-import in the
// pipeline, and an @import placed after @tailwind utilities is spec-invalid — it
// can hoist above preflight and lose every equal-specificity tie. Entry order is
// deterministic, so these rules land last in the emitted CSS chunk.
import "./styles/aura.css";

async function bootstrap() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
