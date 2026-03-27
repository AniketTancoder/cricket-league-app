import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import tplLogo from "../assets/tpl.png";

export default function Layout({ children }) {
  const { logout, isAdmin } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/teams", label: "Teams", icon: "🏏" },
    { path: "/fixtures", label: "Fixtures", icon: "📅" },
    { path: "/points", label: "Points Table", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-100 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3">
                <img
                  src={tplLogo}
                  alt="TPL Logo"
                  className="h-[50px] w-[50px] object-contain rounded-none shadow-sm"
                />
                <span className="text-xl font-bold text-gray-900">
                  Titave Premier League
                </span>
              </Link>
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 flex items-center gap-1 sm:gap-2"
                >
                  <span className="hidden sm:inline">⚙️</span>
                  <span className="text-xs sm:text-sm">Admin Config</span>
                </Link>
              )}

              {isAdmin ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={logout}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - visible below header on small screens */}
      <nav className="md:hidden bg-gray-100 border-b border-gray-200 px-2 py-2 flex justify-center space-x-1 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-shrink-0 px-2 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              location.pathname === item.path
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="mr-0.5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
