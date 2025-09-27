// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc,
  limit, getDocs, startAfter, writeBatch, setDoc, deleteDoc
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
const SEND_WITH_ENTER_KEY = 'chat_send_with_enter_v1';
const STATIC_BACKGROUND_KEY = 'chat_background_static_v1'; // Used for local caching
const CREATOR_PASSWORD = '2025';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for non-image files
const IMAGE_MAX_DIMENSION = 1280; // max width/height for compressed images
const AVATAR_MAX_DIMENSION = 200; // max width/height for avatars
const MESSAGES_PER_PAGE = 15;
const DEFAULT_BACKGROUND_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXdzY3RybAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWhhbmQAAAAAAAAAAAAAAAACaWgAAwAAAAYAAAByAAAAAmZoAAEAAAAMAAAAcgAAAAJpcwAAAAQAAAA0AABoY3BydAAAAUgAAABkY2hhZAAAAZAAAAsUdGV4dAAAAAABY29weXJpZ2h0IChjKSAyMDAwLCAgU0FNU1VOQyBFTEVDVFJPTklDUywgQ08uLCBMVEQuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuCgAAWFlaIAAAAAAAAPNRAAEAAAABFsxYWVogAAAAAAAAAAAAAAAAAAAAAGN1cnYAAAAAAAAAAQIzAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/ABEIBMADEAMBEQACEQEDEQH/xAC3AAEAAwEBAQEBAQAAAAAAAAADBAUGAgEABwgBAQADAQEBAQAAAAAAAAAAAAABAgMEBQYH/9oADAMBAAIBAgIQAAB+vxvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxj-AAAAAAAAAAAAAAAAAAAAAAAAAADUfG5gAAAAAAAAAAAAAAAAAAAAND8bAAAAAAAAAAAAAAD+q33oG1gAAAAAAAAAAAAAAA0M3xAAAAAAAAAAAAAAAAAAABp/nQAAAAAAAAAAAAAAAB1W99AAAAAAAAAAAAAAADxPbAAAAAAAAA5/z4AAAAAPg/H5AAAADlAAAAAAAAD8g+P5H2A5/lUAAAAH0gAAAAAAAADzHn/AB9IfSH0h9HkAAAAAAAAAAAD8g/IOf8/n/I+j5AAAAAAAAAAAAB+f5+T4+v8+f8+QAAAAAAAAAAAAH6PyD8/n8g/I+gAAAAAAAAAAAAA/IPyD8/n/H8g+QAAAAAAAAAAAAH4/kH6fP+D8n0AAAAAAAAAAAAAA/I/x/Afz/g/J9AAAAAAAAAAAAAH6/5P8Aj83yAAAAAAAAAD//Z';
const VIDEO_CALL_ROOM_ID = '_ariana_video_call_room_';
const VIDEO_CALL_ROOM_NAME = 'اتاق تماس تصویری';
const NUM_VIDEO_SLOTS = 4;

// --- Global State ---
let currentRoomId = null;
let currentUsername = '';
let currentUserId = localStorage.getItem(USER_ID_KEY) || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
let currentUserAvatar = null;
let currentFontSize = 'md';
let currentGlassMode = 'off';
let currentSendWithEnter = 'on';
let currentStaticBackground = null;
let messagesUnsubscribe = null;
let userProfilesCache = {}; // Cache for user profiles { userId: { username, avatarUrl } }

// --- WebRTC State ---
let localStream = null;
let peerConnections = {}; // { remoteUserId: RTCPeerConnection }
let myVideoSlotId = null;
let videoSlotsUnsubscribe = null;
const stunServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };


// Ensure user ID is persisted
if (!localStorage.getItem(USER_ID_KEY)) {
  localStorage.setItem(USER_ID_KEY, currentUserId);
}

