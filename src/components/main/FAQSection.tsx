import React from 'react';
import { useTranslations } from 'next-intl';

interface FAQItem {
  title: string;
  description: string;
}

interface FAQItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgColor: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ icon, title, description, iconBgColor }) => {
  return (
    <div className="flex items-start space-x-4 p-6 bg-white transition-shadow duration-300">
      <div className={`flex-shrink-0 w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const t = useTranslations('faq');
  
  const faqItems = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9H15L13 7H9C7.9 7 7 7.9 7 9V15C7 16.1 7.9 17 9 17H19C20.1 17 21 16.1 21 15V11C21 9.9 20.1 9 19 9Z" fill="white"/>
          <path d="M12 13L8 9L9.41 7.59L12 10.17L14.59 7.59L16 9L12 13Z" fill="white"/>
        </svg>
      ),
      iconBgColor: "bg-red-500"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white"/>
          <path d="M12 6V12L16 14" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      iconBgColor: "bg-red-500"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382C16.975 14.382 16.569 14.007 16.569 13.548C16.569 13.088 16.975 12.713 17.472 12.713C17.969 12.713 18.375 13.088 18.375 13.548C18.375 14.007 17.969 14.382 17.472 14.382ZM13.5 14.382C13.003 14.382 12.597 14.007 12.597 13.548C12.597 13.088 13.003 12.713 13.5 12.713C13.997 12.713 14.403 13.088 14.403 13.548C14.403 14.007 13.997 14.382 13.5 14.382Z" fill="white"/>
          <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM18.215 13.713C18.215 15.616 16.665 17.166 14.762 17.166H9.238C7.335 17.166 5.785 15.616 5.785 13.713V10.287C5.785 8.384 7.335 6.834 9.238 6.834H14.762C16.665 6.834 18.215 8.384 18.215 10.287V13.713Z" fill="white"/>
        </svg>
      ),
      iconBgColor: "bg-green-500"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="white"/>
          <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="#dc2626"/>
        </svg>
      ),
      iconBgColor: "bg-red-500"
    }
  ];

  return (
    <section className="py-10 px-2 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.raw('items').map((item: FAQItem, index: number) => (
            <FAQItem
              key={index}
              icon={faqItems[index]?.icon}
              title={item.title}
              description={item.description}
              iconBgColor={faqItems[index]?.iconBgColor || "bg-red-500"}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;