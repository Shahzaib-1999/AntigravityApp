import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "./LanguageContext";

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
  tashkent_shahar: [
    { label: "Chilonzor", value: "Chilonzor" },
    { label: "Yunusobod", value: "Yunusobod" },
    { label: "Sergeli", value: "Sergeli" },
    { label: "Yakkasaroy", value: "Yakkasaroy" },
    { label: "Olmazor", value: "Olmazor" },
    { label: "Shayxontohur", value: "Shayxontohur" },
    { label: "Mirzo Ulugbek", value: "Mirzo Ulugbek" },
    { label: "Uchtepa", value: "Uchtepa" },
    { label: "Bektemir", value: "Bektemir" },
    { label: "Mirobod", value: "Mirobod" }
  ],
  tashkent_viloyati: [
    { label: "Chirchiq", value: "Chirchiq" },
    { label: "Olmaliq", value: "Olmaliq" },
    { label: "Angren", value: "Angren" },
    { label: "Bekobod", value: "Bekobod" },
    { label: "Nurafshon", value: "Nurafshon" },
    { label: "Yangiyo'l", value: "Yangiyo'l" },
    { label: "Bo'ka", value: "Bo'ka" },
    { label: "Oqqo'rg'on", value: "Oqqo'rg'on" },
    { label: "Parkent", value: "Parkent" }
  ],
  samarkand: [
    { label: "Samarqand shahri", value: "Samarqand shahri" },
    { label: "Urgut", value: "Urgut" },
    { label: "Kattaqo'rg'on", value: "Kattaqo'rg'on" },
    { label: "Ishtixon", value: "Ishtixon" },
    { label: "Nurobod", value: "Nurobod" }
  ],
  fargona: [
    { label: "Farg'ona shahri", value: "Farg'ona shahri" },
    { label: "Qo'qon", value: "Qo'qon" },
    { label: "Marg'ilon", value: "Marg'ilon" },
    { label: "Quva", value: "Quva" },
    { label: "Rishton", value: "Rishton" }
  ],
  andijon: [
    { label: "Andijon shahri", value: "Andijon shahri" },
    { label: "Asaka", value: "Asaka" },
    { label: "Xo'jaobod", value: "Xo'jaobod" },
    { label: "Shahrixon", value: "Shahrixon" }
  ],
  namangan: [
    { label: "Namangan shahri", value: "Namangan shahri" },
    { label: "Chortoq", value: "Chortoq" },
    { label: "Chust", value: "Chust" },
    { label: "Pop", value: "Pop" }
  ],
  buxoro: [
    { label: "Buxoro shahri", value: "Buxoro shahri" },
    { label: "G'ijduvon", value: "G'ijduvon" },
    { label: "Kogon", value: "Kogon" },
    { label: "Romitan", value: "Romitan" }
  ],
  navoiy: [
    { label: "Navoiy shahri", value: "Navoiy shahri" },
    { label: "Zarafshon", value: "Zarafshon" },
    { label: "Uchquduq", value: "Uchquduq" }
  ],
  qashqadaryo: [
    { label: "Qarshi", value: "Qarshi" },
    { label: "Shahrisabz", value: "Shahrisabz" },
    { label: "Dehqonobod", value: "Dehqonobod" }
  ],
  surxondaryo: [
    { label: "Termiz", value: "Termiz" },
    { label: "Denov", value: "Denov" },
    { label: "Sherobod", value: "Sherobod" },
    { label: "Boysun", value: "Boysun" }
  ],
  jizzax: [
    { label: "Jizzax shahri", value: "Jizzax shahri" },
    { label: "Zomin", value: "Zomin" },
    { label: "G'allaorol", value: "G'allaorol" }
  ],
  sirdaryo: [
    { label: "Guliston", value: "Guliston" },
    { label: "Sirdaryo shahri", value: "Sirdaryo shahri" },
    { label: "Yangiyer", value: "Yangiyer" }
  ],
  xorazm: [
    { label: "Urganch", value: "Urganch" },
    { label: "Xiva", value: "Xiva" },
    { label: "Bog'ot", value: "Bog'ot" }
  ],
  qoraqalpogiston: [
    { label: "Nukus", value: "Nukus" },
    { label: "Taxiatosh", value: "Taxiatosh" },
    { label: "Xo'jayli", value: "Xo'jayli" },
    { label: "Chimboy", value: "Chimboy" }
  ]
};

export default function RegionCitySelector({
  selectedRegion,
  selectedCity,
  manualAddress = "",
  onRegionChange,
  onCityChange,
  onManualAddressChange,
  regionLabel,
  cityLabel,
  addressLabel,
  addressPlaceholder,
  disabled = false
}) {
  const { t } = useLanguage();
  const cities = selectedRegion ? citiesByRegion[selectedRegion] || [] : [];

  const finalRegionLabel = regionLabel || t('region');
  const finalCityLabel = cityLabel || t('cityDistrict');
  const finalAddressLabel = addressLabel || t('address');
  const finalAddressPlaceholder = addressPlaceholder || t('addressPlaceholder');

  const handleRegionChange = (regionValue) => {
    onRegionChange(regionValue);
    onCityChange("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <Label htmlFor="manualAddress">{finalAddressLabel}</Label>
        <Input
          id="manualAddress"
          value={manualAddress}
          onChange={(e) => onManualAddressChange?.(e.target.value)}
          placeholder={finalAddressPlaceholder}
          disabled={disabled}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="regionSelect">{finalRegionLabel}</Label>
        <Select value={selectedRegion} onValueChange={handleRegionChange} disabled={disabled}>
          <SelectTrigger id="regionSelect" className="mt-1">
            <SelectValue placeholder={t('selectRegion')} />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="citySelect">{finalCityLabel}</Label>
        <Select
          value={selectedCity}
          onValueChange={onCityChange}
          disabled={disabled || !selectedRegion || cities.length === 0}
        >
          <SelectTrigger id="citySelect" className="mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder={selectedRegion ? t('selectCity') : t('selectRegionFirst')} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}