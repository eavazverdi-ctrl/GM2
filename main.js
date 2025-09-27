// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc,
  limit, getDocs, startAfter, writeBatch, where, endBefore, limitToLast, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG } from './config.js';

// --- App Initialization ---
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const roomsCollection = collection(db, 'rooms');

// --- User Identity & Settings ---
const APP_ACCESS_KEY = 'chat_app_access_v1';
const USER_ID_KEY = 'chat_user_id_v2';
const USERNAME_KEY = 'chat_username_v2';
const USER_AVATAR_KEY = 'chat_user_avatar_v1';
const FONT_SIZE_KEY = 'chat_font_size_v1';
const GLASS_MODE_KEY = 'chat_glass_mode_v1';
const CREATOR_PASSWORD = '2025';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for non-image files
const IMAGE_MAX_DIMENSION = 1280; // max width/height for compressed images
const AVATAR_MAX_DIMENSION = 200; // max width/height for avatars
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
let currentUserAvatar = null;
let currentRoomId = null;
let messagesUnsubscribe = null;
let roomsUnsubscribe = null;
let currentFontSize = 'sm';
let currentGlassMode = 'off';

// Pagination state
let oldestMessageDoc = null;
let isLoadingOlderMessages = false;
let reachedEndOfMessages = false;

// --- DOM Elements ---
const usernameModal = document.getElementById('username-modal');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const initialPasswordInput = document.getElementById('initial-password-input');
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
const userAvatarPreview = document.getElementById('user-avatar-preview');
const userAvatarInput = document.getElementById('user-avatar-input');
const changeUsernameInput = document.getElementById('change-username-input');
const fontSizeOptions = document.getElementById('font-size-options');
const glassModeOptions = document.getElementById('glass-mode-options');
const settingsOkBtn = document.getElementById('settings-ok-btn');
const chatContainer = document.getElementById('chat-container');
const chatBackground = document.getElementById('chat-background');
const chatRoomName = document.getElementById('chat-room-name');
const chatRoomAvatar = document.getElementById('chat-room-avatar');
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
const chatSettingsModal = document.getElementById('chat-settings-modal');
const cancelChatSettings = document.getElementById('cancel-chat-settings');
const openChangeRoomAvatarBtn = document.getElementById('open-change-room-avatar-btn');
const openChangeBackgroundBtn = document.getElementById('open-change-background-btn');
const openChangeNameModalBtn = document.getElementById('open-change-name-modal-btn');
const openSetPasswordModalBtn = document.getElementById('open-set-password-modal-btn');
const openDeleteChatModalBtn = document.getElementById('open-delete-chat-modal-btn');
const changeRoomAvatarModal = document.getElementById('change-room-avatar-modal');
const changeRoomAvatarForm = document.getElementById('change-room-avatar-form');
const roomAvatarPreview = document.getElementById('room-avatar-preview');
const roomAvatarInput = document.getElementById('room-avatar-input');
const currentPasswordForAvatarInput = document.getElementById('current-password-for-avatar');
const changeAvatarStatus = document.getElementById('change-avatar-status');
const changeBackgroundModal = document.getElementById('change-background-modal');
const changeBackgroundForm = document.getElementById('change-background-form');
const backgroundPreview = document.getElementById('background-preview');
const backgroundPreviewText = document.getElementById('background-preview-text');
const backgroundInput = document.getElementById('background-input');
const currentPasswordForBackgroundInput = document.getElementById('current-password-for-background');
const changeBackgroundStatus = document.getElementById('change-background-status');
const changeRoomNameModal = document.getElementById('change-room-name-modal');
const changeRoomNameForm = document.getElementById('change-room-name-form');
const newRoomNameInputForChange = document.getElementById('new-room-name-input');
const currentPasswordForNameInput = document.getElementById('current-password-for-name');
const changeNameStatus = document.getElementById('change-name-status');
const setRoomPasswordModal = document.getElementById('set-room-password-modal');
const setRoomPasswordForm = document.getElementById('set-room-password-form');
const newPasswordInput = document.getElementById('new-password-input');
const currentPasswordForPassInput = document.getElementById('current-password-for-pass');
const setPasswordStatus = document.getElementById('setPassword-status');
const deleteChatModal = document.getElementById('delete-chat-modal');
const deleteChatForm = document.getElementById('delete-chat-form');
const passwordForDeleteInput = document.getElementById('password-for-delete');
const deleteChatStatus = document.getElementById('delete-chat-status');
const cancelBtns = document.querySelectorAll('.cancel-btn');


