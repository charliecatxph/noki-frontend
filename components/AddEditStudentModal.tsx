import { useEnokiModals } from "@/contexts/EnokiModalContext";
import { useEnokiMutator } from "@/hooks/useEnokiMutator";
import { useEnokiValidators } from "@/hooks/useEnokiValidators";
import { useRfidSocket } from "@/utils/useRfidSocket";
import { CircularProgress } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Save, ShieldAlert, TriangleAlert, WifiOff, X } from "lucide-react";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useEffect, useState } from "react";
import z from "zod";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export interface Student {
  acctId: string;
  id: string;
  name: string;
  email: string;
  actType: string;
  updatedAt: string;
  createdAt: string;
  studentId: string;
  studentRfidHash: string;
  course: Course;
}

export interface Course {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  institutionId: string;
}

interface AddEditStudentModalProps {
  courses: Course[];
  institutionId: string;
  feed?: Pick<
    Student,
    | "acctId"
    | "id"
    | "name"
    | "email"
    | "studentId"
    | "studentRfidHash"
    | "course"
  > | null;
  close: () => void;
}

export default function AddEditStudentModal({
  courses,
  institutionId,
  feed,
  close,
}: AddEditStudentModalProps) {
  const { addStudent, editStudent } = useEnokiMutator();
  const { checkEmail, checkRfid, checkStudentId } = useEnokiValidators();
  const queryClient = useQueryClient();
  const enokiModals = useEnokiModals();
  const [runCheck, setRunCheck] = useState({
    email: false,
    studentId: false,
    rfidTag: false,
  });
  const [localData, setLocalData] = useState({
    name: {
      v: "",
      e: "",
    },
    email: {
      v: "",
      e: "",
    },
    studentId: {
      v: "",
      e: "",
    },
    course: {
      v: "",
      e: "",
    },
    rfidTag: {
      v: "",
      e: "",
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [ignore, setIgnore] = useState({
    email: false,
    studentId: false,
    rfidTag: false,
  });

  useEffect(() => {
    if (!feed) return;
    setLocalData({
      name: {
        v: feed.name,
        e: "",
      },
      email: {
        v: feed.email,
        e: "",
      },
      studentId: {
        v: feed.studentId,
        e: "",
      },
      course: {
        v: feed.course.id,
        e: "",
      },
      rfidTag: {
        v: feed.studentRfidHash,
        e: "",
      },
    });
  }, [feed]);

  useEffect(() => {
    if (!feed) return;
    if (localData.email.v === feed?.email) {
      setIgnore((pv) => ({
        ...pv,
        email: true,
      }));
    } else {
      setIgnore((pv) => ({
        ...pv,
        email: false,
      }));
    }
    if (localData.studentId.v === feed?.studentId) {
      setIgnore((pv) => ({
        ...pv,
        studentId: true,
      }));
    } else {
      setIgnore((pv) => ({
        ...pv,
        studentId: false,
      }));
    }
    if (localData.rfidTag.v === feed?.studentRfidHash) {
      setIgnore((pv) => ({
        ...pv,
        rfidTag: true,
      }));
    } else {
      setIgnore((pv) => ({
        ...pv,
        rfidTag: false,
      }));
    }
  }, [localData.email.v, localData.studentId.v, localData.rfidTag.v, feed]);

  useEffect(() => {
    if (!localData.email.v.trim()) return;
    if (ignore.email) return;

    const abort = new AbortController();

    const ttx = () => {
      if (!z.string().email().safeParse(localData.email.v).success) {
        setLocalData((pv) => ({
          ...pv,
          email: {
            ...pv.email,
            e: "E-Mail format is invalid.",
          },
        }));
        return;
      }

      setRunCheck((pv) => ({
        ...pv,
        email: true,
      }));
      checkEmail(localData.email.v, abort)
        .catch((e) => {
          setLocalData((pv) => ({
            ...pv,
            email: {
              ...pv.email,
              e: "Email already used",
            },
          }));
        })
        .finally(() => {
          setRunCheck((pv) => ({
            ...pv,
            email: false,
          }));
        });
    };

    const tmx = setTimeout(() => ttx(), 500);

    return () => {
      abort.abort();
      clearTimeout(tmx);
    };
  }, [localData.email.v, ignore.email]);

  useEffect(() => {
    if (!localData.studentId.v.trim()) return;
    if (ignore.studentId) return;
    const abort = new AbortController();

    const tpx = () => {
      setRunCheck((pv) => ({
        ...pv,
        studentId: true,
      }));
      checkStudentId(localData.studentId.v, institutionId, abort)
        .catch((e) => {
          setLocalData((pv) => ({
            ...pv,
            studentId: {
              ...pv.studentId,
              e: "Student ID already used",
            },
          }));
        })
        .finally(() => {
          setRunCheck((pv) => ({
            ...pv,
            studentId: false,
          }));
        });
    };

    const tmx = setTimeout(() => tpx(), 500);

    return () => {
      abort.abort();
      clearTimeout(tmx);
    };
  }, [localData.studentId.v, ignore.studentId]);

  useEffect(() => {
    if (!localData.rfidTag.v.trim()) return;
    if (ignore.rfidTag) return;
    const abort = new AbortController();

    const ttx = () => {
      setRunCheck((pv) => ({
        ...pv,
        rfidTag: true,
      }));
      checkRfid(localData.rfidTag.v, institutionId, abort)
        .catch((e) => {
          setLocalData((pv) => ({
            ...pv,
            rfidTag: {
              ...pv.rfidTag,
              e: "RFID already used",
            },
          }));
        })
        .finally(() => {
          setRunCheck((pv) => ({
            ...pv,
            rfidTag: false,
          }));
        });
    };

    const tmx = setTimeout(() => ttx(), 500);

    return () => {
      abort.abort();
      clearTimeout(tmx);
    };
  }, [localData.rfidTag.v, ignore.rfidTag]);

  const {
    rfidData,
    isOnline: rfidReaderOnline,
    isPulsing: rfidPulse,
  } = useRfidSocket({
    enabled: true,
    onRfidData: (data) => {
      if (data.type !== "RFID-READ") return;
      setLocalData((prev) => ({ ...prev, rfidTag: { v: data.data, e: "" } }));
    },
    playSound: true,
    soundFile: "notification.mp3",
  });

  const handleSaveStudent = async () => {
    // prevalidation
    let ok = true;
    let svd = true;

    if (!localData.name.v.trim()) {
      ok = false;
      setLocalData((pv) => ({
        ...pv,
        name: {
          ...pv.name,
          e: "Name is required.",
        },
      }));
    }

    if (!z.string().email().safeParse(localData.email.v).success) {
      setLocalData((pv) => ({
        ...pv,
        email: {
          ...pv.email,
          e: "E-Mail format is invalid.",
        },
      }));
    }

    if (!localData.studentId.v.trim()) {
      ok = false;
      setLocalData((pv) => ({
        ...pv,
        studentId: {
          ...pv.studentId,
          e: "Student ID is required.",
        },
      }));
    }

    if (!localData.rfidTag.v.trim()) {
      ok = false;
      setLocalData((pv) => ({
        ...pv,
        rfidTag: {
          ...pv.rfidTag,
          e: "RFID is required.",
        },
      }));
    }

    if (!localData.course.v.trim()) {
      ok = false;
      setLocalData((pv) => ({
        ...pv,
        course: {
          ...pv.course,
          e: "Course is required.",
        },
      }));
    }

    if (!localData.rfidTag.v.trim()) {
      ok = false;
      setLocalData((pv) => ({
        ...pv,
        rfidTag: {
          ...pv.rfidTag,
          e: "RFID is required.",
        },
      }));
    }

    if (!ok) return;
    // server-side checks

    if (!ignore.email) {
      // check email in server
      setRunCheck((pv) => ({
        ...pv,
        email: true,
      }));
      await checkEmail(localData.email.v)
        .catch((e) => {
          svd = false;
          setLocalData((pv) => ({
            ...pv,
            email: {
              ...pv.email,
              e: "Email already used",
            },
          }));
        })
        .finally(() => {
          setRunCheck((pv) => ({
            ...pv,
            email: false,
          }));
        });
    }

    if (!ignore.studentId) {
      // check student id in server
      setRunCheck((pv) => ({
        ...pv,
        studentId: true,
      }));
      await checkStudentId(localData.studentId.v, institutionId)
        .catch((e) => {
          svd = false;
          setLocalData((pv) => ({
            ...pv,
            studentId: {
              ...pv.studentId,
              e: "Student ID already used",
            },
          }));
        })
        .finally(() => {
          setRunCheck((pv) => ({
            ...pv,
            studentId: false,
          }));
        });
    }
    if (!ignore.rfidTag) {
      // check rfid tag in server
      setRunCheck((pv) => ({
        ...pv,
        rfidTag: true,
      }));
      await checkRfid(localData.rfidTag.v, institutionId)
        .catch((e) => {
          svd = false;
          setLocalData((pv) => ({
            ...pv,
            rfidTag: {
              ...pv.rfidTag,
              e: "RFID already used",
            },
          }));
        })
        .finally(() => {
          setRunCheck((pv) => ({
            ...pv,
            rfidTag: false,
          }));
        });
    }

    if (!svd) return;

    // try to save
    setIsSaving(true);
    if (feed) {
      try {
        await editStudent.mutateAsync({
          id: feed.id,
          name: localData.name.v,
          email: localData.email.v,
          studentId: localData.studentId.v,
          studentRfidHash: localData.rfidTag.v,
          courseId: localData.course.v,
        });
        close();
        enokiModals.showModal({
          type: "success",
          title: "Success",
          message: "Student updated successfully",
          hasCancelButton: true,
          cancelButtonText: "Close",
          autoCloseTimeout: 5000,
        });
      } catch (e) {
        close();
        enokiModals.showModal({
          type: "error",
          title: "Error",
          message: "Failed to update student",
          hasCancelButton: true,
          cancelButtonText: "Close",
          autoCloseTimeout: 5000,
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      try {
        await addStudent.mutateAsync({
          name: localData.name.v,
          email: localData.email.v,
          studentId: localData.studentId.v,
          studentRfidHash: localData.rfidTag.v,
          courseId: localData.course.v,
          institutionId: institutionId,
        });
        close();
        enokiModals.showModal({
          type: "success",
          title: "Success",
          message: "Student added successfully",
          hasCancelButton: true,
          cancelButtonText: "Close",
          autoCloseTimeout: 5000,
        });
      } catch (e) {
        close();
        enokiModals.showModal({
          type: "error",
          title: "Error",
          message: "Failed to add student",
          hasCancelButton: true,
          cancelButtonText: "Close",
          autoCloseTimeout: 5000,
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
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
            {feed ? "Edit Student" : "Add New Student"}
          </h2>
          <button
            onClick={() => close()}
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
              value={localData.name.v}
              onChange={(e) =>
                setLocalData((prev) => ({
                  ...prev,
                  name: {
                    v: e.target.value,
                    e: "",
                  },
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter student name"
            />
            {localData.name.e && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-2">
                <TriangleAlert size="12" /> {localData.name.e}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={localData.email.v}
              onChange={(e) =>
                setLocalData((prev) => ({
                  ...prev,
                  email: {
                    v: e.target.value,
                    e: "",
                  },
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
            {localData.email.e && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-2">
                <TriangleAlert size="12" /> {localData.email.e}
              </p>
            )}
            {runCheck.email && (
              <p className="text-blue-500 text-xs mt-1 flex items-center gap-2 font-[500]">
                <CircularProgress
                  disableShrink
                  size="8"
                  thickness={5}
                  className="w-[15px]"
                  sx={{ color: "blue" }}
                />{" "}
                Checking E-Mail...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student ID
            </label>
            <input
              type="text"
              value={localData.studentId.v}
              onChange={(e) =>
                setLocalData((prev) => ({
                  ...prev,
                  studentId: {
                    v: e.target.value.toUpperCase(),
                    e: "",
                  },
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="Enter student ID"
            />
            {localData.studentId.e && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-2">
                <TriangleAlert size="12" /> {localData.studentId.e}
              </p>
            )}
            {runCheck.studentId && (
              <p className="text-blue-500 text-xs mt-1 flex items-center gap-2 font-[500]">
                <CircularProgress
                  disableShrink
                  size="8"
                  thickness={5}
                  className="w-[15px]"
                  sx={{ color: "blue" }}
                />{" "}
                Checking student ID...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              value={localData.course.v}
              onChange={(e) =>
                setLocalData((prev) => ({
                  ...prev,
                  course: {
                    v: e.target.value,
                    e: "",
                  },
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Course</option>
              {courses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.id})
                </option>
              ))}
            </select>
            {localData.course.e && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-2">
                <TriangleAlert size="12" /> {localData.course.e}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFID Tag
            </label>
            <div className="relative">
              <input
                type="text"
                value={localData.rfidTag.v}
                onChange={(e) =>
                  setLocalData((prev) => ({
                    ...prev,
                    rfidTag: {
                      v: e.target.value.toUpperCase(),
                      e: "",
                    },
                  }))
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all duration-300 ${
                  rfidPulse
                    ? "ring-4 ring-green-300 border-green-400 bg-green-50"
                    : ""
                }`}
                placeholder="Enter RFID tag manually or scan with reader"
              />
              {localData.rfidTag.e && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-2">
                  <TriangleAlert size="12" /> {localData.rfidTag.e}
                </p>
              )}
              {runCheck.rfidTag && (
                <p className="text-blue-500 text-xs mt-1 flex items-center gap-2 font-[500]">
                  <CircularProgress
                    disableShrink
                    size="8"
                    thickness={5}
                    className="w-[15px]"
                    sx={{ color: "blue" }}
                  />{" "}
                  Checking RFID tag...
                </p>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {rfidReaderOnline ? (
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                ) : (
                  <ShieldAlert size="16" className="text-red-500" />
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
                <ShieldAlert
                  size="16"
                  className="text-red-600 mt-0.5 flex-shrink-0"
                />
              )}
              <div
                className={`text-sm ${
                  rfidReaderOnline ? "text-green-800" : "text-red-800"
                }`}
              >
                <p className="font-medium">
                  {rfidReaderOnline
                    ? "Websocket connection established"
                    : "Websocket connection not established"}
                </p>
                <p>
                  {rfidReaderOnline
                    ? "Ready to scan RFID tags. Present a tag to the reader attached to this E-Noki instance.."
                    : "Please type the RFID tag manually or connect the RFID reader."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => close()}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            Cancel
          </button>
          {!isSaving && (
            <button
              onClick={() => handleSaveStudent()}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-200`}
            >
              <Save size="16" />
              {feed ? "Update" : "Add"} Student
            </button>
          )}
          {isSaving && (
            <button
              disabled
              className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-200 bg-gray-400 text-white`}
            >
              <CircularProgress
                sx={{ color: "white" }}
                disableShrink
                size={15}
                thickness={8}
              />
              Saving...
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
