import React, { useState } from 'react';
import Icon, { ICONS } from './Icon';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="bg-gray-100/80 backdrop-blur-md border-t border-gray-200 px-4 py-2 sticky bottom-0">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message"
            className="w-full bg-gray-200 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button type="submit" disabled={!inputValue.trim()}>
            <Icon icon={ICONS.ARROW_UP_CIRCLE} className={`w-8 h-8 transition-colors ${inputValue.trim() ? 'text-blue-500' : 'text-gray-400'}`}/>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
