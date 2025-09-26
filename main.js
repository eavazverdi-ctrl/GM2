// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc,
  limit, getDocs, startAfter, writeBatch, where, endBefore, limitToLast
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
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for non-image files
const IMAGE_MAX_DIMENSION = 1280; // max width/height for compressed images
const MESSAGES_PER_PAGE = 15;

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

// Pagination state
let oldestMessageDoc = null;
let isLoadingOlderMessages = false;
let reachedEndOfMessages = false;


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
const fileInput = document.getElementById('file-input');
const sendButton = document.getElementById('send-button');
const sendButtonIcon = sendButton.querySelector('svg');
const loadingSpinner = document.getElementById('loading-spinner');
const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');

// Chat Settings Modals
const chatSettingsModal = document.getElementById('chat-settings-modal');
const cancelChatSettings = document.getElementById('cancel-chat-settings');
const openChangeNameModalBtn = document.getElementById('open-change-name-modal-btn');
const openSetPasswordModalBtn = document.getElementById('open-set-password-modal-btn');
const openDeleteChatModalBtn = document.getElementById('open-delete-chat-modal-btn');

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

const deleteChatModal = document.getElementById('delete-chat-modal');
const deleteChatForm = document.getElementById('delete-chat-form');
const passwordForDeleteInput = document.getElementById('password-for-delete');
const deleteChatStatus = document.getElementById('delete-chat-status');

const cancelBtns = document.querySelectorAll('.cancel-btn');


// --- View Management ---
const showView = (viewId) => {
  [
    lobbyContainer, chatContainer, usernameModal, createRoomModal, passwordModal, settingsModal,
    chatSettingsModal, changeRoomNameModal, setRoomPasswordModal, deleteChatModal
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

const scrollToBottom = (behavior = 'auto') => {
  messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior });
};

// --- Settings Logic ---
const applyFontSize = (size) => {
    document.body.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
    document.body.classList.add(`font-size-${size}`);
    currentFontSize = size;
    // Visually update selected button
    fontSizeOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('glass-button-blue', btn.dataset.size === size);
        btn.classList.toggle('text-white', btn.dataset.size === size);
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
  messagesList.innerHTML = '';
  
  // Reset pagination state
  oldestMessageDoc = null;
  isLoadingOlderMessages = false;
  reachedEndOfMessages = false;
  scrollToBottomBtn.classList.add('view-hidden', 'opacity-0');
  
  showView('chat-container');
  
  if (messagesUnsubscribe) messagesUnsubscribe();

  // Load initial messages and listen for new ones
  loadAndListenForMessages();
};

const loadAndListenForMessages = () => {
  const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
  // Listen for the latest messages in real-time
  const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(MESSAGES_PER_PAGE));
  
  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    if (snapshot.empty && messagesList.children.length === 0) {
      messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">هنوز پیامی در این گفتگو وجود ندارد.</li>';
      reachedEndOfMessages = true;
      return;
    }

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() ?? new Date(),
    })).reverse();
    
    // Only update if it's the initial load or a new message has arrived
    const isInitialLoad = !oldestMessageDoc;
    if (isInitialLoad || snapshot.docChanges().some(c => c.type === 'added')) {
        renderMessages(messages, false, isInitialLoad);
    }
    
    // Update pagination cursor
    if (snapshot.docs.length > 0) {
        oldestMessageDoc = snapshot.docs[snapshot.docs.length - 1];
    } else {
        reachedEndOfMessages = true;
    }
  }, error => {
    console.error("Error listening to messages:", error);
    messagesList.innerHTML = '<li class="text-center text-red-500 p-4">خطا در بارگذاری پیام‌ها.</li>';
  });
};

const loadOlderMessages = async () => {
  if (isLoadingOlderMessages || reachedEndOfMessages || !oldestMessageDoc) return;

  isLoadingOlderMessages = true;
  loadingSpinner.classList.remove('hidden');

  const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'desc'), startAfter(oldestMessageDoc), limit(MESSAGES_PER_PAGE));
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      reachedEndOfMessages = true;
      loadingSpinner.classList.add('hidden');
      return;
    }

    const oldMessages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() ?? new Date(),
    })).reverse();
    
    oldestMessageDoc = snapshot.docs[snapshot.docs.length - 1];
    
    const firstMessage = messagesList.firstChild;
    const currentScrollHeight = messagesContainer.scrollHeight;
    
    renderMessages(oldMessages, true);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight - currentScrollHeight;

  } catch(error) {
    console.error("Error loading older messages:", error);
  } finally {
    isLoadingOlderMessages = false;
    loadingSpinner.classList.add('hidden');
  }
};


