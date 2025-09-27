// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc,
  limit, getDocs, startAfter, writeBatch
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
const BACKGROUND_MODE_KEY = 'chat_background_mode_v3'; // version up
const STATIC_BACKGROUND_KEY = 'chat_background_static_v1';
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
let currentFontSize = 'md';
let currentGlassMode = 'off';
let currentBackgroundMode = '1'; // New default
let currentStaticBackground = null;

// --- State for Settings Modal ---
let tempStaticBackground = null;
let initialSettingsState = {};

// Pagination state
let oldestMessageDoc = null;
let isLoadingOlderMessages = false;
let reachedEndOfMessages = false;

// --- DOM Elements ---
const appBackground = document.getElementById('app-background');
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
const backgroundModeOptions = document.getElementById('background-mode-options');
const staticBackgroundUploader = document.getElementById('static-background-uploader');
const backgroundImageInput = document.getElementById('background-image-input');
const settingsOkBtn = document.getElementById('settings-ok-btn');
const settingsCancelBtn = document.getElementById('settings-cancel-btn');
const chatContainer = document.getElementById('chat-container');
const chatBackground = document.getElementById('chat-background');
const chatRoomName = document.getElementById('chat-room-name');
const chatRoomAvatar = document.getElementById('chat-room-avatar');
const chatHeaderInfo = document.getElementById('chat-header-info');
const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
const chatSettingsBtn = document.getElementById('chat-settings-btn');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const sendButton = document.getElementById('send-button');
const loadingSpinner = document.getElementById('loading-spinner');
const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
const chatSettingsModal = document.getElementById('chat-settings-modal');
const cancelChatSettings = document.getElementById('cancel-chat-settings');
const openDeleteChatModalBtn = document.getElementById('open-delete-chat-modal-btn');
const deleteChatModal = document.getElementById('delete-chat-modal');
const deleteChatForm = document.getElementById('delete-chat-form');
const passwordForDeleteInput = document.getElementById('password-for-delete');
const deleteChatStatus = document.getElementById('delete-chat-status');
const viewAvatarModal = document.getElementById('view-avatar-modal');
const viewAvatarDisplay = document.getElementById('view-avatar-display');
const viewAvatarName = document.getElementById('view-avatar-name');
const closeViewAvatarModalBtn = document.getElementById('close-view-avatar-modal');
const changeUserAvatarInChatModal = document.getElementById('change-user-avatar-in-chat-modal');
const changeUserAvatarInChatForm = document.getElementById('change-user-avatar-in-chat-form');
const userAvatarInChatPreview = document.getElementById('user-avatar-in-chat-preview');
const userAvatarInChatInput = document.getElementById('user-avatar-in-chat-input');
const changeUserAvatarInChatStatus = document.getElementById('change-user-avatar-in-chat-status');
const sendSound = document.getElementById('send-sound');

// New Consolidated Room Info Modal Elements
const roomInfoModal = document.getElementById('room-info-modal');
const roomInfoForm = document.getElementById('room-info-form');
const roomInfoAvatarPreview = document.getElementById('room-info-avatar-preview');
const roomInfoAvatarInput = document.getElementById('room-info-avatar-input');
const roomInfoBackgroundPreview = document.getElementById('room-info-background-preview');
const roomInfoBackgroundPreviewText = document.getElementById('room-info-background-preview-text');
const roomInfoBackgroundInput = document.getElementById('room-info-background-input');
const roomInfoNameInput = document.getElementById('room-info-name-input');
const roomInfoNewPasswordInput = document.getElementById('room-info-new-password-input');
const roomInfoCurrentPasswordInput = document.getElementById('room-info-current-password-input');
const roomInfoStatus = document.getElementById('room-info-status');


