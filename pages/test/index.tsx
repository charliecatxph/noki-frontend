import { useEnokiModals } from "@/contexts/EnokiModalContext";
import { useEffect } from "react";

export default function Test() {
  const notification = useEnokiModals();
  useEffect(() => {
    notification.showModal({
      type: "loading",
      title: "Deleting...",
      message: "Teacher created successfully.",
    });
  }, []);
  return <></>;
}
