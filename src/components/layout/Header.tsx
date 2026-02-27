'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import LanguageSwitcher from './LanguageSwitcher';
import { useTripConfig } from '@/config/trip-context';
import { hexToRgba } from '@/lib/city-colors';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const config = useTripConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryColor = config.theme.primaryColor;
  const prefix = `/${config.slug}`;

  const navItems = [
    { href: prefix, label: t('navigation.home') },
    { href: `${prefix}/itinerary`, label: t('navigation.itinerary') },
    { href: `${prefix}/attractions`, label: t('navigation.attractions') },
    { href: `${prefix}/map`, label: t('navigation.map') },
    { href: `${prefix}/restaurants`, label: t('navigation.restaurants') },
    { href: `${prefix}/budget`, label: t('navigation.budget') },
  ];

  const isActive = (href: string) => {
    if (href === prefix) return pathname === prefix;
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={prefix} className="flex items-center space-x-2">
            <span className="text-xl font-bold" style={{ color: primaryColor }}>
              {t('common.appName')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? ''
                    : 'text-gray-700 hover:bg-gray-100'
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

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav
          className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 py-4 border-t border-gray-200' : 'max-h-0'
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
                    : 'text-gray-700 hover:bg-gray-100'
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
    </header>
  );
}
