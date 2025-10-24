import Sidebar from "@/components/Sidebar";
import { z } from "zod";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  UserPlus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Users,
  Mail,
  Phone,
  Building2,
  CreditCard,
  Wifi,
  WifiOff,
  AlertTriangle,
  Check,
  Search,
  Calendar,
  Clock,
  Plus,
  Minus,
  Coffee,
  TriangleAlert,
} from "lucide-react";
import { Inter } from "next/font/google";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";
import { useSelector } from "react-redux";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { isPending } from "@reduxjs/toolkit";
import moment from "moment";
import { useRfidSocket } from "@/utils/useRfidSocket";
import { useEnokiModals } from "@/contexts/EnokiModalContext";
import { CircularProgress } from "@mui/material";
import AddEditTeacherModal, { Teacher } from "@/components/AddEditTeacherModal";

const inter = Inter({ subsets: ["latin"] });

// Department interface
interface Department {
  id: string;
  name: string;
}

// Schedule interfaces
interface TimeSlot {
  id: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  type: "class" | "break";
  label?: string;
}

interface DaySchedule {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  timeSlots: TimeSlot[];
}

interface WeeklySchedule {
  teacherId?: number;
  schedule: DaySchedule[];
}

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type TStatus = "IN_BUSY" | "IN_BREAK" | "IN_CLASS" | "OUT" | "AVAILABLE";
type TStatusMode = "ICON" | "TEXT" | "TEXT-COLOR";

// Schedule utility functions
const formatTime = (secondsFromStartOfDay: number): string => {
  // Convert seconds from start of day to hours and minutes
  const hours = Math.floor(secondsFromStartOfDay / 3600);
  const minutes = Math.floor((secondsFromStartOfDay % 3600) / 60);

  // Create a moment object for today at the specified time in GMT+8
  const time = moment()
    .utcOffset(8)
    .startOf("day")
    .add(hours, "hours")
    .add(minutes, "minutes");

  return time.format("h:mm A");
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function Teachers({ user, queries, api }: any) {
  // mutations
  const queryClient = useQueryClient();

  const deleteTeacher = useMutation({
    mutationFn: (data: Partial<Teacher>) => {
      return axios.post(`${api}/delete-teacher`, {
        id: data.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      });
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    },
  });

  const enokiModal = useEnokiModals();

  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;

  const [forms, setForms] = useState({
    addEditModal: false,
  });

  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [feed, setFeed] = useState<Teacher | null>(null);

  const handleAddTeacher = () => {
    setFeed(null);
    setForms({
      addEditModal: true,
    });
  };

  const { data: departmentsData = [] } = useQuery({
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
    data: facultyData = [],
    isPending: facultyPending,
    isError: facultyError,
    refetch: facultyRefetch,
  } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-teachers`, {
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

  useEffect(() => {
    if (facultyData.length === 0 && searchTerm.trim() === "") return;
    const filtered = facultyData
      .filter(
        (teacher: any) =>
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.departmentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    setFilteredTeachers(filtered);
  }, [facultyData, searchTerm]);

  const handleDeleteTeacher = (teacher: Teacher) => {
    enokiModal.showModal({
      type: "warning",
      title: "Delete Teacher",
      message: `Are you sure you want to delete ${teacher.name}?`,
      cancelButtonText: "Close",
      hasCancelButton: true,
      hasConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonFn: async () => {
        enokiModal.showModal({
          type: "loading",
          title: "Deleting...",
          message: "",
        });
        deleteTeacher
          .mutateAsync({
            id: teacher.id,
          })
          .then(() => {
            enokiModal.showModal({
              type: "success",
              title: "Teacher deleted",
              message: "Teacher deleted successfully.",
              cancelButtonText: "Close",
              hasCancelButton: true,
            });
          })
          .catch((e) => {
            enokiModal.showModal({
              type: "error",
              title: "Error deleting teacher",
              message: "An error occurred while deleting the teacher.",
              cancelButtonText: "Close",
              hasCancelButton: true,
            });
          });
      },
    });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setFeed(teacher);
    setForms({
      addEditModal: true,
    });
  };

  return (
    <>
      <main
        className={`${poppins.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}
      >
        <div className="flex">
          <Sidebar userData={__userData} />
          <div className="flex-1">
            <header
              className={`${inter.className} p-5 bg-blue-600 text-white w-full sticky top-0 z-10 flex gap-5 justify-between items-center`}
            >
              <div className="flex items-center gap-5">
                <div>
                  <Users size="30" strokeWidth={1.2} />
                </div>
                <div>
                  <h1 className="font-[600]  text-white text-sm">Teachers</h1>
                  <p className="font-[400] text-white/70 text-xs">
                    Manage your teaching staff and their information
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5 flex-1 justify-end">
                <div className="relative max-w-lg flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-200" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-b-1 border-blue-400 text-white leading-5 placeholder-neutral-200 focus:outline-none focus:border-transparent"
                    placeholder="Search teachers..."
                  />
                </div>
                <button
                  onClick={handleAddTeacher}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <UserPlus size="20" />
                  Add Teacher
                </button>
              </div>
            </header>

            <div className="main-panel p-5">
              {facultyPending && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading teachers...</p>
                  </div>
                </div>
              )}

              {/* {facultyError && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Error Loading Teachers
                    </h3>
                    <p className="text-gray-600 mb-4">{facultyError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )} */}

              {!facultyPending && !facultyError && facultyData.length === 0 && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No Teachers Yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No teachers have been added yet.
                    </p>
                  </div>
                </div>
              )}

              {!facultyPending &&
                !facultyError &&
                facultyData.length > 0 &&
                filteredTeachers.length === 0 &&
                searchTerm.trim() !== "" && (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No Teachers Found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        No teachers match {searchTerm}
                      </p>
                      <button
                        onClick={handleAddTeacher}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
                      >
                        <UserPlus size="20" />
                        Add First Teacher
                      </button>
                    </div>
                  </div>
                )}

              {/* Success State - Teachers Grid */}
              {!facultyPending &&
                !facultyError &&
                filteredTeachers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher, index) => (
                      <div
                        key={teacher.id}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 flex flex-col h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {teacher.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .filter(
                                    (_, i, arr) => i < 2 || i === arr.length - 1
                                  )
                                  .join("")}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {teacher.name}
                              </h3>

                              <p className="text-sm text-gray-500">
                                {
                                  departmentsData.find(
                                    (d: Department) =>
                                      d.id === teacher.departmentId
                                  )?.name
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size="14" />
                            <span>{teacher.email}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CreditCard size="14" />
                            <span className="uppercase">
                              {teacher.employeeRfidHash}
                            </span>
                          </div>
                          {teacher.statistics.status === "IN_CLASS" &&
                            teacher.room && (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Building2 size="14" />
                                <span>
                                  RM {teacher.room.toString().toUpperCase()}
                                </span>
                              </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => handleEditTeacher(teacher)}
                            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-1"
                          >
                            <Edit3 size="14" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors duration-200 flex items-center justify-center gap-1"
                          >
                            <Trash2 size="14" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              <AnimatePresence>
                {forms.addEditModal && (
                  <AddEditTeacherModal
                    apiLink={api}
                    isEditing={false}
                    departments={departmentsData}
                    institutionId={__userData.institutionId}
                    feed={feed}
                    close={() => {
                      setForms((pv) => ({
                        addEditModal: false,
                      }));
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
