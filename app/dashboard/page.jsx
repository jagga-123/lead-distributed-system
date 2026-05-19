"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

export default function Dashboard() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.success) {
        setProviders(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Socket connection for real-time updates
    const socket = io();

    socket.on("dashboard_update", (data) => {
      console.log("Real-time update received:", data.message);
      fetchDashboardData(); // Refresh data
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Provider Dashboard</h1>
        
        {loading ? (
          <p className="text-gray-600">Loading dashboard...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {providers.map((provider) => (
              <div key={provider.providerId} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{provider.name}</h3>
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Remaining Quota:</span>
                    <span className="font-semibold text-gray-900">{provider.remainingQuota}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                    <span>Leads Received:</span>
                    <span className="font-semibold text-gray-900">{provider.totalLeadsReceived}</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Leads ({provider.assignedLeads.length})</h4>
                    <ul className="text-sm text-gray-500 max-h-32 overflow-y-auto space-y-1">
                      {provider.assignedLeads.length === 0 ? (
                        <li className="italic text-gray-400">No leads assigned</li>
                      ) : (
                        provider.assignedLeads.map((lead, idx) => (
                          <li key={idx} className="bg-gray-50 p-2 rounded">
                            {lead.name} - {lead.serviceType}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
