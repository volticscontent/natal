import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ReviewCardProps {
  rating: string;
  totalReviews: string;
  platform: 'trustpilot' | 'elfi' | 'facebook';
  logo?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ rating, totalReviews, platform, logo }) => {
  const t = useTranslations('reviewCards');

  const getPlatformLogo = () => {
    switch (platform) {
      case 'trustpilot':
        return '/images/trustpilot-logo.svg';
      case 'elfi':
        return '/images/logo_65x91.webp';
      case 'facebook':
        return '/images/facebook-logo.svg';
      default:
        return logo || '';
    }
  };

  const getPlatformName = () => {
    return t(`platforms.${platform}`);
  };

  const getStars = () => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 !== 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'text-green-500 fill-current'
                : i === fullStars && hasHalfStar
                ? 'text-green-500 fill-current'
                : 'text-gray-300 fill-current'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between min-w-[280px] hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center space-x-4">
        {/* Rating Badge */}
        <div className="bg-green-500 text-white font-bold text-xl px-3 py-2 rounded-lg min-w-[50px] text-center">
          {rating}
        </div>
        
        {/* Review Info */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-1">
            {getStars()}
          </div>
          <p className="text-gray-700 text-sm font-medium">
            {t('reviewsText', { count: totalReviews })}
          </p>
          <p className="text-gray-500 text-xs">
            {t('platformText', { platform: getPlatformName() })}
          </p>
        </div>
      </div>

      {/* Platform Logo */}
      <div className="flex-shrink-0">
        {platform === 'elfi' ? (
          <Image
            src={getPlatformLogo()}
            alt={getPlatformName()}
            width={40}
            height={56}
            className="object-contain"
          />
        ) : (
          <Image
            src={getPlatformLogo()}
            alt={getPlatformName()}
            width={platform === 'facebook' ? 80 : 100}
            height={24}
            className="object-contain"
          />
        )}
      </div>
    </div>
  );
};

const ReviewCards: React.FC = () => {
  const t = useTranslations('reviewCards');

  const reviews = [
    {
      rating: '4.7',
      totalReviews: '1407',
      platform: 'trustpilot' as const,
    },
    {
      rating: '4.9',
      totalReviews: '60.671',
      platform: 'elfi' as const,
    },
    {
      rating: '4.4',
      totalReviews: '135',
      platform: 'facebook' as const,
    },
  ];

  return (
    <section className="py-12 px-4" style={{ backgroundColor: '#f5f1e8' }}>
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h2>
          <p className="text-gray-600 text-lg">
            {t('subtitle')}
          </p>
        </div>

        {/* Cards de Avaliações */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          {reviews.map((review, index) => (
            <ReviewCard
              key={index}
              rating={review.rating}
              totalReviews={review.totalReviews}
              platform={review.platform}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewCards;