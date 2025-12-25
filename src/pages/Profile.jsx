import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Phone, MapPin, Briefcase, Award, Building2, Edit, Upload, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "../components/LanguageContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RegionCitySelector from "../components/RegionCitySelector";

export default function Profile() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    user_type: "worker",
    phone: "",
    location: "",
    region: "",
    city: "",
    company_name: "",
    job_title: "",
    years_experience: "",
    skills: [],
    instagram: "",
    facebook: "",
    telegram: "",
    profile_image: "",
    bio: ""
  });
  const [newSkill, setNewSkill] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) throw new Error("No user found");

        setUser({ ...u, ...u.user_metadata });

        // Default form data from Auth User Metadata
        let initialData = {
          user_type: u.user_metadata?.user_type || "worker",
          phone: u.phone || u.user_metadata?.phone || "",
          location: u.user_metadata?.location || "",
          region: u.user_metadata?.region || "",
          city: u.user_metadata?.city || "",
          company_name: u.user_metadata?.company_name || "",
          job_title: u.user_metadata?.job_title || "",
          years_experience: u.user_metadata?.years_experience || "",
          skills: u.user_metadata?.skills || [],
          instagram: u.user_metadata?.instagram || "",
          facebook: u.user_metadata?.facebook || "",
          telegram: u.user_metadata?.telegram || "",
          profile_image: u.user_metadata?.profile_image || "",
          bio: u.user_metadata?.bio || ""
        };

        // Try to fetch existing Job Seeker profile
        const { data: seeker } = await supabase
          .from('job_seekers')
          .select('*')
          .eq('created_by', u.email)
          .single();

        if (seeker) {
          // Merge Job Seeker data (priority over Auth data for worker fields)
          initialData = {
            ...initialData,
            user_type: "worker", // If they have a seeker profile, default to worker view
            phone: seeker.phone || initialData.phone,
            location: seeker.location || initialData.location,
            region: seeker.region || initialData.region,
            city: seeker.city || initialData.city,
            job_title: seeker.job_title || initialData.job_title,
            years_experience: seeker.years_experience || initialData.years_experience,
            skills: seeker.skills || initialData.skills,
            instagram: seeker.instagram || initialData.instagram,
            facebook: seeker.facebook || initialData.facebook,
            telegram: seeker.telegram || initialData.telegram,
            profile_image: seeker.profile_image || initialData.profile_image,
            bio: seeker.bio || initialData.bio
          };
        }

        setFormData(initialData);
      } catch (error) {
        console.error("Error loading profile:", error);
        // navigate(createPageUrl("MyLogin")); // Redirect if no user
      }
    };

    loadProfile();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Update Auth User (Metadata)
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data: {
          user_type: data.user_type,
          phone: data.phone,
          location: data.location,
          region: data.region,
          city: data.city,
          company_name: data.company_name,
          job_title: data.job_title,
          years_experience: data.years_experience,
          skills: data.skills,
          instagram: data.instagram,
          facebook: data.facebook,
          telegram: data.telegram,
          profile_image: data.profile_image,
          bio: data.bio
        }
      });

      if (error) throw error;

      // 2. If Worker, Upsert Job Seeker Profile
      if (data.user_type === 'worker') {
        const { data: existing } = await supabase
          .from('job_seekers')
          .select('id')
          .eq('created_by', user.email)
          .single();

        const seekerData = {
          full_name: user.full_name, // Ensure name is synced
          email: user.email,
          phone: data.phone,
          location: data.location,
          region: data.region,
          city: data.city,
          job_title: data.job_title,
          years_experience: data.years_experience ? parseFloat(data.years_experience) : null,
          skills: data.skills,
          instagram: data.instagram,
          facebook: data.facebook,
          telegram: data.telegram,
          profile_image: data.profile_image,
          bio: data.bio,
          updated_at: new Date().toISOString()
        };

        if (existing) {
          await supabase.from('job_seekers').update(seekerData).eq('id', existing.id);
        } else {
          await supabase.from('job_seekers').insert({
            ...seekerData,
            created_by: user.email,
            status: 'active',
            created_at: new Date().toISOString()
          });
        }
      }

      return data; // Return data for onSuccess
    },
    onSuccess: (updatedData) => {
      setUser(prev => ({ ...prev, ...updatedData }));
      setIsEditing(false);
      toast.success(t('profileUpdated'));
      queryClient.invalidateQueries({ queryKey: ['jobSeeker'] }); // Invalidate public profile queries
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast.error(t('profileUpdateFailed'));
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      // Delete user's job seeker profile if exists
      const { error } = await supabase.from('job_seekers').delete().eq('created_by', user.email);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job Ad deleted successfully");

      // Reset form data to base user metadata (remove job seeker specific overrides)
      setFormData({
        user_type: user.user_metadata?.user_type || "worker",
        phone: user.phone || user.user_metadata?.phone || "",
        location: user.user_metadata?.location || "",
        region: user.user_metadata?.region || "",
        city: user.user_metadata?.city || "",
        company_name: user.user_metadata?.company_name || "",
        job_title: user.user_metadata?.job_title || "",
        years_experience: user.user_metadata?.years_experience || "",
        skills: user.user_metadata?.skills || [],
        instagram: user.user_metadata?.instagram || "",
        facebook: user.user_metadata?.facebook || "",
        telegram: user.user_metadata?.telegram || "",
        profile_image: user.user_metadata?.profile_image || "",
        bio: user.user_metadata?.bio || ""
      });

      queryClient.invalidateQueries({ queryKey: ['jobSeeker'] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete profile");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-files')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, profile_image: publicUrl }));
      toast.success(t('photoUploaded'));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t('photoUploadFailed'));
    }
    setUploadingImage(false);
  };

  const handleDeleteProfile = () => {
    if (window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
      deleteProfileMutation.mutate();
    }
  };

  if (!user) return <div className="max-w-4xl mx-auto px-4 py-12">{t('loading')}...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('myProfile')}</h1>
            <p className="text-gray-600 mt-1">{t('manageAccountInfo')}</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="bg-orange-500 hover:bg-orange-600">
              <Edit className="w-4 h-4 mr-2" />
              {t('editProfile')}
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('basicInfo')}</h2>

              {/* Profile Picture */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-500 bg-gray-100">
                    {formData.profile_image ? (
                      <img
                        src={formData.profile_image}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <input
                        id="profile_image_upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full bg-orange-500 hover:bg-orange-600"
                        onClick={() => document.getElementById('profile_image_upload').click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                      {formData.profile_image && (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-0 right-0 rounded-full h-6 w-6"
                          onClick={() => setFormData(prev => ({ ...prev, profile_image: "" }))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>{t('fullName')}</Label>
                  <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{user.user_metadata?.full_name || user.full_name}</span>
                  </div>
                </div>

                <div>
                  <Label>{t('email')}</Label>
                  <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="user_type">{t('accountType')}</Label>
                  <Select
                    value={formData.user_type}
                    onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">{t('worker')}</SelectItem>
                      <SelectItem value="employer">{t('employer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <RegionCitySelector
                    selectedRegion={formData.region}
                    selectedCity={formData.city}
                    manualAddress={formData.location}
                    onRegionChange={(region) => setFormData(prev => ({ ...prev, region }))}
                    onCityChange={(city) => setFormData(prev => ({ ...prev, city }))}
                    onManualAddressChange={(location) => setFormData(prev => ({ ...prev, location }))}
                    regionLabel={t('region')}
                    cityLabel={t('cityDistrict')}
                    addressLabel={t('location')}
                    addressPlaceholder={t('locationPlaceholder')}
                    disabled={!isEditing}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="bio">{t('bio')}</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={t('bioPlaceholder')}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Worker-specific fields */}
            {formData.user_type === "worker" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('professionalDetails')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="job_title">{t('jobTitle')}</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      placeholder={t('jobTitlePlaceholder')}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="years_experience">{t('yearsExperience')}</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      min="0"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>{t('skills')}</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, idx) => (
                          <Badge key={idx} className="bg-orange-100 text-orange-700 border-orange-200">
                            {skill}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-2 hover:text-orange-900"
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder={t('addSkillPlaceholder')}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          />
                          <Button type="button" onClick={addSkill}>{t('add')}</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label>{t('socialMedia')}</Label>
                    <div className="space-y-3 mt-2">
                      <div>
                        <Label htmlFor="instagram" className="text-sm text-gray-600">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                          placeholder="https://instagram.com/yourusername"
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="facebook" className="text-sm text-gray-600">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.facebook}
                          onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                          placeholder="https://facebook.com/yourprofile"
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telegram" className="text-sm text-gray-600">Telegram</Label>
                        <Input
                          id="telegram"
                          value={formData.telegram}
                          onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                          placeholder="@yourusername"
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Employer-specific fields */}
            {formData.user_type === "employer" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('companyDetails')}</h2>
                <div>
                  <Label htmlFor="company_name">{t('companyName')}</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder={t('companyNamePlaceholder')}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </Card>
            )}

            {/* Actions */}
            {isEditing && (
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      user_type: user.user_metadata?.user_type || "worker",
                      phone: user.phone || user.user_metadata?.phone || "",
                      location: user.user_metadata?.location || "",
                      region: user.user_metadata?.region || "",
                      city: user.user_metadata?.city || "",
                      company_name: user.user_metadata?.company_name || "",
                      job_title: user.user_metadata?.job_title || "",
                      years_experience: user.user_metadata?.years_experience || "",
                      skills: user.user_metadata?.skills || [],
                      instagram: user.user_metadata?.instagram || "",
                      facebook: user.user_metadata?.facebook || "",
                      telegram: user.user_metadata?.telegram || "",
                      profile_image: user.user_metadata?.profile_image || "",
                      bio: user.user_metadata?.bio || ""
                    });
                  }}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {updateProfileMutation.isPending ? t('saving') : t('saveChanges')}
                </Button>
              </div>
            )}

            {/* Delete Profile */}
            {!isEditing && (
              <Card className="p-6 border-red-200 bg-red-50">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your job ad, it will be removed from the listings. Your account will remain active.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProfile}
                  disabled={deleteProfileMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteProfileMutation.isPending ? "Deleting..." : "Delete Profile"}
                </Button>
              </Card>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}