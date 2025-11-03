'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface SocialProofSectionProps {
  title?: string;
  subtitle?: string;
}

const SocialProofSection: React.FC<SocialProofSectionProps> = ({
  title,
  subtitle
}) => {
  const isMobile = useIsMobile();
  const t = useTranslations('socialProof');

  const reviews = [
    {
      platform: "Trustpilot",
      rating: "4,7",
      totalReviews: "1407",
      logo: "/images/trustpilot.webp",
      bgColor: "bg-green-50",
      ratingColor: "text-green-700"
    },
    {
      platform: "Elfi Santa",
      rating: "4,9", 
      totalReviews: "60671",
      logo: "/images/logo_65x91.webp",
      bgColor: "bg-red-50",
      ratingColor: "text-red-600"
    },
    {
      platform: "Facebook",
      rating: "4,4",
      totalReviews: "135", 
      logo: "/images/facebook-logo.svg",
      bgColor: "bg-blue-50",
      ratingColor: "text-blue-600"
    }
  ];

  return (
    <section className="py-10 md:py-12 bg-[#b7d684]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl pt-8 font-bold font-fertigo text-black mb-4">
            {title || t('title')}
          </h2>
          <p className="text-lg text-black max-w-2xl mx-auto">
            {subtitle || t('subtitle')}
          </p>
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-5' : 'grid-cols-3 gap-8'} text-center`}>
          {reviews.map((review, index) => (
            <div key={index} className={`${review.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
              {/* Rating, Review Count and Platform Logo in same line */}
              <div className={`flex items-center justify-center ${isMobile ? 'gap-10 text-sm' : 'gap-3'} text-gray-700 font-medium`}>
                <div className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold text-lg flex-shrink-0">
                  {review.rating}
                </div>
                <span className="whitespace-nowrap">{t('reviewsText', { totalReviews: review.totalReviews })}</span>
                <div className="flex items-center justify-center h-5 w-auto flex-shrink-0 min-w-10">
                  <Image
                    src={review.logo}
                    alt={`${review.platform} logo`}
                    width={review.platform === 'Trustpilot' ? 110 : 70}
                    height={40}
                    style={{ width: 'auto', height: 'auto' }}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;