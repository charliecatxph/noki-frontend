import { authGate } from "@/middlewares/secureEnokiGate";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { GetServerSideProps } from "next";
import { Inter } from "next/font/google";
import { useSelector } from "react-redux";
import { GetServerSidePropsContext } from "next";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronRight, User, Circle, MessageSquare, Mail, CreditCard, Building2, X, Search } from "lucide-react";
import { useState } from "react";
import { getStatusBackground, getStatusColor, getStatusText } from "..";

const inter = Inter({ subsets: ["latin"] });

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const auth = await authGate(ctx);
  return auth;
}

export default function Kiosk({ api, user, queries }: { api: string; user: any; queries: string }) {
  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [message, setMessage] = useState("");


  const {
    data: departmentsData = [],
    isFetched: departmentsFetched,
    isPending: departmentsPending,
    isError: departmentsError,
    isFetching: departmentsFetching,
    isRefetching: departmentsRefetching,
    refetch: departmentRefetch,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-departments`, {
        params: {
          institutionId: __userData.institutionId,
        },
      });

      return res.data.data;
    },
    enabled: !!__userData.userId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    data: teachersData = [],
    isFetching: teachersFetching,
    isError: teachersError,
  } = useQuery({
    queryKey: ["teachers", selectedDepartmentId],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-teachers`, {
        params: {
          departmentId: selectedDepartmentId,
          institutionId: __userData.institutionId,
        },
      });

      return res.data.data;
    },
    enabled: !!selectedDepartmentId,
    staleTime: 5 * 60 * 1000,
  });

  type TStatus = "IN_BUSY" | "IN_BREAK" | "IN_CLASS" | "OUT" | "AVAILABLE";
  type TStatusMode = "ICON" | "TEXT" | "TEXT-COLOR";

  const unifiedTSStatusHandler = (mode: TStatusMode, status: TStatus) => {
    if (mode === "ICON") {
      switch (status) {
        case "IN_BUSY":
          return "bg-green-500";
        case "IN_BREAK":
          return "bg-yellow-500";
        case "IN_CLASS":
          return "bg-blue-500";
        case "OUT":
          return "bg-red-500";
        case "AVAILABLE":
          return "bg-orange-500";
        default:
          return "bg-gray-500";
      }
    } else if (mode === "TEXT") {
      switch (status) {
        case "IN_BUSY":
          return "In Busy";
        case "IN_BREAK":
          return "In Break";
        case "IN_CLASS":
          return "In Class";
        case "OUT":
          return "Out";
        case "AVAILABLE":
          return "Available";
        default:
          return "Unknown";
      }
    } else if (mode === "TEXT-COLOR") {
      switch (status) {
        case "IN_BUSY":
          return "bg-red-100 text-red-700";
        case "IN_BREAK":
          return "bg-yellow-100 text-yellow-700";
        case "IN_CLASS":
          return "bg-blue-100 text-blue-700";
        case "OUT":
          return "bg-red-100 text-red-700";
        case "AVAILABLE":
          return "bg-green-100 text-green-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    } else {
      return "";
    }
  };

  const handleSendMessage = (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowMessageModal(true);
  };

  const handleCloseModal = () => {
    setShowMessageModal(false);
    setSelectedTeacher(null);
    setMessage("");
  };

  const handleSubmitMessage = () => {
    console.log('Sending message to:', selectedTeacher?.name, 'Message:', message);
    // Handle message submission here
    handleCloseModal();
  };
  return (
    <>
      <main
        className={`${inter.className} bg-yellow-300 h-screen w-screen p-10 flex gap-5`}
      >
        <nav className="w-1/3 h-full overflow-y-auto">
       <div className=" max-w-[300px] rounded mb-5">
       <img src="enokiblck.svg" alt="" />
       </div>
          
          <ul className="mt-4 space-y-3">
            {departmentsData.map((department: any) => (
              <li 
                key={department.id}
                className={`bg-blue-700 text-yellow-300 px-6 py-4 rounded-xl font-semibold text-lg cursor-pointer hover:bg-blue-800 hover:text-yellow-200 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-between ${
                  selectedDepartmentId === department.id ? 'ring-4 ring-yellow-400' : ''
                }`}
                onClick={() => {
                  setSelectedDepartmentId(department.id);
                }}
              >
                <span>{department.name}</span>
                <ChevronRight className="w-6 h-6" />
              </li>
            ))}
          </ul>
        </nav>
        <div className="w-2/3 bg-blue-700 h-full rounded-2xl p-8 overflow-y-auto">
          {!selectedDepartmentId ? (
            <div className="flex items-center justify-center h-full text-yellow-300">
              <div className="text-center">
                <User className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">Select a department to view teachers</p>
              </div>
            </div>
          ) : teachersFetching ? (
            <div className="flex items-center justify-center h-full text-yellow-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-300 mx-auto mb-4"></div>
                <p className="text-xl font-semibold">Loading teachers...</p>
              </div>
            </div>
          ) : teachersError ? (
            <div className="flex items-center justify-center h-full text-red-300">
              <div className="text-center">
                <p className="text-xl font-semibold">Error loading teachers</p>
              </div>
            </div>
          ) : teachersData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-yellow-300">
              <div className="text-center">
                <User className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">No teachers found in this department</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-yellow-300 ">Teachers</h2>
              <Search className="text-yellow-300"/>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {teachersData.map((teacher: any) => (
                  <div
                    key={teacher.id}
                    className="bg-yellow-50 rounded-2xl p-6 shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-200 flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {teacher.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .filter(
                                (_: any, i: number, arr: any[]) => i < 2 || i === arr.length - 1
                              )
                              .join("")}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(teacher.statistics?.status || teacher.status)} rounded-full border-2 border-yellow-50`}
                          ></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">
                            {teacher.name}
                          </h3>
                          <p className="text-sm text-blue-600">
                            {departmentsData.find(
                              (d: any) => d.id === teacher.departmentId
                            )?.name || 'Department'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          getStatusBackground(teacher.statistics?.status || teacher.status)
                        }`}
                      >
                        {getStatusText(teacher.statistics?.status || teacher.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                    


                      
                      {(teacher.statistics?.status === "IN_CLASS" || teacher.status === "IN_CLASS") &&
                        teacher.room && (
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Building2 size="14" />
                            <span>
                              RM {teacher.room.toString().toUpperCase()}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleSendMessage(teacher)}
                        className="flex-1 bg-blue-700 text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <MessageSquare size="16" />
                        Send Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Message Modal */}
      {showMessageModal && selectedTeacher && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-yellow-50 rounded-3xl shadow-2xl border-4 border-blue-700 p-8 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-yellow-300 font-bold text-2xl">
                  {selectedTeacher.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .filter(
                      (_: any, i: number, arr: any[]) => i < 2 || i === arr.length - 1
                    )
                    .join("")}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">
                    Send Message to {selectedTeacher.name}
                  </h2>
                  <p className="text-blue-600">
                    {departmentsData.find(
                      (d: any) => d.id === selectedTeacher.departmentId
                    )?.name || 'Department'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-blue-700 hover:text-blue-900 transition-colors p-2 hover:bg-blue-100 rounded-full"
              >
                <X size="24" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-blue-900 font-semibold mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-40 px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-200 transition-all resize-none bg-white text-blue-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMessage}
                disabled={!message.trim()}
                className="flex-1 bg-blue-700 text-yellow-300 px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <MessageSquare size="20" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
