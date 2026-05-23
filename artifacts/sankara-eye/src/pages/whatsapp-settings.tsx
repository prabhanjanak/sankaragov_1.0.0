import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Save, CheckCircle2 } from "lucide-react";

export default function WhatsAppSettings() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-green-100 p-2.5 rounded-xl">
          <MessageCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">WhatsApp API Integration</h1>
          <p className="text-sm text-gray-500 font-medium">Configure Meta Cloud API for automated dispatch messages</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
            <CheckCircle2 size={18} /> API Configuration
          </div>
          <span className="text-xs font-semibold bg-white border border-green-200 text-green-700 px-2.5 py-1 rounded-lg">Future Enhancement</span>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Phone Number ID</Label>
              <Input placeholder="e.g. 104523999999999" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Business Account ID</Label>
              <Input placeholder="e.g. 104523888888888" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Permanent Access Token</Label>
            <Input type="password" placeholder="EAAD..." className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
            <p className="text-[10px] text-gray-500 font-medium">Generate this from your Meta Developer Portal.</p>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Template Name (Emergency Dispatch)</Label>
            <Input placeholder="emergency_dispatch_team" className="h-11 rounded-xl bg-gray-50 border-gray-200" disabled />
          </div>

          <div className="pt-4 flex justify-end">
            <Button disabled className="bg-green-600 text-white rounded-xl h-11 px-6 font-bold shadow-sm">
              <Save className="mr-2 h-4 w-4" /> Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
