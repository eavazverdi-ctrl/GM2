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
const getUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};
const currentUserId = getUserId();

// --- DOM Elements ---
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const sendButtonIcon = sendButton.querySelector('svg');

// --- Rendering Logic ---
const renderMessages = (messages) => {
  messagesList.innerHTML = ''; // Clear existing messages
  
  messages.forEach(message => {
    const isUser = message.author === currentUserId;
    const bubbleClasses = isUser
      ? 'bg-blue-500 text-white rounded-br-lg'
      : 'bg-gray-200 text-black rounded-bl-lg';
    const containerClasses = isUser ? 'justify-end' : 'justify-start';

    const messageEl = document.createElement('div');
    messageEl.className = `flex items-end p-2 ${containerClasses}`;
    
    const textContent = message.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    messageEl.innerHTML = `
      <div class="px-4 py-2 rounded-2xl max-w-xs lg:max-w-md break-words ${bubbleClasses}">
        <p class="whitespace-pre-wrap">${textContent}</p>
      </div>
    `;
    messagesList.appendChild(messageEl);
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
        timestamp: data.timestamp?.toDate() ?? null,
      };
    });
    callback(messages);
  });
};

const sendMessageToFirebase = (author, text) => {
  return addDoc(messagesCollection, {
    author,
    text,
    timestamp: serverTimestamp(),
  });
};

// --- Event Listeners ---
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (text) {
    messageInput.value = '';
    messageInput.dispatchEvent(new Event('input')); 
    try {
      await sendMessageToFirebase(currentUserId, text);
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

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered.', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// --- Start the app ---
onMessagesSnapshot(renderMessages);
messageInput.dispatchEvent(new Event('input')); // Set initial button state