// --- View Management ---
const showView = (viewId) => {
  [
    lobbyContainer, chatContainer, usernameModal, createRoomModal, passwordModal, settingsModal,
    chatSettingsModal, deleteChatModal, viewAvatarModal, changeUserAvatarInChatModal, roomInfoModal
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

const formatDateSeparator = (date) => {
    const gregorian = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(date);
    const shamsi = new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric' }).format(date);
    return `${gregorian}<br>${shamsi}`;
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
    if (url && url !== 'null' && url !== 'undefined') {
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

const applyBackgroundModeSelection = (mode) => {
    backgroundModeOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('glass-button-blue', btn.dataset.mode === mode);
        btn.classList.toggle('text-white', btn.dataset.mode === mode);
        btn.classList.toggle('glass-button-gray', btn.dataset.mode !== mode);
    });
    staticBackgroundUploader.classList.toggle('hidden', mode !== 'static');
};


const applyBackgroundSettings = (mode, staticBgData) => {
    // Reset all background states
    appBackground.style.backgroundImage = '';
    appBackground.style.backgroundColor = 'transparent';
    appBackground.className = 'fixed inset-0 -z-10 h-full w-full bg-sky-100 overflow-hidden'; // Reset classes

    switch (mode) {
        case 'static':
            if (staticBgData) {
                appBackground.style.backgroundImage = `url(${staticBgData})`;
                appBackground.style.backgroundSize = 'cover';
                appBackground.style.backgroundPosition = 'center';
            } else {
                appBackground.style.backgroundColor = '#f0f9ff'; // Fallback solid color
            }
            break;
        case '1': // Glowing Dots
        case '2': // Fluid Gradient
            appBackground.classList.add(`bg-mode-${mode}`);
            break;
        default: // Fallback to mode 1
            appBackground.classList.add('bg-mode-1');
            break;
    }
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

backgroundModeOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.bg-mode-btn');
    if (btn) {
        const mode = btn.dataset.mode;
        applyBackgroundModeSelection(mode);
        // Apply live preview
        const bgData = (mode === 'static') ? (tempStaticBackground || currentStaticBackground) : null;
        applyBackgroundSettings(mode, bgData);
    }
});

backgroundImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        tempStaticBackground = await compressImage(file, IMAGE_MAX_DIMENSION);
        // Apply live preview of the new image
        applyBackgroundSettings('static', tempStaticBackground);
        alert('عکس برای پس‌زمینه آماده شد. برای ذخیره، دکمه OK را بزنید.');
    } catch (error) {
        console.error("Error compressing background image:", error);
        alert("خطا در پردازش تصویر پس‌زمینه.");
    }
});


settingsBtn.addEventListener('click', () => {
    // Store initial state to revert on cancel
    initialSettingsState = {
        mode: currentBackgroundMode,
        staticBg: currentStaticBackground
    };
    
    changeUsernameInput.value = currentUsername;
    userAvatarPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    applyFontSize(currentFontSize);
    applyGlassModeSelection(currentGlassMode);
    applyBackgroundModeSelection(currentBackgroundMode);
    
    // Reset temp background state for the new session
    tempStaticBackground = null;
    backgroundImageInput.value = '';

    showView('settings-modal');
});

