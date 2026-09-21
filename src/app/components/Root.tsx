import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Home, MessageCircle, Heart, Activity, Users, Shield, User, LogOut, Bell, BookOpen } from "lucide-react";
import { useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userType, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const studentNavItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/connect", label: "Connect", icon: MessageCircle },
    { path: "/diary", label: "Diary", icon: BookOpen },
    { path: "/wellness", label: "Wellness", icon: Heart },
    { path: "/mood-tracker", label: "Mood", icon: Activity },
    { path: "/community", label: "Community", icon: Users },
    { path: "/safety", label: "Safety", icon: Shield },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const elderNavItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/requests", label: "Requests", icon: Bell },
    { path: "/connect", label: "Chat", icon: MessageCircle },
    { path: "/student-diary", label: "Diary", icon: BookOpen },
    { path: "/wellness", label: "Wellness", icon: Heart },
    { path: "/profile", label: "Profile", icon: User },
  ];

  // Mobile bottom nav shows top 5 most important items
  const studentMobileNav = [
    { path: "/", label: "Home", icon: Home },
    { path: "/connect", label: "Connect", icon: MessageCircle },
    { path: "/diary", label: "Diary", icon: BookOpen },
    { path: "/wellness", label: "Wellness", icon: Heart },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const elderMobileNav = [
    { path: "/", label: "Home", icon: Home },
    { path: "/requests", label: "Requests", icon: Bell },
    { path: "/connect", label: "Chat", icon: MessageCircle },
    { path: "/wellness", label: "Wellness", icon: Heart },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const navItems = userType === "student" ? studentNavItems : elderNavItems;
  const mobileNav = userType === "student" ? studentMobileNav : elderMobileNav;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const all = [...studentNavItems, ...elderNavItems];
    const match = all.find((item) =>
      item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
    );
    return match?.label ?? "MindMate";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF]">
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-border z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground text-sm">MindMate</span>
          </Link>
          <span className="text-sm font-medium text-muted-foreground">{getPageTitle()}</span>
          <button
            onClick={() => logout()}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 flex-1 relative py-2"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-x-2 top-1 bottom-1 rounded-xl bg-gradient-to-br from-[#C4B5FD]/20 to-[#A78BFA]/20"
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    active ? "text-[#A78BFA]" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] relative z-10 font-medium transition-colors leading-tight ${
                    active ? "text-[#A78BFA]" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* iOS safe area spacer */}
        <div className="h-safe-bottom" />
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white/80 backdrop-blur-lg border-r border-border flex-col p-6 gap-8 z-50">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-lg leading-tight">MindMate</h1>
            <p className="text-xs text-muted-foreground">You are not alone</p>
          </div>
        </Link>

        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-muted-foreground hover:bg-muted hover:text-foreground mt-1"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        <div className="mt-auto">
          <div className="bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] rounded-xl p-4">
            <p className="text-sm text-accent-foreground mb-2 font-medium">Need immediate help?</p>
            <Link
              to="/safety"
              className="text-xs text-accent-foreground underline hover:no-underline"
            >
              Crisis Resources →
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 pb-16 lg:pt-0 lg:pb-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
