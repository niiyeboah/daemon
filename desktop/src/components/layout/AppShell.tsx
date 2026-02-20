import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
