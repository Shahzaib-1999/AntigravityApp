import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import JobCard from "../components/jobs/JobCard";
import { useLanguage } from "../components/LanguageContext";
import CategorySelector from "../components/CategorySelector";

const regions = [
  { label: "Toshkent Shahar", value: "tashkent_shahar" },
  { label: "Toshkent Viloyati", value: "tashkent_viloyati" },
  { label: "Samarqand", value: "samarkand" },
  { label: "Farg'ona", value: "fargona" },
  { label: "Andijon", value: "andijon" },
  { label: "Namangan", value: "namangan" },
  { label: "Buxoro", value: "buxoro" },
  { label: "Navoiy", value: "navoiy" },
  { label: "Qashqadaryo", value: "qashqadaryo" },
  { label: "Surxondaryo", value: "surxondaryo" },
  { label: "Jizzax", value: "jizzax" },
  { label: "Sirdaryo", value: "sirdaryo" },
  { label: "Xorazm", value: "xorazm" },
  { label: "Qoraqalpog'iston", value: "qoraqalpogiston" }
];

const citiesByRegion = {
  "tashkent_shahar": ["Chilonzor", "Yunusobod", "Sergeli", "Yakkasaroy", "Olmazor", "Shayxontohur", "Mirzo Ulugbek", "Uchtepa", "Bektemir", "Mirobod"],
  "tashkent_viloyati": ["Chirchiq", "Olmaliq", "Angren", "Bekobod", "Nurafshon", "Yangiyo'l", "Bo'ka", "Oqqo'rg'on", "Parkent"],
  "samarkand": ["Samarqand shahri", "Urgut", "Kattaqo'rg'on", "Ishtixon", "Nurobod"],
  "fargona": ["Farg'ona shahri", "Qo'qon", "Marg'ilon", "Quva", "Rishton"],
  "andijon": ["Andijon shahri", "Asaka", "Xo'jaobod", "Shahrixon"],
  "namangan": ["Namangan shahri", "Chortoq", "Chust", "Pop"],
  "buxoro": ["Buxoro shahri", "G'ijduvon", "Kogon", "Romitan"],
  "navoiy": ["Navoiy shahri", "Zarafshon", "Uchquduq"],
  "qashqadaryo": ["Qarshi", "Shahrisabz", "Dehqonobod"],
  "surxondaryo": ["Termiz", "Denov", "Sherobod", "Boysun"],
  "jizzax": ["Jizzax shahri", "Zomin", "G'allaorol"],
  "sirdaryo": ["Guliston", "Sirdaryo shahri", "Yangiyer"],
  "xorazm": ["Urganch", "Xiva", "Bog'ot"],
  "qoraqalpogiston": ["Nukus", "Taxiatosh", "Xo'jayli", "Chimboy"]
};

export default function JobsList() {
  const { t } = useLanguage();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const cities = regionFilter !== "all" ? citiesByRegion[regionFilter] || [] : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error);
        return [];
      }
      return data;
    },
    initialData: []
  });

  const filteredJobs = jobs.filter((job) => {
    const jobCategories = job.categories || (job.category ? [job.category] : []);
    const matchesCategory = selectedCategories.length === 0 ||
      jobCategories.some(cat => selectedCategories.includes(cat));
    const matchesJobType = jobTypeFilter === "all" || job.job_type === jobTypeFilter;
    const matchesRegion = regionFilter === "all" || job.region === regionFilter;
    const matchesCity = cityFilter === "all" || job.city === cityFilter;
    return matchesCategory && matchesJobType && matchesRegion && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('availablePositions')}
              </h1>
              <p className="text-gray-600">{filteredJobs.length} {t('jobsFound')}</p>
            </div>
            <Link to={createPageUrl("PostJob")}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                {t('postAJob')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
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
                  <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter} disabled={regionFilter === "all"}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={regionFilter === "all" ? t('selectRegionFirst') : t('cityDistrict')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCities')}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('jobType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="full_time">{t('fullTime')}</SelectItem>
                <SelectItem value="part_time">{t('partTime')}</SelectItem>
                <SelectItem value="contract">{t('contract')}</SelectItem>
                <SelectItem value="temporary">{t('temporary')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-6" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noJobsFound')}</h3>
            <p className="text-gray-600 mb-6">{t('noJobsDesc')}</p>
            <Button onClick={() => {
              setSelectedCategories([]);
              setJobTypeFilter("all");
              setRegionFilter("all");
              setCityFilter("all");
            }}>
              {t('clearFilters')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}