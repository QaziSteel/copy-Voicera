import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const DailySummary: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
            <button
              onClick={() => navigate("/call-logs")}
              className="px-4 py-2 hover:bg-accent rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-muted-foreground">
                Call Logs
              </span>
            </button>
            <div className="bg-card px-4 py-2 rounded-full shadow-sm">
              <span className="text-lg font-semibold text-foreground">
                Daily Summary
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-16 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            Daily Summary
          </h1>
          <p className="text-xl font-semibold text-muted-foreground">
            Today's performance overview and insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Summary Card */}
          <div className="lg:col-span-2 bg-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Today's Activity</h2>
              <span className="text-sm text-muted-foreground">December 26, 2024</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-1">8</div>
                <div className="text-sm text-muted-foreground">Total Calls</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">3</div>
                <div className="text-sm text-muted-foreground">Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">3</div>
                <div className="text-sm text-muted-foreground">Inquiries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-1">2</div>
                <div className="text-sm text-muted-foreground">Dropped</div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Key Highlights</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-foreground">Strong conversion rate today</p>
                      <p className="text-sm text-muted-foreground">38% of calls resulted in bookings, up from yesterday's 25%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-foreground">Average call duration improved</p>
                      <p className="text-sm text-muted-foreground">Calls averaged 2m 34s, indicating good engagement</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-foreground">Peak call time: 4-5 PM</p>
                      <p className="text-sm text-muted-foreground">Consider adjusting availability for better coverage</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Common Inquiries</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                    <span className="text-foreground">Service pricing questions</span>
                    <span className="text-sm text-muted-foreground">40%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                    <span className="text-foreground">Availability inquiries</span>
                    <span className="text-sm text-muted-foreground">25%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                    <span className="text-foreground">Location and directions</span>
                    <span className="text-sm text-muted-foreground">20%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                    <span className="text-foreground">General business info</span>
                    <span className="text-sm text-muted-foreground">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Performance Score */}
            <div className="bg-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Performance Score</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">8.5/10</div>
                <p className="text-sm text-muted-foreground">Excellent performance today</p>
              </div>
              
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Response Speed</span>
                    <span className="text-muted-foreground">95%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Accuracy</span>
                    <span className="text-muted-foreground">88%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Customer Satisfaction</span>
                    <span className="text-muted-foreground">92%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-foreground text-primary-foreground p-3 rounded-lg text-left hover:bg-foreground/90 transition-colors">
                  <div className="font-medium">Email Summary</div>
                  <div className="text-sm opacity-90">Send detailed report to your inbox</div>
                </button>
                
                <button className="w-full bg-muted text-foreground p-3 rounded-lg text-left hover:bg-muted/80 transition-colors">
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm opacity-90">Download today's call data as CSV</div>
                </button>
                
                <button className="w-full bg-secondary text-secondary-foreground p-3 rounded-lg text-left hover:bg-secondary/80 transition-colors">
                  <div className="font-medium">Schedule Review</div>
                  <div className="text-sm opacity-90">Set up weekly performance reviews</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DailySummary;