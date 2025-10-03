import Sidebar from "@/components/Sidebar";
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
} from "lucide-react";
import { Inter } from "next/font/google";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";
import { useSelector } from "react-redux";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { isPending } from "@reduxjs/toolkit";
import moment from "moment";

const inter = Inter({ subsets: ["latin"] });
type TStatus = "IN_OFFICE" | "BREAK" | "IN_CLASS" | "ABSENT" | "LEAVE";

// Teacher interface
interface Teacher {
  id: number;
  name: string;
  email: string;
  departmentId: string;
  employeeRfidHash: string;
  statistics: {
    status: TStatus;
  };
  room?: string; // Optional room number for in-class status
  avatar: string;
  joinDate: string;
  schedule?: any; // Schedule data for existing teachers
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "IN_OFFICE":
      return "bg-green-500";
    case "BREAK":
      return "bg-yellow-500";
    case "IN_CLASS":
      return "bg-blue-500";
    case "ABSENT":
      return "bg-red-500";
    case "LEAVE":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "IN_OFFICE":
      return "In Office";
    case "BREAK":
      return "Break";
    case "IN_CLASS":
      return "In Class";
    case "ABSENT":
      return "Absent";
    case "LEAVE":
      return "Leave";
    default:
      return "Unknown";
  }
};

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

const createTimeSlot = (
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  type: "class" | "break",
  label?: string
): TimeSlot => {
  // Convert hours and minutes to seconds from start of day
  const startSeconds = startHour * 3600 + startMinute * 60;
  const endSeconds = endHour * 3600 + endMinute * 60;

  return {
    id: Math.random().toString(36).substr(2, 9),
    startTime: startSeconds,
    endTime: endSeconds,
    type,
    label,
  };
};

