import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string | null;
  details?: string | null;
  valueClassName?: string;
  onValueClick?: () => void;
  onSubtitleClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, details, valueClassName = 'text-2xl', onValueClick, onSubtitleClick }) => {
  const ValueComponent = onValueClick ? 'button' : 'p';
  const SubtitleComponent = onSubtitleClick ? 'button' : 'p';

  return (
    <div className="bg-gradient-to-br from-poker-light to-poker-dark p-4 rounded-lg shadow-lg flex flex-col justify-between h-36 border-t-2 border-poker-gold">
      <div className="flex items-center text-poker-gray">
        <span className="h-4 w-4 mr-2">{icon}</span>
        <h4 className="text-xs font-semibold uppercase tracking-wider">{title}</h4>
      </div>
      
      <div className="text-center my-2">
        <ValueComponent 
            onClick={onValueClick} 
            className={`font-bold text-white truncate transition-transform duration-200 ${onValueClick ? 'hover:scale-105 hover:text-poker-gold' : ''} ${valueClassName}`} 
            title={String(value)}
        >
            {value}
        </ValueComponent>
      </div>

      <div className="text-center h-8">
        {subtitle && (
          <div className="flex items-center justify-center gap-2">
             <SubtitleComponent 
                onClick={onSubtitleClick} 
                className={`text-sm font-semibold truncate ${onSubtitleClick ? 'text-poker-gold hover:underline' : 'text-white'}`} 
                title={subtitle}
            >
                {subtitle}
            </SubtitleComponent>
            {details && <span className="text-xs text-poker-gray flex-shrink-0">({details})</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;