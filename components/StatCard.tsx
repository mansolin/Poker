import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string | null;
  onValueClick?: () => void;
  onSubtitleClick?: () => void;
  detail?: string;
  valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, onValueClick, onSubtitleClick, detail, valueClassName }) => {
  return (
    <div className="bg-gradient-to-br from-poker-light to-poker-dark p-3 rounded-lg shadow-lg flex flex-col justify-between h-full border-t-4 border-poker-gold">
      <div>
        <div className="flex items-center text-poker-gray mb-2">
          <span className="h-4 w-4 mr-2">{icon}</span>
          <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{title}</h4>
        </div>
        <button 
          onClick={onValueClick} 
          disabled={!onValueClick}
          className={`w-full text-left font-bold text-poker-gold truncate ${onValueClick ? 'hover:opacity-80' : 'cursor-default'} ${valueClassName || 'text-xl md:text-2xl'}`} 
          title={String(value)}
        >
          {value}
        </button>
      </div>
      {subtitle && (
         <div className="flex justify-between items-end mt-1">
            <button 
                onClick={onSubtitleClick}
                disabled={!onSubtitleClick}
                className={`text-sm font-semibold text-white truncate text-left ${onSubtitleClick ? 'hover:underline' : 'cursor-default'}`} 
                title={subtitle}
            >
                {subtitle}
            </button>
            {detail && <span className="text-xs text-poker-gray flex-shrink-0 ml-2">{detail}</span>}
         </div>
      )}
    </div>
  );
};

export default StatCard;