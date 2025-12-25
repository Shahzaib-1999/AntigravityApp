import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, Briefcase, DollarSign, Clock, Filter, TrendingUp, Users, Building2, ArrowRight, UserPlus, ThumbsUp, ShoppingCart, CheckCircle, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from
  "@/components/ui/select";
import JobCard from "@/components/jobs/JobCard";
import StatsCard from "@/components/jobs/StatsCard";
import { useLanguage } from "@/components/LanguageContext";
import CategorySelector from "@/components/CategorySelector";
import SaveSearchModal from "@/components/SaveSearchModal";


export default function Home() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;


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
    "tashkent_shahar": [
      "Chilonzor", "Yunusobod", "Sergeli", "Yakkasaroy", "Olmazor",
      "Shayxontohur", "Mirzo Ulugbek", "Uchtepa", "Bektemir", "Mirobod"
    ],
    "tashkent_viloyati": [
      "Chirchiq", "Olmaliq", "Angren", "Bekobod", "Nurafshon",
      "Yangiyo'l", "Bo'ka", "Oqqo'rg'on", "Parkent"
    ],
    "samarkand": [
      "Samarqand shahri", "Urgut", "Kattaqo'rg'on", "Ishtixon", "Nurobod"
    ],
    "fargona": [
      "Farg'ona shahri", "Qo'qon", "Marg'ilon", "Quva", "Rishton"
    ],
    "andijon": [
      "Andijon shahri", "Asaka", "Xo'jaobod", "Shahrixon"
    ],
    "namangan": [
      "Namangan shahri", "Chortoq", "Chust", "Pop"
    ],
    "buxoro": [
      "Buxoro shahri", "G'ijduvon", "Kogon", "Romitan"
    ],
    "navoiy": [
      "Navoiy shahri", "Zarafshon", "Uchquduq"
    ],
    "qashqadaryo": [
      "Qarshi", "Shahrisabz", "Dehqonobod"
    ],
    "surxondaryo": [
      "Termiz", "Denov", "Sherobod", "Boysun"
    ],
    "jizzax": [
      "Jizzax shahri", "Zomin", "G'allaorol"
    ],
    "sirdaryo": [
      "Guliston", "Sirdaryo shahri", "Yangiyer"
    ],
    "xorazm": [
      "Urganch", "Xiva", "Bog'ot"
    ],
    "qoraqalpogiston": [
      "Nukus", "Taxiatosh", "Xo'jayli", "Chimboy"
    ]
  };

  const cities = regionFilter !== "all" ? citiesByRegion[regionFilter] || [] : [];

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

  const { data: jobSeekers = [] } = useQuery({
    queryKey: ['jobSeekers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error("Error fetching job seekers:", error);
        return [];
      }
      return data;
    },
    initialData: []
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesRegion = regionFilter === "all" || job.region === regionFilter;
    const matchesCity = cityFilter === "all" || job.city === cityFilter;
    const jobCategories = job.categories || (job.category ? [job.category] : []);
    const matchesCategory = selectedCategories.length === 0 ||
      jobCategories.some(cat => selectedCategories.includes(cat));
    const matchesJobType = jobTypeFilter === "all" || job.job_type === jobTypeFilter;

    return matchesSearch && matchesLocation && matchesRegion && matchesCity && matchesCategory && matchesJobType;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    totalJobs: jobs.length,
    activeEmployers: new Set(jobs.map((j) => j.company)).size,
    jobSeekers: jobSeekers.length
  };

  const getHeroTitle = () => {
    if (language === 'ru') {
      return (
        <>
          Ищете мастера, подсобника или работу в строительстве?{' '}
          <br className="hidden sm:block" />
          <span className="text-yellow-400">Все возможности здесь!</span>
        </>);

    } else if (language === 'uz') {
      return (
        <>
          Usta, yordamchi yoki qurilishda ish izlayapsizmi?{' '}
          <br className="hidden sm:block" />
          <span className="text-yellow-400">Barcha imkoniyatlar shu yerda!</span>
        </>);

    } else {
      return (
        <>
          Looking for a master, laborer or work in construction?{' '}
          <br className="hidden sm:block" />
          <span className="text-yellow-400">All opportunities are here!</span>
        </>);

    }
  };

  const getHeroSubtitle = () => {
    if (language === 'ru') {
      return (
        <>
          <span className="text-yellow-400">Соединяем квалифицированных строителей</span>{' '}
          с ведущими работодателями
        </>);

    } else if (language === 'uz') {
      return (
        <>
          <span className="text-yellow-400">Malakali qurilish ishchilarini</span>{' '}
          yetakchi ish beruvchilar bilan bog'laymiz
        </>);

    } else {
      return (
        <>
          <span className="text-yellow-400">Connect with top construction companies</span>{' '}
          and find your next opportunity
        </>);

    }
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap');
                      .hero-title {
                        font-family: 'Nunito', sans-serif;
                        font-weight: 700;
                      }
      `}</style>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden pt-14 pt-[env(safe-area-inset-top)]">

        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600')] opacity-10 bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-2xl font-semibold leading-tight hero-title sm:text-5xl lg:text-6xl">
              {getHeroTitle()}
            </h1>
            <p className="text-xl sm:text-2xl mb-8 font-medium">
              {getHeroSubtitle()}
            </p>

            {/* Hero Buttons */}
            <div className="flex flex-col gap-4 max-w-xl">
              <Button
                onClick={() => navigate(createPageUrl("JobSeekersList"))}
                className="w-full h-16 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-lg font-bold rounded-full shadow-lg">

                {t('findMasterBtn')}
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("JobsList"))}
                className="w-full h-16 bg-white hover:bg-gray-100 text-gray-900 text-lg font-bold rounded-full shadow-lg">

                {t('needWorkBtn')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Boxes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Box 1 */}
            <div className="border-2 border-yellow-400 rounded-xl p-6 flex flex-col items-start gap-4">
              <UserPlus className="w-12 h-12 text-gray-700" />
              <p className="text-gray-900 font-medium leading-relaxed">
                {t('featureBox1')}
              </p>
            </div>

            {/* Box 2 */}
            <div className="border-2 border-yellow-400 rounded-xl p-6 flex flex-col items-start gap-4">
              <ThumbsUp className="w-12 h-12 text-gray-700" />
              <p className="text-gray-900 font-medium leading-relaxed">
                {t('featureBox2')}
              </p>
            </div>

            {/* Box 3 */}
            <div className="border-2 border-yellow-400 rounded-xl p-6 flex flex-col items-start gap-4">
              <ShoppingCart className="w-12 h-12 text-gray-700" />
              <p className="text-gray-900 font-medium leading-relaxed">
                {t('featureBox3')}
              </p>
            </div>

            {/* Box 4 */}
            <div className="border-2 border-yellow-400 rounded-xl p-6 flex flex-col items-start gap-4">
              <CheckCircle className="w-12 h-12 text-gray-700" />
              <p className="text-gray-900 font-medium leading-relaxed">
                {t('featureBox4')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Banner - Modern Design */}
      <section className="mt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gray-900 hover:bg-gray-800 rounded-full py-5 px-8 sm:px-12 flex items-center justify-center gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-xl border-2 border-gray-700"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.4 14.9C20.2 16.4 21 17 21 17H3s3-2 3-9c0-3.3 2.7-6 6-6 .7 0 1.3.1 1.9.3" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              <circle cx="18" cy="8" r="3" />
            </svg>
            <p className="text-lg sm:text-xl lg:text-2xl font-black text-center tracking-wide hero-title">
              <span className="text-yellow-400">{t('earlyAccessFree')}</span>
              <span className="text-white"> — </span>
              <span className="text-white">{t('earlyAccessRest')}</span>
              <span className="text-yellow-400 underline ml-2">{t('clickToStart')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon={Briefcase}
            value={stats.totalJobs}
            label={t('activeJobs')}
            color="orange" />

          <StatsCard
            icon={Building2}
            value={stats.activeEmployers}
            label={t('companiesHiring')}
            color="blue" />

          <Link to={createPageUrl("JobSeekersList")} className="block">
            <StatsCard
              icon={Users}
              value={stats.jobSeekers}
              label={t('peopleLooking')}
              color="green" />

          </Link>
        </div>
      </section>

      {/* Filters and Jobs */}
      <section id="jobs-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('availablePositions')}</h2>
              <p className="text-gray-600 mt-1">{filteredJobs.length} {t('jobsFound')}</p>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl("PostJob")}>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  {t('postAJob')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <CategorySelector
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder={t('locationPlaceholder')}
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full sm:w-48"
              />
              <Select value={regionFilter} onValueChange={(value) => {
                setRegionFilter(value);
                setCityFilter("all");
              }}>
                <SelectTrigger id="filterRegion" className="w-full sm:w-48">
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
                <SelectTrigger id="filterCity" className="w-full sm:w-48">
                  <SelectValue placeholder={regionFilter === "all" ? "Select Region First" : t('cityDistrict')} />
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
        </div>

        {/* Jobs Grid */}
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
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noJobsFound')}</h3>
            <p className="text-gray-600 mb-6">{t('noJobsDesc')}</p>
            <Button onClick={() => {
              setSearchQuery("");
              setLocationFilter("");
              setRegionFilter("all");
              setCityFilter("all");
              setSelectedCategories([]);
              setJobTypeFilter("all");
              setCurrentPage(1);
            }}>
              {t('clearFilters')}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {paginatedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
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
      </section>
    </div>);

}