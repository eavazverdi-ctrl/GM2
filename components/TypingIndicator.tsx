
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start p-2">
      <div className="bg-gray-200 rounded-2xl px-4 py-2 max-w-xs lg:max-w-md">
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;