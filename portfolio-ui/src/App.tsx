import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ponytail: dropped TooltipProvider — the app renders zero tooltips, so it was a
// no-op wrapper pulling all of @radix-ui/react-tooltip into the bundle. Re-add it
// (and wrap the tree) if/when an actual <Tooltip> is introduced.
const App = () => (
  <QueryProvider>
    <Toaster />
    {/* Moved off the default bottom-right: the chat launcher owns that corner now,
        and Sonner renders at z-index 999999999 — react-query fires it on every
        request error (src/lib/react-query.tsx), so it would land on the launcher. */}
    <Sonner position="top-right" theme="dark" />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryProvider>
);

export default App;
