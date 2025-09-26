import React, { useState, useEffect, useRef } from 'react';
import { type Message } from './types';
import { sendMessageToFirebase, onMessagesSnapshot } from './services/firebaseService';

import Header from './components/Header';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';

// Helper to get or create a user ID and store it locally
const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId] = useState<string>(getUserId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to message updates from Firebase
    const unsubscribe = onMessagesSnapshot((newMessages) => {
      setMessages(newMessages);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      await sendMessageToFirebase(currentUserId, text);
    } catch (error) {
      console.error("Error sending message:", error);
      // You could add an error message to the state here to inform the user
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{height: '90vh'}}>
        <Header />
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="flex flex-col space-y-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default App;
