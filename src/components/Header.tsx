'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const t = useTranslations('header');
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentLocale = pathname.split('/')[1] || 'pt';

  const changeLocale = (locale: string) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${locale}`);
    router.push(newPath);
  };

  return (
    <header className="bg-transparent absolute top-12 left-0 right-0 z-50">{/* Header posicionado abaixo do banner promocional */}
      
      <div className="container mx-auto px-4 pt-6 relative z-10">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button - Left */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-14 h-14 transition-all duration-200"
            aria-label="Menu"
          >
            <div className="flex flex-col space-y-1 justify-center items-center rounded-full bg-white w-14 h-14">
              <Image src="/images/ico-menu_28x19.png" alt="Menu" width={25} height={25} />
            </div>
          </button>
          {/* Logo - Center */}
          <Link href={`/${currentLocale}`} className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none">
            <div className="w-15 h-15 flex items-center justify-center shadow-lg">
              <Image src="/images/logo_65x91.webp" alt="Logo" width={50} height={50} />
            </div>
            <div className="hidden md:block">
              <span className="text-xl font-bold text-white drop-shadow-lg">{t('brandName')}</span>
            </div>
          </Link>

          {/* Cart Icon - Right */}
          <button className="md:hidden relative flex justify-center items-center rounded-full bg-white w-14 h-14 transition-all duration-200">
            <Image src="/images/ico-cart_38x30.png" alt="Cart" width={25} height={25} />
            <span className="absolute -top-1 -right-1 bg-white text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">0</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href={`/${currentLocale}/video`} className="hover:text-yellow-200 transition-colors font-medium">
              {t('santaVideo')}
            </Link>
            <Link href={`/${currentLocale}/precos`} className="hover:text-yellow-200 transition-colors font-medium">
              {t('priceList')}
            </Link>
            <Link href={`/${currentLocale}/conta`} className="hover:text-yellow-200 transition-colors font-medium">
              {t('accountLogin')}
            </Link>
            
            {/* Language Selector */}
            <div className="relative">
              <select
                value={currentLocale}
                onChange={(e) => changeLocale(e.target.value)}
                className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 backdrop-blur-sm"
              >
                <option value="pt" className="bg-red-700 text-white">🇧🇷 PT</option>
                <option value="en" className="bg-red-700 text-white">🇺🇸 EN</option>
                <option value="es" className="bg-red-700 text-white">🇪🇸 ES</option>
              </select>
            </div>

            {/* Desktop Cart */}
            <button className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-all duration-200 relative">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </button>
          </nav>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 pt-4 backdrop-blur-sm bg-white/10 rounded-lg">
            <div className="flex flex-col space-y-3">
              <Link href={`/${currentLocale}/video`} className="hover:text-yellow-200 transition-colors font-medium py-2 px-4 rounded-lg hover:bg-white/10">
                {t('santaVideo')}
              </Link>
              <Link href={`/${currentLocale}/precos`} className="hover:text-yellow-200 transition-colors font-medium py-2 px-4 rounded-lg hover:bg-white/10">
                {t('priceList')}
              </Link>
              <Link href={`/${currentLocale}/conta`} className="hover:text-yellow-200 transition-colors font-medium py-2 px-4 rounded-lg hover:bg-white/10">
                {t('accountLogin')}
              </Link>
              
              {/* Mobile Language Selector */}
              <div className="pt-2 px-4">
                <select
                  value={currentLocale}
                  onChange={(e) => changeLocale(e.target.value)}
                  className="bg-white/10 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 backdrop-blur-sm"
                >
                  <option value="pt" className="bg-red-700 text-white">🇧🇷 {t('languages.portuguese')}</option>
                  <option value="en" className="bg-red-700 text-white">🇺🇸 {t('languages.english')}</option>
                  <option value="es" className="bg-red-700 text-white">🇪🇸 {t('languages.spanish')}</option>
                </select>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}