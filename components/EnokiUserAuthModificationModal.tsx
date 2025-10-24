import { useEnokiModals } from "@/contexts/EnokiModalContext";
import { useEnokiMutator } from "@/hooks/useEnokiMutator";
import { useEnokiValidators } from "@/hooks/useEnokiValidators";
import { CircularProgress } from "@mui/material";
import axios from "axios";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";

export type ACTType = "OWNER" | "ADMIN" | "TEACHER" | "STUDENT" | "KIOSK";

export interface EnokiAcct {
  id: string;
  name: string;
  email: string;
  password: string;
  actType: ACTType;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  teacherId: string;
}

export default function EnokiUserAuthModificationModal({
  account,
  close,
}: {
  account: EnokiAcct;
  close: () => void;
}) {
  const { changeAccount } = useEnokiMutator();
  const { checkEmail } = useEnokiValidators();
  const enokiModal = useEnokiModals();
  const [localData, setLocalData] = useState({
    name: {
      v: "",
      e: "",
    },
    email: {
      v: "",
      e: "",
    },
    actType: {
      v: "",
      e: "",
    },
    changePassword: false,
    newPassword: "",
    nwpPasswordError: "",
    nwpPasswordOk: false,
    confirmPassword: "",
    cfpwPasswordError: "",
  });

  useEffect(() => {
    if (account) {
      setLocalData({
        name: {
          v: account.name,
          e: "",
        },
        email: {
          v: account.email,
          e: "",
        },
        actType: {
          v: account.actType,
          e: "",
        },
        changePassword: false,
        newPassword: "",
        nwpPasswordError: "",
        nwpPasswordOk: false,
        confirmPassword: "",
        cfpwPasswordError: "",
      });
    }
  }, [account]);

  const [ignoreEmailCheck, setIgnoreEmailCheck] = useState(false);
  const [emailCheck, setEmailCheck] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [holdUI, setHoldUI] = useState(false);

  useEffect(() => {
    if (!localData.email.v.trim()) return;
    if (ignoreEmailCheck) return;

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

      setEmailCheck(true);
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
          setEmailCheck(false);
        });
    };

    const tmx = setTimeout(() => ttx(), 500);

    return () => {
      abort.abort();
      clearTimeout(tmx);
    };
  }, [localData.email.v, ignoreEmailCheck]);

  useEffect(() => {
    if (account.email === localData.email.v) {
      setIgnoreEmailCheck(true);
    } else {
      setIgnoreEmailCheck(false);
    }
  }, [account.email, localData.email.v]);

  // passwords UI handling
  useEffect(() => {
    if (!localData.changePassword) return;
    if (localData.newPassword.trim() === "") {
      setLocalData({
        ...localData,
        nwpPasswordError: "New password is required.",
        nwpPasswordOk: false,
      });
      return;
    }
    if (localData.newPassword.trim().length < 8) {
      setLocalData({
        ...localData,
        nwpPasswordError: "Password must be at least 8 characters.",
        nwpPasswordOk: false,
      });
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(localData.newPassword)) {
      setLocalData({
        ...localData,
        nwpPasswordError:
          "Password must contain uppercase, lowercase, and number.",
        nwpPasswordOk: false,
      });
      return;
    }
    setLocalData({
      ...localData,
      nwpPasswordError: "",
      nwpPasswordOk: true,
      confirmPassword: "",
      cfpwPasswordError: "",
    });
  }, [localData.changePassword, localData.newPassword]);

  useEffect(() => {
    if (!localData.changePassword) return;
    if (localData.newPassword !== localData.confirmPassword) {
      setLocalData({
        ...localData,
        cfpwPasswordError: "Passwords do not match.",
      });
      return;
    }
    setLocalData({
      ...localData,
      cfpwPasswordError: "",
    });
  }, [localData.changePassword, localData.confirmPassword]);

  useEffect(() => {
    if (localData.nwpPasswordOk) {
      setLocalData({
        ...localData,
        confirmPassword: "",
      });
    }
  }, [localData.nwpPasswordOk]);

  const handleSave = async () => {
    let ok = true;
    if (localData.name.v.trim() === "") {
      setLocalData({
        ...localData,
        name: {
          v: localData.name.v,
          e: "Name is required",
        },
      });
      ok = false;
    }

    if (!z.string().email().safeParse(localData.email.v).success) {
      setLocalData({
        ...localData,
        email: {
          v: localData.email.v,
          e: "Invalid email format.",
        },
      });
      ok = false;
    }

    if (localData.actType.v.trim() === "") {
      setLocalData({
        ...localData,
        actType: {
          v: localData.actType.v,
          e: "Account type is required.",
        },
      });
      ok = false;
    }

    if (localData.changePassword) {
      if (localData.newPassword.trim() === "") {
        setLocalData({
          ...localData,
          nwpPasswordError: "New password is required.",
        });
        ok = false;
      }

      if (localData.newPassword.trim().length < 8) {
        setLocalData({
          ...localData,
          nwpPasswordError: "Password must be at least 8 characters.",
        });
        ok = false;
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(localData.newPassword)) {
        setLocalData({
          ...localData,
          nwpPasswordError:
            "Password must contain uppercase, lowercase, and number.",
        });
        ok = false;
      }

      if (localData.confirmPassword.trim() === "") {
        setLocalData({
          ...localData,
          cfpwPasswordError: "Please confirm your password.",
        });
        ok = false;
      }

      if (localData.newPassword !== localData.confirmPassword) {
        setLocalData({
          ...localData,
          cfpwPasswordError: "Passwords do not match.",
        });
        ok = false;
      }
    }

    if (!ok) return;

    if (!ignoreEmailCheck) {
      await checkEmail(localData.email.v).catch((e) => {
        setLocalData({
          ...localData,
          email: {
            v: localData.email.v,
            e: "Email is already in use.",
          },
        });
        return;
      });
    }

    setHoldUI(true);
    enokiModal.showModal({
      type: "warning",
      title: "Are you sure?",
      message: "Are you sure you want to update this account?",
      hasCancelButton: true,
      hasConfirmButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Update",
      confirmButtonFn: async () => {
        try {
          setIsUpdating(true);
          await changeAccount.mutateAsync({
            id: account.id,
            name: localData.name.v,
            email: localData.email.v,
            actType: localData.actType.v,
            password: localData.newPassword,
          });
          close();
          enokiModal.showModal({
            title: "Success",
            message: "Account updated successfully.",
            type: "success",
            autoCloseTimeout: 5000,
            hasCancelButton: true,
            cancelButtonText: "Go Back",
          });
        } catch (e) {
          close();
          enokiModal.showModal({
            title: "Error",
            message: "Failed to update account.",
            type: "error",
            autoCloseTimeout: 5000,
            hasCancelButton: true,
            cancelButtonText: "Go Back",
          });
        } finally {
          setIsUpdating(false);
        }
      },
      cancelButtonFn: () => {
        setHoldUI(false);
      },
    });
  };

  if (!holdUI) {
    return (
      <>
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 h-full">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-semibold">Edit Account</h2>
              <p className="text-sm text-blue-100 mt-1">
                Update user information and permissions
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localData.name.v}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      name: { v: e.target.value, e: "" },
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    localData.name.e ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="Enter full name"
                />
                {localData.name.e && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <X size={14} /> {localData.name.e}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={localData.email.v}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      email: { v: e.target.value, e: "" },
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    localData.email.e ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="user@example.com"
                />
                {localData.email.e && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <X size={14} /> {localData.email.e}
                  </p>
                )}
                {emailCheck && (
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

              {/* Account Type Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={localData.actType.v || ""}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      actType: { v: e.target.value as ACTType, e: "" },
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    localData.actType.e ? "border-red-500" : "border-slate-300"
                  }`}
                >
                  <option value="" disabled selected>
                    Select account type
                  </option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="KIOSK">Kiosk</option>
                </select>
                {localData.actType.e && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <X size={14} /> {localData.actType.e}
                  </p>
                )}
              </div>

              {/* Password Change Section */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="changePassword"
                    checked={localData.changePassword}
                    onChange={(e) =>
                      setLocalData({
                        ...localData,
                        changePassword: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="changePassword"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Change Password?
                  </label>
                </div>

                {localData.changePassword && (
                  <div className="space-y-4 bg-slate-50 p-4 rounded-md">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={localData.newPassword}
                        onChange={(e) =>
                          setLocalData({
                            ...localData,
                            newPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          localData.nwpPasswordError
                            ? "border-red-500"
                            : "border-slate-300"
                        }`}
                        placeholder="Enter new password"
                      />
                      {localData.nwpPasswordError && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <X size={14} /> {localData.nwpPasswordError}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Must be at least 8 characters with uppercase, lowercase,
                        and number
                      </p>
                    </div>

                    {localData.nwpPasswordOk && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Confirm Password{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={localData.confirmPassword}
                          onChange={(e) =>
                            setLocalData({
                              ...localData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            localData.cfpwPasswordError
                              ? "border-red-500"
                              : "border-slate-300"
                          }`}
                          placeholder="Confirm new password"
                        />
                        {localData.cfpwPasswordError && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <X size={14} /> {localData.cfpwPasswordError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="bg-blue-50 p-4 rounded-md space-y-2">
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Account ID:</span> {account.id}
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(account.createdAt).toLocaleString()}
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Last Updated:</span>{" "}
                  {new Date(account.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end border-t border-slate-200">
              <button
                disabled={isUpdating}
                onClick={close}
                className="flex items-center disabled:cursor-not-allowed gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors font-medium"
              >
                Cancel
              </button>
              {isUpdating && (
                <button
                  disabled={isUpdating}
                  className="flex items-center disabled:cursor-not-allowed gap-2 px-4 py-2 bg-gray-200 text-black rounded-md transition-colors font-medium"
                >
                  <CircularProgress
                    size={15}
                    disableShrink
                    thickness={8}
                    sx={{ color: "black" }}
                  />
                  Saving...
                </button>
              )}

              {!isUpdating && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
}
