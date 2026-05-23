import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  PhoneCall,
  Building2,
  Users,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BASE_PATH } from "@/lib/constants";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "eye_bank_head", "unit_coordinator"] },
    { href: "/eye-calls", label: "Eye Calls", icon: PhoneCall, roles: ["super_admin", "eye_bank_head", "unit_coordinator"] },
    { href: "/units", label: "Units", icon: Building2, roles: ["super_admin", "eye_bank_head"] },
    { href: "/users", label: "Users", icon: Users, roles: ["super_admin"] },
    { href: "/profile", label: "Profile", icon: UserCircle, roles: ["super_admin", "eye_bank_head", "unit_coordinator"] },
  ];

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-[100dvh] transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4 overflow-hidden">
        {collapsed ? (
          <img src={`${BASE_PATH}/logo.png`} alt="SEFI" className="h-8 w-8 object-cover object-top rounded-full border border-orange-100 shadow-sm" />
        ) : (
          <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-12 w-full object-contain" />
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm z-10"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                isActive
                  ? "bg-orange-50 text-orange-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                size={20}
                className={cn("shrink-0", isActive ? "text-orange-600" : "text-gray-500 group-hover:text-gray-700")}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600 w-full group",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={20} className="shrink-0 group-hover:text-red-600 text-gray-500" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
