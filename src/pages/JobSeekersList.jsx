import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, MapPin, Briefcase, Filter, Mail, Phone, Award, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useLanguage } from "../components/LanguageContext";
import CategorySelector from "../components/CategorySelector";

const categoryColors = {
  general_labor: "bg-gray-100 text-gray-800",
  carpenter: "bg-amber-100 text-amber-800",
  electrician: "bg-yellow-100 text-yellow-800",
  plumber: "bg-blue-100 text-blue-800",
  hvac: "bg-cyan-100 text-cyan-800",
  mason: "bg-stone-100 text-stone-800",
  welder: "bg-orange-100 text-orange-800",
  heavy_equipment: "bg-slate-100 text-slate-800",
  project_manager: "bg-purple-100 text-purple-800",
  site_supervisor: "bg-indigo-100 text-indigo-800",
  architect: "bg-pink-100 text-pink-800",
  engineer: "bg-teal-100 text-teal-800",
  painter: "bg-lime-100 text-lime-800",
  roofer: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800"
};

const regions = [
  { label: "Tashkent Shahar", value: "tashkent_shahar" },
  { label: "Tashkent Viloyati", value: "tashkent_viloyati" },
  { label: "Samarkand", value: "samarkand" },
  { label: "Farg'ona", value: "fargona" },
  { label: "Andijon", value: "andijon" },
  { label: "Namangan", value: "namangan" },
  { label: "Buxoro", value: "buxoro" },
  { label: "Navoiy", value: "navoiy" },
  { label: "Qashqadaryo", value: "qashqadaryo" },
  { label: "Surxondaryo", value: "surxondaryo" },
  { label: "Jizzax", value: "jizzax" }
];

const citiesByRegion = {
  tashkent_shahar: [
    "Shayxontohur", "Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Sergeli", "Yakkasaroy"
  ],
  tashkent_viloyati: [
    "Angren", "Oqqo'rg'on", "Chirchiq", "Olmaliq", "Piskent", "Bekobod"
  ],
  samarkand: [
    "Samarkand city", "Bulung'ur", "Payariq", "Jomboy", "Siyob"
  ],
  namangan: [
    "Namangan city", "Uychi", "Chortoq", "Chust", "Pop"
  ],
  fargona: [
    "Farg'ona city", "Marg'ilon", "Qo'qon", "Rishton", "Oltiariq"
  ],
  andijon: [
    "Andijon city", "Asaka", "Shahrixon", "Xonobod", "Baliqchi"
  ],
  buxoro: [
    "Buxoro city", "G'ijduvon", "Kogon", "Vobkent", "Romitan"
  ],
  navoiy: [
    "Navoiy city", "Zarafshon", "Uchquduq", "Karmana", "Nurota"
  ],
  qashqadaryo: [
    "Qarshi", "Shahrisabz", "Kitob", "Koson", "Yakkabog'"
  ],
  surxondaryo: [
    "Termiz", "Denov", "Sherobod", "Boysun", "Jarqo'rg'on"
  ],
  jizzax: [
    "Jizzax city", "Zomin", "G'allaorol", "Forish", "Paxtakor"
  ]
};

export default function JobSeekersList() {
  const { t } = useLanguage();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  React.useEffect(() => {
    setTimeout(() => {
      const filtersSection = document.getElementById('filters-section');
      if (filtersSection) {
        const yOffset = -80;
        const y = filtersSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    }, 100);
  }, []);

  const cities = regionFilter !== "all" ? citiesByRegion[regionFilter] || [] : [];

  const { data: jobSeekers = [], isLoading } = useQuery({
    queryKey: ['jobSeekers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching job seekers:", error);
        return [];
      }
      return data;
    },
    initialData: []
  });

  const filteredJobSeekers = jobSeekers.filter((seeker) => {
    const matchesCategory = selectedCategories.length === 0 ||
      (seeker.categories && seeker.categories.some(cat => selectedCategories.includes(cat)));
    const matchesExperience = experienceFilter === "all" || seeker.experience_level === experienceFilter;
    const matchesRegion = regionFilter === "all" || seeker.region === regionFilter;
    const matchesCity = cityFilter === "all" || seeker.city === cityFilter;
    return matchesCategory && matchesExperience && matchesRegion && matchesCity;
  });

  const totalPages = Math.ceil(filteredJobSeekers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobSeekers = filteredJobSeekers.slice(startIndex, startIndex + itemsPerPage);

  const getCategoryLabel = (cat) => {
    const key = cat.replace(/_/g, '').replace(/\s+/g, '').toLowerCase();
    return t(key) !== key ? t(key) : cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('peopleLooking')}
              </h1>
              <p className="text-gray-600">{filteredJobSeekers.length} {t('peopleLooking').toLowerCase()}</p>
            </div>
            <Link to={createPageUrl("LookingForJob")}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Users className="w-4 h-4 mr-2" />
                {t('registerProfile')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div id="filters-section" className="mb-8">
          <div className="space-y-4">
            <CategorySelector
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={regionFilter} onValueChange={(value) => {
                setRegionFilter(value);
                setCityFilter("all");
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allRegions')}</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter} disabled={regionFilter === "all"}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={regionFilter === "all" ? t('region') : t('cityDistrict')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCities')}</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('experienceLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCategories')}</SelectItem>
                  <SelectItem value="entry">{t('entryLevel')}</SelectItem>
                  <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                  <SelectItem value="senior">{t('senior')}</SelectItem>
                  <SelectItem value="expert">{t('expert')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Job Seekers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-6" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredJobSeekers.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No job seekers found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters</p>
            <Button onClick={() => {
              setSelectedCategories([]);
              setExperienceFilter("all");
              setRegionFilter("all");
              setCityFilter("all");
              setCurrentPage(1);
            }}>
              {t('clearFilters')}
            </Button>
          </Card>
        ) : (
          <>
            <div id="profiles-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedJobSeekers.map((seeker) => (
                <Card key={seeker.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {seeker.full_name}
                      </h3>
                      <p className="text-gray-600 font-medium mb-2">{seeker.job_title}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-orange-100">
                      {seeker.profile_image ? (
                        <img
                          src={seeker.profile_image}
                          alt={seeker.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {seeker.categories && seeker.categories.slice(0, 2).map((cat, idx) => (
                      <Badge key={idx} className={categoryColors[cat] || categoryColors.other}>
                        {t(cat)}
                      </Badge>
                    ))}
                    {seeker.categories && seeker.categories.length > 2 && (
                      <Badge variant="outline">
                        +{seeker.categories.length - 2} more
                      </Badge>
                    )}
                    {seeker.experience_level && (
                      <Badge variant="outline">
                        {t(seeker.experience_level)}
                      </Badge>
                    )}
                    {seeker.years_experience && (
                      <Badge variant="outline">
                        {seeker.years_experience} {seeker.years_experience === 1 ? 'year' : 'years'}
                      </Badge>
                    )}
                  </div>

                  {seeker.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{seeker.location}</span>
                    </div>
                  )}

                  {seeker.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {seeker.bio}
                    </p>
                  )}

                  {seeker.skills && seeker.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-2">
                        <Award className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700">Skills:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {seeker.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                        {seeker.skills.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{seeker.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <Link to={createPageUrl(`JobSeekerProfile?id=${seeker.id}`)} className="block">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      {seeker.email && (
                        <a href={`mailto:${seeker.email}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                        </a>
                      )}
                      {seeker.phone && (
                        <a href={`tel:${seeker.phone}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      className={currentPage === i + 1 ? "bg-orange-500 hover:bg-orange-600" : ""}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}