import { useState } from "react";
import { Geist, Inter } from "next/font/google";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Plus, Edit, Trash2, Check } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
});

const NAV_ITEMS = [
  { label: "Dashboard", key: "dashboard" },
  { label: "Departments", key: "departments" },
  { label: "Teachers", key: "teachers" },
  { label: "Students", key: "students" },
];
const NAV_BOTTOM = [
  { label: "No-Ki Settings", key: "settings" },
  { label: "No-Ki RFID Programmer", key: "nkcp" },
  { label: "No-Ki Table Lighting", key: "nktl" },
  { label: "No-Ki App", key: "nktl" },
  { label: "User Authentication and Credentials", key: "auth" },
];

const DUMMY_DEPARTMENTS = [
  { id: 1, name: "Mathematics", head: "Dr. Smith" },
  { id: 2, name: "Science", head: "Dr. Johnson" },
  { id: 3, name: "English", head: "Ms. Lee" },
];
const DUMMY_TEACHERS = [
  { id: 1, name: "Alice Brown", department: "Mathematics" },
  { id: 2, name: "Bob White", department: "Science" },
  { id: 3, name: "Carol Black", department: "English" },
];
const DUMMY_STUDENTS = [
  {
    id: 1,
    name: "John Doe",
    studentId: "2023001",
    rfid: "A1B2C3D4E5",
    course: "BS Math",
    department: "Mathematics",
  },
  {
    id: 2,
    name: "Jane Roe",
    studentId: "2023002",
    rfid: "F6G7H8I9J0",
    course: "BS Science",
    department: "Science",
  },
  {
    id: 3,
    name: "Sam Poe",
    studentId: "2023003",
    rfid: "K1L2M3N4O5",
    course: "BA English",
    department: "English",
  },
];

// Dummy call data for dashboard
const DUMMY_CALLS_TODAY = 42;
const DUMMY_CALLS_BY_TEACHER = {
  today: [
    { teacher: "Alice Brown", count: 12 },
    { teacher: "Bob White", count: 8 },
    { teacher: "Carol Black", count: 5 },
  ],
  week: [
    { teacher: "Alice Brown", count: 30 },
    { teacher: "Bob White", count: 22 },
    { teacher: "Carol Black", count: 15 },
  ],
  month: [
    { teacher: "Alice Brown", count: 80 },
    { teacher: "Bob White", count: 60 },
    { teacher: "Carol Black", count: 40 },
  ],
  all: [
    { teacher: "Alice Brown", count: 200 },
    { teacher: "Bob White", count: 150 },
    { teacher: "Carol Black", count: 100 },
  ],
};

// Type definitions

type Department = { id: number; name: string; head: string };
type Teacher = { id: number; name: string; department: string };
type Student = {
  id: number;
  name: string;
  studentId: string;
  rfid: string;
  course: string;
  department: string;
};

type TableColumn<T> = { key: string; label: string };
type TableConfig<T> = {
  columns: TableColumn<T>[];
  data: T[];
  fields: { key: string; label: string }[];
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  onAdd: () => void;
};

type Section =
  | "dashboard"
  | "departments"
  | "teachers"
  | "students"
  | "settings"
  | "auth";

type ModalState = {
  open: boolean;
  type: "departments" | "teachers" | "students" | null;
  data: Department | Teacher | Student | null;
};

