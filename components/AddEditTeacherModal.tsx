import { useRfidSocket } from "@/utils/useRfidSocket";
import axios from "axios";
import { useEffect, useState } from "react";
import z from "zod";
import { Space_Grotesk } from "next/font/google";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Coffee,
  Minus,
  Plus,
  Save,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
  X,
} from "lucide-react";
import { CircularProgress } from "@mui/material";
import moment from "moment";
import { motion } from "framer-motion";
import { useEnokiModals } from "@/contexts/EnokiModalContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEnokiValidators } from "@/hooks/useEnokiValidators";
import { useEnokiMutator } from "@/hooks/useEnokiMutator";
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

interface AddEditTeacherModal {
  apiLink: string;
  isEditing: boolean;
  departments: any;
  institutionId: string;
  feed?: Pick<
    Teacher,
    | "acctId"
    | "id"
    | "name"
    | "email"
    | "departmentId"
    | "employeeRfidHash"
    | "schedule"
  > | null;
  close: () => void;
}

export interface Teacher {
  acctId: string;
  id: string;
  name: string;
  email: string;
  actType: string;
  institutionId: string;
  updatedAt: string;
  createdAt: string;
  schedule: any;
  statistics: any;
  department: any;
  departmentId: string;
  employeeRfidHash: string;
}

export interface Department {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  institutionId: string;
  teachers: Teacher[];
}

interface TeacherForm {
  acctId: string;
  id: string;
  name: {
    v: string;
    e: string;
  };
  email: {
    v: string;
    e: string;
  };
  institutionId: string;
  schedule: any;
  department: Department[];
  departmentId: {
    v: string;
    e: string;
  };
  employeeRfidHash: {
    v: string;
    e: string;
  };
}

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

