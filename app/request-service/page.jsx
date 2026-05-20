"use client";
import { useState } from "react";

export default function RequestService() {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    city: "",
    serviceType: "Service 1",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: "Lead submitted successfully! Assigned to: " + data.assignedProviders.map(p => p.name).join(", ") });
        setFormData({ name: "", phoneNumber: "", city: "", serviceType: "Service 1", description: "" });
      } else {
        setMessage({ type: "error", text: data.error || `Failed to submit lead (${res.status})` });
      }
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Network error occurred." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Request Service</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="tel" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Type</label>
              <select className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                <option value="Service 1">Service 1</option>
                <option value="Service 2">Service 2</option>
                <option value="Service 3">Service 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? "Submitting..." : "Submit Lead"}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