// --- View Management ---
const showView = (viewId) => {
  [
    lobbyContainer, chatContainer, usernameModal, createRoomModal, passwordModal, settingsModal,
    chatSettingsModal, changeRoomNameModal, setRoomPasswordModal, deleteChatModal, changeRoomAvatarModal,
    changeBackgroundModal
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

const hashStringToColor = (str) => {
    let hash = 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

const generateAvatar = (name, url) => {
    if (url) {
        return `<img src="${url}" class="w-full h-full object-cover" alt="${name || 'avatar'}"/>`;
    }
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const color = hashStringToColor(name || '');
    return `
        <div class="w-full h-full flex items-center justify-center text-white font-bold text-xl" style="background-color: #${color};">
            ${initial}
        </div>
    `;
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

const applyGlassModeSelection = (mode) => {
    currentGlassMode = mode;
    glassModeOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('glass-button-blue', btn.dataset.glass === mode);
        btn.classList.toggle('text-white', btn.dataset.glass === mode);
        btn.classList.toggle('glass-button-gray', btn.dataset.glass !== mode);
    });
};

fontSizeOptions.addEventListener('click', (e) => {
    if (e.target.matches('.font-size-btn')) {
        applyFontSize(e.target.dataset.size);
    }
});

glassModeOptions.addEventListener('click', (e) => {
    if (e.target.matches('.glass-mode-btn')) {
        applyGlassModeSelection(e.target.dataset.glass);
    }
});

settingsBtn.addEventListener('click', () => {
    changeUsernameInput.value = currentUsername;
    userAvatarPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    applyFontSize(currentFontSize);
    applyGlassModeSelection(currentGlassMode);
    showView('settings-modal');
});

userAvatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const compressedAvatar = await compressImage(file, AVATAR_MAX_DIMENSION);
        currentUserAvatar = compressedAvatar;
        userAvatarPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    } catch (error) {
        console.error("Error compressing avatar:", error);
        alert("خطا در پردازش تصویر.");
    }
});

userSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUsername = changeUsernameInput.value.trim();
    if (newUsername && newUsername !== currentUsername) {
        currentUsername = newUsername;
        localStorage.setItem(USERNAME_KEY, currentUsername);
    }
    localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar || '');
    localStorage.setItem(FONT_SIZE_KEY, currentFontSize);
    localStorage.setItem(GLASS_MODE_KEY, currentGlassMode);
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
    li.className = 'bg-white/40 backdrop-blur-md p-3 rounded-xl shadow-sm hover:shadow-lg hover:bg-white/60 transition-all cursor-pointer flex items-center justify-between';
    li.dataset.roomId = room.id;
    
    const roomName = room.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const avatarHTML = generateAvatar(room.name, room.avatarUrl);

    li.innerHTML = `
      <div class="flex items-center space-x-3 rtl:space-x-reverse">
        <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">${avatarHTML}</div>
        <span class="font-semibold text-lg text-gray-800">${roomName}</span>
      </div>
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
  if (roomsUnsubscribe) roomsUnsubscribe();
  roomsUnsubscribe = onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRooms(rooms);
  });
};

const handleRoomClick = async (e) => {
  const roomEl = e.currentTarget;
  const { roomId } = roomEl.dataset;

  const roomDoc = await getDoc(doc(db, 'rooms', roomId));
  if (!roomDoc.exists()) return;
  const roomData = roomDoc.data();
  
  const accessGranted = localStorage.getItem(`room_access_${roomId}`);
  
  if (!roomData.password || accessGranted) {
    enterChatRoom(roomId, roomData);
  } else {
    passwordError.classList.add('hidden');
    passwordInput.value = '';
    passwordModalRoomName.textContent = roomData.name;
    passwordForm.dataset.roomId = roomId;
    showView('password-modal');
    passwordInput.focus();
  }
};

// --- Chat Room Logic ---
const enterChatRoom = (roomId, roomData) => {
  currentRoomId = roomId;
  chatRoomName.textContent = roomData.name;
  chatRoomAvatar.innerHTML = generateAvatar(roomData.name, roomData.avatarUrl);
  chatBackground.style.backgroundImage = roomData.backgroundUrl ? `url(${roomData.backgroundUrl})` : '';

  messagesList.innerHTML = '';
  oldestMessageDoc = null;
  isLoadingOlderMessages = false;
  reachedEndOfMessages = false;
  scrollToBottomBtn.classList.add('view-hidden', 'opacity-0');
  
  showView('chat-container');
  
  if (messagesUnsubscribe) messagesUnsubscribe();

  loadAndListenForMessages();
};

const loadAndListenForMessages = () => {
  const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(MESSAGES_PER_PAGE));
  
  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    if (snapshot.empty && messagesList.children.length === 0) {
      messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">هنوز پیامی در این گفتگو وجود ندارد.</li>';
      reachedEndOfMessages = true;
      return;
    }
    
    // Check if the view is still active before rendering
    if(currentRoomId) {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() ?? new Date(),
        })).reverse();
        const isInitialLoad = !oldestMessageDoc;
        if (isInitialLoad || snapshot.docChanges().some(c => c.type === 'added')) {
            renderMessages(messages, false, isInitialLoad);
        }
        if (snapshot.docs.length > 0) {
            oldestMessageDoc = snapshot.docs[snapshot.docs.length - 1];
        } else {
            reachedEndOfMessages = true;
        }
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
  if (messagesContainer.scrollTop < 50) { loadOlderMessages(); }
  const isScrolledUp = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight > 200;
  scrollToBottomBtn.classList.remove('view-hidden');
  scrollToBottomBtn.classList.toggle('opacity-0', !isScrolledUp);
});
scrollToBottomBtn.addEventListener('click', () => { scrollToBottom('smooth'); });

const renderMessages = (messages, prepend = false, isInitialLoad = false) => {
  if (!prepend && messagesList.innerHTML.includes('هنوز پیامی')) { messagesList.innerHTML = ''; }
  const fragment = document.createDocumentFragment();

  const glassModeClasses = {
      'off': { user: 'bg-green-500', other: 'bg-white' },
      'low': { user: 'bg-green-500/70 backdrop-blur-sm', other: 'bg-white/70 backdrop-blur-sm' },
      'high': { user: 'bg-green-500/40 backdrop-blur-md', other: 'bg-white/40 backdrop-blur-md' }
  };
  const selectedModeClasses = glassModeClasses[currentGlassMode] || glassModeClasses['off'];

  messages.forEach(message => {
    const isUser = message.authorId === currentUserId;
    const li = document.createElement('li');
    li.dataset.authorId = message.authorId;
    
    // Determine classes based on sender
    const liClasses = isUser ? 'justify-start' : 'justify-end'; // start=right, end=left in RTL
    const bubbleClasses = isUser ? `${selectedModeClasses.user} text-white` : `${selectedModeClasses.other} text-black shadow`;
    const bubbleTailClass = isUser ? 'rounded-br-none' : 'rounded-bl-none';
    const nameAlignmentClass = isUser ? 'text-right' : 'text-left';
    const timeAlignmentClass = isUser ? 'left-2.5' : 'right-2.5';
    const metaColorClass = isUser ? 'text-white/80' : 'text-gray-500';

    li.className = `flex items-start space-x-3 rtl:space-x-reverse ${liClasses}`;

    const senderName = (message.authorName || 'کاربر').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const nameHTML = `<div class="text-xs ${metaColorClass} mb-1 ${nameAlignmentClass}">${senderName}</div>`;
    
    const avatarHTML = generateAvatar(message.authorName, message.authorAvatar);
    const avatarContainer = `<div class="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden self-end bg-white/30 backdrop-blur-sm">${avatarHTML}</div>`;

    let messageContentHTML = '';
    const timeHTML = (timestamp) => `<span class="text-xs ${metaColorClass}" dir="ltr">${formatTime(timestamp)}</span>`;
    
    switch (message.type) {
      case 'image':
        messageContentHTML = `<div class="relative rounded-lg overflow-hidden"><img src="${message.fileDataUrl}" class="max-w-full h-auto" style="max-height: 300px; min-width: 150px;" alt="${message.fileName || 'Image'}"/><div class="absolute bottom-1 right-2 text-white bg-black/30 rounded px-1 flex items-center gap-1" dir="ltr">${formatTime(message.timestamp)}</div></div>`;
        break;
      case 'file':
        const fileName = (message.fileName || 'فایل').replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const fileMetaHTML = `<div class="absolute bottom-1.5 ${timeAlignmentClass} flex items-center gap-1">${timeHTML(message.timestamp)}</div>`;
        messageContentHTML = `<a href="${message.fileDataUrl}" download="${fileName}" class="relative flex items-center space-x-2 rtl:space-x-reverse bg-gray-100/30 backdrop-blur-sm p-3 rounded-lg hover:bg-gray-100/50 min-w-[180px]"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 flex-shrink-0 text-gray-600"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg><span class="font-medium text-sm text-gray-800 break-all">${fileName}</span>${fileMetaHTML}</a>`;
        break;
      default: // text
        const textContent = (message.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const metaHTML = `<div class="absolute bottom-1.5 ${timeAlignmentClass} flex items-center gap-1">${timeHTML(message.timestamp)}</div>`;
        messageContentHTML = `
          <div class="px-3 py-2 rounded-2xl ${bubbleClasses} ${bubbleTailClass} relative">
            ${nameHTML}
            <p class="whitespace-pre-wrap pb-4 break-words message-text">${textContent}</p>
            ${metaHTML}
          </div>`;
    }
    
    const bubbleContainer = `<div class="flex flex-col max-w-xs lg:max-w-md">${messageContentHTML}</div>`;

    // In RTL flex, the first DOM element is rendered on the right.
    if (isUser) { // User (Right): We want [Bubble | Avatar]. DOM order: Bubble, then Avatar.
        li.innerHTML = bubbleContainer + avatarContainer;
    } else { // Others (Left): We want [Avatar | Bubble]. DOM order: Avatar, then Bubble.
        li.innerHTML = avatarContainer + bubbleContainer;
    }

    fragment.appendChild(li);
  });

  if (prepend) { messagesList.prepend(fragment); } else { messagesList.appendChild(fragment); }
  if (isInitialLoad || !prepend) { setTimeout(() => scrollToBottom(), 50); }
};

