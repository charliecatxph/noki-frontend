type CallRequest = {
  studentName: string;
  class: string;
  location: string;
  timeRequested: string;
  reason: string;
  urgency: "Low" | "Medium" | "High";
};

export default function LiveQueuePanel({ queue }: { queue: CallRequest[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold mb-4">Live Queue</h2>
      {queue.length === 0 ? (
        <div className="text-gray-500">No current requests.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {queue.map((req, i) => (
            <li
              key={i}
              className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {req.studentName}
                </div>
                <div className="text-gray-500 text-sm">
                  {req.class} &bull; {req.location}
                </div>
                <div className="text-gray-400 text-xs">
                  Requested: {req.timeRequested}
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-1">
                <div className="text-gray-700 text-sm">
                  Reason: {req.reason}
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    req.urgency === "High"
                      ? "bg-red-100 text-red-700"
                      : req.urgency === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {req.urgency}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
