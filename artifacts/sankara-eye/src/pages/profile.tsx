import { useUpdateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { UserCircle, Mail, Shield, Building, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [name, setName] = useState("");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSave = () => {
    updateProfile.mutate({ data: { name } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({ title: "Profile updated successfully" });
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" })
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-gray-500">Manage your account settings and preferences.</p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border-4 border-white shadow-sm">
              <UserCircle className="h-10 w-10" />
            </div>
            <div>
              <CardTitle className="text-xl">{user?.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
                  {user?.role?.replace("_", " ").toUpperCase()}
                </Badge>
                {user?.unitName && (
                  <Badge variant="outline" className="text-gray-600 bg-white">
                    <Building className="h-3 w-3 mr-1" /> {user.unitName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" /> Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address (Read-only)</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={updateProfile.isPending || name === user?.name || !name}
              className="mt-2"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <hr className="border-gray-100" />

          <div className="pt-2">
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