// --- State for Settings Modal ---
let tempStaticBackground = null;
let initialSettingsState = {};
let fileToUpload = null;

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
const sendWithEnterOptions = document.getElementById('send-with-enter-options');
const staticBackgroundUploader = document.getElementById('static-background-uploader');
const backgroundImageInput = document.getElementById('background-image-input');
const backgroundUploadStatus = document.getElementById('background-upload-status');
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
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const sendButton = document.getElementById('send-button');
const loadingSpinner = document.getElementById('loading-spinner');
const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
const chatSettingsModal = document.getElementById('chat-settings-modal');
const cancelChatSettings = document.getElementById('cancel-chat-settings');
const openDeleteChatModalBtn = document.getElementById('open-delete-chat-modal-btn');
const changePasswordForm = document.getElementById('change-password-form');
const newPasswordInput2 = document.getElementById('room-info-new-password-input-2');
const currentPasswordInput2 = document.getElementById('room-info-current-password-input-2');
const changePasswordStatus = document.getElementById('change-password-status');
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
const fileConfirmModal = document.getElementById('file-confirm-modal');
const filePreviewContainer = document.getElementById('file-preview-container');
const fileConfirmStatus = document.getElementById('file-confirm-status');
const cancelFileUploadBtn = document.getElementById('cancel-file-upload');
const confirmFileUploadBtn = document.getElementById('confirm-file-upload');
const roomInfoModal = document.getElementById('room-info-modal');
const roomInfoForm = document.getElementById('room-info-form');
const roomInfoAvatarPreview = document.getElementById('room-info-avatar-preview');
const roomInfoAvatarInput = document.getElementById('room-info-avatar-input');
const roomInfoBackgroundPreview = document.getElementById('room-info-background-preview');
const roomInfoBackgroundPreviewText = document.getElementById('room-info-background-preview-text');
const roomInfoBackgroundInput = document.getElementById('room-info-background-input');
const roomInfoNameInput = document.getElementById('room-info-name-input');
const roomInfoStatus = document.getElementById('room-info-status');
// Video Call Elements
const videoCallContainer = document.getElementById('video-call-container');
const videoGrid = document.getElementById('video-grid');
const backToLobbyFromVideoBtn = document.getElementById('back-to-lobby-from-video-btn');


// --- View Management ---
const showView = (viewId) => {
  [
    lobbyContainer, chatContainer, usernameModal, createRoomModal, passwordModal, settingsModal,
    chatSettingsModal, deleteChatModal, viewAvatarModal, changeUserAvatarInChatModal, roomInfoModal,
    fileConfirmModal, videoCallContainer
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
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
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

// --- Profile Caching ---
const getUserProfile = async (userId) => {
    if (userProfilesCache[userId]) {
        return userProfilesCache[userId];
    }
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userProfilesCache[userId] = userData; // Cache the result
            return userData;
        }
        const fallback = { username: 'کاربر ناشناس', avatarUrl: null };
        userProfilesCache[userId] = fallback;
        return fallback;
    } catch (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
        return { username: 'کاربر', avatarUrl: null };
    }
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

const applySendWithEnterSelection = (value) => {
    currentSendWithEnter = value;
    sendWithEnterOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('glass-button-blue', btn.dataset.value === value);
        btn.classList.toggle('text-white', btn.dataset.value === value);
        btn.classList.toggle('glass-button-gray', btn.dataset.value !== value);
    });
};

const applyBackgroundSettings = (staticBgData) => {
    // Reset all background states
    appBackground.style.backgroundImage = '';
    appBackground.style.backgroundColor = 'transparent';
    appBackground.className = 'fixed inset-0 -z-10 h-full w-full bg-sky-100 overflow-hidden'; // Reset classes

    if (staticBgData) {
        appBackground.style.backgroundImage = `url(${staticBgData})`;
        appBackground.style.backgroundSize = 'cover';
        appBackground.style.backgroundPosition = 'center';
    } else {
        appBackground.style.backgroundColor = '#f0f9ff'; // Fallback solid color
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

sendWithEnterOptions.addEventListener('click', (e) => {
    if (e.target.matches('.send-with-enter-btn')) {
        applySendWithEnterSelection(e.target.dataset.value);
    }
});

backgroundImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    backgroundUploadStatus.textContent = 'در حال پردازش...';
    backgroundUploadStatus.className = 'text-sm text-center h-4 mt-2 text-gray-600';

    try {
        tempStaticBackground = await compressImage(file, IMAGE_MAX_DIMENSION);
        // Apply live preview of the new image
        applyBackgroundSettings(tempStaticBackground);
        backgroundUploadStatus.textContent = 'عکس آماده شد. برای ذخیره تایید را بزنید.';
        backgroundUploadStatus.classList.add('text-green-600');

    } catch (error) {
        console.error("Error compressing background image:", error);
        backgroundUploadStatus.textContent = 'خطا در پردازش تصویر.';
        backgroundUploadStatus.classList.add('text-red-600');
    }
});

settingsBtn.addEventListener('click', () => {
    // Store initial state to revert on cancel
    initialSettingsState = {
        staticBg: currentStaticBackground
    };
    
    changeUsernameInput.value = currentUsername;
    userAvatarPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    applyFontSize(currentFontSize);
    applyGlassModeSelection(currentGlassMode);
    applySendWithEnterSelection(currentSendWithEnter);
    
    // Reset temp background state for the new session
    tempStaticBackground = null;
    backgroundImageInput.value = '';
    backgroundUploadStatus.textContent = '';


    showView('settings-modal');
});

