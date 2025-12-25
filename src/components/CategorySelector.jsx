import React from "react";
import { useLanguage } from "./LanguageContext";
import { 
  Hammer, Trash2, Zap, Drill, Home, Wrench, Droplets, 
  PaintBucket, LucideDoorOpen, Fence, Warehouse, Box, 
  Building2, Trees, HardHat, AlertTriangle, Wind, Flame,
  Shield, Lock, Lightbulb, Sun, LampDesk, Plug, Cable,
  ThermometerSun, Refrigerator, Fan, Ruler, Mountain,
  Waves, Sofa, BedDouble, Bath, UtensilsCrossed, 
  Shovel, Leaf, TreePine, Sprout, Scissors, Puzzle
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons = {
  interior_finishing: Home,
  facade_exterior: Building2,
  electrical_installation: Zap,
  plumbing_heating: Wrench,
  gas_works: Flame,
  carpentry_joinery: Scissors,
  masonry_stonework: Box,
  painting_decorating: PaintBucket,
  drywall_ceilings: Box,
  roofing_waterproofing: Home,
  flooring: Box,
  tile_work: Box,
  doors_windows_installation: LucideDoorOpen,
  general_construction: HardHat,
  demolition_cleanup: Trash2,
  paving_roadwork: Mountain,
  turnkey_repair: Building2
};

const constructionCategories = [
  { key: 'interior_finishing', emoji: '🏠' },
  { key: 'facade_exterior', emoji: '🏢' },
  { key: 'electrical_installation', emoji: '⚡' },
  { key: 'plumbing_heating', emoji: '🔧' },
  { key: 'gas_works', emoji: '🔥' },
  { key: 'carpentry_joinery', emoji: '🪚' },
  { key: 'masonry_stonework', emoji: '🧱' },
  { key: 'painting_decorating', emoji: '🎨' },
  { key: 'drywall_ceilings', emoji: '📋' },
  { key: 'roofing_waterproofing', emoji: '🏘️' },
  { key: 'flooring', emoji: '📏' },
  { key: 'tile_work', emoji: '⬜' },
  { key: 'doors_windows_installation', emoji: '🚪' },
  { key: 'general_construction', emoji: '👷' },
  { key: 'demolition_cleanup', emoji: '🧹' },
  { key: 'paving_roadwork', emoji: '🛣️' },
  { key: 'turnkey_repair', emoji: '🔑' }
];

export default function CategorySelector({ selectedCategories = [], onChange }) {
  const { t } = useLanguage();
  
  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter(c => c !== category));
    } else {
      onChange([...selectedCategories, category]);
    }
  };

  // Split categories into 5 columns
  const columns = [[], [], [], [], []];
  constructionCategories.forEach((cat, idx) => {
    columns[idx % 5].push(cat);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {constructionCategories.map(({ key, emoji }) => {
        const Icon = categoryIcons[key] || HardHat;
        const isSelected = selectedCategories.includes(key);
        
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleCategory(key)}
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left hover:shadow-md",
              isSelected 
                ? "border-orange-500 bg-orange-50 shadow-sm" 
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <span className="text-lg flex-shrink-0">{emoji}</span>
            <span className={cn(
              "text-sm font-medium",
              isSelected ? "text-orange-900" : "text-gray-700"
            )}>
              {t(key)}
            </span>
          </button>
        );
      })}
    </div>
  );
}