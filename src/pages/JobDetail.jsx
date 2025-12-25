import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Calendar,
  Building2, CheckCircle, Send, User, Phone, Mail, Trash2, MessageSquare, ChevronLeft, ChevronRight, Edit, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "../components/LanguageContext";
import ChatSection from "../components/ChatSection";

export default function JobDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("id");
  const [user, setUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [jobSeekerProfile, setJobSeekerProfile] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (urlParams.get("chat") === "true") {
      setTimeout(() => {
        document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [jobId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const { data: userApplications = [] } = useQuery({
    queryKey: ['user-applications', user?.email, jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('created_by', user.email);
      return data || [];
    },
    enabled: !!user && !!jobId
  });

  const { data: applicationCount = 0 } = useQuery({
    queryKey: ['application-count', jobId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);
      if (error) throw error;
      return count;
    },
    enabled: !!jobId
  });

  const { data: jobSeekerProfiles = [] } = useQuery({
    queryKey: ['jobseeker-profile', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('created_by', user.email);
      return data || [];
    },
    enabled: !!user
  });

  useEffect(() => {
    if (jobSeekerProfiles.length > 0) {
      setJobSeekerProfile(jobSeekerProfiles[0]);
    }
  }, [jobSeekerProfiles]);

  useEffect(() => {
    setHasApplied(userApplications.length > 0);
  }, [userApplications]);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job deleted successfully!");
      navigate(createPageUrl("Home"));
    },
    onError: () => {
      toast.error("Failed to delete job");
    }
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate(createPageUrl("MyLogin"));
        throw new Error("Please log in to apply");
      }
      if (!jobSeekerProfile) {
        throw new Error("Please create a profile first");
      }
      const { error } = await supabase.from('applications').insert({
        job_id: jobId,
        applicant_name: user.user_metadata?.full_name || user.email,
        applicant_email: user.email,
        applicant_phone: jobSeekerProfile.phone || "",
        years_experience: jobSeekerProfile.years_experience || 0,
        certifications: [],
        cover_letter: `I'm interested in the ${job.title} position and would like to discuss this opportunity with you.`,
        status: 'pending',
        created_by: user.email,
        created_at: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You have applied for this position!");
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
    },
    onError: (error) => {
      if (error.message === "Please create a profile first") {
        toast.error("Please create your profile first to apply for jobs");
        setTimeout(() => {
          navigate(createPageUrl("LookingForJob"));
        }, 2000);
      } else {
        toast.error(error.message || "Failed to submit application");
      }
    }
  });

  const handleApplyNow = () => {
    if (!user) {
      navigate(createPageUrl("MyLogin"));
      return;
    }
    if (!jobSeekerProfile) {
      toast.error("Please create your profile first to apply for jobs");
      setTimeout(() => {
        navigate(createPageUrl("LookingForJob"));
      }, 2000);
      return;
    }
    applyMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      deleteJobMutation.mutate();
    }
  };

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

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('jobNotFound')}</h2>
        <Button onClick={() => navigate(createPageUrl("Home"))}>
          {t('backToJobs')}
        </Button>
      </div>
    );
  }

  const formatSalary = () => {
    if (!job.salary_min) return t('salaryNegotiable');
    const min = job.salary_min.toLocaleString();
    const max = job.salary_max ? job.salary_max.toLocaleString() : null;
    const period = job.salary_period || "hourly";
    if (max) return `$${min} - $${max} / ${t(period)}`;
    return `$${min} / ${t(period)}`;
  };

  const isJobOwner = user && user.email === job.created_by;
  const images = job.image_urls || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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

  const formatRegion = (regionValue) => {
    return regionsMap[regionValue] || regionValue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Image Carousel */}
      {images.length > 0 && (
        <div className="h-96 bg-gray-900 relative">
          <img
            src={images[currentImageIndex]}
            alt={`${job.title} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-contain"
          />

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                onClick={prevImage}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                onClick={nextImage}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${idx === currentImageIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("JobsList"))}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToJobs')}
          </Button>

          {isJobOwner && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl(`EditJob?id=${jobId}`))}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteJobMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteJobMutation.isPending ? t('deleting') : 'Delete'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Building2 className="w-5 h-5" />
                  <span className="text-lg">{job.company}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(job.categories || (job.category ? [job.category] : [])).filter(cat => cat).map((cat, idx) => (
                    <Badge key={idx} className="bg-orange-100 text-orange-700 border-orange-200">
                      {t(cat) || cat.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {t(job.job_type) || job.job_type?.replace(/_/g, ' ') || 'N/A'}
                  </Badge>
                  {job.experience_level && (
                    <Badge variant="outline">
                      {t(job.experience_level)} {t('level')}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                {job.region && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('region')}</p>
                      <p className="font-medium">{formatRegion(job.region)}</p>
                    </div>
                  </div>
                )}
                {job.city && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('cityDistrict')}</p>
                      <p className="font-medium">{job.city}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">{t('compensation')}</p>
                    <p className="font-medium">{formatSalary()}</p>
                  </div>
                </div>
                {job.start_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('startDate')}</p>
                      <p className="font-medium">{format(new Date(job.start_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
                {job.duration && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('duration')}</p>
                      <p className="font-medium">{job.duration}</p>
                    </div>
                  </div>
                )}
              </div>

              {job.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t('jobDescription')}</h2>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
                </div>
              )}

              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t('requirements')}</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t('benefits')}</h2>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.file_urls && job.file_urls.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Attached Documents</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {job.file_urls.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="p-2 bg-white rounded-md border group-hover:border-orange-200">
                          <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.name || `Document ${idx + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">Click to view PDF</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Chat Section */}
            {(hasApplied || isJobOwner) && (
              <div id="chat-section">
                <ChatSection
                  jobId={jobId}
                  currentUser={user}
                  jobOwnerEmail={job.created_by}
                  isOwner={isJobOwner}
                  applicantId={urlParams.get("applicant")}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-24">
              {!isJobOwner ? (
                <>
                  {hasApplied ? (
                    <>
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="w-5 h-5" />
                          <p className="font-semibold">You have applied for this position</p>
                        </div>
                      </div>
                      <Button
                        className="w-full mb-4 h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with Employer
                      </Button>
                      {(job.contact_email || job.contact_phone) && (
                        <Button
                          variant="outline"
                          className="w-full mb-4 h-12 text-base font-semibold"
                          onClick={() => {
                            if (job.contact_email && job.contact_phone) {
                              const choice = window.confirm(
                                `${t('contactEmployer')}\n\nEmail: ${job.contact_email}\nPhone: ${job.contact_phone}\n\nClick OK for Email, Cancel for Phone`
                              );
                              if (choice) {
                                window.location.href = `mailto:${job.contact_email}`;
                              } else {
                                window.location.href = `tel:${job.contact_phone}`;
                              }
                            } else if (job.contact_email) {
                              window.location.href = `mailto:${job.contact_email}`;
                            } else if (job.contact_phone) {
                              window.location.href = `tel:${job.contact_phone}`;
                            }
                          }}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          {t('contactEmployer')}
                        </Button>
                      )}
                    </>
                  ) : <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 mb-3 h-12 text-base font-semibold"
                    onClick={handleApplyNow}
                    disabled={applyMutation.isPending || (job.max_applications && applicationCount >= job.max_applications)}
                  >
                    {applyMutation.isPending ? t('submitting') :
                      (job.max_applications && applicationCount >= job.max_applications) ? t('applicationLimitReached') : t('applyNow')}
                  </Button>
                  }
                </>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 text-base font-semibold bg-blue-500 hover:bg-blue-600"
                    onClick={() => navigate(createPageUrl(`EditJob?id=${jobId}`))}
                  >
                    Edit Job
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full h-12 text-base font-semibold"
                    onClick={handleDelete}
                    disabled={deleteJobMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteJobMutation.isPending ? t('deleting') : t('deleteJob')}
                  </Button>
                </div>
              )}

              {(isJobOwner || hasApplied) && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900">{t('contactInfo')}</h3>
                  {job.contact_name && (
                    <div className="flex items-start gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{job.contact_name}</span>
                    </div>
                  )}
                  {job.contact_email && (
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                      <a href={`mailto:${job.contact_email}`} className="text-orange-600 hover:underline">
                        {job.contact_email}
                      </a>
                    </div>
                  )}
                  {job.contact_phone && (
                    <div className="flex items-start gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <a href={`tel:${job.contact_phone}`} className="text-orange-600 hover:underline">
                        {job.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-gray-500">
                  {t('posted')} {format(new Date(job.created_at || job.created_date), "MMM d, yyyy")}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}