settingsCancelBtn.addEventListener('click', () => {
    // Revert to initial settings from when the modal was opened
    applyBackgroundSettings(initialSettingsState.staticBg || DEFAULT_BACKGROUND_BASE64);
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

userSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = changeUsernameInput.value.trim();
    
    const userUpdates = {};

    if (newUsername && newUsername !== currentUsername) {
        currentUsername = newUsername;
        localStorage.setItem(USERNAME_KEY, newUsername);
        userUpdates.username = newUsername;
    }
    
    // currentUserAvatar is updated directly on file selection and stored in the global var
    userUpdates.avatarUrl = currentUserAvatar || null;
    localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar || '');

    // Device-specific settings remain in localStorage only
    localStorage.setItem(FONT_SIZE_KEY, currentFontSize);
    localStorage.setItem(GLASS_MODE_KEY, currentGlassMode);
    localStorage.setItem(SEND_WITH_ENTER_KEY, currentSendWithEnter);
    
    // Handle GLOBAL background update
    if (tempStaticBackground) {
        try {
            await setDoc(doc(db, 'app_settings', 'global'), { backgroundUrl: tempStaticBackground }, { merge: true });
        } catch (error) {
            console.error("Error updating global background:", error);
        }
    }
    
    // Sync user-specific settings (username, avatar) with Firebase
    if (Object.keys(userUpdates).length > 0) {
        try {
            await setDoc(doc(db, 'users', currentUserId), userUpdates, { merge: true });
            userProfilesCache[currentUserId] = { username: currentUsername, avatarUrl: currentUserAvatar };
        } catch (error) {
            console.error("Error syncing user settings:", error);
        }
    }
    
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
  
  if (roomId === VIDEO_CALL_ROOM_ID) {
    enterVideoCallRoom();
    return;
  }

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
    chatBackground.style.backgroundSize = 'cover';
    chatBackground.style.backgroundPosition = 'center';
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
    await renderMessages(oldMessages, true);
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

const renderMessages = async (messages, prepend = false, isInitialLoad = false) => {
  if (!prepend && messagesList.innerHTML.includes('هنوز پیامی')) { messagesList.innerHTML = ''; }
  const fragment = document.createDocumentFragment();

  // Pre-fetch all necessary profiles for this batch of messages
  const authorIds = [...new Set(messages.map(m => m.authorId))];
  await Promise.all(authorIds.map(id => getUserProfile(id)));

  const glassModeClasses = {
      'off': { user: 'bg-green-500', other: 'bg-white' },
      'low': { user: 'bg-green-500/70', other: 'bg-white/70' },
      'high': { user: 'bg-green-500/40', other: 'bg-white/40' }
  };
  const selectedModeClasses = glassModeClasses[currentGlassMode] || glassModeClasses['off'];

  let lastDateStrInBatch = null;
  let lastAuthorIdForMargin = null;

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
          const lastMsgAuthorEl = messagesList.querySelector('li[data-author-id]:last-child');
          if (lastMsgAuthorEl) {
            lastAuthorIdForMargin = lastMsgAuthorEl.dataset.authorId;
          }
      }
  }

  for (const message of messages) {
      if (!message.timestamp) continue;
      const messageDateStr = message.timestamp.toDateString();

      if (messageDateStr !== lastDateStrInBatch) {
          const li = document.createElement('li');
          li.className = 'date-separator text-center my-3';
          li.innerHTML = `<span class="inline-block bg-gray-400/30 backdrop-blur-sm text-gray-700 text-xs font-semibold rounded-full px-3 py-1 text-center whitespace-nowrap">${formatDateSeparator(message.timestamp)}</span>`;
          fragment.appendChild(li);
          lastDateStrInBatch = messageDateStr;
          lastAuthorIdForMargin = null; // Reset author on new day
      }

      const isUser = message.authorId === currentUserId;
      const authorProfile = userProfilesCache[message.authorId] || { username: 'کاربر', avatarUrl: null };
      
      const li = document.createElement('li');
      li.dataset.authorId = message.authorId;
      li.dataset.timestamp = message.timestamp.getTime();
      
      let bubbleClasses, bubbleTailClass, nameAlignmentClass, nameColorClass, timeColorClass, liClasses;
      
      const senderName = (authorProfile.username || 'کاربر').replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const authorAvatarForRender = authorProfile.avatarUrl;
      const avatarHTML = generateAvatar(senderName, authorAvatarForRender);
      const avatarContainer = `<div class="message-avatar w-10 h-10 flex-shrink-0 rounded-full overflow-hidden self-end bg-white/30 backdrop-blur-sm cursor-pointer" data-author-id="${message.authorId}" data-author-name="${senderName}" data-author-avatar-url="${authorAvatarForRender || ''}">${avatarHTML}</div>`;

      if (isUser) { // User's messages on the RIGHT
          liClasses = 'justify-start'; // Aligns to the right in RTL
          bubbleClasses = `${selectedModeClasses.user} text-white`;
          bubbleTailClass = 'rounded-br-none'; // Tail points to avatar on the right
          nameAlignmentClass = 'text-right pr-1';
          nameColorClass = 'text-gray-200/90';
          timeColorClass = 'text-gray-200/90';
      } else { // Others' messages on the LEFT
          liClasses = 'justify-end'; // Aligns to the left in RTL
          bubbleClasses = `${selectedModeClasses.other} text-black shadow`;
          bubbleTailClass = 'rounded-bl-none'; // Tail points to avatar on the left
          nameAlignmentClass = 'text-left pl-1';
          nameColorClass = 'text-gray-500 opacity-70';
          timeColorClass = 'text-gray-500 opacity-70';
      }
      
      const isConsecutive = message.authorId === lastAuthorIdForMargin;
      const marginClass = isConsecutive ? 'mb-1' : 'mb-2';
      
      li.className = `flex items-start space-x-3 rtl:space-x-reverse ${marginClass} ${liClasses}`;
      const nameHTML = !isUser ? `<div class="text-xs ${nameColorClass} ${nameAlignmentClass} leading-tight pt-1">${senderName}</div>` : '';

      let messageContentHTML = '';

      switch (message.type) {
        case 'image':
          messageContentHTML = `<div class="relative rounded-lg overflow-hidden"><img src="${message.fileDataUrl}" class="max-w-full h-auto" style="max-height: 300px; min-width: 150px;" alt="${message.fileName || 'Image'}"/><div class="absolute bottom-1 right-2 text-xs text-white bg-black/30 rounded px-1 flex items-center gap-1" dir="ltr">${formatTime(message.timestamp)}</div></div>`;
          break;
        case 'file':
          const fileName = (message.fileName || 'فایل').replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const timeHTML = `<span class="text-xs" dir="ltr">${formatTime(message.timestamp)}</span>`;
          const fileMetaHTML = `<div class="absolute bottom-1.5 ${isUser ? 'left-2.5' : 'right-2.5'} flex items-center gap-1 text-gray-700">${timeHTML}</div>`;
          messageContentHTML = `<a href="${message.fileDataUrl}" download="${fileName}" class="relative flex items-center space-x-2 rtl:space-x-reverse bg-gray-100/30 backdrop-blur-sm p-3 rounded-lg hover:bg-gray-100/50 min-w-[180px]"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 flex-shrink-0 text-gray-600"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg><span class="font-medium text-sm text-gray-800 break-all">${fileName}</span>${fileMetaHTML}</a>`;
          break;
        default: // text
          const textContent = (message.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const timeHTMLSpan = `<span class="text-xs ${timeColorClass} leading-tight" dir="ltr">${formatTime(message.timestamp)}</span>`;
          const timeAlignmentClass = isUser ? 'text-left pl-1.5' : 'text-right pr-1.5';

          messageContentHTML = `
            <div class="px-2 py-0.5 rounded-2xl ${bubbleClasses} ${bubbleTailClass} backdrop-blur-md flex flex-col">
              ${nameHTML}
              <p class="whitespace-pre-wrap break-words break-all message-text self-stretch m-0">${textContent}</p>
              <div class="w-full ${timeAlignmentClass} -mt-1 pb-0.5">${timeHTMLSpan}</div>
            </div>`;
      }
      
      const bubbleContainer = `<div class="flex flex-col max-w-xs lg:max-w-md">${messageContentHTML}</div>`;

      if (isUser) { // User's message on right. DOM: avatar, then bubble.
          li.innerHTML = avatarContainer + bubbleContainer;
      } else { // Other's message on left. DOM: bubble, then avatar.
          li.innerHTML = bubbleContainer + avatarContainer;
      }
      fragment.appendChild(li);
      lastAuthorIdForMargin = message.authorId;
  }
  
  // Handle spacing adjustment for prepended messages
  if (prepend && messages.length > 0) {
    const firstOldMessageOnScreen = messagesList.querySelector('li[data-author-id]');
    if (firstOldMessageOnScreen && firstOldMessageOnScreen.dataset.authorId === lastAuthorIdForMargin) {
        const lastNewTimestamp = messages[messages.length - 1].timestamp;
        const firstOldTimestamp = new Date(parseInt(firstOldMessageOnScreen.dataset.timestamp));
        if (lastNewTimestamp.toDateString() === firstOldTimestamp.toDateString()) {
            firstOldMessageOnScreen.classList.remove('mb-2');
            firstOldMessageOnScreen.classList.add('mb-1');
        }
    }
  }


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
        
        // Sync with Firebase
        await setDoc(doc(db, 'users', currentUserId), { avatarUrl: currentUserAvatar }, { merge: true });
        userProfilesCache[currentUserId] = { ...userProfilesCache[currentUserId], avatarUrl: currentUserAvatar };

        // Update all visible avatars for the current user
        document.querySelectorAll(`.message-avatar[data-author-id="${currentUserId}"]`).forEach(el => {
            el.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
            // also update the data attribute for future clicks within this session
            el.dataset.authorAvatarUrl = currentUserAvatar || '';
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

    fileToUpload = file;
    fileInput.value = ''; // Allow selecting the same file again if cancelled

    filePreviewContainer.innerHTML = ''; // Clear previous preview
    fileConfirmStatus.textContent = 'برای ارسال تایید کنید.';
    fileConfirmStatus.className = 'text-sm text-center h-4 mb-4 text-gray-700';

    if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        filePreviewContainer.innerHTML = `<img src="${previewUrl}" class="max-w-full max-h-full object-contain" alt="Preview"/>`;
    } else {
        filePreviewContainer.innerHTML = `
            <div class="text-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto text-gray-500"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                <p class="font-semibold mt-2 break-all">${file.name}</p>
            </div>
        `;
    }

    showView('file-confirm-modal');
};

const uploadConfirmedFile = async () => {
    if (!fileToUpload || !currentRoomId) return;

    const file = fileToUpload;
    const isImage = file.type.startsWith('image/');
    let fileDataUrl;
    
    fileConfirmStatus.textContent = 'در حال ارسال...';
    
    const tempId = `temp_${Date.now()}`;
    if (isImage) {
        const previewUrl = URL.createObjectURL(file);
        const tempLi = document.createElement('li');
        tempLi.id = tempId;
        tempLi.className = 'flex items-start space-x-3 rtl:space-x-reverse mb-2 justify-start opacity-50';
        tempLi.innerHTML = `
            <div class="message-avatar w-10 h-10 flex-shrink-0 rounded-full overflow-hidden self-end bg-white/30 backdrop-blur-sm">${generateAvatar(currentUsername, currentUserAvatar)}</div>
            <div class="flex flex-col max-w-xs lg:max-w-md">
                <div class="relative rounded-lg overflow-hidden">
                    <img src="${previewUrl}" class="max-w-full h-auto" style="max-height: 300px;" />
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg class="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                </div>
            </div>`;
        messagesList.appendChild(tempLi);
        scrollToBottom('smooth');
    }

    try {
        if (isImage) {
            fileDataUrl = await compressImage(file, IMAGE_MAX_DIMENSION);
        } else {
            if (file.size > MAX_FILE_SIZE) { 
                fileConfirmStatus.textContent = `حجم فایل نباید بیشتر از 5 مگابایت باشد.`;
                fileConfirmStatus.classList.add('text-red-600');
                fileToUpload = null;
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
        await addDoc(messagesCol, { type: isImage ? 'image' : 'file', fileName: file.name, fileDataUrl, authorId: currentUserId, /* Storing for fallback */ authorName: currentUsername, authorAvatar: currentUserAvatar, timestamp: serverTimestamp() });
        showView('chat-container');
        setTimeout(() => scrollToBottom('smooth'), 150); // Ensure scroll after render
    } catch (error) { 
        console.error("Error processing/uploading file:", error); 
        fileConfirmStatus.textContent = 'خطا در ارسال فایل.';
        fileConfirmStatus.classList.add('text-red-600');
    } finally {
        if (isImage) {
            const tempEl = document.getElementById(tempId);
            if(tempEl) tempEl.remove();
        }
        fileToUpload = null;
    }
};

fileInput.addEventListener('change', handleFileSelect);
cancelFileUploadBtn.addEventListener('click', () => {
    fileToUpload = null;
    showView('chat-container');
});
confirmFileUploadBtn.addEventListener('click', uploadConfirmedFile);

// --- Event Listeners & App Flow ---
usernameForm.addEventListener('submit', async (e) => { 
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
        try {
            await setDoc(doc(db, 'users', currentUserId), { username: newUsername }, { merge: true });
        } catch(error) {
            console.error("Error creating user profile in Firestore:", error);
        }
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

const sendMessage = async () => {
    const text = messageInput.value.trim();
    if (!text || !currentRoomId) return;

    const tempInput = messageInput.value;
    messageInput.value = '';
    updateSendButtonState();
    messageInput.focus();

    try {
        const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
        await addDoc(messagesCol, { type: 'text', text, authorId: currentUserId, /* Storing for fallback */ authorName: currentUsername, authorAvatar: currentUserAvatar, timestamp: serverTimestamp() });
        sendSound.play().catch(err => console.error("Audio play failed:", err));
    } catch (error) {
        console.error("Error sending message:", error);
        messageInput.value = tempInput;
        updateSendButtonState();
    }
};

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('input', updateSendButtonState);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && currentSendWithEnter === 'on') {
        e.preventDefault();
        sendMessage();
    }
});

// --- Chat Settings Listeners ---
chatSettingsBtn.addEventListener('click', () => {
    changePasswordForm.reset();
    changePasswordStatus.textContent = '';
    showView('chat-settings-modal');
});
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
        
        roomInfoNameInput.value = roomData.name || '';
        roomInfoAvatarPreview.innerHTML = generateAvatar(roomData.name, roomData.avatarUrl);
        roomInfoBackgroundPreview.style.backgroundImage = roomData.backgroundUrl ? `url(${roomData.backgroundUrl})` : '';
        roomInfoBackgroundPreviewText.classList.toggle('hidden', !!roomData.backgroundUrl);
        
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
    const avatarFile = roomInfoAvatarInput.files[0];
    const backgroundFile = roomInfoBackgroundInput.files[0];

    roomInfoStatus.textContent = 'در حال پردازش...';
    roomInfoStatus.className = 'text-sm mt-2 text-center h-4 text-gray-700';
    
    try {
        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
        const roomData = roomDoc.data();

        const updates = {};
        
        if (newName && newName !== roomData.name) {
            updates.name = newName;
        }
        if (avatarFile) {
            updates.avatarUrl = await compressImage(avatarFile, AVATAR_MAX_DIMENSION);
        }
        if (backgroundFile) {
            updates.backgroundUrl = await compressImage(backgroundFile, IMAGE_MAX_DIMENSION);
        }
        
        if (Object.keys(updates).length > 0) {
            await updateDoc(roomRef, updates);

            if (updates.name) chatRoomName.textContent = updates.name;
            if (updates.avatarUrl) chatRoomAvatar.innerHTML = generateAvatar(updates.name || roomData.name, updates.avatarUrl);
            if (updates.backgroundUrl) {
                chatBackground.style.backgroundImage = `url(${updates.backgroundUrl})`;
                chatBackground.style.backgroundSize = 'cover';
                chatBackground.style.backgroundPosition = 'center';
            }

            roomInfoStatus.textContent = 'تغییرات با موفقیت ذخیره شد.';
            roomInfoStatus.classList.add('text-green-600');
            setTimeout(() => showView('chat-container'), 1500);
        } else {
            roomInfoStatus.textContent = 'تغییری برای ذخیره وجود ندارد.';
            roomInfoStatus.classList.add('text-yellow-600');
            setTimeout(() => showView('chat-container'), 1000);
        }

    } catch (error) {
        console.error("Error updating room info:", error);
        roomInfoStatus.textContent = error.message || 'خطا در ذخیره تغییرات.';
        roomInfoStatus.classList.add('text-red-600');
    }
});


changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentRoomId) return;

    const newPassword = newPasswordInput2.value;
    const currentPassword = currentPasswordInput2.value;

    if (!currentPassword) {
        changePasswordStatus.textContent = 'رمز فعلی برای تایید لازم است.';
        changePasswordStatus.className = 'text-sm mt-2 text-center h-4 text-red-600';
        return;
    }

    changePasswordStatus.textContent = 'در حال پردازش...';
    changePasswordStatus.className = 'text-sm mt-2 text-center h-4 text-gray-700';

    try {
        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
        const roomData = roomDoc.data();

        const correctPassword = roomData.password || CREATOR_PASSWORD;
        if (currentPassword !== correctPassword) {
            throw new Error("رمز فعلی اشتباه است.");
        }

        await updateDoc(roomRef, { password: newPassword || null });
        localStorage.removeItem(`room_access_${currentRoomId}`);

        changePasswordStatus.textContent = 'رمز با موفقیت تغییر کرد.';
        changePasswordStatus.classList.add('text-green-600');
        setTimeout(() => showView('chat-container'), 1500);

    } catch (error) {
        console.error("Error changing password:", error);
        changePasswordStatus.textContent = error.message || 'خطا در تغییر رمز.';
        changePasswordStatus.classList.add('text-red-600');
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

// --- Video Call Logic ---

const enterVideoCallRoom = () => {
  currentRoomId = VIDEO_CALL_ROOM_ID;
  showView('video-call-container');
  initializeVideoGrid();
  listenForSlotChanges();
};

const initializeVideoGrid = () => {
  videoGrid.innerHTML = '';
  for (let i = 1; i <= NUM_VIDEO_SLOTS; i++) {
    const slot = document.createElement('div');
    slot.id = `video-slot-${i}`;
    slot.className = 'bg-black/20 rounded-2xl relative flex items-center justify-center overflow-hidden';
    slot.innerHTML = `
      <video class="w-full h-full object-cover hidden transform -scale-x-100" autoplay playsinline></video>
      <div class="placeholder absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300">
        <svg class="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z"></path></svg>
      </div>
      <div class="occupant-info absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-sm px-2 py-1 rounded-lg hidden"></div>
      <div class="controls absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 hidden">
        <button data-action="mute" class="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        </button>
        <button data-action="end" class="w-10 h-10 bg-red-600/80 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5.586l1.828-1.828a1 1 0 111.414 1.414L11.414 12l2.828 2.828a1 1 0 01-1.414 1.414L10 13.414l-2.828 2.828a1 1 0 01-1.414-1.414L8.586 12 5.757 9.172a1 1 0 111.414-1.414L10 10.586V4a1 1 0 011-1z" clip-rule="evenodd"></path></svg>
        </button>
      </div>
    `;
    const placeholder = slot.querySelector('.placeholder');
    placeholder.addEventListener('click', () => joinVideoSlot(i));
    videoGrid.appendChild(slot);
  }
};

const joinVideoSlot = async (slotId) => {
  if (localStream) return; // Already in a call
  myVideoSlotId = slotId;
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    
    const slotEl = document.getElementById(`video-slot-${slotId}`);
    const videoEl = slotEl.querySelector('video');
    videoEl.srcObject = localStream;
    videoEl.muted = true;
    
    // Update UI
    slotEl.querySelector('.placeholder').classList.add('hidden');
    videoEl.classList.remove('hidden');
    slotEl.querySelector('.controls').classList.remove('hidden');
    
    const slotRef = doc(db, 'rooms', VIDEO_CALL_ROOM_ID, 'slots', `slot_${slotId}`);
    await setDoc(slotRef, { occupantId: currentUserId });

  } catch (err) {
    console.error("Error accessing media devices.", err);
    alert("دسترسی به دوربین و میکروفون امکان‌پذیر نیست.");
    myVideoSlotId = null;
  }
};

