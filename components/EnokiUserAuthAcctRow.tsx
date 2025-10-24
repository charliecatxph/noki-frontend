import { useState } from "react";
import EnokiUserAuthModificationModal, {
  ACTType,
  EnokiAcct,
} from "./EnokiUserAuthModificationModal";
import moment from "moment";
import { Edit2, Trash2 } from "lucide-react";
import { useEnokiModals } from "@/contexts/EnokiModalContext";
import axios from "axios";
import { useEnokiMutator } from "@/hooks/useEnokiMutator";

export default function EnokiUserAuthAcctRow({
  account,
}: {
  account: EnokiAcct;
}) {
  const { deleteAccount } = useEnokiMutator();
  const enokiModal = useEnokiModals();
  const [showEnokiAcctEditor, setShowEnokiAcctEditor] = useState(false);
  const getActTypeColor = (type: ACTType | null) => {
    switch (type) {
      case "OWNER":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "TEACHER":
        return "bg-blue-100 text-blue-800";
      case "STUDENT":
        return "bg-green-100 text-green-800";
      case "KIOSK":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const handleEdit = () => {
    setShowEnokiAcctEditor(true);
  };

  const handleDelete = () => {
    enokiModal.showModal({
      title: "Delete Account",
      message: "Are you sure you want to delete this account?",
      type: "warning",
      hasCancelButton: true,
      hasConfirmButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Delete",
      confirmButtonFn: async () => {
        try {
          await deleteAccount.mutateAsync({ id: account.id });
          enokiModal.showModal({
            title: "Success",
            message: "Account deleted successfully.",
            type: "success",
            autoCloseTimeout: 5000,
            hasCancelButton: true,
            cancelButtonText: "Go Back",
          });
        } catch (e: any) {
          enokiModal.showModal({
            title: "Error",
            message: e.response.data.error,
            type: "error",
            autoCloseTimeout: 5000,
            hasCancelButton: true,
            cancelButtonText: "Go Back",
          });
        }
      },
    });
  };

  return (
    <>
      <li className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {account.name}
            </p>
            <p className="text-xs text-slate-500">
              ID: {account.id.slice(0, 8)}...
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-700">{account.email}</p>
          </div>
          <div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getActTypeColor(
                account.actType
              )}`}
            >
              {account.actType || "N/A"}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-600">
              Created:{" "}
              {moment(account.createdAt).format("MMMM D, YYYY / hh:mm A")}
            </p>
            <p className="text-xs text-slate-600">
              Updated:{" "}
              {moment(account.updatedAt).format("MMMM D, YYYY / hh:mm A")}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleEdit()}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Edit2 size={16} />
              Edit
            </button>
            <button
              onClick={() => handleDelete()}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </li>
      {showEnokiAcctEditor && (
        <EnokiUserAuthModificationModal
          account={account}
          close={() => setShowEnokiAcctEditor(false)}
        />
      )}
    </>
  );
}
