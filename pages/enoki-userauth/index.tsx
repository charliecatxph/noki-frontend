import { Lock, Edit2, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { CircularProgress } from "@mui/material";
import { Inter, Poppins, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import EnokiUserAuthAcctRow from "@/components/EnokiUserAuthAcctRow";
import { EnokiAcct } from "@/components/EnokiUserAuthModificationModal";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function EnokiUserAuth({
  user,
  api,
}: {
  user: any;
  api: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const {
    data: users = [],
    isFetched: usersFetched,
    isPending: usersPending,
    isError: usersError,
    isFetching: usersFetching,
    isRefetching: usersRefetching,
    refetch: usersRefetch,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-users-institution`, {
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
    if (users.length === 0) return;
    const fxm = users.filter((user: EnokiAcct) => {
      if (filter === "all") return true;
      if (filter === "N/A") return user.actType === null;
      return user.actType === filter;
    });
    setFilteredUsers(fxm);
  }, [filter, users]);

  useEffect(() => {
    if (users.length === 0) return;
    const fxm = users.filter((user: EnokiAcct) => {
      if (searchQuery === "") return true;
      return user.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredUsers(fxm);
  }, [searchQuery, users]);

  return (
    <>
      <main
        className={`${poppins.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}
      >
        <div className="flex">
          <Sidebar userData={__userData} />
          <div className="main-panel flex-1">
            <header
              className={`${inter.className} p-5 bg-blue-600 text-white w-full sticky top-0 z-10 flex gap-5 items-center`}
            >
              <div>
                <Lock size="30" strokeWidth={1.2} />
              </div>
              <div>
                <h1 className="font-[600] text-white text-sm">
                  User Account Management
                </h1>
                <p className="font-[400] text-white/70 text-xs">
                  Manage user accounts and permissions
                </p>
              </div>
            </header>
            <div className="p-6 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h1 className="text-2xl font-semibold text-slate-900 mb-4">
                  Instance Information
                </h1>
                <div className="space-y-3 text-slate-700">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">Instance Owner:</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-medium text-sm">
                      {__userData.ownerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">Instance Name:</span>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md font-medium text-sm">
                      {__userData.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">Institution ID:</span>
                    <code className="bg-slate-100 text-slate-800 px-3 py-1 rounded-md font-mono text-sm">
                      {__userData.institutionId}
                    </code>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Registration URL for this instance:
                    </p>
                    <a
                      href={`${origin}/enoki-inst-reg?rf=${__userData.institutionId}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {origin}/enoki-inst-reg?rf={__userData.institutionId}
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    User Accounts
                  </h2>
                  <div className="flex gap-2">
                    <select
                      name="filter"
                      id=""
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="border-1 border-slate-200 px-2 py-1 rounded-md"
                    >
                      <option value="all" selected>
                        Show All
                      </option>
                      <option value="OWNER">Owner</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="STUDENT">Student</option>
                      <option value="KIOSK">Kiosk</option>
                      <option value="N/A">N/A</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-1 border-slate-200 px-2 py-1 rounded-md"
                    />
                  </div>
                </div>
                {usersPending ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <CircularProgress size={48} disableShrink />
                    <p className="mt-4 text-slate-600 text-sm">
                      Loading user accounts...
                    </p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No user accounts found.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {filter !== "all" && filteredUsers.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <p>No user accounts found.</p>
                      </div>
                    ) : (
                      filteredUsers.map((account: EnokiAcct) => (
                        <EnokiUserAuthAcctRow
                          key={account.id}
                          account={account}
                        />
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
