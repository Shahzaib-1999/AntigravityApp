import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell({ user }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const [lastMessageCheck, setLastMessageCheck] = useState(() => {
        return localStorage.getItem('lastMessageCheck') || '1970-01-01T00:00:00.000Z';
    });

    // Fetch unread messages
    const { data: unreadMessages = [] } = useQuery({
        queryKey: ['unread-messages', user?.email],
        queryFn: async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('receiver_email', user.email)
                .eq('is_read', false)
                .order('created_at', { ascending: false });
            return data || [];
        },
        enabled: !!user,
        refetchInterval: 30000 // Check every 30 seconds
    });

    // Fetch job alerts to find new jobs
    const { data: newJobs = [] } = useQuery({
        queryKey: ['new-jobs-notifications', user?.id],
        queryFn: async () => {
            // 1. Get user's alerts
            const { data: alerts } = await supabase
                .from('job_alerts')
                .select('*')
                .eq('user_id', user.id)
                .eq('active', true);

            if (!alerts || alerts.length === 0) return [];

            // 2. Find the oldest check time to minimize data fetched
            const oldestCheck = alerts.reduce((min, alert) => {
                const checkDate = new Date(alert.last_checked || '1970-01-01');
                return checkDate < min ? checkDate : min;
            }, new Date());

            // 3. Fetch ALL potential jobs in one query
            const { data: potentialJobs } = await supabase
                .from('jobs')
                .select('*')
                .gt('created_at', oldestCheck.toISOString())
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (!potentialJobs || potentialJobs.length === 0) return [];

            // 4. Filter jobs in memory
            const matchedJobs = potentialJobs.filter(job => {
                const jobDate = new Date(job.created_at);

                // Check if this job matches ANY of the user's alerts
                return alerts.some(alert => {
                    const alertDate = new Date(alert.last_checked || '1970-01-01');

                    // Must be newer than this specific alert's last check
                    if (jobDate <= alertDate) return false;

                    // Check criteria
                    if (alert.region && alert.region !== 'all' && alert.region !== job.region) return false;
                    if (alert.city && alert.city !== 'all' && alert.city !== job.city) return false;
                    if (alert.job_type && alert.job_type !== 'all' && alert.job_type !== job.job_type) return false;

                    // If we have category logic in alerts, add it here. 
                    // Assuming basic filtering for now as per original code.

                    return true;
                });
            });

            return matchedJobs;
        },
        enabled: !!user,
        refetchInterval: 60000 // Check every minute
    });

    const updateAlertsMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('job_alerts')
                .update({ last_checked: new Date().toISOString() })
                .eq('user_id', user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['new-jobs-notifications'] });
        }
    });

    const handleOpenChange = (open) => {
        setIsOpen(open);
        if (open) {
            // Mark alerts as checked when opening
            if (newJobs.length > 0) {
                updateAlertsMutation.mutate();
            }
            // Update last message check time
            const now = new Date().toISOString();
            setLastMessageCheck(now);
            localStorage.setItem('lastMessageCheck', now);
        }
    };

    // Filter unread messages for badge count (only show ones received after last check)
    const newUnreadMessages = unreadMessages.filter(msg => new Date(msg.created_at) > new Date(lastMessageCheck));
    const totalNotifications = newUnreadMessages.length + newJobs.length;

    if (!user) return null;

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {totalNotifications > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white rounded-full text-xs">
                            {totalNotifications > 9 ? '9+' : totalNotifications}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[80vh] overflow-y-auto">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {totalNotifications === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        No new notifications
                    </div>
                ) : (
                    <>
                        {unreadMessages.length > 0 && (
                            <>
                                <DropdownMenuLabel className="text-xs text-gray-500">Messages</DropdownMenuLabel>
                                {unreadMessages.map((msg) => (
                                    <DropdownMenuItem
                                        key={msg.id}
                                        className="cursor-pointer flex flex-col items-start p-3"
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate(createPageUrl(`Messages?jobId=${msg.job_id}&otherEmail=${msg.sender_email}`));
                                        }}
                                    >
                                        <span className="font-semibold text-sm">{msg.sender_name || 'User'}</span>
                                        <span className="text-xs text-gray-600 truncate w-full">{msg.message}</span>
                                        <span className="text-[10px] text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                            </>
                        )}

                        {newJobs.length > 0 && (
                            <>
                                <DropdownMenuLabel className="text-xs text-gray-500">New Jobs</DropdownMenuLabel>
                                {newJobs.map((job) => (
                                    <DropdownMenuItem
                                        key={job.id}
                                        className="cursor-pointer flex flex-col items-start p-3"
                                        onClick={() => navigate(createPageUrl(`JobDetail?id=${job.id}`))}
                                    >
                                        <span className="font-semibold text-sm">{job.title}</span>
                                        <span className="text-xs text-gray-600">{job.company} • {job.region}</span>
                                        <span className="text-[10px] text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
