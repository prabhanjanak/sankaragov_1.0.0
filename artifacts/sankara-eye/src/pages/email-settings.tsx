import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Save, Server } from "lucide-react";

export default function EmailSettings() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-100 p-2.5 rounded-xl">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Email SMTP Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Configure SMTP for automated notification emails</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
            <Server size={18} /> SMTP Server Details
          </div>
          <span className="text-xs font-semibold bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg">Future Enhancement</span>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SMTP Host</Label>
              <Input placeholder="smtp.gmail.com" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SMTP Port</Label>
              <Input placeholder="587" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Username / Email</Label>
              <Input placeholder="alerts@sankaraeye.com" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Password / App Password</Label>
              <Input type="password" placeholder="••••••••••••" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">From Name</Label>
            <Input placeholder="Sankara Eye Bank Alerts" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" disabled className="h-11 rounded-xl px-6 font-bold shadow-sm">
              Test Connection
            </Button>
            <Button disabled className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 font-bold shadow-sm">
              <Save className="mr-2 h-4 w-4" /> Save SMTP Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
