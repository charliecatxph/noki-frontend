import { ArrowLeftRight, Computer } from "lucide-react";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/router";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
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
  { name: "Student Management", path: "/students" }
];

const enoKiItems: NavigationItem[] = [
  { name: "System Configuration", path: "/enoki-settings" },
  { name: "User Account Management", path: "/enoki-userauth" }
];

export default function Sidebar({ userData }: { userData: any }) {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

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
                  className={`px-4 py-3 text-white font-medium w-full rounded-xl text-left transition-all duration-200 cursor-pointer hover:translate-x-1 ${isActive(item.path)
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                    : 'hover:bg-white/10'
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
                  className={`px-4 py-3 text-white font-medium w-full rounded-xl text-left transition-all duration-200 cursor-pointer hover:translate-x-1 ${isActive(item.path)
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                    : 'hover:bg-white/10'
                    }`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 font-[500] bg-blue-900 text-white px-3 py-1 rounded-full text-sm items-center w-max">
              <ArrowLeftRight size="15" /> Live Connection Established
            </div>
            <div className="flex gap-3 font-[500] bg-blue-900 text-white px-3 py-1 rounded-full text-sm items-center w-max">
              <Computer size="15" /> Kiosk Online
            </div>
          </div>
          <div className="border-t-1 border-blue-500 pt-5">
            <div className="user bg-blue-800 text-white px-3 py-2 text-sm rounded-lg cursor-pointer">
              <p className="">Logged in as {userData.ownerName}</p>
              <p className="text-xs">{userData.name}</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
