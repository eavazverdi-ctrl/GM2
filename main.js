// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG } from './config.js';

// --- App Initialization ---
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const roomsCollection = collection(db, 'rooms');

// --- User Identity & Settings ---
const USER_ID_KEY = 'chat_user_id_v2';
const USERNAME_KEY = 'chat_username_v2';
const FONT_SIZE_KEY = 'chat_font_size_v1';
const CREATOR_PASSWORD = '2025';

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
let currentRoomId = null;
let messagesUnsubscribe = null;
let currentFontSize = 'md';

// --- DOM Elements ---
const usernameModal = document.getElementById('username-modal');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');

const lobbyContainer = document.getElementById('lobby-container');
const roomList = document.getElementById('room-list');
const createRoomBtn = document.getElementById('create-room-btn');
const settingsBtn = document.getElementById('settings-btn');

const createRoomModal = document.getElementById('create-room-modal');
const createRoomForm = document.getElementById('create-room-form');
const newRoomNameInput = document.getElementById('new-room-name');
const creatorPasswordInput = document.getElementById('creator-password-input');
const cancelCreateRoomBtn = document.getElementById('cancel-create-room');

const passwordModal = document.getElementById('password-modal');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('room-password-input');
const passwordError = document.getElementById('password-error');
const passwordModalRoomName = document.getElementById('password-modal-room-name');
const cancelPasswordEntryBtn = document.getElementById('cancel-password-entry');

const settingsModal = document.getElementById('settings-modal');
const userSettingsForm = document.getElementById('user-settings-form');
const changeUsernameInput = document.getElementById('change-username-input');
const fontSizeOptions = document.getElementById('font-size-options');
const settingsOkBtn = document.getElementById('settings-ok-btn');

const chatContainer = document.getElementById('chat-container');
const chatRoomName = document.getElementById('chat-room-name');
const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
const chatSettingsBtn = document.getElementById('chat-settings-btn');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const sendButtonIcon = sendButton.querySelector('svg');

// Chat Settings Modals
const chatSettingsModal = document.getElementById('chat-settings-modal');
const cancelChatSettings = document.getElementById('cancel-chat-settings');
const openChangeNameModalBtn = document.getElementById('open-change-name-modal-btn');
const openSetPasswordModalBtn = document.getElementById('open-set-password-modal-btn');

const changeRoomNameModal = document.getElementById('change-room-name-modal');
const changeRoomNameForm = document.getElementById('change-room-name-form');
const newRoomNameInputForChange = document.getElementById('new-room-name-input');
const currentPasswordForNameInput = document.getElementById('current-password-for-name');
const changeNameStatus = document.getElementById('change-name-status');

const setRoomPasswordModal = document.getElementById('set-room-password-modal');
const setRoomPasswordForm = document.getElementById('set-room-password-form');
const newPasswordInput = document.getElementById('new-password-input');
const currentPasswordForPassInput = document.getElementById('current-password-for-pass');
const setPasswordStatus = document.getElementById('set-password-status');
const cancelBtns = document.querySelectorAll('.cancel-btn');


// --- View Management ---
const showView = (viewId) => {
  [
    lobbyContainer, chatContainer, usernameModal, createRoomModal, passwordModal, settingsModal,
    chatSettingsModal, changeRoomNameModal, setRoomPasswordModal
  ].forEach(el => {
    if (el.id === viewId) {
      el.classList.remove('view-hidden');
    } else {
      el.classList.add('view-hidden');
    }
  });
};

// --- Helper Functions ---
const formatTime = (date) => {
  if (!date || !(date instanceof Date)) return '';
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// --- Settings Logic ---
const applyFontSize = (size) => {
    document.body.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
    document.body.classList.add(`font-size-${size}`);
    currentFontSize = size;
    // Visually update selected button
    fontSizeOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('glass-button-blue', btn.dataset.size === size);
        btn.classList.toggle('glass-button-gray', btn.dataset.size !== size);
    });
};

fontSizeOptions.addEventListener('click', (e) => {
    if (e.target.matches('.font-size-btn')) {
        applyFontSize(e.target.dataset.size);
    }
});

settingsBtn.addEventListener('click', () => {
    changeUsernameInput.value = currentUsername;
    applyFontSize(currentFontSize);
    showView('settings-modal');
});

userSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Save Username
    const newUsername = changeUsernameInput.value.trim();
    if (newUsername && newUsername !== currentUsername) {
        currentUsername = newUsername;
        localStorage.setItem(USERNAME_KEY, currentUsername);
    }
    // Save Font Size
    localStorage.setItem(FONT_SIZE_KEY, currentFontSize);
    showView('lobby-container');
});


