import Sidebar from "@/components/Sidebar";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useRfidSocket } from "@/utils/useRfidSocket";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import AddEditStudentModal, { Student } from "@/components/AddEditStudentModal";
import { useEnokiModals } from "@/contexts/EnokiModalContext";
import { useEnokiMutator } from "@/hooks/useEnokiMutator";

const inter = Inter({ subsets: ["latin"] });

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function Students({ api, queries, user }: any) {
  const { deleteStudent } = useEnokiMutator();

  const queryClient = useQueryClient();
  const enokiModal = useEnokiModals();
  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;

  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [feed, setFeed] = useState<Student | null>(null);

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
          institutionId: __userData.institutionId,
        },
      });
      return res.data.data;
    },
    enabled: !!__userData.userId,
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

  // Search functionality
  useEffect(() => {
    const filtered = studentsData.filter(
      (student: Student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [studentsData, searchTerm]);

  const handleAddStudent = () => {
    setFeed(null);
    setShowModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setFeed(student);
    setShowModal(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    enokiModal.showModal({
      type: "warning",
      title: "Warning",
      message: "Are you sure you want to delete this student?",
      hasCancelButton: true,
      cancelButtonText: "Cancel",
      hasConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonFn: async () => {
        try {
          enokiModal.showModal({
            type: "loading",
            title: "Deleting Student",
            message: "",
            hasCancelButton: false,
            hasConfirmButton: false,
          });
          await deleteStudent.mutateAsync({ id: student.id });
          enokiModal.showModal({
            type: "success",
            title: "Success",
            message: "Student deleted successfully",
            hasCancelButton: true,
            cancelButtonText: "Close",
            autoCloseTimeout: 5000,
          });
        } catch (e) {
          enokiModal.showModal({
            type: "error",
            title: "Error",
            message: "Failed to delete student",
            hasCancelButton: true,
            cancelButtonText: "Close",
            autoCloseTimeout: 5000,
          });
        }
      },
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
                <button
                  onClick={handleAddStudent}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <UserPlus size="20" />
                  Add Student
                </button>
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
                        No students match "{searchTerm}"
                      </p>

                      <button
                        onClick={handleAddStudent}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
                      >
                        <UserPlus size="20" />
                        Add First Student
                      </button>
                    </div>
                  </div>
                )}

              {/* Success State - Students Grid */}
              {!studentsPending &&
                !studentsError &&
                filteredStudents.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student, index) => (
                      <div
                        key={student.id}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 flex flex-col h-full cursor-pointer"
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
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-1"
                          >
                            <Edit3 size="14" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
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

              {/* Add/Edit Student Modal */}
              <AnimatePresence>
                {showModal && (
                  <AddEditStudentModal
                    courses={coursesData}
                    institutionId={__userData.institutionId}
                    feed={feed}
                    close={() => setShowModal(false)}
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
