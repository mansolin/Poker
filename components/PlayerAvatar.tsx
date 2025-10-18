import React from 'react';

interface PlayerAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const colors = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
  'bg-pink-500', 'bg-rose-500'
];

const getInitials = (name: string): string => {
  if (!name) return '?';
  const names = name.split(' ');
  const firstInitial = names[0]?.[0] || '';
  const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const getColorFromName = (name: string): string => {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, size = 'md' }) => {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold ${sizeClasses[size]} ${bgColor}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default PlayerAvatar;