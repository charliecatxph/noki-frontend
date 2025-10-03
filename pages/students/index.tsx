import Sidebar from "@/components/Sidebar";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  UserPlus,
  Edit3,
  Trash2,
  X,
  Save,
  Mail,
  Phone,
  CreditCard,
  WifiOff,
  AlertTriangle,
  GraduationCap,
  Search,
} from "lucide-react";
import { Inter } from "next/font/google";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";
import { useSelector } from "react-redux";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const inter = Inter({ subsets: ["latin"] });

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Student interface (no status)
interface Student {
  id: number;
  name: string;
  studentId: string;
  email: string;
  studentRfidHash: string;
  avatar: string;
  course: any;
  courseId: string;
  department: any;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function Students({ api, queries, user }: any) {
  const queryClient = useQueryClient();
  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;

  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  // 🔥 HOTSWAP LOCATION: Change this to `true` to enable RFID reader
  const [rfidReaderOnline, setRfidReaderOnline] = useState(false);
  const [isListeningForRfid, setIsListeningForRfid] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "edit" | "delete";
    student?: Student;
  } | null>(null);
  const router = useRouter();
  const [newCourse, setNewCourse] = useState("");
  const [rfidPulse, setRfidPulse] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    course: "",
    rfidTag: "",
  });

  const {
    data: studentsData = [],
    isSuccess: studentsSuccess,
    isPending: studentsPending,
    isFetching: studentsFetching,
    isError: studentsError,
    refetch: studentRefetch,
    isRefetching: studentsRefetching,
  } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-students`, {
        params: {
          institutionId: __userData.id,
        },
      });
      return res.data.data;
    },
    enabled: !!__userData.id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const {
    data: coursesData = [],
    isSuccess: coursesSuccess,
    isPending: coursesPending,
    isFetching: coursesFetching,
    isError: coursesError,
    refetch: courseRefetch,
    isRefetching: coursesRefetching,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-courses`, {
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

  // Search functionality
  useEffect(() => {
    const filtered = studentsData.filter(
      (student: Student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [studentsData, searchTerm]);

  // Socket.IO connection for RFID scanning
  useEffect(() => {
    if (showModal) {
      // Connect to RFID websocket when modal opens
      socketRef.current = io("http://localhost:10000");

      socketRef.current.on("rfid-sig", (data: { rfidData: string }) => {
        setFormData((prev) => ({ ...prev, rfidTag: data.rfidData }));
        setRfidReaderOnline(true);
        // Trigger pulse animation
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

  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      email: "",
      studentId: "",
      course: "",
      rfidTag: "",
    });
    setShowModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setConfirmAction({ type: "edit", student });
    setShowConfirmDialog(true);
  };

  const confirmEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      course: student.courseId,
      rfidTag: student.studentRfidHash,
    });
    setShowModal(true);
    setShowConfirmDialog(false);
  };

  const handleDeleteStudent = (student: Student) => {
    setConfirmAction({ type: "delete", student });
    setShowConfirmDialog(true);
  };

  const confirmDeleteStudent = async (studentId: number) => {
    try {
      await queryClient.fetchQuery({
        queryKey: ["studentsMutation"],
        queryFn: async () => {
          const res = await axios.post(`${api}/delete-student`, {
            id: studentId,
          });
          return res.data;
        },
      });
      studentRefetch();
      setShowConfirmDialog(false);
    } catch (err) {
      console.log(err);
      setShowConfirmDialog(false);
    }
  };

  const handleSaveStudent = async () => {
    try {
      if (editingStudent) {
        await queryClient.fetchQuery({
          queryKey: ["studentsMutation"],
          queryFn: async () => {
            const res = await axios.post(`${api}/edit-student`, {
              name: formData.name,
              id: editingStudent.id,
              email: formData.email,
              studentId: formData.studentId,
              courseId: formData.course,
              studentRfidHash: formData.rfidTag,
              institutionId: __userData.id,
            });
            return res.data;
          },
        });
        studentRefetch();
        setShowModal(false);
      } else {
        await queryClient.fetchQuery({
          queryKey: ["studentsMutation"],
          queryFn: async () => {
            const res = await axios.post(`${api}/add-student`, {
              name: formData.name,
              email: formData.email,
              studentId: formData.studentId,
              courseId: formData.course,
              studentRfidHash: formData.rfidTag,
              institutionId: __userData.id,
            });
            return res.data;
          },
        });
        studentRefetch();
        setShowModal(false);
      }
    } catch (e) {
      setShowModal(false);
    }
  };

  const handleStudentClick = (studentId: number) => {
    router.push(`/student/${studentId}`);
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
                  <GraduationCap size="30" strokeWidth={1.2} />
                </div>
                <div>
                  <h1 className="font-[600]  text-white text-sm">Students</h1>
                  <p className="font-[400] text-white/70 text-xs">
                    Manage your student body and their information
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
                    placeholder="Search students..."
                  />
                </div>
                <motion.button
                  onClick={handleAddStudent}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserPlus size="20" />
                  Add Student
                </motion.button>
              </div>
            </header>
            <div className="main-panel p-5">
              {studentsPending && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {studentsError && !studentsFetching && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Error Loading Students
                    </h3>
                    <p className="text-gray-600 mb-4">{studentsError}</p>
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
              {!studentsPending &&
                !studentsError &&
                studentsData.length === 0 && (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No Students Found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        No students have been enrolled yet.
                      </p>
                    </div>
                  </div>
                )}

              {!studentsPending &&
                !studentsError &&
                studentsData.length > 0 &&
                filteredStudents.length === 0 &&
                searchTerm.trim() !== "" && (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No Students Found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        No students match "${searchTerm}"
                      </p>

                      <motion.button
                        onClick={handleAddStudent}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <UserPlus size="20" />
                        Add First Student
                      </motion.button>
                    </div>
                  </div>
                )}

              {/* Success State - Students Grid */}
              {!studentsPending &&
                !studentsError &&
                filteredStudents.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student, index) => (
                      <motion.div
                        key={student.id}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 flex flex-col h-full cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                        onClick={() => handleStudentClick(student.id)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {student.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <GraduationCap size="14" />
                            <span className="font-mono">
                              {student.course?.name || "Unset or Deleted"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size="14" />
                            <span>{student.email}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CreditCard size="14" />
                            <span className="font-mono">
                              {student.studentRfidHash}
                            </span>
                          </div>
                        </div>

                        <div
                          className="flex gap-2 mt-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <motion.button
                            onClick={() => handleEditStudent(student)}
                            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-1"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Edit3 size="14" />
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteStudent(student)}
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

              {/* Add/Edit Student Modal */}
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
                          {editingStudent ? "Edit Student" : "Add New Student"}
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
                            Student Name
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
                            placeholder="Enter student name"
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Student ID
                          </label>
                          <input
                            type="text"
                            value={formData.studentId}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                studentId: e.target.value.toUpperCase(),
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                            placeholder="Enter student ID"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course
                          </label>
                          <select
                            value={formData.course}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                course: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Course</option>
                            {coursesData.map((course: any) => (
                              <option key={course.id} value={course.id}>
                                {course.name} ({course.id})
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
                              value={formData.rfidTag}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  rfidTag: e.target.value.toUpperCase(),
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
                          onClick={() => setShowModal(false)}
                          className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          onClick={handleSaveStudent}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Save size="16" />
                          {editingStudent ? "Update Student" : "Add Student"}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirmation Dialog */}
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
                          {confirmAction.type === "edit" && "Edit Student"}
                          {confirmAction.type === "delete" && "Delete Student"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          {confirmAction.type === "edit" &&
                            `Are you sure you want to edit ${confirmAction.student?.name}?`}
                          {confirmAction.type === "delete" &&
                            `Are you sure you want to delete ${confirmAction.student?.name}? This action cannot be undone.`}
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
                                confirmAction.student
                              ) {
                                confirmEditStudent(confirmAction.student);
                              } else if (
                                confirmAction.type === "delete" &&
                                confirmAction.student
                              ) {
                                confirmDeleteStudent(confirmAction.student.id);
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
