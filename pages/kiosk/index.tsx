import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Kiosk() {
  return (
    <>
      <main
        className={`${inter.className} bg-yellow-300 h-screen w-screen p-10 flex gap-5`}
      >
        <nav className="w-1/3 h-full">
          <h1 className="text-2xl font-[700] tracking-tight">Departments</h1>
        </nav>
        <div className="w-2/3 bg-blue-700 h-full rounded-2xl"></div>
      </main>
    </>
  );
}