const listenForSlotChanges = () => {
  const slotsCollection = collection(db, 'rooms', VIDEO_CALL_ROOM_ID, 'slots');
  videoSlotsUnsubscribe = onSnapshot(slotsCollection, (snapshot) => {
    snapshot.docs.forEach(doc => {
        const slotIdNum = doc.id.split('_')[1];
        const { occupantId } = doc.data();
        
        if (occupantId && occupantId !== currentUserId) {
           // A remote user is in this slot. Initiate connection if not already started.
           if (!peerConnections[occupantId]) {
              createPeerConnection(occupantId, slotIdNum, true); // true = I am the initiator
           }
        }
    });

    // Handle users leaving
    const currentOccupants = new Set(snapshot.docs.map(d => d.data().occupantId));
    for (const remoteId in peerConnections) {
        if (!currentOccupants.has(remoteId)) {
            peerConnections[remoteId]?.close();
            delete peerConnections[remoteId];
            // Clear the video slot UI
            const slotToClear = Array.from(videoGrid.children).find(s => s.dataset.occupantId === remoteId);
            if(slotToClear) resetVideoSlot(slotToClear);
        }
    }
  });
};

const createPeerConnection = async (remoteUserId, slotIdNum, isInitiator) => {
    peerConnections[remoteUserId] = new RTCPeerConnection(stunServers);
    const pc = peerConnections[remoteUserId];

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
        const slotEl = document.getElementById(`video-slot-${slotIdNum}`);
        const remoteVideo = slotEl.querySelector('video');
        if (remoteVideo.srcObject !== event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            slotEl.querySelector('.placeholder').classList.add('hidden');
            remoteVideo.classList.remove('hidden');
            slotEl.dataset.occupantId = remoteUserId;
        }
    };
    
    // Signaling logic follows...
};