// --- File Handling & Image Compression ---
const compressImage = (file, maxDimension) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height) {
                    if (width > maxDimension) { height *= maxDimension / width; width = maxDimension; }
                } else {
                    if (height > maxDimension) { width *= maxDimension / height; height = maxDimension; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
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

    const isImage = file.type.startsWith('image/');
    let fileDataUrl;
    
    // Show temporary uploading indicator for images
    const tempId = `temp_${Date.now()}`;
    if (isImage) {
        const previewUrl = URL.createObjectURL(file);
        const tempLi = document.createElement('li');
        tempLi.id = tempId;
        tempLi.className = 'flex justify-start items-start space-x-3 rtl:space-x-reverse opacity-50'; // Aligned right for user
        tempLi.innerHTML = `
            <div class="flex flex-col max-w-xs lg:max-w-md">
                 <div class="relative rounded-lg overflow-hidden">
                    <img src="${previewUrl}" class="max-w-full h-auto" style="max-height: 300px;" />
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg class="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                </div>
            </div>
            <div class="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden self-end bg-white/30 backdrop-blur-sm">${generateAvatar(currentUsername, currentUserAvatar)}</div>
            `;
        messagesList.appendChild(tempLi);
        scrollToBottom('smooth');
    }

    try {
        if (isImage) {
            fileDataUrl = await compressImage(file, IMAGE_MAX_DIMENSION);
        } else {
            if (file.size > MAX_FILE_SIZE) { alert(`حجم فایل نباید بیشتر از 5 مگابایت باشد.`); e.target.value = ''; return; }
            fileDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(e);
                reader.readAsDataURL(file);
            });
        }
        const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
        await addDoc(messagesCol, { type: isImage ? 'image' : 'file', fileName: file.name, fileDataUrl, authorId: currentUserId, authorName: currentUsername, authorAvatar: currentUserAvatar, timestamp: serverTimestamp() });
        // The onSnapshot listener will handle rendering the final message
    } catch (error) { 
        console.error("Error processing/uploading file:", error); 
        alert('خطا در ارسال فایل.'); 
    } finally {
        if (isImage) {
            const tempEl = document.getElementById(tempId);
            if(tempEl) tempEl.remove();
        }
        e.target.value = ''; 
    }
};
fileInput.addEventListener('change', handleFileSelect);

