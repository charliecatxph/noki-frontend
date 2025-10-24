import { ArrowLeftRight, Computer, LogOut } from "lucide-react";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEnokiMutator } from "@/hooks/useEnokiMutator";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface NavigationItem {
  name: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { name: "Dashboard", path: "/" },
  { name: "Departments", path: "/departments" },
  { name: "Courses", path: "/courses" },
  { name: "Faculty Management", path: "/teachers" },
  { name: "Student Management", path: "/students" },
];

const enoKiItems: NavigationItem[] = [
  { name: "System Configuration", path: "/enoki-settings" },
  { name: "User Account Management", path: "/enoki-userauth" },
];

export default function Sidebar({ userData }: { userData: any }) {
  const { logout } = useEnokiMutator();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const handleLogout = () => {
    logout.mutate();
    setIsMenuOpen(false);
  };

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="h-screen bg-blue-600 w-[380px] text-white p-8 flex flex-col sticky left-0 top-0">
      <div className="title flex items-start gap-4 mb-8">
        {/* <h1 className={`${spaceGrotesk.className} font-black text-3xl bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent tracking-tight`}>
          ENo-Ki
        </h1> */}
        <div className="w-full">
          <img src="enokioff.svg" alt="" className="h-[100px]" />
        </div>
      </div>

      <div className="flex flex-col mt-5 text-[1.05rem] justify-between flex-1">
        <div className="flex flex-col gap-5">
          <ul className="flex flex-col gap-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`px-4 py-3 text-white font-medium w-full rounded-xl text-left transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                    isActive(item.path)
                      ? "bg-white/5 border border-white/10 hover:bg-white/10"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>

          <ul className="flex flex-col gap-2 border-t-1 border-blue-500 pt-5">
            {enoKiItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`px-4 py-3 text-white font-medium w-full rounded-xl text-left transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                    isActive(item.path)
                      ? "bg-white/5 border border-white/10 hover:bg-white/10"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-5">
          <div className="border-blue-500 pt-5 relative" ref={menuRef}>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full mb-2 left-0 right-0 bg-blue-800 rounded-lg shadow-lg overflow-hidden border border-blue-700"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="user bg-blue-800 text-white px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <p className="">Logged in as {userData.ownerName}</p>
              <p className="text-xs">{userData.name}</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
