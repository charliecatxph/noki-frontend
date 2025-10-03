const mockCalls = {
  liveQueue: [
    {
      studentName: "John Doe",
      class: "BS Math 2A",
      location: "Library",
      timeRequested: "2024-06-10T09:15:00Z",
      reason: "Consult about exam",
      urgency: "High",
    },
    {
      studentName: "Jane Roe",
      class: "BS Science 1B",
      location: "Cafeteria",
      timeRequested: "2024-06-10T09:30:00Z",
      reason: "Assignment help",
      urgency: "Medium",
    },
  ],
  recentActivity: [
    {
      studentName: "Sam Poe",
      class: "BA English 3C",
      timeRequested: "2024-06-10T08:00:00Z",
      timeCompleted: "2024-06-10T08:20:00Z",
      responseTimeMinutes: 20,
    },
    {
      studentName: "Alex Kim",
      class: "BS Math 2A",
      timeRequested: "2024-06-09T14:00:00Z",
      timeCompleted: "2024-06-09T14:10:00Z",
      responseTimeMinutes: 10,
    },
  ],
  metrics: {
    totalCallsToday: 5,
    totalCallsThisWeek: 22,
    averageResponseTimeMinutes: 13,
  },
};

export default mockCalls;
