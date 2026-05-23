import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetDashboardStats, useGetCallsByStatus, useGetCallsByUnit, useGetRecentCalls,
  useListEyeCalls, useCreateEyeCall, useListUnits
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { INDIA_STATES } from "@/lib/constants";
import { format } from "date-fns";
import {
  PhoneCall, CheckCircle, Clock, Building2, Activity, Plus,
  AlertCircle, Send, Eye, TrendingUp, Users, Zap, BarChart2,
  ClipboardList, HeartHandshake, Search, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useMemo } from "react";

// ─── Colors ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#f59e0b",
  team_sent: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

// ─── Manual Entry Schema ─────────────────────────────────────────────────────
const mobileRegex = /^\+91 [6-9]\d{9}$/;

const manualEntrySchema = z.object({
  referrerName: z.string().min(2, "Name required"),
  referrerMobile: z.string().regex(mobileRegex, "Valid +91 mobile required"),
  referrerRelationship: z.string().min(2, "Relationship required"),
  donorName: z.string().min(2, "Donor name required"),
  donorAge: z.coerce.number().min(0).max(120),
  donorGender: z.enum(["male", "female", "other"]),
  timeOfDeath: z.string().min(3, "Required"),
  causeOfDeath: z.string().min(2, "Required"),
  state: z.string().min(2, "State required"),
  district: z.string().min(2, "District required"),
  pincode: z.string().min(6, "Pincode required").max(6),
  address: z.string().min(5, "Address required"),
  unitId: z.coerce.number().min(1, "Select a unit"),
});

type ManualEntryValues = z.infer<typeof manualEntrySchema>;

