import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string | null;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle }) => {
  return (
    <div className="bg-poker-dark p-3 rounded-lg shadow-md flex flex-col justify-between h-28">
      <div>
        <div className="flex items-center text-poker-gray mb-1">
          <span className="h-4 w-4 mr-2">{icon}</span>
          <h4 className="text-xs font-semibold uppercase tracking-wider">{title}</h4>
        </div>
        <p className="text-xl font-bold text-poker-gold truncate" title={String(value)}>{value}</p>
      </div>
      {subtitle && (
        <p className="text-sm text-white truncate" title={subtitle}>{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;