messagesContainer.addEventListener('scroll', () => {
  if (messagesContainer.scrollTop < 50) {
    loadOlderMessages();
  }
  const isScrolledUp = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight > 200;
  scrollToBottomBtn.classList.remove('view-hidden');
  scrollToBottomBtn.classList.toggle('opacity-0', !isScrolledUp);
});

scrollToBottomBtn.addEventListener('click', () => {
    scrollToBottom('smooth');
});


const renderMessages = (messages, prepend = false, isInitialLoad = false) => {
  if (!prepend && messagesList.innerHTML.includes('هنوز پیامی')) {
      messagesList.innerHTML = '';
  }
  
  const fragment = document.createDocumentFragment();
  let lastAuthorId = prepend 
    ? (messagesList.firstChild?.dataset?.authorId || null)
    : (messagesList.lastChild?.dataset?.authorId || null);

  messages.forEach((message, index) => {
    const isUser = message.authorId === currentUserId;
    // Show name if author is different from the *previous* rendered message
    const showName = !isUser && (lastAuthorId !== message.authorId);

    const li = document.createElement('li');
    li.dataset.authorId = message.authorId;
    // user (white) on the right, others (blue) on the left
    li.className = `w-full flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const bubbleClasses = isUser ? 'bg-white text-black rounded-br-none shadow' : 'bg-blue-500 text-white rounded-bl-none';
    const nameColor = 'text-gray-600';

    const senderName = (message.authorName || 'کاربر').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const nameHTML = showName ? `<div class="text-xs font-semibold ${nameColor} mb-1 px-1 text-right">${senderName}</div>` : '';
    
    let messageContentHTML = '';
    const timeHTML = `<div class="absolute bottom-1 ${!isUser ? 'left-2' : 'right-2'} text-xs ${!isUser ? 'text-blue-100/80' : 'text-gray-400'}" dir="ltr">${formatTime(message.timestamp)}</div>`;

    switch (message.type) {
      case 'image':
        messageContentHTML = `
          <div class="relative">
            <img src="${message.fileDataUrl}" class="rounded-lg max-w-full h-auto" style="max-height: 300px; min-width: 150px;" alt="${message.fileName || 'Image'}"/>
            ${timeHTML}
          </div>
        `;
        break;
      case 'file':
        const fileName = (message.fileName || 'فایل').replace(/</g, "&lt;").replace(/>/g, "&gt;");
        messageContentHTML = `
          <a href="${message.fileDataUrl}" download="${fileName}" class="relative flex items-center space-x-2 rtl:space-x-reverse bg-gray-100/50 p-3 rounded-lg hover:bg-gray-100 min-w-[180px]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 flex-shrink-0 text-gray-600"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            <span class="font-medium text-sm text-gray-800 break-all">${fileName}</span>
            ${timeHTML}
          </a>
        `;
        break;
      default: // 'text'
        const textContent = (message.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
        messageContentHTML = `
          <div class="px-3 py-2 rounded-2xl ${bubbleClasses} relative">
            <p class="whitespace-pre-wrap pb-4 break-words message-text">${textContent}</p>
            ${timeHTML}
          </div>
        `;
    }

    li.innerHTML = `
      <div class="flex flex-col max-w-xs lg:max-w-md">
        ${nameHTML}
        ${messageContentHTML}
      </div>
    `;
    fragment.appendChild(li);
    lastAuthorId = message.authorId;
  });

  if (prepend) {
      messagesList.prepend(fragment);
  } else {
      messagesList.appendChild(fragment);
  }
  
  if (isInitialLoad || !prepend) {
      setTimeout(() => scrollToBottom(), 50);
  }
};


// --- File Handling & Image Compression ---
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height) {
                    if (width > IMAGE_MAX_DIMENSION) {
                        height *= IMAGE_MAX_DIMENSION / width;
                        width = IMAGE_MAX_DIMENSION;
                    }
                } else {
                    if (height > IMAGE_MAX_DIMENSION) {
                        width *= IMAGE_MAX_DIMENSION / height;
                        height = IMAGE_MAX_DIMENSION;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85)); // Get compressed data URL
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentRoomId) return;

    let fileDataUrl;
    const isImage = file.type.startsWith('image/');

    try {
        if (isImage) {
            fileDataUrl = await compressImage(file);
        } else {
            if (file.size > MAX_FILE_SIZE) {
                alert(`حجم فایل نباید بیشتر از 5 مگابایت باشد.`);
                e.target.value = ''; // Reset file input
                return;
            }
            fileDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(e);
                reader.readAsDataURL(file);
            });
        }
        
        const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
        await addDoc(messagesCol, {
            type: isImage ? 'image' : 'file',
            fileName: file.name,
            fileDataUrl,
            authorId: currentUserId,
            authorName: currentUsername,
            timestamp: serverTimestamp(),
        });
        scrollToBottom('smooth');

    } catch (error) {
        console.error("Error processing/uploading file:", error);
        alert('خطا در ارسال فایل.');
    } finally {
        e.target.value = ''; // Reset file input
    }
};
fileInput.addEventListener('change', handleFileSelect);


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
      password: null,
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
    const tempInput = messageInput.value;
    messageInput.value = '';
    messageInput.dispatchEvent(new Event('input'));
    try {
      const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
      await addDoc(messagesCol, {
        type: 'text',
        text,
        authorId: currentUserId,
        authorName: currentUsername,
        timestamp: serverTimestamp(),
      });
      scrollToBottom('smooth');
    } catch (error) {
      console.error("Error sending message:", error);
      messageInput.value = tempInput; // Restore on error
      messageInput.dispatchEvent(new Event('input'));
    }
  }
});

messageInput.addEventListener('input', () => {
  const hasText = messageInput.value.trim().length > 0;
  sendButton.disabled = !hasText;
  sendButtonIcon.classList.toggle('text-white', hasText);
  sendButtonIcon.classList.toggle('text-gray-300', !hasText);
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
openDeleteChatModalBtn.addEventListener('click', () => {
    deleteChatForm.reset();
    deleteChatStatus.textContent = '';
    showView('delete-chat-modal');
});
cancelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const parentModal = btn.closest('.fixed');
    if(parentModal.id === 'delete-chat-modal') {
        showView('chat-settings-modal');
    } else {
        showView('chat-settings-modal');
    }
  });
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
    
    localStorage.removeItem(`room_access_${currentRoomId}`);

    setTimeout(() => { showView('chat-settings-modal'); }, 1500);
  } catch (error) {
    console.error("Error setting room password:", error);
    setPasswordStatus.textContent = error.message || 'خطا در تغییر رمز.';
    setPasswordStatus.classList.add('text-red-600');
  }
});

deleteChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentRoomId) return;

    const password = passwordForDeleteInput.value;
    deleteChatStatus.textContent = 'در حال بررسی رمز...';
    deleteChatStatus.classList.remove('text-red-600', 'text-green-600');

    try {
        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");

        const roomData = roomDoc.data();
        const correctPassword = roomData.password || CREATOR_PASSWORD;

        if (password !== correctPassword) {
            deleteChatStatus.textContent = 'رمز اشتباه است.';
            deleteChatStatus.classList.add('text-red-600');
            return;
        }

        deleteChatStatus.textContent = 'در حال حذف پیام‌ها...';
        deleteChatStatus.classList.add('text-yellow-600');

        const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
        const snapshot = await getDocs(query(messagesCol));
        
        // Firestore limits batch writes to 500 operations.
        // We'll delete in chunks if needed.
        for (let i = 0; i < snapshot.docs.length; i += 500) {
            const batch = writeBatch(db);
            const chunk = snapshot.docs.slice(i, i + 500);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        
        deleteChatStatus.textContent = 'تمام پیام‌ها حذف شدند.';
        deleteChatStatus.classList.remove('text-yellow-600');
        deleteChatStatus.classList.add('text-green-600');
        
        messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">تمام پیام‌ها حذف شدند.</li>';

        setTimeout(() => { showView('chat-container'); }, 1500);

    } catch (error) {
        console.error("Error deleting chat:", error);
        deleteChatStatus.textContent = error.message || 'خطا در حذف گفتگو.';
        deleteChatStatus.classList.add('text-red-600');
    }
});


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