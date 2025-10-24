import Sidebar from "@/components/Sidebar";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  BookOpen,
  Users,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Inter } from "next/font/google";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";
import { useSelector } from "react-redux";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CircularProgress from "@mui/material/CircularProgress";

const inter = Inter({ subsets: ["latin"] });

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Course interface
interface Course {
  id: number;
  name: string;
  createdDate: string;
  students?: {
    id: number;
    name: string;
  }[];
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function Courses({
  user,
  queries,
  api,
}: {
  user: any;
  queries: any;
  api: string;
}) {
  const queryClient = useQueryClient();

  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;

  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "edit" | "delete";
    course?: Course;
  } | null>(null);

  // Promise imitation states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Course[] | null>(null);

  const [formData, setFormData] = useState({
    name: "",
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

  useEffect(() => {
    const filtered = coursesData.filter((course: Course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [coursesData, searchTerm]);

  const handleAddCourse = () => {
    setEditingCourse(null);
    setFormData({
      name: "",
    });
    setShowModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setConfirmAction({ type: "edit", course });
    setShowConfirmDialog(true);
  };

  const confirmEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
    });
    setShowModal(true);
    setShowConfirmDialog(false);
  };

  const handleDeleteCourse = (course: Course) => {
    setConfirmAction({ type: "delete", course });
    setShowConfirmDialog(true);
  };

  const confirmDeleteCourse = async (courseId: number) => {
    try {
      await queryClient.fetchQuery({
        queryKey: ["coursesMutation"],
        queryFn: async () => {
          const res = await axios.post(`${api}/delete-course`, {
            id: courseId,
          });
          return res.data;
        },
      });
      courseRefetch();
      setShowConfirmDialog(false);
    } catch (err) {
      console.log(err);
      setShowConfirmDialog(false);
    }
  };

  const handleSaveCourse = async () => {
    try {
      if (editingCourse) {
        await queryClient.fetchQuery({
          queryKey: ["coursesMutation"],
          queryFn: async () => {
            const res = await axios.post(`${api}/edit-course`, {
              name: formData.name,
              id: editingCourse.id,
            });
            return res.data;
          },
        });
        courseRefetch();
        setShowModal(false);
      } else {
        await queryClient.fetchQuery({
          queryKey: ["coursesMutation"],
          queryFn: async () => {
            const res = await axios.post(`${api}/create-course`, {
              name: formData.name,
              institutionId: __userData.institutionId,
            });
            return res.data;
          },
        });
        courseRefetch();
        setShowModal(false);
      }
    } catch (e) {
      setShowModal(false);
    }
  };

  return (
    <>
      <main
        className={`${poppins.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}
      >
        <div className="flex">
          <Sidebar userData={__userData} />
          <div className="flex-1 relative">
            <header
              className={`${inter.className} p-5 bg-blue-600 text-white w-full sticky top-0 z-10 flex gap-5 justify-between items-center`}
            >
              <div className="flex items-center gap-5">
                <div>
                  <BookOpen size="30" strokeWidth={1.2} />
                </div>
                <div>
                  <h1 className="font-[600] text-2xl text-white text-sm">
                    Courses
                  </h1>
                  <p className="font-[400] text-white/70 text-xs">
                    Manage academic courses and their students
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
                    placeholder="Search courses..."
                  />
                </div>
                <button
                  onClick={handleAddCourse}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                
                >
                  <Plus size="20" />
                  Add Course
                </button>
              </div>
            </header>

            <div className="main-panel p-5">
              <AnimatePresence>
                {coursesRefetching && (
                  <div

                    key={"EXIC"}
                   
                    className="refetch p-5 flex gap-5 items-center absolute bottom-0 right-0"
                  >
                    <CircularProgress
                      size={20}
                      thickness={5}
                      disableShrink
                      sx={{
                        color: "black",
                      }}
                    />{" "}
                    <span>Getting latest data...</span>
                  </div>
                )}
              </AnimatePresence>

              {coursesPending && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading courses...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {coursesError && !coursesFetching && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Error Loading Courses
                    </h3>
                    <p className="text-gray-600 mb-4">{error}</p>
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
              {!coursesPending && !coursesError && coursesData.length === 0 && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No Courses Yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No courses have been created yet.
                    </p>

                    <button
                      onClick={handleAddCourse}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
                     
                    >
                      <Plus size="20" />
                      Add First Course
                    </button>
                  </div>
                </div>
              )}

              {!coursesPending &&
                !coursesError &&
                coursesData.length > 0 &&
                filteredCourses.length === 0 &&
                searchTerm.trim() !== "" && (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No Courses Found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        No courses match "${searchTerm}"
                      </p>
                    </div>
                  </div>
                )}

              {!coursesPending &&
                !coursesError &&
                filteredCourses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course, index) => {
                      return (
                        <div
                          key={course.id}
                          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 flex flex-col h-full"
                         
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                                <BookOpen size="20" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {course.name}
                                </h3>
                                <p className="text-sm text-gray-500">Course</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users size="14" />
                              <span>{course.students?.length || 0} Students</span>
                            </div>

                            {course.students && course.students.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-700 mb-2">
                                  Enrolled Students:
                                </p>
                                <div className="space-y-1">
                                  {course.students
                                    .slice(0, 3)
                                    .map((student: any) => (
                                      <p
                                        key={student.id}
                                        className="text-xs text-gray-600"
                                      >
                                        • {student.name}
                                      </p>
                                    ))}
                                  {course.students.length > 3 && (
                                    <p className="text-xs text-blue-600 font-medium">
                                      +{course.students.length - 3} more
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-auto">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-1"
                            
                            >
                              <Edit3 size="14" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course)}
                              className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors duration-200 flex items-center justify-center gap-1"
                            
                            >
                              <Trash2 size="14" />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Add/Edit Course Modal */}
              <AnimatePresence>
                {showModal && (
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  
                  >
                    <div
                      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md"
                    
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2
                          className={`${spaceGrotesk.className} text-2xl font-bold text-gray-800`}
                        >
                          {editingCourse ? "Edit Course" : "Add New Course"}
                        </h2>
                        <button
                          onClick={() => setShowModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <X size="20" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course Name
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
                            placeholder="Enter course name"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mt-8">
                        <button
                          onClick={() => setShowModal(false)}
                          className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCourse}
                          disabled={!formData.name.trim()}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
       
                        >
                          <Save size="16" />
                          {editingCourse ? "Update Course" : "Add Course"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* Confirmation Dialog */}
              <AnimatePresence>
                {showConfirmDialog && confirmAction && (
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  
                  >
                    <div
                      className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md"
                     
                    >
                      <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                          <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3
                          className={`${spaceGrotesk.className} text-lg font-semibold text-gray-900 mb-2`}
                        >
                          {confirmAction.type === "edit" && "Edit Course"}
                          {confirmAction.type === "delete" && "Delete Course"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          {confirmAction.type === "edit" &&
                            `Are you sure you want to edit ${confirmAction.course?.name}?`}
                          {confirmAction.type === "delete" &&
                            `Are you sure you want to delete ${confirmAction.course?.name}? This action cannot be undone.`}
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowConfirmDialog(false)}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                          
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirmAction.type === "edit" &&
                                confirmAction.course
                              ) {
                                confirmEditCourse(confirmAction.course);
                              } else if (
                                confirmAction.type === "delete" &&
                                confirmAction.course
                              ) {
                                confirmDeleteCourse(confirmAction.course.id);
                              }
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                              confirmAction.type === "delete"
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                          
                          >
                            {confirmAction.type === "edit" && "Edit"}
                            {confirmAction.type === "delete" && "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