function Table<T extends { id: number }>({
  columns,
  data,
  onEdit,
  onDelete,
}: {
  columns: { key: string; label: string }[];
  data: T[];
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg shadow bg-white">
      <table className="min-w-full text-slate-900">
        <thead>
          <tr className="bg-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-left font-semibold border-b"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 border-b">
                  {String((row as Record<string, any>)[col.key])}
                </td>
              ))}
              <td className="px-4 py-2 border-b flex gap-2">
                <button
                  className="text-blue-700 hover:bg-blue-100 p-1 rounded"
                  onClick={() => onEdit(row)}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="text-red-600 hover:bg-red-100 p-1 rounded"
                  onClick={() => onDelete(row)}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function AddEditModal<T extends { id?: number }>({
  open,
  onClose,
  onSave,
  fields,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: Partial<T>) => void;
  fields: { key: string; label: string }[];
  initialData?: Partial<T> | null;
}) {
  const [form, setForm] = useState<Partial<T>>(initialData || {});
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? "Edit" : "Add"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-4"
        >
          {fields.map((f) => (
            <div key={String(f.key)}>
              <label className="block mb-1 font-medium">{f.label}</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="text"
                value={(form[f.key as keyof T] as string) || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<Section>("dashboard");
  const [departments, setDepartments] =
    useState<Department[]>(DUMMY_DEPARTMENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(DUMMY_TEACHERS);
  const [students, setStudents] = useState<Student[]>(DUMMY_STUDENTS);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: null,
    data: null,
  });
  const [callsRange, setCallsRange] = useState<
    "today" | "week" | "month" | "all"
  >("today");

  // Filtered data
  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.head.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.rfid.toLowerCase().includes(search.toLowerCase()) ||
      s.course.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  // Modal handlers
  const handleAdd = (type: "departments" | "teachers" | "students") =>
    setModal({ open: true, type, data: null });
  const handleEdit = (
    type: "departments" | "teachers" | "students",
    data: Department | Teacher | Student
  ) => setModal({ open: true, type, data });
  const handleDelete = (
    type: "departments" | "teachers" | "students",
    row: Department | Teacher | Student
  ) => {
    if (type === "departments")
      setDepartments((d) => d.filter((x) => x.id !== (row as Department).id));
    if (type === "teachers")
      setTeachers((d) => d.filter((x) => x.id !== (row as Teacher).id));
    if (type === "students")
      setStudents((d) => d.filter((x) => x.id !== (row as Student).id));
  };
  const handleSave = (
    form: Partial<Department> | Partial<Teacher> | Partial<Student>
  ) => {
    if (modal.type === "departments") {
      if (modal.data && "id" in modal.data) {
        setDepartments((d) =>
          d.map((x) =>
            x.id === (modal.data as Department).id
              ? ({ ...x, ...form } as Department)
              : x
          )
        );
      } else {
        setDepartments((d) => [
          ...d,
          { ...form, id: Date.now() } as Department,
        ]);
      }
    }
    if (modal.type === "teachers") {
      if (modal.data && "id" in modal.data) {
        setTeachers((d) =>
          d.map((x) =>
            x.id === (modal.data as Teacher).id
              ? ({ ...x, ...form } as Teacher)
              : x
          )
        );
      } else {
        setTeachers((d) => [...d, { ...form, id: Date.now() } as Teacher]);
      }
    }
    if (modal.type === "students") {
      if (modal.data && "id" in modal.data) {
        setStudents((d) =>
          d.map((x) =>
            x.id === (modal.data as Student).id
              ? ({ ...x, ...form } as Student)
              : x
          )
        );
      } else {
        setStudents((d) => [...d, { ...form, id: Date.now() } as Student]);
      }
    }
    setModal({ open: false, type: null, data: null });
  };

  // Table configs
  const tableConfigs: Record<
    "departments" | "teachers" | "students",
    TableConfig<any>
  > = {
    departments: {
      columns: [
        { key: "name", label: "Department Name" },
        { key: "head", label: "Head of Department" },
      ],
      data: filteredDepartments,
      fields: [
        { key: "name", label: "Department Name" },
        { key: "head", label: "Head of Department" },
      ],
      onEdit: (row: Department) => handleEdit("departments", row),
      onDelete: (row: Department) => handleDelete("departments", row),
      onAdd: () => handleAdd("departments"),
    },
    teachers: {
      columns: [
        { key: "name", label: "Teacher Name" },
        { key: "department", label: "Department" },
      ],
      data: filteredTeachers,
      fields: [
        { key: "name", label: "Teacher Name" },
        { key: "department", label: "Department" },
      ],
      onEdit: (row: Teacher) => handleEdit("teachers", row),
      onDelete: (row: Teacher) => handleDelete("teachers", row),
      onAdd: () => handleAdd("teachers"),
    },
    students: {
      columns: [
        { key: "name", label: "Student Name" },
        { key: "studentId", label: "Student ID" },
        { key: "rfid", label: "RFID Hash" },
        { key: "course", label: "Course" },
        { key: "department", label: "Department" },
      ],
      data: filteredStudents,
      fields: [
        { key: "name", label: "Student Name" },
        { key: "studentId", label: "Student ID" },
        { key: "rfid", label: "RFID Hash" },
        { key: "course", label: "Course" },
        { key: "department", label: "Department" },
      ],
      onEdit: (row: Student) => handleEdit("students", row),
      onDelete: (row: Student) => handleDelete("students", row),
      onAdd: () => handleAdd("students"),
    },
  };

  // Chart.js data for dashboard
  const callsData = DUMMY_CALLS_BY_TEACHER[callsRange];
  const barData = {
    labels: callsData.map((d) => d.teacher),
    datasets: [
      {
        label: "Calls",
        data: callsData.map((d) => d.count),
        backgroundColor: "#2563eb",
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    indexAxis: "y" as const,
    scales: {
      x: { beginAtZero: true, grid: { color: "#e5e7eb" } },
      y: { grid: { color: "#e5e7eb" } },
    },
  };

  return (
    <div
      className={`${geistSans.className} font-sans flex min-h-screen bg-muted`}
    >
      {/* Sidebar (static, no animation) */}
      <aside className="w-[350px] bg-blue-600 text-white flex flex-col py-8 px-6 min-h-screen shadow-sm">
        <div className="mb-8 text-2xl font-bold tracking-tight flex gap-3 items-center">
          ENo-Ki ®{" "}
          <span className="bg-yellow-300 text-black px-2 py-0.5 rounded-sm text-xs">
            ADMIN
          </span>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition-colors font-medium ${
                    active === item.key ? "bg-blue-700" : "hover:bg-blue-500/80"
                  }`}
                  onClick={() => {
                    setActive(item.key as Section);
                    setSearch("");
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <hr className="my-6 border-blue-400/40" />
          <ul className="space-y-2">
            {NAV_BOTTOM.map((item) => (
              <li key={item.key}>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition-colors font-medium hover:bg-blue-500/80`}
                  onClick={() => setActive(item.key as Section)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-col gap-2 flex">
          <div className="kiosk-connection flex gap-2 items-center bg-white rounded-2xl px-3 py-0.5 text-black font-[700] text-sm w-max">
            <Check size="13" strokeWidth={5} />
            <span>Live Conn. Established</span>
          </div>
          <div className="kiosk-connection flex gap-2 items-center bg-white rounded-2xl px-3 py-0.5 text-black font-[700] text-sm w-max">
            <Check size="13" strokeWidth={5} />
            <span>Kiosk Active</span>
          </div>
        </div>
        <div className="mt-8 border-t border-blue-400/40 pt-4">
          <div className="mb-2 text-sm text-blue-100">
            Logged in as <span className="font-semibold">Charl Concepcion</span>
          </div>
          <button className="w-full px-3 py-2 rounded bg-blue-800 hover:bg-blue-900 transition-colors font-medium">
            Logout
          </button>
          <div className="mt-2 text-sm text-blue-400">
            No-Ki v1.0.0 - build 2025
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10 bg-slate-50 text-slate-900 min-h-screen">
        {active === "dashboard" && (
          <section key="dashboard" className="initial-dashboard">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-lg p-6 shadow flex flex-col items-center justify-center">
                <div className="text-4xl font-bold mb-2">
                  {DUMMY_CALLS_TODAY}
                </div>
                <div className="text-gray-600">Total Calls Today</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow md:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-semibold">
                    Most Called Teachers
                  </div>
                  <select
                    className="border rounded px-2 py-1 text-sm bg-slate-50"
                    value={callsRange}
                    onChange={(e) => setCallsRange(e.target.value as any)}
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <div className="h-64">
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-semibold mb-4">Departments</h2>
                <ul className="list-disc pl-5">
                  {departments.map((d) => (
                    <li key={d.id}>
                      {d.name} (Head: {d.head})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-semibold mb-4">Teachers</h2>
                <ul className="list-disc pl-5">
                  {teachers.map((t) => (
                    <li key={t.id}>
                      {t.name} ({t.department})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Students</h2>
                <ul className="list-disc pl-5">
                  {students.map((s) => (
                    <li key={s.id}>
                      {s.name} (Grade: {s.grade})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
        {["departments", "teachers", "students"].includes(active) && (
          <section key={active} className="initial-section">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold capitalize">{active}</h1>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={() =>
                  tableConfigs[
                    active as "departments" | "teachers" | "students"
                  ].onAdd()
                }
              >
                Add {active.slice(0, -1)}
              </button>
            </div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={`Search ${active}...`}
            />
            <Table
              columns={
                tableConfigs[active as "departments" | "teachers" | "students"]
                  .columns as { key: string; label: string }[]
              }
              data={
                tableConfigs[active as "departments" | "teachers" | "students"]
                  .data
              }
              onEdit={
                tableConfigs[active as "departments" | "teachers" | "students"]
                  .onEdit
              }
              onDelete={
                tableConfigs[active as "departments" | "teachers" | "students"]
                  .onDelete
              }
            />
          </section>
        )}
        {active === "settings" && (
          <section key="settings" className="initial-section">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <div className="bg-white rounded-lg p-6 shadow">
              Settings content here...
            </div>
          </section>
        )}
        {active === "auth" && (
          <section key="auth" className="initial-section">
            <h1 className="text-3xl font-bold mb-6">
              User Authentication and Credentials
            </h1>
            <div className="bg-white rounded-lg p-6 shadow">
              Auth content here...
            </div>
          </section>
        )}
        <AddEditModal
          open={modal.open}
          onClose={() => setModal({ open: false, type: null, data: null })}
          onSave={handleSave}
          fields={
            modal.type === "departments"
              ? (tableConfigs.departments.fields as {
                  key: string;
                  label: string;
                }[])
              : modal.type === "teachers"
              ? (tableConfigs.teachers.fields as {
                  key: string;
                  label: string;
                }[])
              : modal.type === "students"
              ? (tableConfigs.students.fields as {
                  key: string;
                  label: string;
                }[])
              : []
          }
          initialData={modal.data}
        />
      </main>
    </div>
  );
}
