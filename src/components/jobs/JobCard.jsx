import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Briefcase, DollarSign, Clock, Building2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";

const categoryColors = {
  general_labor: "bg-gray-100 text-gray-700",
  carpenter: "bg-amber-100 text-amber-700",
  electrician: "bg-yellow-100 text-yellow-700",
  plumber: "bg-blue-100 text-blue-700",
  hvac: "bg-cyan-100 text-cyan-700",
  mason: "bg-stone-100 text-stone-700",
  welder: "bg-orange-100 text-orange-700",
  heavy_equipment: "bg-red-100 text-red-700",
  project_manager: "bg-purple-100 text-purple-700",
  site_supervisor: "bg-indigo-100 text-indigo-700",
  architect: "bg-pink-100 text-pink-700",
  engineer: "bg-violet-100 text-violet-700",
  painter: "bg-lime-100 text-lime-700",
  roofer: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-700"
};

export default function JobCard({ job }) {
  const { t } = useLanguage();

  const categories = job.categories || (job.category ? [job.category] : []);

  const formatSalary = () => {
    if (!job.salary_min) return t('salaryNegotiable');

    const min = job.salary_min.toLocaleString();
    const max = job.salary_max ? job.salary_max.toLocaleString() : null;
    const period = job.salary_period || "hourly";

    if (max) {
      return `$${min} - $${max} / ${t(period)}`;
    }
    return `$${min} / ${t(period)}`;
  };

  const getJobTypeLabel = (type) => {
    const typeMap = {
      full_time: 'fullTime',
      part_time: 'partTime',
      contract: 'contract',
      temporary: 'temporary'
    };
    return t(typeMap[type] || type);
  };

  // Safely compute job type label only if job_type is present
  const jobTypeLabel = job.job_type ? getJobTypeLabel(job.job_type) : null;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white">
      {(job.image_urls?.[0] || job.image_url) && (
        <div className="h-40 overflow-hidden">
          <img
            src={job.image_urls?.[0] || job.image_url}
            alt={job.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{job.company}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>{job.location}</span>
          </div>

          {job.salary_min && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-gray-900">{formatSalary()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.filter(cat => cat).slice(0, 2).map((cat, idx) => (
            <Badge key={idx} className={categoryColors[cat] || categoryColors.other}>
              {t(cat)}
            </Badge>
          ))}
          {categories.filter(cat => cat).length > 2 && (
            <Badge variant="outline">+{categories.filter(cat => cat).length - 2}</Badge>
          )}
          {jobTypeLabel && (
            <Badge variant="outline" className="border-orange-200 text-orange-700">
              {jobTypeLabel}
            </Badge>
          )}
        </div>

        {job.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {job.description}
          </p>
        )}

        <Link to={createPageUrl(`JobDetail?id=${job.id}`)}>
          <Button className="w-full bg-orange-500 hover:bg-orange-600 group/btn">
            {t('viewDetails')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}