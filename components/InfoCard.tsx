import React from 'react';

interface InfoCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon, className }) => (
  <div className={`p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow duration-300 ${className}`}>
    <div className="p-3 rounded-full bg-white bg-opacity-40 backdrop-blur-sm shadow-sm">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-gray-600 font-medium text-sm uppercase tracking-wide">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1 truncate" title={String(value)}>{value}</p>
    </div>
  </div>
);

export default InfoCard;