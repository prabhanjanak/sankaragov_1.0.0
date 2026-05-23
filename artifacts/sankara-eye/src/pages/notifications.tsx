import { Card, CardContent } from "@/components/ui/card";
import { useListEyeCalls } from "@workspace/api-client-react";
import { Bell, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Notifications() {
  // Polling every 15 seconds to simulate real-time notifications
  const { data: callsResponse, isLoading } = useListEyeCalls(
    { status: "new", limit: 20 }
  );

  const newCalls = callsResponse?.data || [];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 p-2.5 rounded-xl relative">
          <Bell className="h-6 w-6 text-orange-600" />
          {newCalls && newCalls.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Active Alerts</h1>
          <p className="text-sm text-gray-500 font-medium">Real-time emergency eye donation alerts</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading alerts...</div>
        ) : newCalls && newCalls.length > 0 ? (
          newCalls.map((call) => (
            <Link key={call.id} href="/eye-calls">
              <Card className="border-red-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
                <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <AlertCircle size={16} className="animate-pulse" /> Emergency Call: {call.callId}
                  </div>
                  <div className="text-xs font-semibold text-red-500 flex items-center gap-1">
                    <Clock size={12} /> {formatDistanceToNow(new Date(call.createdAt!), { addSuffix: true })}
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div>
                    <h3 className="font-extrabold text-gray-900">{call.referrerName}</h3>
                    <p className="text-sm text-gray-600">{call.referrerMobile}</p>
                    <p className="text-xs text-gray-500 mt-1">Location: {call.district}, {call.state}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider group-hover:bg-red-700 transition-colors">
                      Dispatch Action Required &rarr;
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Active Alerts</h3>
            <p className="text-gray-500 mt-1 max-w-sm">There are currently no new emergency calls pending dispatch. Check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
