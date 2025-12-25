import React from "react";
import { Card } from "@/components/ui/card";

const colorClasses = {
  orange: "from-orange-500 to-orange-600",
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600"
};

export default function StatsCard({ icon: Icon, value, label, color = "orange" }) {
  return (
    <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </Card>
  );
}