// --- Lobby Logic ---
const renderRooms = (rooms) => {
  roomList.innerHTML = '';
  if (rooms.length === 0) {
    roomList.innerHTML = `<li class="text-center text-gray-500 p-4">هنوز گفتگویی ایجاد نشده است. اولین نفر باشید!</li>`;
  }
  rooms.forEach(room => {
    const li = document.createElement('li');
    li.className = 'bg-white/40 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-sm hover:shadow-lg hover:bg-white/60 transition-all cursor-pointer flex items-center justify-between';
    li.dataset.roomId = room.id;
    li.dataset.roomName = room.name;
    li.dataset.hasPassword = !!room.password;
    
    const roomName = room.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    li.innerHTML = `
      <span class="font-semibold text-lg text-gray-800">${roomName}</span>
      ${room.password ? `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-gray-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ` : ''}
    `;
    li.addEventListener('click', handleRoomClick);
    roomList.appendChild(li);
  });
};

const listenForRooms = () => {
  const q = query(roomsCollection, orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRooms(rooms);
  });
};

const handleRoomClick = (e) => {
  const roomEl = e.currentTarget;
  const { roomId, roomName, hasPassword } = roomEl.dataset;

  // Check for stored access grant
  const accessGranted = localStorage.getItem(`room_access_${roomId}`);
  
  if (hasPassword === 'false' || accessGranted) {
    enterChatRoom(roomId, roomName);
  } else {
    passwordError.classList.add('hidden');
    passwordInput.value = '';
    passwordModalRoomName.textContent = roomName;
    passwordForm.dataset.roomId = roomId;
    passwordForm.dataset.roomName = roomName;
    showView('password-modal');
    passwordInput.focus();
  }
};

// --- Chat Room Logic ---
const enterChatRoom = (roomId, roomName) => {
  currentRoomId = roomId;
  chatRoomName.textContent = roomName;
  messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">درحال بارگذاری پیام‌ها...</li>';
  showView('chat-container');

  if (messagesUnsubscribe) messagesUnsubscribe();

  const messagesCol = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'asc'));
  
  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() ?? null,
    }));
    renderMessages(messages);
  });
};

const renderMessages = (messages) => {
  messagesList.innerHTML = '';
  if (messages.length === 0) {
      messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">هنوز پیامی در این گفتگو وجود ندارد.</li>';
  }
  messages.forEach(message => {
    const isUser = message.authorId === currentUserId;
    const li = document.createElement('li');
    // Swapped justify-start and justify-end
    li.className = `w-full flex ${isUser ? 'justify-start' : 'justify-end'}`;

    const bubbleClasses = isUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-black rounded-bl-none shadow';
    const nameColor = isUser ? 'text-blue-200' : 'text-gray-500';

    const textContent = message.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const senderName = (message.authorName || 'کاربر').replace(/</g, "&lt;").replace(/>/g, "&gt;");

    li.innerHTML = `
      <div class="flex flex-col max-w-xs lg:max-w-md">
        ${!isUser ? `<div class="text-xs font-semibold ${nameColor} mb-1 px-2 text-right">${senderName}</div>` : ''}
        <div class="px-3 py-2 rounded-2xl ${bubbleClasses} relative">
          <p class="whitespace-pre-wrap pb-4 break-words message-text">${textContent}</p>
          <div class="absolute bottom-1 ${isUser ? 'right-2' : 'left-2'} text-xs ${isUser ? 'text-blue-100/80' : 'text-gray-400'}" dir="ltr">${formatTime(message.timestamp)}</div>
        </div>
      </div>
    `;
    messagesList.appendChild(li);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// --- Event Listeners & App Flow ---
usernameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newUsername = usernameInput.value.trim();
  if (newUsername) {
    localStorage.setItem(USERNAME_KEY, newUsername);
    startApp();
  }
});

createRoomBtn.addEventListener('click', () => {
  createRoomForm.reset();
  showView('create-room-modal');
  newRoomNameInput.focus();
});

cancelCreateRoomBtn.addEventListener('click', () => showView('lobby-container'));

createRoomForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = newRoomNameInput.value.trim();
  const creatorPassword = creatorPasswordInput.value;

  if (creatorPassword !== CREATOR_PASSWORD) {
    alert('رمز سازنده اشتباه است.');
    creatorPasswordInput.value = '';
    creatorPasswordInput.focus();
    return;
  }
  if (!name) return;

  try {
    await addDoc(roomsCollection, {
      name,
      password: null, // Rooms are created without a password by default
      createdAt: serverTimestamp(),
    });
    showView('lobby-container');
  } catch (error) {
    console.error("Error creating room:", error);
    alert('خطا در ایجاد اتاق.');
  }
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { roomId, roomName } = e.currentTarget.dataset;
  const enteredPassword = passwordInput.value;

  try {
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (roomDoc.exists() && roomDoc.data().password === enteredPassword) {
      localStorage.setItem(`room_access_${roomId}`, 'true');
      enterChatRoom(roomId, roomName);
    } else {
      passwordError.classList.remove('hidden');
    }
  } catch (error) {
    console.error("Error verifying password:", error);
    passwordError.textContent = 'خطای شبکه';
    passwordError.classList.remove('hidden');
  }
});

