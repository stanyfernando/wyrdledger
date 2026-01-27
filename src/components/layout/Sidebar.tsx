import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  Users,
  Package,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AboutModal } from "@/components/about/AboutModal";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/new-order", icon: Plus, label: "New Order" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const location = useLocation();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 ease-out hover:translate-x-2 hover:scale-105 hover:shadow-md",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with links */}
        <div className="border-t border-sidebar-border p-4">
          <div className="text-center text-xs text-sidebar-foreground/60">
            <p>
              <a
                href="https://stanyfernando.github.io/wyrdnweft/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
              >
                &copy; WYRD &amp; WEFT
              </a>
            </p>
            <p className="mt-1">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="hover:opacity-70 transition-opacity"
              >
                WYRD-LEDGER V 1.0
              </button>
            </p>
          </div>
        </div>
      </aside>
      
      <AboutModal open={isAboutOpen} onOpenChange={setIsAboutOpen} />
    </>
  );
}
