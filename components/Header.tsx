import React from 'react';
import Icon, { ICONS } from './Icon';

const Header: React.FC = () => {
  return (
    <div className="bg-gray-100/80 backdrop-blur-md border-b border-gray-200 px-4 py-2 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
           <Icon icon={ICONS.CHEVRON_LEFT} className="w-6 h-6 text-blue-500" />
           <span className="text-blue-500 text-lg">Messages</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <img src="https://picsum.photos/seed/friend/40/40" alt="Friend" className="w-10 h-10 rounded-full" />
          <span className="text-sm font-semibold">Friend</span>
        </div>
        <div>{/* Placeholder for right side icons */}</div>
      </div>
    </div>
  );
};

export default Header;
