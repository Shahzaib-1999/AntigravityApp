import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Send, MessageSquare, User, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "../components/LanguageContext";

export default function Messages() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        // Redirect handled by protected route usually, but safe to keep
      }
    });
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_email.eq.${user.email},receiver_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-for-messages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*');
      if (error) throw error;
      return data;
    },
    initialData: [],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('messages').insert({
        ...data,
        created_at: new Date().toISOString(),
        read: false
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setNewMessage("");
      toast.success("Message sent!");
    },
    onError: () => {
      toast.error("Failed to send message");
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      const { error } = await supabase.from('messages').update({ read: true }).eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  // Group messages by conversation (job + other person)
  const conversations = React.useMemo(() => {
    if (!user || !messages.length) return [];

    const convMap = new Map();

    messages.forEach(msg => {
      const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
      const key = `${msg.job_id}-${otherEmail}`;

      if (!convMap.has(key)) {
        convMap.set(key, {
          jobId: msg.job_id,
          otherEmail,
          otherName: msg.sender_email === user.email ? msg.receiver_email : msg.sender_name,
          messages: [],
          lastMessage: msg,
          unreadCount: 0
        });
      }

      const conv = convMap.get(key);
      conv.messages.push(msg);

      if (msg.receiver_email === user.email && !msg.read) {
        conv.unreadCount++;
      }
    });

    return Array.from(convMap.values()).sort((a, b) =>
      new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
    );
  }, [messages, user]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const job = jobs.find(j => j.id === selectedConversation.jobId);

    sendMessageMutation.mutate({
      job_id: selectedConversation.jobId,
      sender_email: user.email,
      sender_name: user.full_name,
      receiver_email: selectedConversation.otherEmail,
      message: newMessage.trim()
    });
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);

    // Mark unread messages as read
    conv.messages.forEach(msg => {
      if (msg.receiver_email === user.email && !msg.read) {
        markAsReadMutation.mutate(msg.id);
      }
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="p-4 overflow-y-auto">
            <h2 className="font-semibold text-gray-900 mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv, idx) => {
                  const job = jobs.find(j => j.id === conv.jobId);
                  return (
                    <button
                      key={idx}
                      onClick={() => selectConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedConversation?.jobId === conv.jobId && selectedConversation?.otherEmail === conv.otherEmail
                          ? 'bg-orange-50 border-2 border-orange-200'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-sm">{conv.otherName}</span>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-orange-500 text-white">{conv.unreadCount}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Briefcase className="w-3 h-3" />
                        <span className="truncate">{job?.title || 'Job'}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{conv.lastMessage.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(conv.lastMessage.created_at), "MMM d, h:mm a")}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedConversation.otherName}</h3>
                      <Link
                        to={createPageUrl(`JobDetail?id=${selectedConversation.jobId}`)}
                        className="text-sm text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <Briefcase className="w-3 h-3" />
                        {jobs.find(j => j.id === selectedConversation.jobId)?.title}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map((msg) => {
                      const isMine = msg.sender_email === user.email;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMine ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isMine ? 'text-orange-100' : 'text-gray-500'}`}>
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}