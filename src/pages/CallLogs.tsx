import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface CallLog {
  id: string;
  time: string;
  duration: string;
  caller: string;
  status: "booked" | "dropped" | "inquiry";
  outcome: string;
}

export const CallLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [callLogs] = useState<CallLog[]>([
    {
      id: "1007",
      time: "16:58:15",
      duration: "3:42",
      caller: "+1 (555) 123-4567",
      status: "booked",
      outcome: "Appointment scheduled for tomorrow 2:00 PM"
    },
    {
      id: "1006",
      time: "16:57:30", 
      duration: "1:23",
      caller: "+1 (555) 987-6543",
      status: "inquiry",
      outcome: "Asked about services and pricing"
    },
    {
      id: "1005",
      time: "16:55:10",
      duration: "0:45",
      caller: "+1 (555) 456-7890",
      status: "dropped",
      outcome: "Call ended during greeting"
    },
    {
      id: "1004",
      time: "16:53:22",
      duration: "4:18",
      caller: "+1 (555) 234-5678",
      status: "booked",
      outcome: "Appointment scheduled for next week"
    },
    {
      id: "1003",
      time: "16:50:45",
      duration: "2:15",
      caller: "+1 (555) 345-6789",
      status: "inquiry",
      outcome: "General business information request"
    },
  ]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-foreground text-primary-foreground";
      case "dropped":
        return "bg-destructive text-destructive-foreground";
      case "inquiry":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "booked":
        return "Booked";
      case "dropped":
        return "Dropped";
      case "inquiry":
        return "Inquiry";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border px-16 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Voicera AI</h1>

          <div className="flex items-center gap-8">
            {/* Agent Live */}
            <button
              onClick={() => navigate("/agent-management")}
              className="flex items-center gap-3 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-lg font-semibold text-foreground">
                Agent Live
              </span>
            </button>

            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate("/profile")}
                className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                title="Profile"
              >
                <span className="text-lg font-semibold text-foreground">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </button>
              <button onClick={signOut} className="hover:text-muted-foreground transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mt-4">
          <div className="bg-muted rounded-full p-2 flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 hover:bg-accent rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-muted-foreground">
                Dashboard
              </span>
            </button>
            <div className="bg-card px-4 py-2 rounded-full shadow-sm">
              <span className="text-lg font-semibold text-foreground">
                Call Logs
              </span>
            </div>
            <button
              onClick={() => navigate("/daily-summary")}
              className="px-4 py-2 hover:bg-accent rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-muted-foreground">
                Daily Summary
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-16 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            Call Logs
          </h1>
          <p className="text-xl font-semibold text-muted-foreground">
            Detailed history of all agent interactions
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Recent Calls</h2>
            <div className="flex gap-3">
              <button className="bg-foreground text-primary-foreground px-4 py-2 rounded-lg">
                Export
              </button>
              <button className="border border-border px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors">
                Filter
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {callLogs.map((call) => (
              <div
                key={call.id}
                className="border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Call #{call.id}
                      </h3>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(call.status)}`}
                      >
                        {getStatusText(call.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <p className="font-medium text-foreground">{call.time}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium text-foreground">{call.duration}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Caller:</span>
                        <p className="font-medium text-foreground">{call.caller}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Outcome:</span>
                        <p className="font-medium text-foreground">{call.outcome}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="text-muted-foreground hover:text-foreground p-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M2.45801 12C3.73228 7.94288 7.52257 5 12.0002 5C16.4778 5 20.2681 7.94291 21.5424 12C20.2681 16.0571 16.4778 19 12.0002 19C7.52256 19 3.73226 16.0571 2.45801 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                    <button className="text-muted-foreground hover:text-foreground p-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                Previous
              </button>
              <button className="px-3 py-2 bg-foreground text-primary-foreground rounded-lg">
                1
              </button>
              <button className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                2
              </button>
              <button className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                3
              </button>
              <button className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CallLogs;