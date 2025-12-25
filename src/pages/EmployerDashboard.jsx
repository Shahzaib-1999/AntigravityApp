import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Briefcase, MapPin, Clock, Users, Edit, Trash2, Eye,
  CheckCircle, XCircle, Mail, Phone, FileText, Plus, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "../components/LanguageContext";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        navigate(createPageUrl("MyLogin"));
      }
    });
  }, []);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['employer-jobs', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('created_by', user.email)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
    initialData: []
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['employer-applications', jobs.map(j => j.id).join(',')],
    queryFn: async () => {
      if (jobs.length === 0) return [];
      const { data } = await supabase
        .from('applications')
        .select('*')
        .in('job_id', jobs.map(j => j.id))
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: jobs.length > 0,
    initialData: []
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId) => {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      toast.success("Job deleted successfully!");
    },
    onError: () => toast.error("Failed to delete job")
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('applications').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-applications'] });
      toast.success("Application status updated!");
    },
    onError: () => toast.error("Failed to update application")
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from('jobs').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      toast.success("Job updated successfully!");
    },
    onError: () => toast.error("Failed to update job")
  });

  const getApplicationsForJob = (jobId) => {
    return allApplications.filter(app => app.job_id === jobId);
  };

  const handleDelete = (jobId) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      deleteJobMutation.mutate(jobId);
    }
  };



  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewed: "bg-blue-100 text-blue-800",
      interview: "bg-purple-100 text-purple-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const { data: myJobSeekerProfile } = useQuery({
    queryKey: ['my-job-seeker-profile', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('created_by', user.email)
        .single();
      return data;
    },
    enabled: !!user
  });

  const deleteWorkerProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('job_seekers').delete().eq('created_by', user.email);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-job-seeker-profile'] });
      toast.success("Worker profile deleted successfully");
    },
    onError: () => toast.error("Failed to delete worker profile")
  });

  if (jobsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('employerDashboard')}</h1>
            <p className="text-gray-600 mt-1">{t('manageJobPostings')}</p>
          </div>
          <div className="flex gap-2">
            {!myJobSeekerProfile && (
              <Link to={createPageUrl("LookingForJob")}>
                <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                  <User className="w-4 h-4 mr-2" />
                  Create Worker Profile
                </Button>
              </Link>
            )}
            <Link to={createPageUrl("PostJob")}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                {t('postNewJob')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Worker Profile Section */}
        {myJobSeekerProfile && (
          <Card className="p-6 mb-8 border-l-4 border-l-blue-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  My Worker Profile
                </h2>
                <p className="text-gray-600 mt-1">
                  {myJobSeekerProfile.job_title} • {myJobSeekerProfile.years_experience} years exp
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl(`JobSeekerProfile?id=${myJobSeekerProfile.id}`))}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Public Profile
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete your worker profile?")) {
                      deleteWorkerProfileMutation.mutate();
                    }
                  }}
                  disabled={deleteWorkerProfileMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                <p className="text-sm text-gray-600">{t('activeJobs')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.reduce((sum, job) => sum + getApplicationsForJob(job.id).length, 0)}
                </p>
                <p className="text-sm text-gray-600">{t('totalApplications')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {allApplications.filter(app => app.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">{t('pendingReview')}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noJobsPosted')}</h3>
            <p className="text-gray-600 mb-6">{t('startPosting')}</p>
            <Link to={createPageUrl("PostJob")}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                {t('postFirstJob')}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const applications = getApplicationsForJob(job.id);
              const pendingCount = applications.filter(app => app.status === 'pending').length;
              const isLimitReached = job.max_applications && applications.length >= job.max_applications;

              return (
                <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <p className="text-gray-600">{job.company}</p>
                        </div>
                        <Badge className={job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {job.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        {job.region && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.city}, {job.region}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{t('postedOn')} {format(new Date(job.created_at || job.created_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{applications.length} {t('application')}{applications.length !== 1 ? 's' : ''}</span>
                          {pendingCount > 0 && (
                            <Badge className="ml-1 bg-yellow-100 text-yellow-800 text-xs">
                              {pendingCount} {t('newLabel')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(job.categories || []).slice(0, 3).map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cat.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(createPageUrl(`JobDetail?id=${job.id}`))}
                        className="flex-1 lg:flex-none"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t('view')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(job.id)}
                        disabled={deleteJobMutation.isPending}
                        className="flex-1 lg:flex-none"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('deleteAction')}
                      </Button>
                    </div>

                    {/* Limit Reached Warning */}
                    {isLimitReached && job.status === 'open' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <XCircle className="w-5 h-5" />
                          <span className="font-medium">{t('applicationLimitReached')} ({job.max_applications})</span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                            onClick={() => updateJobMutation.mutate({
                              id: job.id,
                              updates: { max_applications: (job.max_applications || 5) + 5 }
                            })}
                            disabled={updateJobMutation.isPending}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('renewAds')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => updateJobMutation.mutate({
                              id: job.id,
                              updates: { status: 'closed' }
                            })}
                            disabled={updateJobMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {t('closeJob')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Applications Section */}
                    {applications.length > 0 && (
                      <div className="mt-6 space-y-4 border-t pt-4">
                        <h4 className="font-semibold text-gray-900">{t('applications')}</h4>
                        {applications
                          .filter(app => app.status !== 'rejected')
                          .map(app => (
                            <div key={app.id} className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {app.applicant_name} <span className="text-gray-500 font-normal">{t('wantsToContact')}</span>
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(app.created_at || app.created_date), "MMM d, yyyy")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const { data: profiles } = await supabase
                                      .from('job_seekers')
                                      .select('*')
                                      .eq('created_by', app.created_by);

                                    if (profiles && profiles.length > 0) {
                                      navigate(createPageUrl(`JobSeekerProfile?id=${profiles[0].id}`));
                                    } else {
                                      toast.error("Applicant profile not found");
                                    }
                                  }}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t('viewProfile')}
                                </Button>

                                {app.status !== 'accepted' ? (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                                    onClick={() => {
                                      updateApplicationMutation.mutate({ id: app.id, status: 'accepted' });
                                      // Navigate to JobDetail with chat params
                                      navigate(createPageUrl(`JobDetail?id=${job.id}&chat=true&applicant=${app.created_by}`));
                                    }}
                                    disabled={updateApplicationMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {t('accept')}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-200 bg-green-50 flex-1 sm:flex-none"
                                    onClick={() => navigate(createPageUrl(`JobDetail?id=${job.id}&chat=true&applicant=${app.created_by}`))}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {t('chatBoard')}
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                                  onClick={() => updateApplicationMutation.mutate({ id: app.id, status: 'rejected' })}
                                  disabled={updateApplicationMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {t('reject')}
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}