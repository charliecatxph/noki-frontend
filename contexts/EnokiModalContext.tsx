import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Check,
  TriangleAlert,
  X,
} from "lucide-react";
import { Poppins, Space_Grotesk } from "next/font/google";
import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// const poppins = Space_Grotesk({
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700"],
// });

type EnokiModalType = "success" | "error" | "info" | "warning" | "loading";

interface EnokiModal {
  type: EnokiModalType;
  title: string;
  message: string;
  hasConfirmButton?: boolean;
  hasCancelButton?: boolean;
  confirmButtonFn?: () => void;
  cancelButtonFn?: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  autoCloseTimeout?: number;
}

interface EnokiModalContextType {
  showModal: (params: EnokiModal) => void;
  closeModal: () => void;
}

const EnokiModalContext = createContext<EnokiModalContextType | undefined>(
  undefined
);

export const useEnokiModals = () => {
  const context = useContext(EnokiModalContext);
  if (!context) {
    throw new Error("useEnokiModals must be used within a EnokiModalProvider");
  }
  return context;
};

export const EnokiModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentNotification, setCurrentNotification] =
    useState<EnokiModal | null>(null);

  const showModal = ({
    type,
    title,
    message,
    hasConfirmButton,
    hasCancelButton,
    confirmButtonFn,
    cancelButtonFn,
    confirmButtonText,
    cancelButtonText,
    autoCloseTimeout,
  }: EnokiModal) => {
    setCurrentNotification({
      type,
      title,
      message,
      hasConfirmButton,
      hasCancelButton,
      confirmButtonFn,
      cancelButtonFn,
      confirmButtonText,
      cancelButtonText,
      autoCloseTimeout,
    });
  };

  const closeModal = () => {
    setCurrentNotification(null);
  };

  useEffect(() => {
    if (!currentNotification?.autoCloseTimeout) return;

    const tmx = setTimeout(() => {
      closeModal();
    }, currentNotification.autoCloseTimeout);

    return () => clearTimeout(tmx);
  }, [currentNotification?.autoCloseTimeout]);

  return (
    <EnokiModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <AnimatePresence>
        {currentNotification?.type === "success" &&
          success(currentNotification, closeModal)}
        {currentNotification?.type === "error" &&
          error(currentNotification, closeModal)}
        {currentNotification?.type === "info" &&
          info(currentNotification, closeModal)}
        {currentNotification?.type === "warning" &&
          warning(currentNotification, closeModal)}
        {currentNotification?.type === "loading" &&
          loading(currentNotification, closeModal)}
      </AnimatePresence>
    </EnokiModalContext.Provider>
  );
};

const success = (
  {
    title,
    message,
    hasConfirmButton,
    hasCancelButton,
    confirmButtonFn,
    cancelButtonFn,
    confirmButtonText,
    cancelButtonText,
  }: EnokiModal,
  closeModal: () => void
) => {
  return (
    <>
      <motion.div
        className="bg-black/30 h-full w-full fixed top-0 left-0 z-50"
        key={"success-modal"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="h-full w-full grid place-content-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/95 min-w-[300px] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3
                className={`${poppins.className} text-lg font-semibold text-gray-900 mb-2`}
              >
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              {(hasConfirmButton || hasCancelButton) && (
                <div className="flex gap-3">
                  {hasCancelButton && (
                    <button
                      onClick={() => {
                        cancelButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      {cancelButtonText}
                    </button>
                  )}
                  {hasConfirmButton && (
                    <button
                      onClick={() => {
                        confirmButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-green-200 bg-green-600 text-green-100 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                    >
                      {confirmButtonText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

const loading = ({ title, message }: EnokiModal, closeModal: () => void) => {
  return (
    <>
      <motion.div
        className="bg-black/30 h-full w-full fixed top-0 left-0 z-50"
        key={"success-modal"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="h-full w-full grid place-content-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/95 min-w-[300px] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md"
          >
            <div className="text-center">
              <CircularProgress
                disableShrink
                size={20}
                thickness={8}
                sx={{ color: "black" }}
              />
              <p className="text-sm text-black mt-2 font-medium">{title}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

const error = (
  {
    title,
    message,
    hasConfirmButton,
    hasCancelButton,
    confirmButtonFn,
    cancelButtonFn,
    confirmButtonText,
    cancelButtonText,
  }: EnokiModal,
  closeModal: () => void
) => {
  return (
    <>
      <motion.div
        className="bg-black/30 h-full w-full fixed top-0 left-0 z-50"
        key={"error-modal"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="h-full w-full grid place-content-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/95 min-w-[300px] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3
                className={`${poppins.className} text-lg font-semibold text-gray-900 mb-2`}
              >
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              {(hasConfirmButton || hasCancelButton) && (
                <div className="flex gap-3">
                  {hasCancelButton && (
                    <button
                      onClick={() => {
                        cancelButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      {cancelButtonText}
                    </button>
                  )}
                  {hasConfirmButton && (
                    <button
                      onClick={() => {
                        confirmButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-red-200 bg-red-600 text-red-100 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                    >
                      {confirmButtonText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

const info = (
  {
    title,
    message,
    hasConfirmButton,
    hasCancelButton,
    confirmButtonFn,
    cancelButtonFn,
    confirmButtonText,
    cancelButtonText,
  }: EnokiModal,
  closeModal: () => void
) => {
  return (
    <>
      <motion.div
        className="bg-black/30 h-full w-full fixed top-0 left-0 z-50"
        key={"success-modal"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="h-full w-full grid place-content-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/95 min-w-[300px] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <h3
                className={`${poppins.className} text-lg font-semibold text-gray-900 mb-2`}
              >
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              {(hasConfirmButton || hasCancelButton) && (
                <div className="flex gap-3">
                  {hasCancelButton && (
                    <button
                      onClick={() => {
                        cancelButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      {cancelButtonText}
                    </button>
                  )}
                  {hasConfirmButton && (
                    <button
                      onClick={() => {
                        confirmButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-blue-200 bg-blue-600 text-blue-100 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                    >
                      {confirmButtonText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

const warning = (
  {
    title,
    message,
    hasConfirmButton,
    hasCancelButton,
    confirmButtonFn,
    cancelButtonFn,
    confirmButtonText,
    cancelButtonText,
  }: EnokiModal,
  closeModal: () => void
) => {
  return (
    <>
      <motion.div
        className="bg-black/30 h-full w-full fixed top-0 left-0 z-50"
        key={"warning-modal"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="h-full w-full grid place-content-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/95 min-w-[300px] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <TriangleAlert className="h-6 w-6 text-yellow-600" />
              </div>
              <h3
                className={`${poppins.className} text-lg font-semibold text-gray-900 mb-2`}
              >
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              {(hasConfirmButton || hasCancelButton) && (
                <div className="flex gap-3">
                  {hasCancelButton && (
                    <button
                      onClick={() => {
                        cancelButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      {cancelButtonText}
                    </button>
                  )}
                  {hasConfirmButton && (
                    <button
                      onClick={() => {
                        confirmButtonFn?.();
                        closeModal();
                      }}
                      className="flex-1 cursor-pointer px-4 py-2 border border-yellow-200 bg-yellow-600 text-yellow-100 rounded-lg font-medium hover:bg-yellow-700 transition-colors duration-200"
                    >
                      {confirmButtonText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
