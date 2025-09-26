import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId }) => {
  const isUser = message.author === currentUserId;

  return (
    <div className={`flex items-end p-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-2 rounded-2xl max-w-xs lg:max-w-md transition-all duration-300 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-lg'
            : 'bg-gray-200 text-black rounded-bl-lg'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
