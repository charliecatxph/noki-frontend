import {
  Check,
  LineChart,
  Users,
  UserCheck,
  UserX,
  Clock,
  Settings,
  UserPlus,
  Building2,
  ChevronRight,
  Phone,
  TrendingUp,
  LayoutDashboard,
  Bell,
  IdCard,
} from "lucide-react";
import { Inter, Poppins, Space_Grotesk } from "next/font/google";
import { motion, useDeprecatedAnimatedState } from "framer-motion";
import { useRouter } from "next/router";
import { Line, Bar } from "react-chartjs-2";
import Sidebar from "../components/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import TimeAgoComponent from "@/components/TimeAgo";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Mock data
const mockTeachers = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    department: "Computer Science",
    status: "in-office",
    avatar: "/api/placeholder/40/40",
    lastSeen: "2 mins ago",
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    department: "Mathematics",
    status: "in-class",
    avatar: "/api/placeholder/40/40",
    lastSeen: "Teaching now",
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    department: "Physics",
    status: "absent",
    avatar: "/api/placeholder/40/40",
    lastSeen: "1 hour ago",
  },
  {
    id: 4,
    name: "Prof. David Kim",
    department: "Chemistry",
    status: "in-office",
    avatar: "/api/placeholder/40/40",
    lastSeen: "5 mins ago",
  },
  {
    id: 5,
    name: "Dr. Lisa Thompson",
    department: "Biology",
    status: "in-class",
    avatar: "/api/placeholder/40/40",
    lastSeen: "Teaching now",
  },
  {
    id: 6,
    name: "Prof. James Wilson",
    department: "English",
    status: "in-office",
    avatar: "/api/placeholder/40/40",
    lastSeen: "Just now",
  },
];

const todayStats = {
  totalCalls: 47,
  inOffice: 12,
  inClass: 8,
  absent: 4,
};

