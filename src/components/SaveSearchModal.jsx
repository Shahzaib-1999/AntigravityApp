import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "./LanguageContext";

export default function SaveSearchModal({ open, onOpenChange, searchCriteria }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [alertName, setAlertName] = useState("");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      if (!user) {
        // base44.auth.redirectToLogin(); // Handle redirect in UI or parent
        throw new Error("Please log in");
      }
      const { error } = await supabase.from('job_alerts').insert({
        ...data,
        user_id: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job alert created successfully!");
      queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
      setAlertName("");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to create alert");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAlertMutation.mutate({
      alert_name: alertName,
      categories: searchCriteria.categories || [],
      job_type: searchCriteria.jobType !== "all" ? searchCriteria.jobType : null,
      region: searchCriteria.region !== "all" ? searchCriteria.region : null,
      city: searchCriteria.city !== "all" ? searchCriteria.city : null,
      keywords: searchCriteria.keywords || null,
      active: true,
      last_checked: new Date().toISOString()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Save Job Alert
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="alertName">Alert Name</Label>
            <Input
              id="alertName"
              required
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g., Electrician jobs in Tashkent"
              className="mt-1"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium text-gray-900">Current Search Criteria:</p>
            {searchCriteria.categories?.length > 0 && (
              <p className="text-gray-600">Categories: {searchCriteria.categories.map(c => t(c)).join(", ")}</p>
            )}
            {searchCriteria.jobType && searchCriteria.jobType !== "all" && (
              <p className="text-gray-600">Job Type: {t(searchCriteria.jobType)}</p>
            )}
            {searchCriteria.region && searchCriteria.region !== "all" && (
              <p className="text-gray-600">Region: {searchCriteria.region}</p>
            )}
            {searchCriteria.city && searchCriteria.city !== "all" && (
              <p className="text-gray-600">City: {searchCriteria.city}</p>
            )}
            {searchCriteria.keywords && (
              <p className="text-gray-600">Keywords: {searchCriteria.keywords}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAlertMutation.isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {createAlertMutation.isPending ? "Saving..." : "Save Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}