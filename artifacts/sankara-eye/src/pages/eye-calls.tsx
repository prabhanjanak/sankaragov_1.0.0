import { useState } from "react";
import { useListEyeCalls, useUpdateEyeCallStatus, getListEyeCallsQueryKey } from "@workspace/api-client-react";
import { EyeCallStatus, ListEyeCallsStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EyeCalls() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListEyeCallsStatus | "all">("all");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListEyeCalls({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: 20
  });

  const updateStatus = useUpdateEyeCallStatus();

  const handleStatusChange = (id: number, newStatus: EyeCallStatus) => {
    updateStatus.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEyeCallsQueryKey() });
          toast({ title: "Status updated successfully" });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Eye Calls</h1>
          <p className="text-gray-500">Manage and track emergency eye donation requests.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search donor or referrer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="team_sent">Team Sent</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                    No eye calls found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((call) => (
                  <TableRow key={call.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-mono text-xs font-medium">{call.callId}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{call.donorName}</div>
                      <div className="text-xs text-gray-500">{call.donorAge}y • {call.donorGender}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{call.district}</div>
                      <div className="text-xs text-gray-500">{call.state}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{call.referrerName}</div>
                      <div className="text-xs text-gray-500">{call.referrerMobile}</div>
                    </TableCell>
                    <TableCell className="text-sm">{call.unitName}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(call.createdAt), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={call.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={call.status} 
                        onValueChange={(val) => handleStatusChange(call.id, val as EyeCallStatus)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="team_sent">Team Sent</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {data && data.total > data.limit && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
            <div>Showing {((page - 1) * data.limit) + 1} to {Math.min(page * data.limit, data.total)} of {data.total} entries</div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * data.limit >= data.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
