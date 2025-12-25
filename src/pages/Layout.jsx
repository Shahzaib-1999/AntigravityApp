import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import {
  User, LogOut, Briefcase, PlusCircle, Settings, Menu, X, Globe, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RegisterModal from "@/components/RegisterModal";
import NotificationBell from "@/components/NotificationBell";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    { name: t('findJobs'), path: createPageUrl("Home"), icon: Briefcase },
    { name: t('postJob'), path: createPageUrl("PostJob"), icon: PlusCircle },
  ];

  if (user) {
    navItems.push({ name: t('manageListings'), path: createPageUrl("EmployerDashboard"), icon: Briefcase });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');

        :root {
  --construction - orange: #F97316;
  --construction - dark: #1E293B;
  --construction - gray: #64748B;
}

        .usta - brand {
  font - family: 'Playfair Display', serif;
  font - weight: 500;
  letter - spacing: 0.02em;
}
`}</style>

      {/* Transparent Safe Area - Status bar icons visible rahenge */}
      <div 
        className="fixed top-0 left-0 right-0 bg-transparent pointer-events-none" 
        style={{ 
          height: 'calc(env(safe-area-inset-top) * 0.5)',
          zIndex: 100
        }} 
      />

      {/* Header */}
      <div className="sticky top-0 z-50">
        {/* Header Content */}
        <header className="bg-white border-b border-gray-200 backdrop-blur-lg bg-white/90 pt-2" style={{ paddingTop: `calc(0.5rem + env(safe-area-inset-top) * 0.5)` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to={createPageUrl("Home")}
              className="flex items-center gap-3 group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 flex items-center justify-center transform transition-transform group-hover:scale-105">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691603b4bc551518bad307de/42ccfb4ff_1.png"
                  alt="Usta's Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl text-gray-900 usta-brand">Usta's</h1>
                <p className="text-xs text-gray-500">{t('footerTagline')}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                item.name === t('findJobs') ? (
                  <Button
                    key={item.name}
                    variant={location.pathname === createPageUrl("Home") ? "default" : "ghost"}
                    className={location.pathname === createPageUrl("Home") ? "bg-orange-500 hover:bg-orange-600" : ""}
                    onClick={() => {
                      if (location.pathname === createPageUrl("Home")) {
                        document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.location.href = createPageUrl("Home") + "#jobs-section";
                      }
                    }}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                ) : (
                  <Link key={item.name} to={item.path}>
                    <Button
                      variant={location.pathname === item.path ? "default" : "ghost"}
                      className={location.pathname === item.path ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                )
              ))}
            </nav>

            {/* User Menu & Language */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {user && <NotificationBell user={user} />}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="hidden sm:inline">{user.full_name || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Profile")} className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        {t('myProfile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("EmployerDashboard")} className="cursor-pointer">
                        <Briefcase className="w-4 h-4 mr-2" />
                        {t('manageListings')}
                      </Link>
                    </DropdownMenuItem>
                    {user.email === "info.usta.uz@gmail.com" && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-orange-600 font-medium">
                          <ShieldAlert className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setUser(null);
                      }}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to={createPageUrl("MyLogin")}>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      {t('login')}
                    </Button>
                  </Link>
                  <Link to={createPageUrl("MySignup")}>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {t('signUp')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                item.name === t('findJobs') ? (
                  <Button
                    key={item.name}
                    variant={location.pathname === createPageUrl("Home") ? "default" : "ghost"}
                    className={`w - full justify - start ${location.pathname === createPageUrl("Home") ? "bg-orange-500 hover:bg-orange-600" : ""} `}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (location.pathname === createPageUrl("Home")) {
                        document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.location.href = createPageUrl("Home") + "#jobs-section";
                      }
                    }}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                ) : (
                  <Link key={item.name} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={location.pathname === item.path ? "default" : "ghost"}
                      className={`w - full justify - start ${location.pathname === item.path ? "bg-orange-500 hover:bg-orange-600" : ""} `}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                )
              ))}
            </nav>
          </div>
        )}
        </header>
      </div>

      {/* Register Modal */}
      <RegisterModal open={registerModalOpen} onOpenChange={setRegisterModalOpen} />

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691603b4bc551518bad307de/42ccfb4ff_1.png"
                    alt="Usta's Logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-white usta-brand">
                    <a href="https://ysaugatupxjbjtpwbfjp.supabase.co" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                      Usta's
                    </a>
                  </h3>
                  <p className="text-xs text-gray-400">{t('footerTagline')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {t('footerDesc')}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('forWorkers')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={createPageUrl("Home")} className="hover:text-orange-500 transition-colors">{t('browseJobs')}</Link></li>
                <li><Link to={createPageUrl("LookingForJob")} className="hover:text-orange-500 transition-colors">{t('createProfile')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('forEmployers')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={createPageUrl("PostJob")} className="hover:text-orange-500 transition-colors">{t('postAJob')}</Link></li>
                <li><Link to={createPageUrl("EmployerDashboard")} className="hover:text-orange-500 transition-colors">{t('manageListings')}</Link></li>
                <li><Link to={createPageUrl("ContactUs")} className="hover:text-orange-500 transition-colors">{t('contactUs')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Usta's. {t('allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}