// ─── Manual Entry Dialog ──────────────────────────────────────────────────────
function ManualEntryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: units } = useListUnits({});
  const createCall = useCreateEyeCall();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ManualEntryValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      referrerName: "", referrerMobile: "+91 ", referrerRelationship: "",
      donorName: "", donorAge: undefined as any, donorGender: "male",
      timeOfDeath: "", causeOfDeath: "", state: "", district: "",
      pincode: "", address: "", unitId: 0,
    },
  });

  const selectedState = form.watch("state");
  const districts = useMemo(() => {
    const stateObj = INDIA_STATES.find(s => s.name === selectedState);
    return stateObj ? stateObj.districts : [];
  }, [selectedState]);

  const handleMobile = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (!v.startsWith("+91 ")) { form.setValue("referrerMobile", "+91 ", { shouldValidate: true }); return; }
    const suffix = v.substring(4).replace(/\D/g, "").replace(/^0/, "").substring(0, 10);
    form.setValue("referrerMobile", "+91 " + suffix, { shouldValidate: true });
  };

  const onSubmit = (data: ManualEntryValues) => {
    createCall.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "✅ Record Added", description: "Eye donation record saved successfully." });
        queryClient.invalidateQueries();
        form.reset();
        onClose();
      },
      onError: () => toast({ title: "Error", description: "Failed to save record.", variant: "destructive" }),
    });
  };

  const err = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-500" />
            Manual Donation Record Entry
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Add a donation record manually for offline or walk-in cases. All fields marked are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">

          {/* Section: Referrer */}
          <div className="border border-orange-100 rounded-2xl p-4 space-y-4 bg-orange-50/30">
            <h3 className="text-xs font-extrabold text-orange-700 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Referrer / Contact Person
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Full Name *</Label>
                <Input placeholder="e.g. Suresh Kumar" className="h-10 rounded-xl" {...form.register("referrerName")} />
                {err.referrerName && <p className="text-[10px] text-red-500">{err.referrerName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Contact Mobile *</Label>
                <Input type="tel" className="h-10 rounded-xl font-semibold" {...form.register("referrerMobile", { onChange: handleMobile })} />
                {err.referrerMobile && <p className="text-[10px] text-red-500">{err.referrerMobile.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Relationship to Donor *</Label>
                <Input placeholder="e.g. Son, Daughter, Spouse" className="h-10 rounded-xl" {...form.register("referrerRelationship")} />
                {err.referrerRelationship && <p className="text-[10px] text-red-500">{err.referrerRelationship.message}</p>}
              </div>
            </div>
          </div>

          {/* Section: Donor */}
          <div className="border border-blue-100 rounded-2xl p-4 space-y-4 bg-blue-50/20">
            <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5" /> Donor Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Full Name *</Label>
                <Input placeholder="Donor's full name" className="h-10 rounded-xl" {...form.register("donorName")} />
                {err.donorName && <p className="text-[10px] text-red-500">{err.donorName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Age *</Label>
                <Input type="number" placeholder="Age" className="h-10 rounded-xl" {...form.register("donorAge")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Gender *</Label>
                <Select onValueChange={v => form.setValue("donorGender", v as any)} defaultValue="male">
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Time of Death *</Label>
                <Input placeholder="e.g. 10:30 AM (23 May 2026)" className="h-10 rounded-xl" {...form.register("timeOfDeath")} />
                {err.timeOfDeath && <p className="text-[10px] text-red-500">{err.timeOfDeath.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Cause of Death *</Label>
                <Input placeholder="e.g. Cardiac arrest" className="h-10 rounded-xl" {...form.register("causeOfDeath")} />
                {err.causeOfDeath && <p className="text-[10px] text-red-500">{err.causeOfDeath.message}</p>}
              </div>
            </div>
          </div>

          {/* Section: Location */}
          <div className="border border-green-100 rounded-2xl p-4 space-y-4 bg-green-50/20">
            <h3 className="text-xs font-extrabold text-green-700 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Location & Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">State *</Label>
                <Select onValueChange={v => { form.setValue("state", v, { shouldValidate: true }); form.setValue("district", ""); }}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select State" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDIA_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {err.state && <p className="text-[10px] text-red-500">{err.state.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">District *</Label>
                <Select disabled={!selectedState} onValueChange={v => form.setValue("district", v, { shouldValidate: true })}>
                  <SelectTrigger className="h-10 rounded-xl disabled:opacity-50"><SelectValue placeholder={selectedState ? "Select District" : "Select State first"} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {err.district && <p className="text-[10px] text-red-500">{err.district.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Pincode *</Label>
                <Input placeholder="6-digit pincode" maxLength={6} className="h-10 rounded-xl" {...form.register("pincode")} />
                {err.pincode && <p className="text-[10px] text-red-500">{err.pincode.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Assigned Unit *</Label>
                <Select onValueChange={v => form.setValue("unitId", Number(v), { shouldValidate: true })}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select Unit" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {units?.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {err.unitId && <p className="text-[10px] text-red-500">{err.unitId.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Collection Address *</Label>
                <Input placeholder="Full address of eye collection" className="h-10 rounded-xl" {...form.register("address")} />
                {err.address && <p className="text-[10px] text-red-500">{err.address.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={createCall.isPending}
              className="flex-1 h-11 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] text-white rounded-xl font-bold border-0 flex items-center justify-center gap-2"
            >
              {createCall.isPending
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <><Send size={16} /> Save Donation Record</>
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, color, sub }: {
  title: string; value: number | string; icon: React.ReactNode;
  color: string; sub?: string;
}) {
  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{sub}</p>}
          </div>
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<number | "all">("all");
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";

  const { data: units } = useListUnits({});

  const { data: globalStats, isLoading: globalStatsLoading } = useGetDashboardStats();
  const { data: globalStatusData, isLoading: globalStatusLoading } = useGetCallsByStatus();
  const { data: globalUnitData, isLoading: globalUnitLoading } = useGetCallsByUnit();
  const { data: globalRecentCalls, isLoading: globalRecentLoading } = useGetRecentCalls({ limit: 8 });

  const { data: unitCallsData, isLoading: unitCallsLoading } = useListEyeCalls(
    { unitId: selectedUnit === "all" ? undefined : selectedUnit, limit: 100 }
  );

  const stats = selectedUnit === "all" ? globalStats : {
    totalCalls: unitCallsData?.data?.length || 0,
    newCalls: unitCallsData?.data?.filter(c => c.status === "new").length || 0,
    contactedCalls: unitCallsData?.data?.filter(c => c.status === "contacted").length || 0,
    teamSentCalls: unitCallsData?.data?.filter(c => c.status === "team_sent").length || 0,
    completedCalls: unitCallsData?.data?.filter(c => c.status === "completed").length || 0,
    cancelledCalls: unitCallsData?.data?.filter(c => c.status === "cancelled").length || 0,
    totalUnits: 1,
    activeUnits: 1
  };

  const statusData = selectedUnit === "all" ? globalStatusData : [
    { status: "new", count: stats?.newCalls || 0 },
    { status: "contacted", count: stats?.contactedCalls || 0 },
    { status: "team_sent", count: stats?.teamSentCalls || 0 },
    { status: "completed", count: stats?.completedCalls || 0 },
    { status: "cancelled", count: stats?.cancelledCalls || 0 },
  ].filter(s => s.count > 0);

  const unitData = selectedUnit === "all" ? globalUnitData : [];
  const recentCalls = selectedUnit === "all" ? globalRecentCalls : unitCallsData?.data?.slice(0, 8);

  const statsLoading = selectedUnit === "all" ? globalStatsLoading : unitCallsLoading;
  const statusLoading = selectedUnit === "all" ? globalStatusLoading : unitCallsLoading;
  const unitLoading = selectedUnit === "all" ? globalUnitLoading : false;

  const filteredRecent = useMemo(() => {
    if (!recentCalls || !search) return recentCalls || [];
    const q = search.toLowerCase();
    return recentCalls.filter(c =>
      c.donorName?.toLowerCase().includes(q) ||
      c.referrerName?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.unitName?.toLowerCase().includes(q)
    );
  }, [recentCalls, search]);

  const pieData = (statusData || []).map(d => ({
    name: d.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: d.count,
    color: STATUS_COLORS[d.status] || "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Eye Bank Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin ? "Super Admin — All Units Overview" : `Unit Coordinator — ${user?.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Select value={selectedUnit.toString()} onValueChange={v => setSelectedUnit(v === "all" ? "all" : Number(v))}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white border-gray-200 shadow-sm font-semibold text-gray-700">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units?.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => setShowManualEntry(true)}
            className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] text-white rounded-xl font-bold border-0 h-10 px-5 flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus size={16} /> Manual Entry
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Records"
            value={stats?.totalCalls || 0}
            icon={<PhoneCall className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
            sub="All time"
          />
          <StatCard
            title="Pending / New"
            value={stats?.newCalls || 0}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            color="bg-amber-50"
            sub="Needs attention"
          />
          <StatCard
            title="Completed"
            value={stats?.completedCalls || 0}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
            sub="Sight restored"
          />
          <StatCard
            title="Active Units"
            value={stats?.activeUnits || 0}
            icon={<Building2 className="h-5 w-5 text-purple-600" />}
            color="bg-purple-50"
            sub="Operational"
          />
        </div>
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-orange-500" /> Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {statusLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v: any, n: any) => [v, n]} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span className="text-[11px] text-gray-600 font-semibold">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" /> Calls per Unit
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {unitLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitData || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="unitName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <RechartsTooltip cursor={{ fill: "#fef3c7" }} />
                  <Bar dataKey="count" fill="#ff7a18" radius={[6, 6, 0, 0]} label={{ position: "top", fontSize: 10, fill: "#374151" }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Records ── */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" /> Recent Donation Records
            </CardTitle>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Search records..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {globalRecentLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Call ID</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Donor</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Location</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Referrer</TableHead>
                    {isAdmin && <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Unit</TableHead>}
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Time</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-gray-400 text-sm">
                        No records found. Use "Manual Entry" to add the first record.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecent.map(call => (
                      <TableRow key={call.id} className="hover:bg-orange-50/30 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-orange-700">{call.callId}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900 text-sm">{call.donorName}</div>
                          <div className="text-[11px] text-gray-400">{call.donorAge}y • {call.donorGender}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-700">{call.district}</div>
                          <div className="text-[11px] text-gray-400">{call.state}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-700">{call.referrerName}</div>
                          <div className="text-[11px] text-gray-400">{call.referrerMobile}</div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-sm text-gray-600 font-medium">{call.unitName}</TableCell>
                        )}
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {format(new Date(call.createdAt), "d MMM, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={call.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setShowManualEntry(true)}
          className="group flex items-center gap-4 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
        >
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
            <Plus className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-sm">Manual Donation Entry</p>
            <p className="text-[11px] text-white/80">Add offline / walk-in records</p>
          </div>
        </button>

        <a href="/eye-calls" className="group flex items-center gap-4 bg-white border border-gray-100 text-gray-900 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 group-hover:rotate-6 transition-transform">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-sm">All Eye Calls</p>
            <p className="text-[11px] text-gray-400">Manage & update statuses</p>
          </div>
        </a>

        {isAdmin && (
          <a href="/units" className="group flex items-center gap-4 bg-white border border-gray-100 text-gray-900 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-purple-600 group-hover:rotate-6 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-sm">Manage Units</p>
              <p className="text-[11px] text-gray-400">Add or edit hospital units</p>
            </div>
          </a>
        )}
      </div>

      {/* Manual Entry Dialog */}
      <ManualEntryDialog open={showManualEntry} onClose={() => setShowManualEntry(false)} />
    </div>
  );
}