export default function AddEditTeacherModal({
  apiLink,
  isEditing,
  departments,
  institutionId,
  feed,
  close,
}: AddEditTeacherModal) {
  const { addTeacher, editTeacher } = useEnokiMutator();
  const { checkEmail, checkRfid } = useEnokiValidators();
  const queryClient = useQueryClient();
  const enokiModals = useEnokiModals();
  const [localData, setLocalData] = useState<
    Partial<
      Omit<TeacherForm, "name" | "email" | "departmentId" | "employeeRfidHash">
    > &
      Pick<TeacherForm, "name" | "email" | "departmentId" | "employeeRfidHash">
  >({
    acctId: "",
    id: "",
    name: {
      v: "",
      e: "",
    },
    email: {
      v: "",
      e: "",
    },
    departmentId: {
      v: "",
      e: "",
    },
    employeeRfidHash: {
      v: "",
      e: "",
    },
  });
  const [ignore, setIgnore] = useState({
    email: false,
    employeeRfidHash: false,
  });

  const {
    rfidData,
    isOnline: rfidReaderOnline,
    isPulsing: rfidPulse,
  } = useRfidSocket({
    enabled: true,
    onRfidData: (data) => {
      if (data.type !== "RFID-READ") return;

      setLocalData((prev) => ({
        ...prev,
        employeeRfidHash: {
          v: data.data,
          e: "",
        },
      }));
    },
    playSound: true,
    soundFile: "notification.mp3",
  });

  useEffect(() => {
    if (feed) {
      setLocalData({
        name: {
          v: feed.name,
          e: "",
        },
        email: {
          v: feed.email,
          e: "",
        },
        departmentId: {
          v: feed.departmentId || "",
          e: "",
        },
        employeeRfidHash: {
          v: feed.employeeRfidHash,
          e: "",
        },
      });
      feedScheduleData(feed.schedule);
    }
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
    if (localData.employeeRfidHash.v === feed?.employeeRfidHash) {
      setIgnore((pv) => ({
        ...pv,
        employeeRfidHash: true,
      }));
    } else {
      setIgnore((pv) => ({
        ...pv,
        employeeRfidHash: false,
      }));
    }
  }, [localData.email.v, localData.employeeRfidHash.v, feed]);

  const [runCheck, setRunCheck] = useState({
    email: false,
    employeeRfidHash: false,
  });

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
              e: "Email already exists",
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
    if (!localData.employeeRfidHash.v.trim()) return;
    if (ignore.employeeRfidHash) return;
    const abort = new AbortController();

    const ttx = () => {
      setRunCheck((pv) => ({
        ...pv,
        employeeRfidHash: true,
      }));
      checkRfid(localData.employeeRfidHash.v, institutionId, abort)
        .catch((e) => {
          setLocalData((pv) => ({
            ...pv,
            employeeRfidHash: {
              ...pv.employeeRfidHash,
              e: "RFID already exists",
            },
          }));
        })
        .finally(() => {
          setRunCheck((pv) => ({
            ...pv,
            employeeRfidHash: false,
          }));
        });
    };

    const tmx = setTimeout(() => ttx(), 500);

    return () => {
      abort.abort();
      clearTimeout(tmx);
    };
  }, [localData.employeeRfidHash.v, ignore.employeeRfidHash]);

  const validateStepZero = async (): Promise<boolean> => {
    let ok = true;
    if (!localData.name.v.trim()) {
      setLocalData((pv) => ({
        ...pv,
        name: {
          ...pv.name,
          e: "Name is required.",
        },
      }));
      ok = false;
    }

    if (!z.string().email().safeParse(localData.email.v).success) {
      setLocalData((pv) => ({
        ...pv,
        email: {
          ...pv.email,
          e: "Invalid email.",
        },
      }));
      ok = false;
    }

    if (!localData.departmentId.v.trim()) {
      setLocalData((pv) => ({
        ...pv,
        departmentId: {
          ...pv.departmentId,
          e: "Department is required.",
        },
      }));
      ok = false;
    }

    if (!localData.employeeRfidHash.v.trim()) {
      setLocalData((pv) => ({
        ...pv,
        employeeRfidHash: {
          ...pv.employeeRfidHash,
          e: "RFID is required.",
        },
      }));
      ok = false;
    }

    if (!ignore.email) {
      setRunCheck({
        email: true,
        employeeRfidHash: false,
      });
      await checkEmail(localData.email.v).catch((e) => {
        ok = false;
        setLocalData((pv) => ({
          ...pv,
          email: {
            ...pv.email,
            e: "Email already exists",
          },
        }));
      });
      await new Promise((resolve) => {
        setTimeout(() => {
          setRunCheck((pv) => ({
            ...pv,
            email: false,
          }));
          resolve("OK");
        }, 1000);
      });
    }

    if (!ignore.employeeRfidHash) {
      setRunCheck({
        email: false,
        employeeRfidHash: true,
      });
      await checkRfid(localData.employeeRfidHash.v, institutionId).catch(
        (e) => {
          ok = false;
          setLocalData((pv) => ({
            ...pv,
            employeeRfidHash: {
              ...pv.employeeRfidHash,
              e: "RFID already exists",
            },
          }));
        }
      );

      await new Promise((resolve) => {
        setTimeout(() => {
          setRunCheck((pv) => ({
            ...pv,
            employeeRfidHash: false,
          }));
          resolve("OK");
        }, 1000);
      });
    }

    return ok;
  };

  const handleSave = async () => {
    const ok1 = await validateStepZero();
    if (!ok1) return;

    setStep(1);
  };

  const [step, setStep] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string>("monday");
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);
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

  const secondsToTimeString = (secondsFromStartOfDay: number): string => {
    const hours = Math.floor(secondsFromStartOfDay / 3600);
    const minutes = Math.floor((secondsFromStartOfDay % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

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

      const newSchedule: DaySchedule[] = scheduleData.map(
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
      return (
        newSlot.startTime < slot.endTime && newSlot.endTime > slot.startTime
      );
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

  const [isSaving, setIsSaving] = useState(false);
  const handleSaveTeacher = async () => {
    const ok1 = validateStepZero();
    if (!ok1) return;

    const ok2 = validateSchedule(currentSchedule);
    if (ok2.length > 0) {
      setScheduleErrors(ok2);
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

    if (feed) {
      // data was fed
      try {
        setIsSaving(true);
        await editTeacher.mutateAsync({
          id: feed.id,
          name: localData.name.v,
          email: localData.email.v,
          departmentId: localData.departmentId.v,
          employeeRfidHash: localData.employeeRfidHash.v,
          scheduleJSON,
        });

        enokiModals.showModal({
          type: "success",
          title: "Teacher updated.",
          message: "Teacher updated successfully.",
          cancelButtonText: "Close",
          hasCancelButton: true,
          autoCloseTimeout: 5000,
        });
      } catch (e) {
        enokiModals.showModal({
          type: "error",
          title: "Error updating teacher",
          message: "An error occurred while updating the teacher.",
          cancelButtonText: "Close",
          hasCancelButton: true,
        });
      } finally {
        setIsSaving(false);
        close();
      }
    } else {
      try {
        setIsSaving(true);
        await addTeacher.mutateAsync({
          name: localData.name.v,
          email: localData.email.v,
          departmentId: localData.departmentId.v,
          employeeRfidHash: localData.employeeRfidHash.v,
          institutionId: institutionId,
          scheduleJSON,
        });

        enokiModals.showModal({
          type: "success",
          title: "Teacher created.",
          message: "Teacher created successfully.",
          cancelButtonText: "Close",
          hasCancelButton: true,
          autoCloseTimeout: 5000,
        });
      } catch (e) {
        enokiModals.showModal({
          type: "error",
          title: "Error creating teacher",
          message: "An error occurred while creating the teacher.",
          cancelButtonText: "Close",
          hasCancelButton: true,
        });
      } finally {
        setIsSaving(false);
        close();
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key={"add-teacher-bgx"}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={"add-teacher-0"}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`${spaceGrotesk.className} text-2xl font-bold text-gray-800`}
              >
                {isEditing ? "Edit Teacher" : "Add New Teacher"}
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={localData.name.v}
                  onChange={(e) =>
                    setLocalData((pv) => ({
                      ...pv,
                      name: {
                        v: e.target.value,
                        e: "",
                      },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
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
                    setLocalData((pv) => ({
                      ...pv,
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>

                <select
                  value={localData.departmentId.v}
                  onChange={(e) =>
                    setLocalData((pv) => ({
                      ...pv,
                      departmentId: {
                        v: e.target.value,
                        e: "",
                      },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" disabled selected>
                    Select Department
                  </option>
                  {departments.map((department: Department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {localData.departmentId.e && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-2">
                    <TriangleAlert size="12" /> {localData.departmentId.e}
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
                    value={localData.employeeRfidHash.v}
                    onChange={(e) =>
                      setLocalData((prev) => ({
                        ...prev,
                        employeeRfidHash: {
                          v: e.target.value,
                          e: "",
                        },
                      }))
                    }
                    className={`w-full px-4 py-3 uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all duration-300 ${
                      rfidPulse
                        ? "ring-4 ring-green-300 border-green-400 bg-green-50"
                        : ""
                    }`}
                    placeholder="Enter RFID tag manually or scan with reader"
                  />
                  {localData.employeeRfidHash.e && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-2">
                      <TriangleAlert size="12" /> {localData.employeeRfidHash.e}
                    </p>
                  )}
                  {runCheck.employeeRfidHash && (
                    <p className="text-blue-500 text-xs mt-1 flex items-center gap-2 font-[500]">
                      <CircularProgress
                        disableShrink
                        size="8"
                        thickness={5}
                        className="w-[15px]"
                        sx={{ color: "blue" }}
                      />{" "}
                      Checking RFID...
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
                onClick={() => {
                  close();
                }}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                <Calendar size="16" />
                Proceed to Schedule
              </button>
            </div>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={"add-teacher-1"}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
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
                  close();
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
                <h3 className="font-semibold text-gray-800 mb-4">Select Day</h3>
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
                    {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}{" "}
                    Schedule
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addTimeSlot(selectedDay, "class")}
                      className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1"
                    >
                      <Plus size="14" />
                      Add Class
                    </button>
                    <button
                      onClick={() => addTimeSlot(selectedDay, "break")}
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
                    ?.timeSlots.sort((a, b) => a.startTime - b.startTime)
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
                              <Clock className="text-blue-600" size="16" />
                            ) : (
                              <Coffee className="text-orange-600" size="16" />
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                              <input
                                type="text"
                                value={slot.label || ""}
                                onChange={(e) =>
                                  updateTimeSlot(selectedDay, slot.id, {
                                    label: e.target.value,
                                  })
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
                                value={secondsToTimeString(slot.startTime)}
                                onChange={(e) => {
                                  const newStartTime = timeStringToSeconds(
                                    e.target.value
                                  );
                                  updateTimeSlot(selectedDay, slot.id, {
                                    startTime: newStartTime,
                                  });
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                              <input
                                type="time"
                                value={secondsToTimeString(slot.endTime)}
                                onChange={(e) => {
                                  const newEndTime = timeStringToSeconds(
                                    e.target.value
                                  );
                                  updateTimeSlot(selectedDay, slot.id, {
                                    endTime: newEndTime,
                                  });
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
                            onClick={() => removeTimeSlot(selectedDay, slot.id)}
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
                      <Calendar size="48" className="mx-auto mb-2 opacity-50" />
                      <p>No time slots scheduled for {selectedDay}</p>
                      <p className="text-sm">
                        Click "Add Class" or "Add Break" to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  clearScheduleData();
                  setStep(0);
                }}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Go Back
              </button>
              {!isSaving && (
                <button
                  onClick={() => handleSaveTeacher()}
                  disabled={scheduleErrors.length > 0}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                    scheduleErrors.length > 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl hover:from-green-600 hover:to-green-700"
                  }`}
                >
                  <Save size="16" />
                  Save Teacher
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
        )}
      </motion.div>
    </>
  );
}
