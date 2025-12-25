import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Award,
  Calendar, Instagram, Facebook, Send, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "../components/LanguageContext";
import { toast } from "sonner";

export default function JobSeekerProfile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const seekerId = urlParams.get("id");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [seekerId]);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const { data: seeker, isLoading } = useQuery({
    queryKey: ['jobSeeker', seekerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('id', seekerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!seekerId
  });

  const queryClient = useQueryClient();

  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('job_seekers')
        .delete()
        .eq('id', seekerId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Profile could not be deleted. You may not have permission or it was already deleted.");
      }
    },
    onSuccess: () => {
      toast.success("Profile deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['jobSeekers'] });
      navigate(createPageUrl("JobSeekersList"));
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error(`Failed to delete profile: ${error.message}`);
    }
  });

  const handleDeleteProfile = () => {
    if (window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
      deleteProfileMutation.mutate();
    }
  };

  const isOwnProfile = user && seeker && user.email === seeker.email;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!seeker) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profileNotFound')}</h2>
        <Button onClick={() => navigate(createPageUrl("JobSeekersList"))}>
          {t('backToJobSeekers')}
        </Button>
      </div>
    );
  }

  const regionsMap = {
    "tashkent_shahar": "Toshkent Shahar",
    "tashkent_viloyati": "Toshkent Viloyati",
    "samarkand": "Samarqand",
    "fargona": "Farg'ona",
    "andijon": "Andijon",
    "namangan": "Namangan",
    "buxoro": "Buxoro",
    "navoiy": "Navoiy",
    "qashqadaryo": "Qashqadaryo",
    "surxondaryo": "Surxondaryo",
    "jizzax": "Jizzax",
    "sirdaryo": "Sirdaryo",
    "xorazm": "Xorazm",
    "qoraqalpogiston": "Qoraqalpog'iston"
  };

  const formatRegion = (value) => {
    return regionsMap[value] || value;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("JobSeekersList"))}
            className="mb-6 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToJobSeekers')}
          </Button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white flex-shrink-0">
              {seeker.profile_image ? (
                <img
                  src={seeker.profile_image}
                  alt={seeker.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-100">
                  <User className="w-16 h-16 text-orange-600" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{seeker.full_name}</h1>
              <p className="text-xl text-orange-100 mb-4">{seeker.job_title}</p>
              <div className="flex flex-wrap gap-2">
                {seeker.categories && seeker.categories.map((cat, idx) => (
                  <Badge key={idx} className="bg-white/20 text-white border-white/30">
                    {t(cat)}
                  </Badge>
                ))}
                {seeker.experience_level && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {t(seeker.experience_level)} {t('level')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="secondary"
                    className="w-full bg-white text-orange-600 hover:bg-orange-50"
                    onClick={() => navigate(createPageUrl("LookingForJob"))}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteProfile}
                    disabled={deleteProfileMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteProfileMutation.isPending ? t('deleting') : t('deleteProfile')}
                  </Button>
                </>
              ) : (
                <>
                  {seeker.email && (
                    <a href={`mailto:${seeker.email}`}>
                      <Button className="w-full bg-white text-orange-600 hover:bg-orange-50">
                        <Mail className="w-4 h-4 mr-2" />
                        {t('email')}
                      </Button>
                    </a>
                  )}
                  {seeker.phone && (
                    <a href={`tel:${seeker.phone}`}>
                      <Button className="w-full bg-white text-orange-600 hover:bg-orange-50">
                        <Phone className="w-4 h-4 mr-2" />
                        {t('call')}
                      </Button>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {seeker.bio && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('about')}</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {seeker.bio}
                </p>
              </Card>
            )}

            {/* Skills */}
            {seeker.skills && seeker.skills.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-900">{t('skills')}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {seeker.skills.map((skill, idx) => (
                    <Badge key={idx} className="bg-orange-100 text-orange-700 border-orange-200 text-sm py-1 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Experience */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('experience')}</h2>
              </div>
              <div className="space-y-3">
                {seeker.years_experience && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {seeker.years_experience} {t('years')} {t('ofExperience')}
                    </span>
                  </div>
                )}
                {seeker.experience_level && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {t(seeker.experience_level)} {t('level')} {t('professional')}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('contactInfo')}</h3>
              <div className="space-y-3">
                {seeker.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <a href={`mailto:${seeker.email}`} className="text-orange-600 hover:underline text-sm">
                      {seeker.email}
                    </a>
                  </div>
                )}
                {seeker.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <a href={`tel:${seeker.phone}`} className="text-orange-600 hover:underline text-sm">
                      {seeker.phone}
                    </a>
                  </div>
                )}
                {seeker.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-700 text-sm">{seeker.location}</span>
                  </div>
                )}
                {seeker.region && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-700 text-sm">
                      {seeker.city ? `${seeker.city}, ${formatRegion(seeker.region)}` : formatRegion(seeker.region)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Social Media */}
            {(seeker.instagram || seeker.facebook || seeker.telegram) && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('socialMedia')}</h3>
                <div className="space-y-3">
                  {seeker.instagram && (
                    <a
                      href={seeker.instagram.startsWith('http') ? seeker.instagram : `https://instagram.com/${seeker.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-orange-600 transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {seeker.facebook && (
                    <a
                      href={seeker.facebook.startsWith('http') ? seeker.facebook : `https://facebook.com/${seeker.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-orange-600 transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </a>
                  )}
                  {seeker.telegram && (
                    <a
                      href={seeker.telegram.startsWith('http') ? seeker.telegram : `https://t.me/${seeker.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-orange-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Telegram</span>
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Job Categories */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('categories')}</h3>
              <div className="flex flex-wrap gap-2">
                {seeker.categories && seeker.categories.map((cat, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {t(cat)}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}