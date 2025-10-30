'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ProductCarouselProps {
  title?: string;
  onProductClick?: () => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  onProductClick
}) => {
  const t = useTranslations('productCarousel');

  // Produto único baseado no JSON de produtos
  const videoProduct = {
    id: 'video-1-crianca',
    title: t('productTitle'),
    price: t('price'),
    originalPrice: t('originalPrice'),
    discount: t('discount'),
    image: '/images/produto+v.webp',
    description: t('description'),
    features: [
      t('features.0'),
      t('features.1'),
      t('features.2'),
      t('features.3')
    ]
  };

  return (
    <section className="md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-[34px] md:text-4xl font-fertigo font-bold text-[#292929] mb-4">
            {title || t('title')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-green-500 mx-auto rounded-full"></div>
        </div>

        {/* Single Product Display */}
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl transition-all duration-300 transform hover:-translate-y-2 relative max-w-sm mx-auto">
            
            {/* Discount Badge */}
            {videoProduct.discount && (
              <div className="absolute top-5 left-18 z-10">
                <span className="bg-green-300 text-black text-sm font-bold font-fertigo px-3 py-1 rounded-full">
                  {videoProduct.discount}
                </span>
              </div>
            )}

            {/* Product Image with Play Button */}
            <div className="relative p-4 flex items-center justify-center">
              <div className="relative w-full h-45">
                <Image
                  src={videoProduct.image}
                  alt={videoProduct.title}
                  fill
                  className="object-contain object-center"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 rounded-full p-1 shadow-lg hover:bg-opacity-100 transition-all duration-300 cursor-pointer">
                    <svg 
                      className="w-6 h-6 text-red-500" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="pb-6 px-10 text-center">
              <h3 className="text-[20] font-normal text-gray-800 mb-2 uppercase tracking-wide">
                {videoProduct.title}
              </h3>
              
              {/* Price */}
              <div className="mb-6">
                <div className="text-2xl font-bold text-gray-800">
                  {videoProduct.price}
                </div>
                {videoProduct.originalPrice && (
                  <div className="text-sm text-gray-400 line-through font-fertigo">
                    {videoProduct.originalPrice}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={onProductClick}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-2 rounded-full transition-all duration-300 transform hover:scale-105 uppercase tracking-wide"
              >
                {t('createVideo')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;