// --- Event Listeners & App Flow ---
usernameForm.addEventListener('submit', (e) => { 
    e.preventDefault(); 
    const newUsername = usernameInput.value.trim(); 
    const password = initialPasswordInput.value;
    if (password !== CREATOR_PASSWORD) {
        alert('رمز ورود به برنامه اشتباه است.');
        initialPasswordInput.value = '';
        initialPasswordInput.focus();
        return;
    }
    if (newUsername) { 
        localStorage.setItem(APP_ACCESS_KEY, 'true');
        localStorage.setItem(USERNAME_KEY, newUsername); 
        startApp(); 
    } 
});
createRoomBtn.addEventListener('click', () => { createRoomForm.reset(); showView('create-room-modal'); newRoomNameInput.focus(); });
cancelCreateRoomBtn.addEventListener('click', () => showView('lobby-container'));

createRoomForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const name = newRoomNameInput.value.trim(); const creatorPassword = creatorPasswordInput.value;
  if (creatorPassword !== CREATOR_PASSWORD) { alert('رمز سازنده اشتباه است.'); creatorPasswordInput.value = ''; creatorPasswordInput.focus(); return; }
  if (!name) return;
  try { await addDoc(roomsCollection, { name, password: null, createdAt: serverTimestamp(), avatarUrl: null, backgroundUrl: null }); showView('lobby-container'); } catch (error) { console.error("Error creating room:", error); alert('خطا در ایجاد اتاق.'); }
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const { roomId } = e.currentTarget.dataset; const enteredPassword = passwordInput.value;
  try {
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (roomDoc.exists() && roomDoc.data().password === enteredPassword) { 
        localStorage.setItem(`room_access_${roomId}`, 'true'); 
        enterChatRoom(roomId, roomDoc.data());
    } else { 
        passwordError.classList.remove('hidden'); 
    }
  } catch (error) { console.error("Error verifying password:", error); passwordError.textContent = 'خطای شبکه'; passwordError.classList.remove('hidden'); }
});

cancelPasswordEntryBtn.addEventListener('click', () => showView('lobby-container'));
backToLobbyBtn.addEventListener('click', () => { if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; } currentRoomId = null; chatBackground.style.backgroundImage = ''; showView('lobby-container'); });

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const text = messageInput.value.trim();
  if (text && currentRoomId) {
    const tempInput = messageInput.value; messageInput.value = ''; messageInput.dispatchEvent(new Event('input'));
    try {
      const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
      await addDoc(messagesCol, { type: 'text', text, authorId: currentUserId, authorName: currentUsername, authorAvatar: currentUserAvatar, timestamp: serverTimestamp() });
      scrollToBottom('smooth');
    } catch (error) { console.error("Error sending message:", error); messageInput.value = tempInput; messageInput.dispatchEvent(new Event('input')); }
  }
});
messageInput.addEventListener('input', () => { const hasText = messageInput.value.trim().length > 0; sendButton.disabled = !hasText; sendButtonIcon.classList.toggle('text-blue-500', hasText); sendButtonIcon.classList.toggle('text-gray-400', !hasText); });

// --- Chat Settings Listeners ---
chatSettingsBtn.addEventListener('click', () => showView('chat-settings-modal'));
cancelChatSettings.addEventListener('click', () => showView('chat-container'));
openChangeRoomAvatarBtn.addEventListener('click', async () => {
    changeRoomAvatarForm.reset(); changeAvatarStatus.textContent = '';
    const roomDoc = await getDoc(doc(db, 'rooms', currentRoomId));
    const roomData = roomDoc.exists() ? roomDoc.data() : {};
    roomAvatarPreview.innerHTML = generateAvatar(roomData.name, roomData.avatarUrl);
    showView('change-room-avatar-modal');
});
openChangeBackgroundBtn.addEventListener('click', async () => {
    changeBackgroundForm.reset(); changeBackgroundStatus.textContent = '';
    const roomDoc = await getDoc(doc(db, 'rooms', currentRoomId));
    const roomData = roomDoc.exists() ? roomDoc.data() : {};
    backgroundPreview.style.backgroundImage = roomData.backgroundUrl ? `url(${roomData.backgroundUrl})` : '';
    backgroundPreviewText.classList.toggle('hidden', !!roomData.backgroundUrl);
    showView('change-background-modal');
});
openChangeNameModalBtn.addEventListener('click', () => { changeRoomNameForm.reset(); changeNameStatus.textContent = ''; showView('change-room-name-modal'); });
openSetPasswordModalBtn.addEventListener('click', () => { setRoomPasswordForm.reset(); setPasswordStatus.textContent = ''; showView('set-room-password-modal'); });
openDeleteChatModalBtn.addEventListener('click', () => { deleteChatForm.reset(); deleteChatStatus.textContent = ''; showView('delete-chat-modal'); });
cancelBtns.forEach(btn => { btn.addEventListener('click', () => showView('chat-settings-modal')); });