const resetVideoSlot = (slotEl) => {
    const video = slotEl.querySelector('video');
    video.srcObject = null;
    video.classList.add('hidden');
    slotEl.querySelector('.placeholder').classList.remove('hidden');
    slotEl.querySelector('.controls').classList.add('hidden');
    slotEl.querySelector('.occupant-info').classList.add('hidden');
    delete slotEl.dataset.occupantId;
};

const hangUp = async () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};

    if (myVideoSlotId) {
        const slotRef = doc(db, 'rooms', VIDEO_CALL_ROOM_ID, 'slots', `slot_${myVideoSlotId}`);
        await deleteDoc(slotRef);
    }
    
    localStream = null;
    myVideoSlotId = null;
    
    // Reset all slots in the UI
    Array.from(videoGrid.children).forEach(resetVideoSlot);
};

backToLobbyFromVideoBtn.addEventListener('click', async () => {
    await hangUp();
    if(videoSlotsUnsubscribe) videoSlotsUnsubscribe();
    showView('lobby-container');
});


// --- App Entry Point ---
const ensureVideoCallRoomExists = async () => {
  const videoRoomRef = doc(db, 'rooms', VIDEO_CALL_ROOM_ID);
  try {
    const docSnap = await getDoc(videoRoomRef);
    if (!docSnap.exists()) {
      await setDoc(videoRoomRef, {
        name: VIDEO_CALL_ROOM_NAME,
        createdAt: serverTimestamp(),
        password: null,
        avatarUrl: null, // Could add a special icon later
      });
    }
  } catch(error) {
    console.error("Could not ensure video call room exists:", error);
  }
};


