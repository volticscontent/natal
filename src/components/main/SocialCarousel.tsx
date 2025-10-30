import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import instagramData from '../../../public/images/carrossel2/instagram-posts-complete.json';

interface SocialPostProps {
  username: string;
  avatar: string;
  image: string;
  likes: number;
  comments: number;
  postUrl: string;
  isActive?: boolean;
}

const SocialPost: React.FC<SocialPostProps> = ({ username, avatar, image, likes, comments, postUrl, isActive = false }) => {
  const handlePostClick = () => {
    window.open(postUrl, '_blank');
  };

  return (
    <div 
      className={`flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 cursor-pointer hover:shadow-xl ${isActive ? 'scale-105' : ''}`}
      onClick={handlePostClick}
    >
      {/* Header do post */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <Image 
          src={avatar} 
          alt={username}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className="ml-3 font-semibold text-gray-900">@{username}</span>
      </div>
      
      {/* Imagem do post */}
      <div className="relative aspect-square">
        <Image 
          src={image} 
          alt={`Post de @${username}`}
          width={320}
          height={320}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Footer com likes e comentários */}
      <div className="p-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const t = useTranslations('socialCarousel');

  // Usando os dados reais dos posts do Instagram
  const socialPosts = instagramData.posts;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % socialPosts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + socialPosts.length) % socialPosts.length);
  };

  return (
    <section className="py-16" style={{ backgroundColor: '#ebdec8' }}>
      <div className="max-w-6xl mx-auto text-center">
        {/* Título principal */}
        <h2 className="text-4xl font-bold font-fertigo text-gray-900 mb-4">
          {t('title')}
        </h2>
        
        {/* Avaliação */}
        <div className="inline-flex items-center bg-white rounded-full px-6 py-3 mb-6 shadow-sm">
          <div className="flex text-[#e0d17a] mr-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
          </div>
          <span className="font-semibold text-gray-900">{t('joinCustomers')}</span>
        </div>

        {/* Texto descritivo */}
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            {t('description.part1')}{' '}
            <span className="text-blue-600 underline cursor-pointer">{t('description.link')}</span>{' '}
            {t('description.part2')}
          </p>
          
          <button className="text-gray-900 font-semibold underline hover:text-gray-700 transition-colors">
            {t('followInstagram')}
          </button>
        </div>

        {/* Carrossel */}
        <div className="relative">
          <div className="flex items-center justify-center">
            {/* Botão anterior */}
            <button 
              onClick={prevSlide}
              className="absolute left-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Container do carrossel */}
            <div className="overflow-hidden max-w-4xl p-4">
              <div 
                className="flex transition-transform duration-500 ease-in-out gap-6"
                style={{ transform: `translateX(-${currentIndex * 320}px)` }}
              >
                {socialPosts.map((post, index) => (
                  <SocialPost
                    key={post.id}
                    username={post.username}
                    avatar={post.avatar}
                    image={post.image}
                    likes={post.likes}
                    comments={post.comments}
                    postUrl={post.postUrl}
                    isActive={index === currentIndex}
                  />
                ))}
              </div>
            </div>

            {/* Botão próximo */}
            <button 
              onClick={nextSlide}
              className="absolute right-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Indicadores */}
          <div className="flex justify-center mt-8 space-x-2 px-4">
            {socialPosts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialCarousel;