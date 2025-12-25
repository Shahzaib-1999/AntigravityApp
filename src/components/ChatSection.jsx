import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Send, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function ChatSection({ jobId, currentUser, jobOwnerEmail, isOwner, applicantId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const scrollRef = useRef(null);

    // For Owner: Fetch list of applicants who have messaged OR if applicantId is provided
    useEffect(() => {
        if (isOwner) {
            const fetchApplicants = async () => {
                // If applicantId is provided, fetch that specific applicant first
                if (applicantId) {
                    const { data: appData } = await supabase
                        .from('applications')
                        .select('created_by, applicant_name, applicant_email')
                        .eq('job_id', jobId)
                        .eq('created_by', applicantId)
                        .single();

                    if (appData) {
                        const applicant = {
                            sender_email: appData.created_by,
                            sender_name: appData.applicant_name
                        };
                        setSelectedApplicant(applicant);
                        return; // Skip fetching list if we have a specific target
                    }
                }

                // Get unique senders for this job excluding the owner
                const { data, error } = await supabase
                    .from('messages')
                    .select('sender_email, sender_name')
                    .eq('job_id', jobId)
                    .neq('sender_email', currentUser.email);

                if (data) {
                    // Deduplicate by email
                    const uniqueApplicants = Array.from(new Map(data.map(item => [item.sender_email, item])).values());
                    setApplicants(uniqueApplicants);
                }
            };
            fetchApplicants();
        }
    }, [isOwner, jobId, currentUser.email, applicantId]);

    // Determine who we are chatting with
    const chatPartnerEmail = isOwner ? selectedApplicant?.sender_email : jobOwnerEmail;

    // Fetch Messages
    useEffect(() => {
        if (!chatPartnerEmail) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('job_id', jobId)
                .or(`and(sender_email.eq.${currentUser.email},receiver_email.eq.${chatPartnerEmail}),and(sender_email.eq.${chatPartnerEmail},receiver_email.eq.${currentUser.email})`)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${jobId}:${currentUser.email}:${chatPartnerEmail}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `job_id=eq.${jobId}`
                },
                (payload) => {
                    const newMsg = payload.new;
                    // Check if message belongs to this conversation
                    if (
                        (newMsg.sender_email === currentUser.email && newMsg.receiver_email === chatPartnerEmail) ||
                        (newMsg.sender_email === chatPartnerEmail && newMsg.receiver_email === currentUser.email)
                    ) {
                        setMessages(prev => {
                            // Deduplicate based on ID
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [jobId, currentUser.email, chatPartnerEmail]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatPartnerEmail) return;

        const msgData = {
            id: crypto.randomUUID(), // Generate ID client-side for deduplication
            job_id: jobId,
            sender_email: currentUser.email,
            sender_name: currentUser.user_metadata?.full_name || currentUser.email,
            receiver_email: chatPartnerEmail,
            message: newMessage.trim(),
            created_at: new Date().toISOString()
        };

        // Optimistic update
        setMessages(prev => [...prev, msgData]);
        setNewMessage("");

        const { error } = await supabase.from('messages').insert(msgData);
        if (error) {
            console.error("Error sending message:", error);
            // Rollback on error (optional, but good practice)
            setMessages(prev => prev.filter(m => m.id !== msgData.id));
            // toast.error("Failed to send message");
        }
    };

    if (isOwner && !selectedApplicant) {
        return (
            <Card className="p-6 mt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Applicant Messages
                </h3>
                {applicants.length === 0 ? (
                    <p className="text-gray-500">No messages yet.</p>
                ) : (
                    <div className="space-y-2">
                        {applicants.map(applicant => (
                            <div
                                key={applicant.sender_email}
                                onClick={() => setSelectedApplicant(applicant)}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                            >
                                <Avatar>
                                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{applicant.sender_name || applicant.sender_email}</p>
                                    <p className="text-xs text-gray-500">{applicant.sender_email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        );
    }

    return (
        <Card className="p-6 mt-8 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {isOwner ? `Chat with ${selectedApplicant?.sender_name}` : "Chat with Employer"}
                </h3>
                {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(null)}>
                        Back to list
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.sender_email === currentUser.email;
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${isMe
                                            ? 'bg-orange-500 text-white rounded-br-none'
                                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.message}</p>
                                        <p className={`text-[10px] mt-1 ${isMe ? 'text-orange-100' : 'text-gray-500'}`}>
                                            {format(new Date(msg.created_at), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-orange-500 hover:bg-orange-600">
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </Card>
    );
}
