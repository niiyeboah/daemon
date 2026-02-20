import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider as JotaiProvider } from "jotai";
import { AppShell } from "@/components/layout/AppShell";
import Home from "@/pages/Home";
import Setup from "@/pages/Setup";
import Chat from "@/pages/Chat";
import Diagnostics from "@/pages/Diagnostics";
import Settings from "@/pages/Settings";
import WhatsApp from "@/pages/WhatsApp";
import { useOllamaStatus, useOllamaModels } from "@/hooks/useOllama";

function StatusPoller() {
  useOllamaStatus();
  useOllamaModels();
  return null;
}

function App() {
  return (
    <JotaiProvider>
      <BrowserRouter>
        <StatusPoller />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/diagnostics" element={<Diagnostics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </JotaiProvider>
  );
}

export default App;
