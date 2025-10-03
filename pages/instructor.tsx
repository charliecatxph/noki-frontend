import { ArrowLeft, Phone, Clock, MapPin, Mail, Calendar, TrendingUp, Users } from "lucide-react";
import { Inter, Poppins, Space_Grotesk } from "next/font/google";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"]
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
});

// Mock instructor data
const instructorData = {
  1: {
    id: 1,
    name: "Dr. Sarah Johnson",
    department: "Computer Science",
    status: "in-office",
    email: "sarah.johnson@sti.edu.ph",
    office: "Room 301, CS Building",
    phone: "+63 912 345 6789",
    schedule: "MWF 8:00-12:00, TTh 2:00-5:00",
    totalCalls: 23,
    todayCalls: 5,
    avgResponseTime: "3.2 mins",
    lastSeen: "2 mins ago"
  },
  2: {
    id: 2,
    name: "Prof. Michael Chen",
    department: "Mathematics",
    status: "in-class",
    email: "michael.chen@sti.edu.ph",
    office: "Room 205, Math Building",
    phone: "+63 912 345 6790",
    schedule: "MWF 10:00-2:00, TTh 8:00-12:00",
    totalCalls: 18,
    todayCalls: 3,
    avgResponseTime: "4.1 mins",
    lastSeen: "Teaching now"
  }
};

const callHistoryData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  datasets: [{
    label: 'Daily Calls',
    data: [4, 6, 3, 8, 5],
    borderColor: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    fill: true,
    tension: 0.4
  }]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#6B7280'
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: '#6B7280'
      }
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in-office': return 'bg-green-500';
    case 'in-class': return 'bg-blue-500';
    case 'absent': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'in-office': return 'In Office';
    case 'in-class': return 'In Class';
    case 'absent': return 'Absent';
    default: return 'Unknown';
  }
};

export default function Instructor() {
  const router = useRouter();
  const { id } = router.query;

  const instructor = instructorData[Number(id) as keyof typeof instructorData];

  if (!instructor) {
    return (
      <div className={`${poppins.className} min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center`}>
        <div className="text-center">
          <h1 className={`${spaceGrotesk.className} text-3xl font-black text-slate-800 mb-4`}>Instructor Not Found</h1>
          <motion.button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            whileHover={{ filter: "brightness(0.9)" }}
            whileTap={{ filter: "brightness(0.8)" }}
          >
            Back to Dashboard
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <main className={`${poppins.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.button
                  onClick={() => router.push('/')}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  whileHover={{ filter: "brightness(0.9)" }}
                  whileTap={{ filter: "brightness(0.8)" }}
                >
                  <ArrowLeft size="22" className="text-slate-700" />
                </motion.button>
                <div>
                  <h1 className={`${spaceGrotesk.className} text-3xl font-black bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 bg-clip-text text-transparent tracking-tight`}>Instructor Profile</h1>
                  <p className="text-slate-500 font-medium mt-1">Detailed information and analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${instructor.status === 'in-office' ? 'bg-green-100 text-green-700' :
                  instructor.status === 'in-class' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                  {getStatusText(instructor.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-lg">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                      {instructor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 w-6 h-6 ${getStatusColor(instructor.status)} rounded-full border-4 border-white`}></div>
                  </div>
                  <h2 className={`${spaceGrotesk.className} text-2xl font-bold text-slate-800 tracking-tight`}>{instructor.name}</h2>
                  <p className="text-slate-600 font-medium">{instructor.department}</p>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Last seen: {instructor.lastSeen}</p>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-4 text-slate-700">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Mail size="18" className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{instructor.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-700">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Phone size="18" className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{instructor.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-700">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <MapPin size="18" className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{instructor.office}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-700">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Calendar size="18" className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{instructor.schedule}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <motion.button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                    whileHover={{ filter: "brightness(0.9)" }}
                    whileTap={{ filter: "brightness(0.8)" }}
                  >
                    Call Instructor
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Analytics */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  className="bg-white border border-neutral-200 rounded-xl p-6 shadow-lg hover:bg-blue-50 transition-all duration-300"
                  whileHover={{ filter: "brightness(0.9)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${spaceGrotesk.className} text-3xl font-black text-blue-700 mb-1`}>{instructor.totalCalls}</p>
                      <p className="text-sm text-blue-600/80 font-semibold tracking-wide">Total Calls</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Phone className="text-blue-600" size="28" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white border border-neutral-200 rounded-xl p-6 shadow-lg hover:bg-green-50 transition-all duration-300"
                  whileHover={{ filter: "brightness(0.9)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${spaceGrotesk.className} text-3xl font-black text-green-700 mb-1`}>{instructor.todayCalls}</p>
                      <p className="text-sm text-green-600/80 font-semibold tracking-wide">Today's Calls</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <TrendingUp className="text-green-600" size="28" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white border border-neutral-200 rounded-xl p-6 shadow-lg hover:bg-purple-50 transition-all duration-300"
                  whileHover={{ filter: "brightness(0.9)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${spaceGrotesk.className} text-3xl font-black text-purple-700 mb-1`}>{instructor.avgResponseTime}</p>
                      <p className="text-sm text-purple-600/80 font-semibold tracking-wide">Avg Response</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <Clock className="text-purple-600" size="28" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Call History Chart */}
              <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-lg">
                <h3 className={`${spaceGrotesk.className} font-bold text-xl flex gap-3 items-center text-slate-800 mb-8 tracking-tight`}>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <TrendingUp size="20" className="text-white" />
                  </div>
                  Weekly Call History
                </h3>
                <div className="h-[300px]">
                  <Line data={callHistoryData} options={chartOptions} />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-lg">
                <h3 className={`${spaceGrotesk.className} font-bold text-xl flex gap-3 items-center text-slate-800 mb-8 tracking-tight`}>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Clock size="20" className="text-white" />
                  </div>
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {[
                    { time: "10:30 AM", action: "Answered call from Student ID: 2021-001234", status: "completed" },
                    { time: "10:15 AM", action: "Missed call from Student ID: 2021-005678", status: "missed" },
                    { time: "9:45 AM", action: "Answered call from Student ID: 2021-009876", status: "completed" },
                    { time: "9:30 AM", action: "Status changed to 'In Office'", status: "status" },
                  ].map((activity, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className={`w-3 h-3 rounded-full ${activity.status === 'completed' ? 'bg-green-500' :
                        activity.status === 'missed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