cancelPasswordEntryBtn.addEventListener('click', () => showView('lobby-container'));

backToLobbyBtn.addEventListener('click', () => {
  if (messagesUnsubscribe) {
    messagesUnsubscribe();
    messagesUnsubscribe = null;
  }
  currentRoomId = null;
  showView('lobby-container');
});

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (text && currentRoomId) {
    messageInput.value = '';
    messageInput.dispatchEvent(new Event('input'));
    try {
      const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
      await addDoc(messagesCol, {
        text,
        authorId: currentUserId,
        authorName: currentUsername,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
});

messageInput.addEventListener('input', () => {
  const hasText = messageInput.value.trim().length > 0;
  sendButton.disabled = !hasText;
  sendButtonIcon.classList.toggle('text-blue-500', hasText);
  sendButtonIcon.classList.toggle('text-gray-400', !hasText);
});

// --- Chat Settings Listeners ---
chatSettingsBtn.addEventListener('click', () => showView('chat-settings-modal'));
cancelChatSettings.addEventListener('click', () => showView('chat-container'));
openChangeNameModalBtn.addEventListener('click', () => {
  changeRoomNameForm.reset();
  changeNameStatus.textContent = '';
  showView('change-room-name-modal');
});
openSetPasswordModalBtn.addEventListener('click', () => {
  setRoomPasswordForm.reset();
  setPasswordStatus.textContent = '';
  showView('set-room-password-modal');
});
cancelBtns.forEach(btn => {
  btn.addEventListener('click', () => showView('chat-settings-modal'));
});

changeRoomNameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentRoomId) return;

  const newName = newRoomNameInputForChange.value.trim();
  const currentPassword = currentPasswordForNameInput.value;
  changeNameStatus.textContent = 'در حال بررسی...';
  changeNameStatus.classList.remove('text-red-600', 'text-green-600');

  try {
    const roomRef = doc(db, 'rooms', currentRoomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) { throw new Error("اتاق یافت نشد."); }

    const roomData = roomDoc.data();
    const correctPassword = roomData.password || CREATOR_PASSWORD;

    if (currentPassword !== correctPassword) {
      changeNameStatus.textContent = 'رمز فعلی اشتباه است.';
      changeNameStatus.classList.add('text-red-600');
      return;
    }

    await updateDoc(roomRef, { name: newName });
    changeNameStatus.textContent = 'نام با موفقیت تغییر کرد.';
    changeNameStatus.classList.add('text-green-600');
    chatRoomName.textContent = newName;

    setTimeout(() => { showView('chat-settings-modal'); }, 1500);
  } catch (error) {
    console.error("Error changing room name:", error);
    changeNameStatus.textContent = error.message || 'خطا در تغییر نام.';
    changeNameStatus.classList.add('text-red-600');
  }
});

setRoomPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentRoomId) return;

  const newPassword = newPasswordInput.value.trim();
  const currentPassword = currentPasswordForPassInput.value;
  setPasswordStatus.textContent = 'در حال بررسی...';
  setPasswordStatus.classList.remove('text-red-600', 'text-green-600');

  try {
    const roomRef = doc(db, 'rooms', currentRoomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) { throw new Error("اتاق یافت نشد."); }

    const roomData = roomDoc.data();
    const correctPassword = roomData.password || CREATOR_PASSWORD;

    if (currentPassword !== correctPassword) {
      setPasswordStatus.textContent = 'رمز فعلی اشتباه است.';
      setPasswordStatus.classList.add('text-red-600');
      return;
    }

    await updateDoc(roomRef, { password: newPassword || null });
    setPasswordStatus.textContent = 'رمز با موفقیت به‌روز شد.';
    setPasswordStatus.classList.add('text-green-600');
    
    // Invalidate access grant since password has changed
    localStorage.removeItem(`room_access_${currentRoomId}`);

    setTimeout(() => { showView('chat-settings-modal'); }, 1500);
  } catch (error) {
    console.error("Error setting room password:", error);
    setPasswordStatus.textContent = error.message || 'خطا در تغییر رمز.';
    setPasswordStatus.classList.add('text-red-600');
  }
});

// --- PWA Service Worker (commented out to remove errors for now) ---
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW registration failed:', err));
//   });
// }

// --- App Entry Point ---
const startApp = () => {
  const storedUsername = localStorage.getItem(USERNAME_KEY);
  const storedFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'md';
  applyFontSize(storedFontSize);

  if (storedUsername) {
    currentUsername = storedUsername;
    showView('lobby-container');
    listenForRooms();
  } else {
    showView('username-modal');
    usernameInput.focus();
  }
};

startApp();