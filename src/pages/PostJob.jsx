import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Upload, X, CheckSquare, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { useLanguage } from "../components/LanguageContext";
import CategorySelector from "../components/CategorySelector";
import RegionCitySelector from "../components/RegionCitySelector";

export default function PostJob() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    region: "",
    city: "",
    job_type: "full_time",
    categories: [],
    experience_level: "intermediate",
    salary_min: "",
    salary_max: "",
    salary_period: "hourly",
    description: "",
    requirements: [""],
    benefits: [""],
    start_date: "",
    duration: "",
    contact_email: "",
    contact_phone: "",
    contact_name: "",
    image_urls: [],
    file_urls: []
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setFormData(prev => ({
          ...prev,
          contact_email: user.email || "",
          contact_name: user.user_metadata?.full_name || "",
          company: user.user_metadata?.company_name || ""
        }));
      } else {
        navigate(createPageUrl("MyLogin"));
      }
    });
  }, []);

  const createJobMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('jobs').insert({
        ...data,
        company: data.company || "Private",
        requirements: data.requirements.filter(r => r.trim()),
        benefits: data.benefits.filter(b => b.trim()),
        salary_min: data.salary_min ? parseFloat(data.salary_min) : null,
        salary_max: data.salary_max ? parseFloat(data.salary_max) : null,
        status: "open",
        max_applications: 5,
        created_at: new Date().toISOString(),
        created_by: user.email
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('posting'));
      navigate(createPageUrl("Home"));
    },
    onError: (error) => {
      console.error("Error posting job:", error);
      alert("Error: " + error.message); // Force user to see the error
      toast.error("Failed to post job: " + error.message);
    }
  });

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const newUrls = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `job-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public-files')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...newUrls]
      }));
      toast.success("Images uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please ensure 'public-files' bucket exists and is public.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true); // Reuse same loading state or create new one
    const newUrls = [];

    try {
      for (const file of files) {
        if (file.type !== 'application/pdf') {
          toast.error(`File ${file.name} is not a PDF`);
          continue;
        }

        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.pdf`;
        const filePath = `job-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public-files')
          .getPublicUrl(filePath);

        newUrls.push({ name: file.name, url: publicUrl });
      }

      setFormData(prev => ({
        ...prev,
        file_urls: [...(prev.file_urls || []), ...newUrls]
      }));
      toast.success("Files uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      file_urls: prev.file_urls.filter((_, i) => i !== index)
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createJobMutation.mutate(formData);
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };



  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('postNewJob')}</h1>
          <p className="text-gray-600">{t('fillDetails')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('basicInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">{t('jobTitle')} *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('jobTitlePlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="company">{t('companyName')} ({t('optional') || 'Optional'})</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={t('companyNamePlaceholder')}
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
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>{t('categories')} *</Label>
                  <div className="mt-2">
                    <CategorySelector
                      selectedCategories={formData.categories}
                      onChange={(categories) => setFormData({ ...formData, categories })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="job_type">{t('jobType')} *</Label>
                  <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">{t('fullTime')}</SelectItem>
                      <SelectItem value="part_time">{t('partTime')}</SelectItem>
                      <SelectItem value="contract">{t('contract')}</SelectItem>
                      <SelectItem value="temporary">{t('temporary')}</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="start_date">{t('startDate')}</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">{t('duration')}</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder={t('durationPlaceholder')}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Compensation */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('compensation')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="salary_min">{t('minSalary')}</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder={t('minSalaryPlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="salary_max">{t('maxSalary')}</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    placeholder={t('maxSalaryPlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="salary_period">{t('period')}</Label>
                  <Select value={formData.salary_period} onValueChange={(value) => setFormData({ ...formData, salary_period: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{t('hourly')}</SelectItem>
                      <SelectItem value="daily">{t('daily')}</SelectItem>
                      <SelectItem value="weekly">{t('weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('monthly')}</SelectItem>
                      <SelectItem value="yearly">{t('yearly')}</SelectItem>
                      <SelectItem value="negotiable">{t('negotiable')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('jobDescription')}</h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="description">{t('description')} *</Label>
                  <Textarea
                    id="description"
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>{t('requirements')}</Label>
                  <div className="space-y-2 mt-2">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={req}
                          onChange={(e) => updateArrayItem('requirements', index, e.target.value)}
                          placeholder={t('requirementPlaceholder')}
                        />
                        {formData.requirements.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeArrayItem('requirements', index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('requirements')}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addRequirement')}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>{t('benefits')}</Label>
                  <div className="space-y-2 mt-2">
                    {formData.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={benefit}
                          onChange={(e) => updateArrayItem('benefits', index, e.target.value)}
                          placeholder={t('benefitPlaceholder')}
                        />
                        {formData.benefits.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeArrayItem('benefits', index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('benefits')}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addBenefit')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact & Image */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('contactInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contact_email">{t('contactEmail')} *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">{t('contactPhone')}</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder={t('phonePlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="contact_name">{t('contactName')}</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>{t('projectImages')} & Files</Label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {/* Image Upload */}
                    <div className="flex-1 min-w-[200px]">
                      <input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('images').click()}
                        disabled={uploadingImage || formData.image_urls.length >= 9}
                        className="w-full h-24 flex flex-col gap-2 border-dashed"
                      >
                        <Upload className="w-6 h-6" />
                        <span>{uploadingImage ? t('uploading') : `${t('uploadImage')} (Max 9)`}</span>
                      </Button>
                    </div>

                    {/* PDF Upload */}
                    <div className="flex-1 min-w-[200px]">
                      <input
                        id="files"
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('files').click()}
                        disabled={uploadingImage}
                        className="w-full h-24 flex flex-col gap-2 border-dashed"
                      >
                        <FileText className="w-6 h-6" />
                        <span>Upload PDF Files</span>
                      </Button>
                    </div>
                  </div>

                  {/* Image Previews */}
                  {formData.image_urls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {formData.image_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File List */}
                  {formData.file_urls && formData.file_urls.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label>Attached Files:</Label>
                      {formData.file_urls.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-red-500" />
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline text-blue-600">
                              {file.name || `Document ${index + 1}`}
                            </a>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Agreement */}
            <div className="flex items-start gap-3 p-4 bg-gray-100 rounded-lg">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                {t('agreeToTerms')}
              </label>
            </div>

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
                disabled={createJobMutation.isPending || !agreedToTerms}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {createJobMutation.isPending ? t('posting') : t('postJobBtn')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}