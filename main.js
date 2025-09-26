// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG } from './config.js';

// --- App Initialization ---
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const messagesCollection = collection(db, 'messages');

// --- User Identity ---
const USER_ID_KEY = 'userId';
const USERNAME_KEY = 'chat_username';

const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};
const currentUserId = getUserId();
let currentUsername = '';

// --- DOM Elements ---
const chatContainer = document.getElementById('chat-container');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const sendButtonIcon = sendButton.querySelector('svg');
const usernameModal = document.getElementById('username-modal');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');


// --- Helper Functions ---
const formatTime = (date) => {
  if (!date || !(date instanceof Date)) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};


// --- Rendering Logic ---
const renderMessages = (messages) => {
  messagesList.innerHTML = ''; // Clear existing messages
  
  messages.forEach(message => {
    const isUser = message.author === currentUserId;

    // In RTL, self-start aligns to the right, self-end to the left.
    const alignmentClass = isUser ? 'self-start' : 'self-end';
    
    const bubbleClasses = isUser
      ? 'bg-blue-500 text-white rounded-bl-lg'
      : 'bg-gray-200 text-black rounded-br-lg';
    
    const nameColor = isUser ? 'text-blue-200' : 'text-gray-500';
    const timeColor = isUser ? 'text-blue-100' : 'text-gray-500';

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex flex-col max-w-xs lg:max-w-md ${alignmentClass}`;
    
    const textContent = message.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const senderName = message.name ? message.name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'کاربر';

    messageWrapper.innerHTML = `
      <div class="text-sm font-semibold ${nameColor} mb-1 px-2 ${isUser ? 'text-right' : 'text-left'}">${senderName}</div>
      <div class="px-3 py-2 rounded-2xl ${bubbleClasses} relative shadow">
        <p class="whitespace-pre-wrap pb-4 break-words">${textContent}</p>
        <div class="absolute bottom-1 ${isUser ? 'left-2' : 'right-2'} text-xs ${timeColor} opacity-80" dir="ltr">${formatTime(message.timestamp)}</div>
      </div>
    `;
    messagesList.appendChild(messageWrapper);
  });

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// --- Firebase Logic ---
const onMessagesSnapshot = (callback) => {
  const q = query(messagesCollection, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        author: data.author,
        name: data.name, // Extract username
        timestamp: data.timestamp?.toDate() ?? null,
      };
    });
    callback(messages);
  });
};

const sendMessageToFirebase = (author, name, text) => {
  return addDoc(messagesCollection, {
    author,
    name,
    text,
    timestamp: serverTimestamp(),
  });
};

// --- Event Listeners & App Flow ---
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (text && currentUsername) {
    messageInput.value = '';
    messageInput.dispatchEvent(new Event('input')); 
    try {
      await sendMessageToFirebase(currentUserId, currentUsername, text);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
});

messageInput.addEventListener('input', () => {
  const hasText = messageInput.value.trim().length > 0;
  sendButton.disabled = !hasText;
  if (hasText) {
    sendButtonIcon.classList.remove('text-gray-400');
    sendButtonIcon.classList.add('text-blue-500');
  } else {
    sendButtonIcon.classList.remove('text-blue-500');
    sendButtonIcon.classList.add('text-gray-400');
  }
});

usernameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newUsername = usernameInput.value.trim();
  if (newUsername) {
    localStorage.setItem(USERNAME_KEY, newUsername);
    startApp();
  }
});

const startApp = () => {
  const storedUsername = localStorage.getItem(USERNAME_KEY);
  if (storedUsername) {
    currentUsername = storedUsername;
    usernameModal.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Start listening for messages
    onMessagesSnapshot(renderMessages);
    
    // Set initial button state
    messageInput.dispatchEvent(new Event('input'));
  } else {
    usernameModal.classList.remove('hidden');
    chatContainer.classList.add('hidden');
  }
};

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered.', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// --- Start the app flow ---
startApp();
