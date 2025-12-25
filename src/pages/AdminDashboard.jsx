import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trash2, Mail, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "../components/LanguageContext";

const ADMIN_EMAIL = "info.usta.uz@gmail.com";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.email !== ADMIN_EMAIL) {
                toast.error("Unauthorized access");
                navigate(createPageUrl("Home"));
                return;
            }
            setUser(user);
            setLoading(false);
        };
        checkUser();
    }, [navigate]);

    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['contact-messages'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const deleteMessageMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('contact_messages').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Message deleted");
            queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
        },
        onError: () => {
            toast.error("Failed to delete message");
        }
    });

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8 text-orange-600" />
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600">Manage contact messages and system alerts</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['contact-messages'] })}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Contact Messages ({messages.length})
                    </h2>

                    {messagesLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No messages found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg">{msg.subject}</h3>
                                            <p className="text-sm text-gray-500">
                                                From: <span className="font-medium text-gray-900">{msg.name}</span> ({msg.email})
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(msg.created_at), "MMM d, yyyy HH:mm")}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    if (window.confirm("Delete this message?")) {
                                                        deleteMessageMutation.mutate(msg.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded text-gray-700 whitespace-pre-wrap">
                                        {msg.message}
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <a
                                            href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                                            className="text-sm text-orange-600 hover:underline font-medium flex items-center gap-1"
                                        >
                                            <Mail className="w-3 h-3" />
                                            Reply via Email
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