changeRoomAvatarForm.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentRoomId) return;
    const file = roomAvatarInput.files[0]; const password = currentPasswordForAvatarInput.value;
    if (!file) { alert("لطفا یک عکس انتخاب کنید."); return; }
    changeAvatarStatus.textContent = 'در حال بررسی...'; changeAvatarStatus.classList.remove('text-red-600', 'text-green-600');
    try {
        const roomRef = doc(db, 'rooms', currentRoomId); const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
        const correctPassword = roomDoc.data().password || CREATOR_PASSWORD;
        if (password !== correctPassword) { changeAvatarStatus.textContent = 'رمز فعلی اشتباه است.'; changeAvatarStatus.classList.add('text-red-600'); return; }
        const avatarUrl = await compressImage(file, AVATAR_MAX_DIMENSION);
        await updateDoc(roomRef, { avatarUrl });
        changeAvatarStatus.textContent = 'عکس با موفقیت تغییر کرد.'; changeAvatarStatus.classList.add('text-green-600');
        chatRoomAvatar.innerHTML = generateAvatar(roomDoc.data().name, avatarUrl);
        setTimeout(() => showView('chat-settings-modal'), 1500);
    } catch (error) { console.error("Error changing avatar:", error); changeAvatarStatus.textContent = error.message; changeAvatarStatus.classList.add('text-red-600'); }
});
roomAvatarInput.addEventListener('change', async e => { const file = e.target.files[0]; if(file) roomAvatarPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover"/>`; });

changeBackgroundForm.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentRoomId) return;
    const file = backgroundInput.files[0]; const password = currentPasswordForBackgroundInput.value;
    if (!file) { alert("لطفا یک عکس انتخاب کنید."); return; }
    changeBackgroundStatus.textContent = 'در حال بررسی...'; changeBackgroundStatus.classList.remove('text-red-600', 'text-green-600');
    try {
        const roomRef = doc(db, 'rooms', currentRoomId); const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
        const correctPassword = roomDoc.data().password || CREATOR_PASSWORD;
        if (password !== correctPassword) { changeBackgroundStatus.textContent = 'رمز فعلی اشتباه است.'; changeBackgroundStatus.classList.add('text-red-600'); return; }
        const backgroundUrl = await compressImage(file, IMAGE_MAX_DIMENSION);
        await updateDoc(roomRef, { backgroundUrl });
        changeBackgroundStatus.textContent = 'پس‌زمینه با موفقیت تغییر کرد.'; changeBackgroundStatus.classList.add('text-green-600');
        chatBackground.style.backgroundImage = `url(${backgroundUrl})`;
        setTimeout(() => showView('chat-settings-modal'), 1500);
    } catch (error) { console.error("Error changing background:", error); changeBackgroundStatus.textContent = error.message; changeBackgroundStatus.classList.add('text-red-600'); }
});
backgroundInput.addEventListener('change', async e => { const file = e.target.files[0]; if(file) { backgroundPreview.style.backgroundImage = `url(${URL.createObjectURL(file)})`; backgroundPreviewText.classList.add('hidden'); }});

