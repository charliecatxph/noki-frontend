import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { Poppins, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";

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

export default function InvalidUserPermissions({ user, queries, api }: any) {
  const router = useRouter();

  return (
    <main
      className={`${poppins.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen flex items-center justify-center p-4`}
    >
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg">
              <ShieldX size="64" className="text-white" strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h1
              className={`${spaceGrotesk.className} text-4xl md:text-5xl font-bold text-gray-900 mb-4`}
            >
              Access Denied
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              You don't have permission to access this page
            </p>
            <p className="text-sm text-gray-500">
              Your current account type doesn't have the necessary permissions to
              view this content. Please contact your administrator if you believe
              this is an error.
            </p>
          </div>

          {/* User Info Card */}
          {user && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user.ownerName
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {user.ownerName || "User"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Account Type:{" "}
                    <span className="font-medium text-blue-600">
                      {user.actType || "Unknown"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </main>
  );
}