// Helper function to convert seconds from start of day to time string for input fields
const secondsToTimeString = (secondsFromStartOfDay: number): string => {
  const hours = Math.floor(secondsFromStartOfDay / 3600);
  const minutes = Math.floor((secondsFromStartOfDay % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

// Helper function to convert time string to seconds from start of day
const timeStringToSeconds = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 3600 + minutes * 60;
};

const checkTimeSlotCollision = (
  newSlot: TimeSlot,
  existingSlots: TimeSlot[]
): boolean => {
  return existingSlots.some((slot) => {
    return newSlot.startTime < slot.endTime && newSlot.endTime > slot.startTime;
  });
};

const validateSchedule = (schedule: WeeklySchedule): string[] => {
  const errors: string[] = [];

  schedule.schedule.forEach((daySchedule) => {
    const sortedSlots = [...daySchedule.timeSlots].sort(
      (a, b) => a.startTime - b.startTime
    );

    for (let i = 0; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];

      // Check if start time is before end time
      if (currentSlot.startTime >= currentSlot.endTime) {
        errors.push(
          `${daySchedule.day}: Invalid time slot - start time must be before end time`
        );
      }

      // Check for overlaps with other slots
      for (let j = i + 1; j < sortedSlots.length; j++) {
        const nextSlot = sortedSlots[j];
        if (checkTimeSlotCollision(currentSlot, [nextSlot])) {
          errors.push(
            `${
              daySchedule.day
            }: Time slot collision detected between ${formatTime(
              currentSlot.startTime
            )}-${formatTime(currentSlot.endTime)} and ${formatTime(
              nextSlot.startTime
            )}-${formatTime(nextSlot.endTime)}`
          );
        }
      }
    }
  });

  return errors;
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function Teachers({ user, queries, api }: any) {
  const queryClient = useQueryClient();

  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;

  const [teachers, setTeachers] = useState<Teacher[]>();
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  // 🔥 HOTSWAP LOCATION: Change this to `true` to enable RFID reader
  const [rfidReaderOnline, setRfidReaderOnline] = useState(false);
  const [isListeningForRfid, setIsListeningForRfid] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "edit" | "delete" | "status";
    teacher?: Teacher;
    newStatus?: "free" | "in-class" | "absent";
  } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [rfidPulse, setRfidPulse] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule>({
    schedule: [
      { day: "monday", timeSlots: [] },
      { day: "tuesday", timeSlots: [] },
      { day: "wednesday", timeSlots: [] },
      { day: "thursday", timeSlots: [] },
      { day: "friday", timeSlots: [] },
      { day: "saturday", timeSlots: [] },
      { day: "sunday", timeSlots: [] },
    ],
  });
  const [selectedDay, setSelectedDay] = useState<string>("monday");
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);
  const [pendingTeacherData, setPendingTeacherData] = useState<any>(null);

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
    if (facultyPending && facultyData.length === 0) return;
    const filtered = facultyData
      .filter(
        (teacher: any) =>
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.departmentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    setFilteredTeachers(filtered);
  }, [facultyData, searchTerm, facultyPending]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    employeeRfidHash: "",
  });

  useEffect(() => {
    if (showModal) {
      socketRef.current = io("http://localhost:10000");

      socketRef.current.on("rfid-sig", (data: { rfidData: string }) => {
        setFormData((prev) => ({ ...prev, employeeRfidHash: data.rfidData }));
        setRfidReaderOnline(true);
        setRfidPulse(true);
        const audio = new Audio("notification.mp3");
        audio.play();
        setTimeout(() => setRfidPulse(false), 1000);
      });

      socketRef.current.on("connect", () => {
        setRfidReaderOnline(true);
      });

      socketRef.current.on("disconnect", () => {
        setRfidReaderOnline(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [showModal]);

  const clearScheduleData = () => {
    setCurrentSchedule({
      schedule: [
        { day: "monday", timeSlots: [] },
        { day: "tuesday", timeSlots: [] },
        { day: "wednesday", timeSlots: [] },
        { day: "thursday", timeSlots: [] },
        { day: "friday", timeSlots: [] },
        { day: "saturday", timeSlots: [] },
        { day: "sunday", timeSlots: [] },
      ],
    });
    setSelectedDay("monday");
    setScheduleErrors([]);
    setPendingTeacherData(null);
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setFormData({
      name: "",
      email: "",
      department: "",
      employeeRfidHash: "",
    });
    clearScheduleData(); // Clear any previous schedule data
    setShowModal(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setConfirmAction({ type: "edit", teacher });
    clearScheduleData(); // Clear any previous schedule data
    // Load existing teacher schedule data if available
    if (teacher.schedule) {
      feedScheduleData({ json: teacher.schedule });
    }
    setShowConfirmDialog(true);
  };

  const confirmEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      department: teacher.departmentId,
      employeeRfidHash: teacher.employeeRfidHash,
    });
    setShowModal(true);
    setShowConfirmDialog(false);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setConfirmAction({ type: "delete", teacher });
    setShowConfirmDialog(true);
  };

  const confirmDeleteTeacher = async (teacherId: number) => {
    try {
      await queryClient.fetchQuery({
        queryKey: ["teachersMutation"],
        queryFn: async () => {
          const res = await axios.post(`${api}/delete-teacher`, {
            id: teacherId,
          });
          return res.data;
        },
      });
      facultyRefetch();
      setShowConfirmDialog(false);
    } catch (err) {
      console.log(err);
      setShowConfirmDialog(false);
    }
  };

  const handleSaveTeacher = async () => {
    // Don't save teacher yet, just prepare the data and open schedule modal
    const teacherData = {
      isEdit: !!editingTeacher,
      id: editingTeacher?.id,
      name: formData.name,
      email: formData.email,
      departmentId: formData.department,
      employeeRfidHash: formData.employeeRfidHash,
      institutionId: __userData.id,
    };

    setPendingTeacherData(teacherData);
    setShowModal(false);
    setCurrentSchedule((prev) => ({
      ...prev,
      teacherId: teacherData.id || Date.now(),
    }));
    setShowScheduleModal(true);
  };

  // Schedule management functions
  const addTimeSlot = (day: string, type: "class" | "break") => {
    // Find the latest end time in the current day to add the new slot after it
    const currentDaySchedule = currentSchedule.schedule.find(
      (d) => d.day === day
    );
    let startHour = 8; // Default start time
    let startMinute = 0;

    if (currentDaySchedule && currentDaySchedule.timeSlots.length > 0) {
      // Find the latest end time
      const latestEndTime = Math.max(
        ...currentDaySchedule.timeSlots.map((slot) => slot.endTime)
      );
      const latestEndHour = Math.floor(latestEndTime / 3600);
      const latestEndMinute = Math.floor((latestEndTime % 3600) / 60);

      // Start the new slot 30 minutes after the latest end time
      startHour = latestEndHour;
      startMinute = latestEndMinute + 30;

      // Handle minute overflow
      if (startMinute >= 60) {
        startHour += Math.floor(startMinute / 60);
        startMinute = startMinute % 60;
      }
    }

    const newSlot = createTimeSlot(
      startHour,
      startMinute,
      startHour + 1, // End 1 hour later
      startMinute,
      type,
      type === "break" ? "Break" : "Class"
    );

    setCurrentSchedule((prev) => ({
      ...prev,
      schedule: prev.schedule.map((daySchedule) =>
        daySchedule.day === day
          ? { ...daySchedule, timeSlots: [...daySchedule.timeSlots, newSlot] }
          : daySchedule
      ),
    }));
  };

  const removeTimeSlot = (day: string, slotId: string) => {
    setCurrentSchedule((prev) => ({
      ...prev,
      schedule: prev.schedule.map((daySchedule) =>
        daySchedule.day === day
          ? {
              ...daySchedule,
              timeSlots: daySchedule.timeSlots.filter(
                (slot) => slot.id !== slotId
              ),
            }
          : daySchedule
      ),
    }));
  };

  const updateTimeSlot = (
    day: string,
    slotId: string,
    updates: Partial<TimeSlot>
  ) => {
    setCurrentSchedule((prev) => ({
      ...prev,
      schedule: prev.schedule.map((daySchedule) =>
        daySchedule.day === day
          ? {
              ...daySchedule,
              timeSlots: daySchedule.timeSlots.map((slot) =>
                slot.id === slotId ? { ...slot, ...updates } : slot
              ),
            }
          : daySchedule
      ),
    }));

    // Validate schedule after update
    const errors = validateSchedule(currentSchedule);
    setScheduleErrors(errors);
  };

  const handleScheduleSave = async () => {
    const errors = validateSchedule(currentSchedule);
    if (errors.length > 0) {
      setScheduleErrors(errors);
      return;
    }

    const scheduleJSON = [
      ...currentSchedule.schedule.map((day) => {
        // Check if day has no time slots (day off)
        if (day.timeSlots.length === 0) {
          return { dayOff: true };
        }

        // Separate class times and break times
        const classTimes: { cS: number; cE: number }[] = [];
        const breakTimes: { bS: number; bE: number }[] = [];

        day.timeSlots.forEach((slot) => {
          if (slot.type === "class") {
            classTimes.push({
              cS: slot.startTime,
              cE: slot.endTime,
            });
          } else if (slot.type === "break") {
            breakTimes.push({
              bS: slot.startTime,
              bE: slot.endTime,
            });
          }
        });

        return {
          dayOff: false,
          classTimes: classTimes,
          breakTimes: breakTimes,
        };
      }),
    ];

    setShowScheduleModal(false);

    // Now save the teacher data
    try {
      if (pendingTeacherData) {
        if (pendingTeacherData.isEdit) {
          await queryClient.fetchQuery({
            queryKey: ["teachersMutation"],
            queryFn: async () => {
              const res = await axios.post(`${api}/edit-teacher`, {
                id: pendingTeacherData.id,
                email: pendingTeacherData.email,
                name: pendingTeacherData.name,
                employeeRfidHash: pendingTeacherData.employeeRfidHash,
                departmentId: pendingTeacherData.departmentId,
                schedule: scheduleJSON,
              });
              return res.data;
            },
          });
        } else {
          await queryClient.fetchQuery({
            queryKey: ["teachersMutation"],
            queryFn: async () => {
              const res = await axios.post(`${api}/add-teacher`, {
                name: pendingTeacherData.name,
                email: pendingTeacherData.email,
                departmentId: pendingTeacherData.departmentId,
                employeeRfidHash: pendingTeacherData.employeeRfidHash,
                institutionId: pendingTeacherData.institutionId,
                schedule: scheduleJSON,
              });
              return res.data;
            },
          });
        }
      }

      clearScheduleData(); // Clear schedule data after successful save
      facultyRefetch();
    } catch (e) {
      console.log(e);
      setScheduleErrors(["Error saving teacher data"]);
    }
  };

  // Data pipeline input function for feeding schedule data
  // Usage: feedScheduleData({"json":[{"dayOff":false,"breakTimes":[{"bE":46800,"bS":39600}],"classTimes":[{"cE":30600,"cS":25200}]}]})
  const feedScheduleData = (scheduleData: any) => {
    try {
      const dayNames = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      if (!scheduleData.json || !Array.isArray(scheduleData.json)) {
        throw new Error("Invalid schedule data format");
      }

      const newSchedule: DaySchedule[] = scheduleData.json.map(
        (dayData: any, index: number) => {
          const dayName = dayNames[index] as
            | "monday"
            | "tuesday"
            | "wednesday"
            | "thursday"
            | "friday"
            | "saturday"
            | "sunday";
          const timeSlots: TimeSlot[] = [];

          if (dayData.dayOff) {
            return { day: dayName, timeSlots: [] };
          }

          // Convert class times
          if (dayData.classTimes && Array.isArray(dayData.classTimes)) {
            dayData.classTimes.forEach((classTime: any, classIndex: number) => {
              timeSlots.push({
                id: `class-${index}-${classIndex}`,
                startTime: classTime.cS,
                endTime: classTime.cE,
                type: "class",
                label: `Class ${classIndex + 1}`,
              });
            });
          }

          // Convert break times
          if (dayData.breakTimes && Array.isArray(dayData.breakTimes)) {
            dayData.breakTimes.forEach((breakTime: any, breakIndex: number) => {
              timeSlots.push({
                id: `break-${index}-${breakIndex}`,
                startTime: breakTime.bS,
                endTime: breakTime.bE,
                type: "break",
                label: `Break ${breakIndex + 1}`,
              });
            });
          }

          return { day: dayName, timeSlots };
        }
      );

      setCurrentSchedule((prev) => ({
        ...prev,
        schedule: newSchedule,
      }));

      setScheduleErrors([]);

      // Validate the imported schedule
      const errors = validateSchedule({
        ...currentSchedule,
        schedule: newSchedule,
      });
      if (errors.length > 0) {
        setScheduleErrors(errors);
      }
    } catch (error) {
      setScheduleErrors([
        `Data Feed Error: ${
          error instanceof Error ? error.message : "Invalid data format"
        }`,
      ]);
    }
  };

  const handleRfidScan = () => {
    if (rfidReaderOnline) {
      setIsListeningForRfid(true);
    }
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
                <motion.button
                  onClick={handleAddTeacher}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserPlus size="20" />
                  Add Teacher
                </motion.button>
              </div>
            </header>

            <div className="main-panel p-5">
              {/* Loading State */}
              {facultyPending && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading teachers...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {facultyError && (
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
              )}

              {/* Empty State */}
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
                      <motion.button
                        onClick={handleAddTeacher}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <UserPlus size="20" />
                        Add First Teacher
                      </motion.button>
                    </div>
                  </div>
                )}

              {/* Success State - Teachers Grid */}
              {!facultyPending &&
                !facultyError &&
                filteredTeachers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher, index) => (
                      <motion.div
                        key={teacher.id}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 flex flex-col h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
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
                              <div
                                className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                                  teacher.statistics.status
                                )} rounded-full border-2 border-white`}
                              ></div>
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
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              teacher.statistics.status === "IN_OFFICE"
                                ? "bg-green-100 text-green-700"
                                : teacher.statistics.status === "IN_CLASS"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {getStatusText(teacher.statistics.status)}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size="14" />
                            <span>{teacher.email}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CreditCard size="14" />
                            <span className="font-mono">
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
                          <motion.button
                            onClick={() => handleEditTeacher(teacher)}
                            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-1"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Edit3 size="14" />
                            Edit
                          </motion.button>

                          <motion.button
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors duration-200 flex items-center justify-center gap-1"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 size="14" />
                            Delete
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

              <AnimatePresence>
                {showModal && (
                  <motion.div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 20 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                      }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2
                          className={`${spaceGrotesk.className} text-2xl font-bold text-gray-800`}
                        >
                          {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
                        </h2>
                        <button
                          onClick={() => setShowModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <X size="20" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                          </label>

                          <select
                            value={formData.department}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                department: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="" disabled selected>
                              Select Department
                            </option>
                            {departmentsData.map((department: Department) => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            RFID Tag
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.employeeRfidHash}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  employeeRfidHash:
                                    e.target.value.toUpperCase(),
                                }))
                              }
                              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all duration-300 ${
                                rfidPulse
                                  ? "ring-4 ring-green-300 border-green-400 bg-green-50"
                                  : ""
                              }`}
                              placeholder="Enter RFID tag manually or scan with reader"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {rfidReaderOnline ? (
                                <div className="w-4 h-4 bg-green-500 rounded-full" />
                              ) : (
                                <WifiOff size="16" className="text-red-500" />
                              )}
                            </div>
                          </div>
                          <div
                            className={`mt-2 flex items-start gap-2 p-3 border rounded-lg ${
                              rfidReaderOnline
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            {rfidReaderOnline ? (
                              <div className="w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0" />
                            ) : (
                              <WifiOff
                                size="16"
                                className="text-red-600 mt-0.5 flex-shrink-0"
                              />
                            )}
                            <div
                              className={`text-sm ${
                                rfidReaderOnline
                                  ? "text-green-800"
                                  : "text-red-800"
                              }`}
                            >
                              <p className="font-medium">
                                {rfidReaderOnline
                                  ? "RFID Reader Connected"
                                  : "RFID Reader Offline"}
                              </p>
                              <p>
                                {rfidReaderOnline
                                  ? "Ready to scan RFID tags. Present a tag to the reader."
                                  : "Please type the RFID tag manually or connect the RFID reader."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-8">
                        <motion.button
                          onClick={() => {
                            setShowModal(false);
                            clearScheduleData(); // Clear schedule data when cancelling teacher form
                          }}
                          className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          onClick={handleSaveTeacher}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Save size="16" />
                          {editingTeacher ? "Update Teacher" : "Add Teacher"}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Schedule Modal */}
              <AnimatePresence>
                {showScheduleModal && (
                  <motion.div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 20 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                      }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2
                          className={`${spaceGrotesk.className} text-2xl font-bold text-gray-800 flex items-center gap-2`}
                        >
                          <Calendar size="24" />
                          Modify Schedule
                        </h2>
                        <button
                          onClick={() => {
                            setShowScheduleModal(false);
                            clearScheduleData(); // Clear schedule data when closing
                          }}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <X size="20" />
                        </button>
                      </div>

                      {/* Error Display */}
                      {scheduleErrors.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="text-red-600" size="16" />
                            <h3 className="font-semibold text-red-800">
                              Schedule Conflicts Detected
                            </h3>
                          </div>
                          <ul className="text-sm text-red-700 space-y-1">
                            {scheduleErrors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Day Selection */}
                        <div className="lg:col-span-1">
                          <h3 className="font-semibold text-gray-800 mb-4">
                            Select Day
                          </h3>
                          <div className="space-y-2">
                            {[
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                              "saturday",
                              "sunday",
                            ].map((day) => (
                              <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                  selectedDay === day
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Schedule Management */}
                        <div className="lg:col-span-3">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-800">
                              {selectedDay.charAt(0).toUpperCase() +
                                selectedDay.slice(1)}{" "}
                              Schedule
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  addTimeSlot(selectedDay, "class")
                                }
                                className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1"
                              >
                                <Plus size="14" />
                                Add Class
                              </button>
                              <button
                                onClick={() =>
                                  addTimeSlot(selectedDay, "break")
                                }
                                className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors duration-200 flex items-center gap-1"
                              >
                                <Coffee size="14" />
                                Add Break
                              </button>
                            </div>
                          </div>

                          {/* Time Slots */}
                          <div className="space-y-3">
                            {currentSchedule.schedule
                              .find((day) => day.day === selectedDay)
                              ?.timeSlots.sort(
                                (a, b) => a.startTime - b.startTime
                              )
                              .map((slot) => (
                                <div
                                  key={slot.id}
                                  className={`p-4 border rounded-lg ${
                                    slot.type === "class"
                                      ? "bg-blue-50 border-blue-200"
                                      : "bg-orange-50 border-orange-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {slot.type === "class" ? (
                                        <Clock
                                          className="text-blue-600"
                                          size="16"
                                        />
                                      ) : (
                                        <Coffee
                                          className="text-orange-600"
                                          size="16"
                                        />
                                      )}
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                                        <input
                                          type="text"
                                          value={slot.label || ""}
                                          onChange={(e) =>
                                            updateTimeSlot(
                                              selectedDay,
                                              slot.id,
                                              { label: e.target.value }
                                            )
                                          }
                                          placeholder={
                                            slot.type === "class"
                                              ? "Class name"
                                              : "Break description"
                                          }
                                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                        <input
                                          type="time"
                                          value={secondsToTimeString(
                                            slot.startTime
                                          )}
                                          onChange={(e) => {
                                            const newStartTime =
                                              timeStringToSeconds(
                                                e.target.value
                                              );
                                            updateTimeSlot(
                                              selectedDay,
                                              slot.id,
                                              {
                                                startTime: newStartTime,
                                              }
                                            );
                                          }}
                                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                        <input
                                          type="time"
                                          value={secondsToTimeString(
                                            slot.endTime
                                          )}
                                          onChange={(e) => {
                                            const newEndTime =
                                              timeStringToSeconds(
                                                e.target.value
                                              );
                                            updateTimeSlot(
                                              selectedDay,
                                              slot.id,
                                              {
                                                endTime: newEndTime,
                                              }
                                            );
                                          }}
                                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-gray-600">
                                            {formatTime(slot.startTime)} -{" "}
                                            {formatTime(slot.endTime)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeTimeSlot(selectedDay, slot.id)
                                      }
                                      className="text-red-500 hover:text-red-700 p-1"
                                    >
                                      <Minus size="16" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                            {currentSchedule.schedule.find(
                              (day) => day.day === selectedDay
                            )?.timeSlots.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <Calendar
                                  size="48"
                                  className="mx-auto mb-2 opacity-50"
                                />
                                <p>No time slots scheduled for {selectedDay}</p>
                                <p className="text-sm">
                                  Click "Add Class" or "Add Break" to get
                                  started
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-8">
                        <motion.button
                          onClick={() => {
                            setShowScheduleModal(false);
                            clearScheduleData(); // Clear schedule data when cancelling
                          }}
                          className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          onClick={handleScheduleSave}
                          disabled={scheduleErrors.length > 0}
                          className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                            scheduleErrors.length > 0
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl hover:from-green-600 hover:to-green-700"
                          }`}
                          whileHover={
                            scheduleErrors.length === 0 ? { scale: 1.01 } : {}
                          }
                          whileTap={
                            scheduleErrors.length === 0 ? { scale: 0.99 } : {}
                          }
                        >
                          <Save size="16" />
                          Save Schedule
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showConfirmDialog && confirmAction && (
                  <motion.div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md"
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 20 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                      }}
                    >
                      <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                          <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3
                          className={`${spaceGrotesk.className} text-lg font-semibold text-gray-900 mb-2`}
                        >
                          {confirmAction.type === "edit" && "Edit Teacher"}
                          {confirmAction.type === "delete" && "Delete Teacher"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          {confirmAction.type === "edit" &&
                            `Are you sure you want to edit ${confirmAction.teacher?.name}?`}
                          {confirmAction.type === "delete" &&
                            `Are you sure you want to delete ${confirmAction.teacher?.name}? This action cannot be undone.`}
                        </p>
                        <div className="flex gap-3">
                          <motion.button
                            onClick={() => setShowConfirmDialog(false)}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              if (
                                confirmAction.type === "edit" &&
                                confirmAction.teacher
                              ) {
                                confirmEditTeacher(confirmAction.teacher);
                              } else if (
                                confirmAction.type === "delete" &&
                                confirmAction.teacher
                              ) {
                                confirmDeleteTeacher(confirmAction.teacher.id);
                              }
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                              confirmAction.type === "delete"
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            {confirmAction.type === "edit" && "Edit"}
                            {confirmAction.type === "delete" && "Delete"}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