settingsCancelBtn.addEventListener('click', () => {
    // Revert to initial settings from when the modal was opened
    applyBackgroundSettings(initialSettingsState.mode, initialSettingsState.staticBg);
    showView('lobby-container');
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
        localStorage.setItem(USERNAME_KEY, newUsername);
    }
    
    localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar || '');
    localStorage.setItem(FONT_SIZE_KEY, currentFontSize);
    localStorage.setItem(GLASS_MODE_KEY, currentGlassMode);
    
    // Finalize and save background settings
    const selectedBtn = backgroundModeOptions.querySelector('.bg-mode-btn.glass-button-blue');
    const selectedMode = selectedBtn ? selectedBtn.dataset.mode : '1';
    
    currentBackgroundMode = selectedMode;
    localStorage.setItem(BACKGROUND_MODE_KEY, selectedMode);
    
    if (selectedMode === 'static' && tempStaticBackground) {
        currentStaticBackground = tempStaticBackground;
        localStorage.setItem(STATIC_BACKGROUND_KEY, currentStaticBackground);
    } else if (selectedMode !== 'static') {
        // If user switches away from static, we can clear the old static bg if we want
        // For now, we'll keep it in case they switch back.
    }
    
    // The background is already showing the preview, so no need to call applyBackgroundSettings again.
    // Just ensure the final state is correct.
    const finalBgData = (currentBackgroundMode === 'static') ? (tempStaticBackground || currentStaticBackground) : null;
    applyBackgroundSettings(currentBackgroundMode, finalBgData);
    
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
  onSnapshot(q, (snapshot) => {
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
  
  // Set default background unless a custom one exists
  if (roomData.backgroundUrl) {
    chatBackground.style.backgroundImage = `url(${roomData.backgroundUrl})`;
  } else {
    chatBackground.style.backgroundImage = '';
  }

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
      'low': { user: 'bg-green-500/70', other: 'bg-white/70' },
      'high': { user: 'bg-green-500/40', other: 'bg-white/40' }
  };
  const selectedModeClasses = glassModeClasses[currentGlassMode] || glassModeClasses['off'];

  let lastDateStrInBatch = null;

  if (prepend) {
      const firstOldMessageOnScreenEl = messagesList.querySelector('li[data-timestamp]');
      if (firstOldMessageOnScreenEl) {
          const lastNewMessage = messages[messages.length - 1];
          const firstOldMessageDateStr = new Date(parseInt(firstOldMessageOnScreenEl.dataset.timestamp)).toDateString();
          if (lastNewMessage && lastNewMessage.timestamp?.toDateString() === firstOldMessageDateStr) {
              const separator = firstOldMessageOnScreenEl.previousElementSibling;
              if (separator && separator.classList.contains('date-separator')) {
                  separator.remove();
              }
          }
      }
  } else {
      const allVisibleMsgs = messagesList.querySelectorAll('li[data-timestamp]');
      if (allVisibleMsgs.length > 0) {
          const lastVisibleMsg = allVisibleMsgs[allVisibleMsgs.length - 1];
          lastDateStrInBatch = new Date(parseInt(lastVisibleMsg.dataset.timestamp)).toDateString();
      }
  }

  messages.forEach(message => {
      if (!message.timestamp) return;
      const messageDateStr = message.timestamp.toDateString();

      if (messageDateStr !== lastDateStrInBatch) {
          const li = document.createElement('li');
          li.className = 'date-separator text-center my-3';
          li.innerHTML = `<span class="inline-block bg-gray-400/30 backdrop-blur-sm text-gray-700 text-xs font-semibold rounded-full px-3 py-1 text-center whitespace-nowrap">${formatDateSeparator(message.timestamp)}</span>`;
          fragment.appendChild(li);
          lastDateStrInBatch = messageDateStr;
      }

      const isUser = message.authorId === currentUserId;
      const li = document.createElement('li');
      li.dataset.authorId = message.authorId;
      li.dataset.timestamp = message.timestamp.getTime();
      
      let bubbleClasses, bubbleTailClass, nameAlignmentClass, timeAlignmentClass, nameColorClass, timeColorClass, liClasses;
      
      const senderName = (message.authorName || 'کاربر').replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const avatarHTML = generateAvatar(message.authorName, message.authorAvatar);
      const avatarContainer = `<div class="message-avatar w-10 h-10 flex-shrink-0 rounded-full overflow-hidden self-end bg-white/30 backdrop-blur-sm cursor-pointer" data-author-id="${message.authorId}" data-author-name="${senderName}" data-author-avatar-url="${message.authorAvatar || ''}">${avatarHTML}</div>`;

      let messageContentHTML = '';
      const timeHTML = `<span class="text-xs" dir="ltr">${formatTime(message.timestamp)}</span>`;

      if (isUser) { // User's messages on the RIGHT
          liClasses = 'justify-start'; // Aligns to the right in RTL
          bubbleClasses = `${selectedModeClasses.user} text-white`;
          bubbleTailClass = 'rounded-br-none'; // Tail points to avatar on the right
          nameAlignmentClass = 'text-right';
          timeAlignmentClass = 'left-2.5';
          nameColorClass = 'text-gray-200/90';
          timeColorClass = 'text-gray-200/90';
      } else { // Others' messages on the LEFT
          liClasses = 'justify-end'; // Aligns to the left in RTL
          bubbleClasses = `${selectedModeClasses.other} text-black shadow`;
          bubbleTailClass = 'rounded-bl-none'; // Tail points to avatar on the left
          nameAlignmentClass = 'text-left';
          timeAlignmentClass = 'right-2.5';
          nameColorClass = 'text-gray-500 opacity-70';
          timeColorClass = 'text-gray-500 opacity-70';
      }
      
      li.className = `flex items-start space-x-3 rtl:space-x-reverse mb-2 ${liClasses}`;
      const nameHTML = `<div class="text-xs ${nameColorClass} mb-1 ${nameAlignmentClass}">${senderName}</div>`;

      switch (message.type) {
        case 'image':
          messageContentHTML = `<div class="relative rounded-lg overflow-hidden"><img src="${message.fileDataUrl}" class="max-w-full h-auto" style="max-height: 300px; min-width: 150px;" alt="${message.fileName || 'Image'}"/><div class="absolute bottom-1 right-2 text-xs text-white bg-black/30 rounded px-1 flex items-center gap-1" dir="ltr">${formatTime(message.timestamp)}</div></div>`;
          break;
        case 'file':
          const fileName = (message.fileName || 'فایل').replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const fileMetaHTML = `<div class="absolute bottom-1.5 ${timeAlignmentClass} flex items-center gap-1 text-gray-700">${timeHTML}</div>`;
          messageContentHTML = `<a href="${message.fileDataUrl}" download="${fileName}" class="relative flex items-center space-x-2 rtl:space-x-reverse bg-gray-100/30 backdrop-blur-sm p-3 rounded-lg hover:bg-gray-100/50 min-w-[180px]"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 flex-shrink-0 text-gray-600"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg><span class="font-medium text-sm text-gray-800 break-all">${fileName}</span>${fileMetaHTML}</a>`;
          break;
        default: // text
          const textContent = (message.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const metaHTML = `<div class="absolute bottom-1.5 ${timeAlignmentClass} flex items-center gap-1 ${timeColorClass}">${timeHTML}</div>`;
          messageContentHTML = `
            <div class="px-3 py-2 rounded-2xl ${bubbleClasses} ${bubbleTailClass} relative backdrop-blur-md">
              ${nameHTML}
              <p class="whitespace-pre-wrap pb-4 break-words message-text">${textContent}</p>
              ${metaHTML}
            </div>`;
      }
      
      const bubbleContainer = `<div class="flex flex-col max-w-xs lg:max-w-md">${messageContentHTML}</div>`;

      if (isUser) { // User's message on right. DOM: avatar, then bubble.
          li.innerHTML = avatarContainer + bubbleContainer;
      } else { // Other's message on left. DOM: bubble, then avatar.
          li.innerHTML = bubbleContainer + avatarContainer;
      }
      fragment.appendChild(li);
  });

  if (prepend) { messagesList.prepend(fragment); } else { messagesList.appendChild(fragment); }
  if (isInitialLoad || !prepend) { setTimeout(() => scrollToBottom(), 50); }
};

// --- Avatar Click Logic ---
const showUserAvatar = (name, url) => {
    viewAvatarName.textContent = name || 'کاربر';
    viewAvatarDisplay.innerHTML = generateAvatar(name, url);
    showView('view-avatar-modal');
};

messagesList.addEventListener('click', (e) => {
    const avatarEl = e.target.closest('.message-avatar');
    if (!avatarEl) return;
    
    const authorId = avatarEl.dataset.authorId;
    const authorName = avatarEl.dataset.authorName;
    const authorAvatarUrl = avatarEl.dataset.authorAvatarUrl;

    if (authorId === currentUserId) {
        changeUserAvatarInChatForm.reset();
        userAvatarInChatPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
        changeUserAvatarInChatStatus.textContent = '';
        showView('change-user-avatar-in-chat-modal');
    } else {
        showUserAvatar(authorName, authorAvatarUrl);
    }
});

closeViewAvatarModalBtn.addEventListener('click', () => showView('chat-container'));
document.querySelector('#change-user-avatar-in-chat-modal .cancel-btn').addEventListener('click', () => showView('chat-container'));

userAvatarInChatInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        userAvatarInChatPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover"/>`;
    }
});

changeUserAvatarInChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = userAvatarInChatInput.files[0];
    if (!file) { alert("لطفا یک عکس انتخاب کنید."); return; }
    
    changeUserAvatarInChatStatus.textContent = 'در حال ذخیره...';
    changeUserAvatarInChatStatus.classList.remove('text-red-600', 'text-green-600');
    try {
        const compressedAvatar = await compressImage(file, AVATAR_MAX_DIMENSION);
        currentUserAvatar = compressedAvatar;
        localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar || '');
        
        // Update all visible avatars for the current user
        document.querySelectorAll(`.message-avatar[data-author-id="${currentUserId}"]`).forEach(el => {
            el.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
        });

        changeUserAvatarInChatStatus.textContent = 'عکس با موفقیت ذخیره شد.';
        changeUserAvatarInChatStatus.classList.add('text-green-600');
        setTimeout(() => showView('chat-container'), 1500);

    } catch(error) {
        console.error("Error changing user avatar in chat:", error);
        changeUserAvatarInChatStatus.textContent = 'خطا در ذخیره عکس.';
        changeUserAvatarInChatStatus.classList.add('text-red-600');
    }
});


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
    
    const tempId = `temp_${Date.now()}`;
    if (isImage) {
        const previewUrl = URL.createObjectURL(file);
        const tempLi = document.createElement('li');
        tempLi.id = tempId;
        tempLi.className = 'flex items-start space-x-3 rtl:space-x-reverse mb-2 justify-start opacity-50'; // Changed to justify-start
        tempLi.innerHTML = `
            <div class="message-avatar w-10 h-10 flex-shrink-0 rounded-full overflow-hidden self-end bg-white/30 backdrop-blur-sm">${generateAvatar(currentUsername, currentUserAvatar)}</div>
            <div class="flex flex-col max-w-xs lg:max-w-md">
                <div class="relative rounded-lg overflow-hidden">
                    <img src="${previewUrl}" class="max-w-full h-auto" style="max-height: 300px;" />
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg class="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                </div>
            </div>
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

const updateSendButtonState = () => {
    const hasText = messageInput.value.trim().length > 0; 
    sendButton.disabled = !hasText;
};

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault(); 
  const text = messageInput.value.trim();
  if (!text || !currentRoomId) return;

  const tempInput = messageInput.value; 
  messageInput.value = ''; 
  updateSendButtonState();
  messageInput.focus();

  try {
    const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
    await addDoc(messagesCol, { type: 'text', text, authorId: currentUserId, authorName: currentUsername, authorAvatar: currentUserAvatar, timestamp: serverTimestamp() });
    sendSound.play().catch(err => console.error("Audio play failed:", err));
  } catch (error) { 
      console.error("Error sending message:", error); 
      messageInput.value = tempInput;
      updateSendButtonState();
  }
});

messageInput.addEventListener('input', updateSendButtonState);

// --- Chat Settings Listeners ---
chatSettingsBtn.addEventListener('click', () => showView('chat-settings-modal'));
cancelChatSettings.addEventListener('click', () => showView('chat-container'));

openDeleteChatModalBtn.addEventListener('click', () => { 
    deleteChatForm.reset(); 
    deleteChatStatus.textContent = ''; 
    showView('delete-chat-modal'); 
});

// New listener for consolidated Room Info Modal
chatHeaderInfo.addEventListener('click', async () => {
    if (!currentRoomId) return;
    roomInfoForm.reset();
    roomInfoStatus.textContent = '';
    roomInfoStatus.className = 'text-sm mt-2 text-center h-4';
    
    try {
        const roomDoc = await getDoc(doc(db, 'rooms', currentRoomId));
        if (!roomDoc.exists()) {
            alert('اطلاعات گفتگو یافت نشد.');
            return;
        }
        const roomData = roomDoc.data();
        
        // Populate form
        roomInfoNameInput.value = roomData.name || '';
        roomInfoAvatarPreview.innerHTML = generateAvatar(roomData.name, roomData.avatarUrl);
        roomInfoBackgroundPreview.style.backgroundImage = roomData.backgroundUrl ? `url(${roomData.backgroundUrl})` : '';
        roomInfoBackgroundPreviewText.classList.toggle('hidden', !!roomData.backgroundUrl);
        roomInfoNewPasswordInput.placeholder = roomData.password ? "رمز جدید (خالی برای حذف)" : "رمز جدید (اختیاری)";
        
        showView('room-info-modal');
    } catch (error) {
        console.error("Error fetching room details:", error);
        alert('خطا در دریافت اطلاعات گفتگو.');
    }
});

roomInfoAvatarInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        roomInfoAvatarPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover"/>`;
    }
});
roomInfoBackgroundInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        roomInfoBackgroundPreview.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
        roomInfoBackgroundPreviewText.classList.add('hidden');
    }
});

roomInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentRoomId) return;

    const newName = roomInfoNameInput.value.trim();
    const newPasswordText = roomInfoNewPasswordInput.value; // Don't trim, could be spaces
    const currentPassword = roomInfoCurrentPasswordInput.value;
    const avatarFile = roomInfoAvatarInput.files[0];
    const backgroundFile = roomInfoBackgroundInput.files[0];
    
    if (!currentPassword) {
        alert('لطفا برای اعمال تغییرات، رمز فعلی را وارد کنید.');
        return;
    }

    roomInfoStatus.textContent = 'در حال بررسی...';
    roomInfoStatus.className = 'text-sm mt-2 text-center h-4 text-gray-700';

    try {
        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");

        const correctPassword = roomDoc.data().password || CREATOR_PASSWORD;
        if (currentPassword !== correctPassword) {
            roomInfoStatus.textContent = 'رمز فعلی اشتباه است.';
            roomInfoStatus.classList.add('text-red-600');
            return;
        }

        const updateData = {};
        let uiNeedsUpdate = false;

        if (newName && newName !== roomDoc.data().name) {
            updateData.name = newName;
            uiNeedsUpdate = true;
        }
        // Check if password field was touched. An empty string means remove password.
        if (roomInfoNewPasswordInput.value !== '') {
            updateData.password = newPasswordText || null;
            uiNeedsUpdate = true;
        }
        if (avatarFile) {
            updateData.avatarUrl = await compressImage(avatarFile, AVATAR_MAX_DIMENSION);
            uiNeedsUpdate = true;
        }
        if (backgroundFile) {
            updateData.backgroundUrl = await compressImage(backgroundFile, IMAGE_MAX_DIMENSION);
            uiNeedsUpdate = true;
        }

        if (Object.keys(updateData).length > 0) {
            await updateDoc(roomRef, updateData);
            
            if (updateData.name) chatRoomName.textContent = updateData.name;
            if (updateData.avatarUrl) chatRoomAvatar.innerHTML = generateAvatar(updateData.name || roomDoc.data().name, updateData.avatarUrl);
            if (updateData.backgroundUrl) {
                chatBackground.style.backgroundImage = `url(${updateData.backgroundUrl})`;
            }
            if (updateData.password !== undefined) {
                localStorage.removeItem(`room_access_${currentRoomId}`);
            }
        }
        
        roomInfoStatus.textContent = 'تغییرات با موفقیت ذخیره شد.';
        roomInfoStatus.classList.add('text-green-600');
        setTimeout(() => showView('chat-container'), 1500);

    } catch (error) {
        console.error("Error updating room info:", error);
        roomInfoStatus.textContent = error.message || 'خطا در ذخیره تغییرات.';
        roomInfoStatus.classList.add('text-red-600');
    }
});


