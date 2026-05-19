"use client";
import { useState } from "react";

export default function TestTools() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message, data) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, data }]);
  };

  const resetQuota = async () => {
    setLoading(true);
    try {
      const eventId = `EVT-RESET-${Date.now()}`;
      addLog(`Sending Webhook to reset quotas. EventID: ${eventId}`);
      
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          eventType: "RESET_QUOTA",
          payload: { timestamp: Date.now() }
        }),
      });
      const data = await res.json();
      addLog("Webhook Response", data);
    } catch (err) {
      addLog("Error", err.message);
    }
    setLoading(false);
  };

  const testIdempotency = async () => {
    setLoading(true);
    try {
      const eventId = `EVT-IDEMP-TEST`;
      addLog(`Testing Idempotency. Sending 3 identical webhooks sequentially. EventID: ${eventId}`);
      
      for (let i = 1; i <= 3; i++) {
        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            eventType: "RESET_QUOTA",
            payload: { timestamp: Date.now() }
          }),
        });
        const data = await res.json();
        addLog(`Call ${i} Response`, data);
      }
    } catch (err) {
      addLog("Error", err.message);
    }
    setLoading(false);
  };

  const generateLeads = async () => {
    setLoading(true);
    addLog("Generating 10 concurrent leads to test safety...");
    try {
      const res = await fetch("/api/test/generate-leads", { method: "POST" });
      const data = await res.json();
      addLog("Concurrency Test Results", data);
    } catch (err) {
      addLog("Error", err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Tools</h1>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={resetQuota} 
            disabled={loading}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            Reset Quotas (Webhook)
          </button>
          
          <button 
            onClick={testIdempotency} 
            disabled={loading}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            Test Webhook Idempotency
          </button>
          
          <button 
            onClick={generateLeads} 
            disabled={loading}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            Generate 10 Leads (Concurrency)
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">Execution Logs</h3>
            <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-white">Clear Logs</button>
          </div>
          <div className="p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">No logs yet. Run a test tool above.</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-800 pb-2">
                    <span className="text-gray-400">[{log.time}]</span> <span className="text-blue-400">{log.message}</span>
                    {log.data && (
                      <pre className="mt-1 text-green-400 whitespace-pre-wrap overflow-x-auto text-xs bg-black p-2 rounded">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