const listenForGlobalSettings = () => {
    const globalSettingsRef = doc(db, 'app_settings', 'global');
    onSnapshot(globalSettingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const settings = docSnap.data();
            const newBackground = settings.backgroundUrl;
            if (newBackground && newBackground !== currentStaticBackground) {
                currentStaticBackground = newBackground;
                applyBackgroundSettings(currentStaticBackground);
                localStorage.setItem(STATIC_BACKGROUND_KEY, currentStaticBackground);
            }
        }
    });
};

const startApp = async () => {
  // Get local device settings as fallbacks
  const storedFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'md';
  const storedGlassMode = localStorage.getItem(GLASS_MODE_KEY) || 'off';
  currentSendWithEnter = localStorage.getItem(SEND_WITH_ENTER_KEY) || 'on';
  
  applyFontSize(storedFontSize);
  applyGlassModeSelection(storedGlassMode);
  applySendWithEnterSelection(currentSendWithEnter);

  const appAccessGranted = localStorage.getItem(APP_ACCESS_KEY);

  // Apply cached or default background immediately
  currentStaticBackground = localStorage.getItem(STATIC_BACKGROUND_KEY);
  applyBackgroundSettings(currentStaticBackground || DEFAULT_BACKGROUND_BASE64);
  
  // Listen for live global settings changes
  listenForGlobalSettings();
  
  await ensureVideoCallRoomExists();

  if (appAccessGranted) {
    // User has logged in before, fetch their synced profile
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            currentUsername = userData.username || localStorage.getItem(USERNAME_KEY);
            currentUserAvatar = userData.avatarUrl || localStorage.getItem(USER_AVATAR_KEY);
            
            // Update local cache
            userProfilesCache[currentUserId] = { username: currentUsername, avatarUrl: currentUserAvatar };

            localStorage.setItem(USERNAME_KEY, currentUsername);
            localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar || '');
        } else {
            currentUsername = localStorage.getItem(USERNAME_KEY);
            currentUserAvatar = localStorage.getItem(USER_AVATAR_KEY);
        }
    } catch (error) {
        console.error("Error fetching user profile, using local data:", error);
        currentUsername = localStorage.getItem(USERNAME_KEY);
        currentUserAvatar = localStorage.getItem(USER_AVATAR_KEY);
    }
    
    if (currentUsername) {
        showView('lobby-container');
        listenForRooms();
        updateSendButtonState();
    } else {
        showView('username-modal');
        usernameInput.focus();
    }
  } else {
    showView('username-modal');
    usernameInput.focus();
  }
};

startApp();