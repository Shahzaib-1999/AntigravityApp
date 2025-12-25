import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "../components/LanguageContext";
import CategorySelector from "../components/CategorySelector";
import RegionCitySelector from "../components/RegionCitySelector";

export default function LookingForJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    region: "",
    city: "",
    job_title: "",
    categories: [],
    experience_level: "intermediate",
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
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user);

        // Check if user already has a profile
        const { data: existingProfile } = await supabase
          .from('job_seekers')
          .select('*')
          .eq('created_by', user.email)
          .single();

        if (existingProfile) {
          toast.info("Editing your existing profile");
          setFormData({
            full_name: existingProfile.full_name || "",
            email: existingProfile.email || "",
            phone: existingProfile.phone || "",
            location: existingProfile.location || "",
            region: existingProfile.region || "",
            city: existingProfile.city || "",
            job_title: existingProfile.job_title || "",
            categories: existingProfile.categories || [],
            experience_level: existingProfile.experience_level || "intermediate",
            years_experience: existingProfile.years_experience || "",
            skills: existingProfile.skills || [],
            instagram: existingProfile.instagram || "",
            facebook: existingProfile.facebook || "",
            telegram: existingProfile.telegram || "",
            profile_image: existingProfile.profile_image || "",
            bio: existingProfile.bio || ""
          });
        } else {
          setFormData(prev => ({
            ...prev,
            full_name: user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: user.phone || "",
          }));
        }
      } else {
        navigate(createPageUrl("MyLogin"));
      }
    });
  }, []);

  const createJobSeekerMutation = useMutation({
    mutationFn: async (data) => {
      // Check if profile exists to determine if we should update or insert
      const { data: existing } = await supabase
        .from('job_seekers')
        .select('id')
        .eq('created_by', user.email)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('job_seekers')
          .update({
            ...data,
            years_experience: data.years_experience ? parseFloat(data.years_experience) : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('job_seekers').insert({
          ...data,
          years_experience: data.years_experience ? parseFloat(data.years_experience) : null,
          status: "active",
          created_by: user.email,
          created_at: new Date().toISOString()
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Profile saved successfully!");
      queryClient.invalidateQueries({ queryKey: ['jobSeekers'] });
      queryClient.invalidateQueries({ queryKey: ['jobSeeker'] });
      navigate(createPageUrl("JobSeekerProfile") + `?id=${user.id}`); // We might need the actual ID, but usually we redirect to list or profile
      // Better to redirect to their profile. We need the ID.
      // Let's just go to Home or List for now, or fetch the ID.
      // Actually, let's go to Home as per original logic, or maybe the list.
      navigate(createPageUrl("JobSeekersList"));
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createJobSeekerMutation.mutate(formData);
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
      toast.success("Profile photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const getCategoryLabel = (cat) => {
    const key = cat.replace(/_/g, '').replace(/\s+/g, '').toLowerCase();
    const formatted = key.charAt(0).toUpperCase() + key.slice(1);
    return t(key) !== key ? t(key) : cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('lookingForJob')}</h1>
          <p className="text-gray-600">{t('fillJobSeekerDetails')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('basicInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="full_name">{t('fullName')} *</Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t('email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('phonePlaceholder')}
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
                    addressLabel={t('address')}
                    addressPlaceholder={t('addressPlaceholder')}
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
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Job Preferences */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('jobPreferences')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="job_title">{t('desiredJobTitle')} *</Label>
                  <Input
                    id="job_title"
                    required
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder={t('desiredJobTitlePlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>{t('category')} *</Label>
                  <p className="text-sm text-gray-600 mb-3">{t('selectMultipleCategories')}</p>
                  <CategorySelector
                    selectedCategories={formData.categories}
                    onChange={(categories) => setFormData({ ...formData, categories })}
                  />
                </div>

                <div>
                  <Label htmlFor="experience_level">{t('experienceLevel')}</Label>
                  <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">{t('entryLevel')}</SelectItem>
                      <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                      <SelectItem value="senior">{t('senior')}</SelectItem>
                      <SelectItem value="expert">{t('expert')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="years_experience">{t('yearsExperience')}</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="profile_image">{t('profilePicture')} ({t('optional')})</Label>
                  <div className="mt-2 space-y-3">
                    {formData.profile_image && (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-orange-500">
                        <img
                          src={formData.profile_image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full"
                          onClick={() => setFormData(prev => ({ ...prev, profile_image: "" }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <input
                      id="profile_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profile_image').click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? t('uploading') : (formData.profile_image ? t('changePhoto') : t('uploadPhoto'))}
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>{t('skills')}</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, idx) => (
                        <Badge key={idx} className="bg-orange-100 text-orange-700 border-orange-200">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-orange-900"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder={t('skillPlaceholder')}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill}>{t('add')}</Button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>{t('socialMedia')} ({t('optional')})</Label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label htmlFor="instagram" className="text-sm text-gray-600">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/yourusername"
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
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("Home"))}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createJobSeekerMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {createJobSeekerMutation.isPending ? t('submitting') : t('registerProfile')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}