import { NavLink, useNavigate } from "react-router-dom";
import { 
  HomeIcon, 
  CreditCardIcon, 
  BellIcon, 
  CalendarIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function Sidebar({ role }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const tenantLinks = [
    { to: "/tenant", label: "Dashboard", icon: HomeIcon },
    { to: "/tenant/payments", label: "Payments", icon: CreditCardIcon },
    { to: "/tenant/notices", label: "Notices", icon: BellIcon },
    { to: "/tenant/events", label: "Events", icon: CalendarIcon },
    { to: "/tenant/maintenance", label: "Maintenance", icon: WrenchScrewdriverIcon },
    { to: "/tenant/chat", label: "Chat", icon: ChatBubbleLeftRightIcon },
    { to: "/tenant/photos", label: "Photos", icon: PhotoIcon },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: HomeIcon },
    { to: "/admin/houses", label: "Houses", icon: HomeIcon },
    { to: "/admin/tenants", label: "Tenants", icon: HomeIcon },
    { to: "/admin/payments", label: "Payments", icon: CreditCardIcon },
    { to: "/admin/notices", label: "Notices", icon: BellIcon },
    { to: "/admin/events", label: "Events", icon: CalendarIcon },
    { to: "/admin/maintenance", label: "Maintenance", icon: WrenchScrewdriverIcon },
    { to: "/admin/chat", label: "Chat", icon: ChatBubbleLeftRightIcon },
  ];

  const links = role === "admin" ? adminLinks : tenantLinks;

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-green-600">Akiba Estate</h1>
        <p className="text-sm text-gray-600 mt-1">
          {role === "admin" ? "Admin Panel" : "Tenant Portal"}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/tenant" || link.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors ${
                  isActive ? "bg-green-50 text-green-600 border-r-4 border-green-600" : ""
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