document.querySelectorAll('.cancel-btn').forEach(btn => {
    const parentModal = btn.closest('.fixed');
    if (parentModal && (parentModal.id === 'room-info-modal' || parentModal.id === 'delete-chat-modal')) {
        btn.addEventListener('click', () => showView('chat-container'));
    } else if (parentModal && parentModal.id !== 'change-user-avatar-in-chat-modal') {
        btn.addEventListener('click', () => showView('chat-settings-modal'));
    }
});

deleteChatForm.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentRoomId) return;
    const password = passwordForDeleteInput.value;
    deleteChatStatus.textContent = 'در حال بررسی رمز...'; deleteChatStatus.classList.remove('text-red-600', 'text-green-600');
    try {
        const roomRef = doc(db, 'rooms', currentRoomId); const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
        const correctPassword = roomDoc.data().password || CREATOR_PASSWORD;
        if (password !== correctPassword) { deleteChatStatus.textContent = 'رمز اشتباه است.'; deleteChatStatus.classList.add('text-red-600'); return; }
        deleteChatStatus.textContent = 'در حال حذف پیام‌ها...'; deleteChatStatus.classList.add('text-yellow-600');
        const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
        const snapshot = await getDocs(query(messagesCol));
        for (let i = 0; i < snapshot.docs.length; i += 500) { const batch = writeBatch(db); const chunk = snapshot.docs.slice(i, i + 500); chunk.forEach(doc => batch.delete(doc.ref)); await batch.commit(); }
        deleteChatStatus.textContent = 'تمام پیام‌ها حذف شدند.'; deleteChatStatus.classList.remove('text-yellow-600'); deleteChatStatus.classList.add('text-green-600');
        messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">تمام پیام‌ها حذف شدند.</li>';
        setTimeout(() => { showView('chat-container'); }, 1500);
    } catch (error) { console.error("Error deleting chat:", error); deleteChatStatus.textContent = error.message || 'خطا در حذف گفتگو.'; deleteChatStatus.classList.add('text-red-600'); }
});

// --- App Entry Point ---
const startApp = () => {
  currentUsername = localStorage.getItem(USERNAME_KEY);
  currentUserAvatar = localStorage.getItem(USER_AVATAR_KEY);
  const storedFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'md';
  const storedGlassMode = localStorage.getItem(GLASS_MODE_KEY) || 'off';
  currentBackgroundMode = localStorage.getItem(BACKGROUND_MODE_KEY) || '1'; // Default to 1
  currentStaticBackground = localStorage.getItem(STATIC_BACKGROUND_KEY);

  applyFontSize(storedFontSize);
  applyGlassModeSelection(storedGlassMode);
  applyBackgroundSettings(currentBackgroundMode, currentStaticBackground);

  const appAccessGranted = localStorage.getItem(APP_ACCESS_KEY);

  if (appAccessGranted && currentUsername) {
    showView('lobby-container');
    listenForRooms();
    updateSendButtonState();
  } else {
    showView('username-modal');
    usernameInput.focus();
  }
};

startApp();