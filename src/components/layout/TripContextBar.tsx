'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useTripConfig } from '@/config/trip-context';
import { hexToRgba } from '@/lib/city-colors';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function TripContextBar() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();
  const config = useTripConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryColor = config.theme.primaryColor;
  const prefix = `/${config.slug}`;

  const tripName = config.name[locale as keyof typeof config.name] || config.name.nl || config.slug;

  const navItems = [
    { href: prefix, label: t('navigation.home') },
    { href: `${prefix}/planner`, label: t('navigation.planner') },
    { href: `${prefix}/attractions`, label: t('navigation.attractions') },
    { href: `${prefix}/restaurants`, label: t('navigation.restaurants') },
    { href: `${prefix}/budget`, label: t('navigation.budget') },
  ];

  const isActive = (href: string) => {
    if (href === prefix) return pathname === prefix;
    return pathname.startsWith(href);
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-11 gap-3">
          {/* Back to trips */}
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('navigation.backToTrips')}</span>
          </Link>

          {/* Trip name */}
          <span
            className="text-sm font-semibold truncate shrink-0"
            style={{ color: primaryColor }}
          >
            {tripName}
          </span>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-auto" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? ''
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  isActive(item.href)
                    ? {
                        backgroundColor: hexToRgba(primaryColor, 0.1),
                        color: primaryColor,
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden ml-auto p-2 rounded-md text-gray-700 hover:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav
          className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 py-3 border-t border-gray-200' : 'max-h-0'
          }`}
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] flex items-center ${
                  isActive(item.href)
                    ? ''
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  isActive(item.href)
                    ? {
                        backgroundColor: hexToRgba(primaryColor, 0.1),
                        color: primaryColor,
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
