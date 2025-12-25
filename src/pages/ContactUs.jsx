import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "../components/LanguageContext";

export default function ContactUs() {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      setSent(true);
      toast.success(t('messageSent') || "Message sent successfully!");
    } catch (error) {
      toast.error(t('messageFailed') || "Failed to send message. Please try again.");
    }

    setSending(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-xl mx-auto px-4">
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('thankYou') || "Thank You!"}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('messageReceived') || "Your message has been received. We'll get back to you soon."}
            </p>
            <Button
              onClick={() => {
                setSent(false);
                setFormData({ name: "", email: "", subject: "", message: "" });
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {t('sendAnother') || "Send Another Message"}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('contactUs') || "Contact Us"}
          </h1>
          <p className="text-gray-600">
            {t('contactDesc') || "Have a question or feedback? Send us a message."}
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">{t('yourName') || "Your Name"} *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('namePlaceholder') || "Enter your name"}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">{t('yourEmail') || "Your Email"} *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('emailPlaceholder') || "Enter your email"}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="subject">{t('subject') || "Subject"} *</Label>
              <Input
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={t('subjectPlaceholder') || "What is this about?"}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">{t('yourMessage') || "Your Message"} *</Label>
              <Textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t('messagePlaceholder') || "Write your message here..."}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {sending ? (
                <>{t('sending') || "Sending..."}</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('sendMessage') || "Send Message"}
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}