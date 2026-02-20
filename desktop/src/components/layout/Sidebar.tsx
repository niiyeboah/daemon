import { NavLink } from "react-router-dom";
import { useAtom } from "jotai";
import { Home, Wand2, MessageSquare, Activity, Settings, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarCollapsedAtom } from "@/store/atoms";
import { Button } from "@/components/ui/button";

const icons = {
  Home,
  Wand2,
  MessageSquare,
  Activity,
  Settings,
} as const;

const navItems = [
  { path: "/", label: "Home", icon: "Home" as const },
  { path: "/setup", label: "Setup", icon: "Wand2" as const },
  { path: "/chat", label: "Chat", icon: "MessageSquare" as const },
  { path: "/diagnostics", label: "Diagnostics", icon: "Activity" as const },
  { path: "/settings", label: "Settings", icon: "Settings" as const },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-14" : "w-48"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight">Daemon</span>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn("ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70",
                  collapsed && "justify-center px-0"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