const historicalData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Teacher Calls",
      data: [32, 45, 38, 52, 47, 23, 15],
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "white",
      bodyColor: "white",
      borderColor: "rgba(59, 130, 246, 0.5)",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#6B7280",
      },
    },
    y: {
      grid: {
        color: "rgba(0, 0, 0, 0.1)",
      },
      ticks: {
        color: "#6B7280",
      },
    },
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-500";
    case "IN_CLASS":
      return "bg-blue-500";
    case "OUT":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "IN_CLASS":
      return "In Class";
    case "OUT":
      return "Out";
    default:
      return "Unknown";
  }
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function Home({
  user,
  queries,
  api,
}: {
  user: any;
  queries: any;
  api: string;
}) {
  const router = useRouter();

  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;

  const [todayStats, setTodayStats] = useState({
    inClass: 0,
    inBusy: 0,
    inBreak: 0,
    available: 0,
    out: 0,
  });

  const handleTeacherClick = (teacherId: number) => {
    router.push(`/`);
  };

  const {
    data: facultyData = [],
    isFetched: facultyFetched,
    isPending: facultyPending,
    isError: facultyError,
    isFetching: facultyFetching,
    isRefetching: facultyRefetching,
    refetch: facultyRefetch,
  } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-teachers`, {
        params: {
          institutionId: __userData.id,
        },
      });

      return res.data.data;
    },
    enabled: !!__userData.id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (facultyData.length === 0) return;
    const todayStats = {
      available: facultyData.filter(
        (teacher: any) => teacher.statistics.status === "AVAILABLE"
      ).length,
      inBreak: facultyData.filter(
        (teacher: any) => teacher.statistics.status === "IN_BREAK"
      ).length,
      inBusy: facultyData.filter(
        (teacher: any) => teacher.statistics.status === "IN_BUSY"
      ).length,
      inClass: facultyData.filter(
        (teacher: any) => teacher.statistics.status === "IN_CLASS"
      ).length,
      out: facultyData.filter(
        (teacher: any) => teacher.statistics.status === "OUT"
      ).length,
    };
    setTodayStats(todayStats);
  }, [facultyData]);

  return (
    <>
      <main
        className={`${poppins.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}
      >
        <div className="flex">
          <Sidebar userData={__userData} />
          <div className="main-panel flex-1">
            <header
              className={`${inter.className} p-5 bg-blue-600 text-white w-full sticky top-0 z-10 flex gap-5 items-center`}
            >
              <div>
                <LayoutDashboard size="30" strokeWidth={1.2} />
              </div>
              <div>
                <h1 className="font-[600]  text-white text-sm">Dashboard</h1>
                <p className="font-[400] text-white/70 text-xs">
                  Real-time insights and system management
                </p>
              </div>
            </header>
            <div className="grid grid-cols-3 gap-8 px-5 p-5">
              {/* Statistics Panel */}
              <div className="col-span-2  rounded-2xl statistics p-8 bg-white border border-white/20">
                <div className="h-full flex flex-col">
                  <h2
                    className={`${spaceGrotesk.className} font-bold text-2xl flex gap-3 items-center text-slate-800 mb-8 tracking-tight`}
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <TrendingUp size="22" className="text-white" />
                    </div>
                    Analytics Overview
                  </h2>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-5 mb-8">
                    <div className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent p-6 rounded-2xl border border-green-200/50 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`${spaceGrotesk.className} text-3xl font-black text-green-700 mb-1`}
                          >
                            {todayStats.available}
                          </p>
                          <p className="text-sm text-green-600/80 font-semibold tracking-wide">
                            Available
                          </p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-xl">
                          <UserCheck className="text-green-600" size="28" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent p-6 rounded-2xl border border-blue-200/50 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`${spaceGrotesk.className} text-3xl font-black text-blue-700 mb-1`}
                          >
                            {todayStats.inBusy}
                          </p>
                          <p className="text-sm text-blue-600/80 font-semibold tracking-wide">
                            In (Busy)
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Phone className="text-blue-600" size="28" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-transparent p-6 rounded-2xl border border-yellow-200/50 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`${spaceGrotesk.className} text-3xl font-black text-yellow-700 mb-1`}
                          >
                            {todayStats.inBreak}
                          </p>
                          <p className="text-sm text-yellow-600/80 font-semibold tracking-wide">
                            In (Break)
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Phone className="text-yellow-600" size="28" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-transparent p-6 rounded-2xl border border-indigo-200/50 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`${spaceGrotesk.className} text-3xl font-black text-indigo-700 mb-1`}
                          >
                            {todayStats.inClass}
                          </p>
                          <p className="text-sm text-indigo-600/80 font-semibold tracking-wide">
                            In Class
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                          <Users className="text-indigo-600" size="28" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent p-6 rounded-2xl border border-red-200/50 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`${spaceGrotesk.className} text-3xl font-black text-red-700 mb-1`}
                          >
                            {todayStats.out}
                          </p>
                          <p className="text-sm text-red-600/80 font-semibold tracking-wide">
                            Out
                          </p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-xl">
                          <UserX className="text-red-600" size="28" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historical Chart */}
                </div>
              </div>

              {/* Teacher Statuses Panel */}
              <div className="col-span-1 row-span-2 bg-white border border-neutral-200 rounded-xl teacher-statuses p-6">
                <div>
                  <h2
                    className={`${spaceGrotesk.className} font-[700] text-lg text-gray-800 mb-6 flex items-center gap-2`}
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Users size="15" className="text-white" />
                    </div>{" "}
                    Teacher Status
                  </h2>

                  <div className="space-y-3 max-h-[700px] overflow-y-auto">
                    {facultyData
                      .sort((a: any, b: any) => {
                        const aTime = new Date(a.statistics.updatedAt);
                        const bTime = new Date(b.statistics.updatedAt);
                        return bTime.getTime() - aTime.getTime();
                      })
                      .map((teacher: any, index: any) => (
                        <motion.div
                          key={teacher.id}
                          className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                          onClick={() => handleTeacherClick(teacher.id)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          whileHover={{ filter: "brightness(0.95)" }}
                          whileTap={{ filter: "brightness(0.9)" }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {teacher.name
                                    .split(" ")
                                    .map((n: any) => n[0])
                                    .filter(
                                      (_: any, i: any, arr: any) =>
                                        i < 2 || i === arr.length - 1
                                    )
                                    .join("")}
                                </div>
                                <div
                                  className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                                    teacher.statistics.status
                                  )} rounded-full border-2 border-white`}
                                ></div>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 text-sm">
                                  {teacher.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate w-[130px]">
                                  {teacher.department?.name ||
                                    "Department missing."}
                                </p>
                                <p className="text-xs text-gray-400">
                                  <TimeAgoComponent
                                    timestamp={teacher.statistics.updatedAt}
                                  />
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  teacher.statistics.status === "AVAILABLE"
                                    ? "bg-green-100 text-green-700"
                                    : teacher.statistics.status === "IN_CLASS"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {getStatusText(teacher.statistics.status)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity Panel */}
              <div className="col-span-2 bg-white border border-neutral-200 rounded-xl h-[400px] call-graph p-6">
                <div className="h-full flex flex-col">
                  <h2
                    className={`${spaceGrotesk.className} font-[700] text-lg text-gray-800 mb-6 flex items-center gap-2`}
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <IdCard size="15" className="text-white" />
                    </div>{" "}
                    Recent Kiosk Student Scans
                  </h2>

                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Activity Items */}
                    <motion.div
                      className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-2 bg-blue-500 rounded-full">
                        <UserPlus size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          New Teacher Registered
                        </p>
                        <p className="text-xs text-gray-600">
                          Dr. Maria Santos joined Computer Science department
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          2 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <div className="p-2 bg-green-500 rounded-full">
                        <Check size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          System Status Update
                        </p>
                        <p className="text-xs text-gray-600">
                          All RFID scanners are online and functioning
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          5 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <div className="p-2 bg-orange-500 rounded-full">
                        <Users size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Bulk Data Import
                        </p>
                        <p className="text-xs text-gray-600">
                          Successfully imported 45 student records
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          12 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <div className="p-2 bg-purple-500 rounded-full">
                        <Settings size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Configuration Updated
                        </p>
                        <p className="text-xs text-gray-600">
                          Attendance tracking settings modified by admin
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          18 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <div className="p-2 bg-indigo-500 rounded-full">
                        <LineChart size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Weekly Report Generated
                        </p>
                        <p className="text-xs text-gray-600">
                          Attendance analytics report for week 36 is ready
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          25 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <div className="p-2 bg-red-500 rounded-full">
                        <UserX size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Absence Alert
                        </p>
                        <p className="text-xs text-gray-600">
                          Prof. Johnson marked absent for scheduled class
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          32 minutes ago
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="col-span-3 bg-white border border-neutral-200 rounded-xl h-[400px] call-graph p-6">
                <div className="h-full flex flex-col">
                  <h2
                    className={`${spaceGrotesk.className} font-[700] text-lg text-gray-800 mb-6 flex items-center gap-2`}
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Bell size="15" className="text-white" />
                    </div>{" "}
                    All Notifications / System Notifications
                  </h2>

                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Activity Items */}
                    <motion.div
                      className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-2 bg-blue-500 rounded-full">
                        <UserPlus size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          New Teacher Registered
                        </p>
                        <p className="text-xs text-gray-600">
                          Dr. Maria Santos joined Computer Science department
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          2 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <div className="p-2 bg-green-500 rounded-full">
                        <Check size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          System Status Update
                        </p>
                        <p className="text-xs text-gray-600">
                          All RFID scanners are online and functioning
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          5 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <div className="p-2 bg-orange-500 rounded-full">
                        <Users size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Bulk Data Import
                        </p>
                        <p className="text-xs text-gray-600">
                          Successfully imported 45 student records
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          12 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <div className="p-2 bg-purple-500 rounded-full">
                        <Settings size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Configuration Updated
                        </p>
                        <p className="text-xs text-gray-600">
                          Attendance tracking settings modified by admin
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          18 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <div className="p-2 bg-indigo-500 rounded-full">
                        <LineChart size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Weekly Report Generated
                        </p>
                        <p className="text-xs text-gray-600">
                          Attendance analytics report for week 36 is ready
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          25 minutes ago
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <div className="p-2 bg-red-500 rounded-full">
                        <UserX size="16" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Absence Alert
                        </p>
                        <p className="text-xs text-gray-600">
                          Prof. Johnson marked absent for scheduled class
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          32 minutes ago
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
