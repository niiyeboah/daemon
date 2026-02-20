import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider as JotaiProvider } from "jotai";
import { AppShell } from "@/components/layout/AppShell";
import Home from "@/pages/Home";
import Setup from "@/pages/Setup";
import Chat from "@/pages/Chat";
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
          </Route>
        </Routes>
      </BrowserRouter>
    </JotaiProvider>
  );
}

export default App;