changeRoomNameForm.addEventListener('submit', async (e) => {
  e.preventDefault(); if (!currentRoomId) return;
  const newName = newRoomNameInputForChange.value.trim(); const currentPassword = currentPasswordForNameInput.value;
  if (!newName) return;
  changeNameStatus.textContent = 'در حال بررسی...'; changeNameStatus.classList.remove('text-red-600', 'text-green-600');
  try {
    const roomRef = doc(db, 'rooms', currentRoomId); const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
    const correctPassword = roomDoc.data().password || CREATOR_PASSWORD;
    if (currentPassword !== correctPassword) { changeNameStatus.textContent = 'رمز فعلی اشتباه است.'; changeNameStatus.classList.add('text-red-600'); return; }
    await updateDoc(roomRef, { name: newName });
    changeNameStatus.textContent = 'نام با موفقیت تغییر کرد.'; changeNameStatus.classList.add('text-green-600');
    chatRoomName.textContent = newName;
    setTimeout(() => showView('chat-settings-modal'), 1500);
  } catch (error) { console.error("Error changing room name:", error); changeNameStatus.textContent = error.message; changeNameStatus.classList.add('text-red-600'); }
});

setRoomPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault(); if (!currentRoomId) return;
  const newPassword = newPasswordInput.value; const currentPassword = currentPasswordForPassInput.value;
  setPasswordStatus.textContent = 'در حال بررسی...'; setPasswordStatus.classList.remove('text-red-600', 'text-green-600');
  try {
    const roomRef = doc(db, 'rooms', currentRoomId); const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
    const correctPassword = roomDoc.data().password || CREATOR_PASSWORD;
    if (currentPassword !== correctPassword) { setPasswordStatus.textContent = 'رمز فعلی اشتباه است.'; setPasswordStatus.classList.add('text-red-600'); return; }
    await updateDoc(roomRef, { password: newPassword || null });
    if(newPassword) { localStorage.setItem(`room_access_${currentRoomId}`, 'true'); } // Grant access if setting a new password
    else { localStorage.removeItem(`room_access_${currentRoomId}`); } // Remove access if password is removed
    setPasswordStatus.textContent = 'رمز با موفقیت ذخیره شد.'; setPasswordStatus.classList.add('text-green-600');
    setTimeout(() => showView('chat-settings-modal'), 1500);
  } catch (error) { console.error("Error setting password:", error); setPasswordStatus.textContent = error.message; setPasswordStatus.classList.add('text-red-600'); }
});

deleteChatForm.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentRoomId) return;
    const password = passwordForDeleteInput.value;
    deleteChatStatus.textContent = 'در حال بررسی...'; deleteChatStatus.classList.remove('text-red-600', 'text-green-600');
    try {
        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
        const correctPassword = roomDoc.data().password || CREATOR_PASSWORD;
        if (password !== correctPassword) {
            deleteChatStatus.textContent = 'رمز فعلی اشتباه است.';
            deleteChatStatus.classList.add('text-red-600');
            return;
        }

        // Delete all messages in the room
        deleteChatStatus.textContent = 'در حال حذف پیام‌ها...';
        const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
        const messagesSnapshot = await getDocs(messagesCol);
        const batch = writeBatch(db);
        messagesSnapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();

        // Delete the room itself
        deleteChatStatus.textContent = 'در حال حذف اتاق...';
        await deleteDoc(roomRef);
        
        deleteChatStatus.textContent = 'اتاق با موفقیت حذف شد.';
        deleteChatStatus.classList.add('text-green-600');
        
        setTimeout(() => {
            // Unsubscribe and go back to lobby
            if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
            currentRoomId = null;
            showView('lobby-container');
        }, 1500);

    } catch (error) {
        console.error("Error deleting chat:", error);
        deleteChatStatus.textContent = error.message;
        deleteChatStatus.classList.add('text-red-600');
    }
});


// --- App Start ---
const startApp = () => {
    // Load user settings from localStorage
    currentUsername = localStorage.getItem(USERNAME_KEY);
    currentUserAvatar = localStorage.getItem(USER_AVATAR_KEY);
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'md';
    const savedGlassMode = localStorage.getItem(GLASS_MODE_KEY) || 'off';
    applyFontSize(savedFontSize);
    applyGlassModeSelection(savedGlassMode);

    const hasAccess = localStorage.getItem(APP_ACCESS_KEY);

    if (currentUsername && hasAccess) {
        listenForRooms();
        showView('lobby-container');
    } else {
        showView('username-modal');
        usernameInput.focus();
    }
};

startApp();