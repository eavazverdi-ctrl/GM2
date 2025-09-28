// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc,
  limit, getDocs, startAfter, writeBatch, setDoc, deleteDoc, where, collectionGroup
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
const STATIC_BACKGROUND_KEY = 'chat_background_static_v1';
const VIDEO_BG_MODE_KEY = 'video_bg_mode_v1';
const VIDEO_BG_STATIC_KEY = 'video_bg_static_v1';
const CREATOR_PASSWORD = '2025';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for non-image files
const IMAGE_MAX_DIMENSION = 1280; // max width/height for compressed images
const AVATAR_MAX_DIMENSION = 200; // max width/height for avatars
const MESSAGES_PER_PAGE = 15;
const DEFAULT_BACKGROUND_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXdzY3RybAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWhhbmQAAAAAAAAAAAAAAAACaWgAAwAAAAYAAAByAAAAAmZoAAEAAAAMAAAAcgAAAAJpcwAAAAQAAAA0AABoY3BydAAAAUgAAABkY2hhZAAAAZAAAAsUdGV4dAAAAAABY29weXJpZ2h0IChjKSAyMDAwLCAgU0FNU1VOQyBFTEVDVFJPTklDUywgQ08uLCBMVEQuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuCgAAWFlaIAAAAAAAAPNRAAEAAAABFsxYWVogAAAAAAAAAAAAAAAAAAAAAGN1cnYAAAAAAAAAAQIzAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/ABEIBMADEAMBEQACEQEDEQH/xAC3AAEAAwEBAQEBAQAAAAAAAAADBAUGAgEABwgBAQADAQEBAQAAAAAAAAAAAAABAgMEBQYH/9oADAMBAAIBAgIQAAB+vxvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQAxjGQA-AAAAAAAAAAAAAAAAAAAAAAAAAADUf35gAAAAAAAAAAAAAAAAAAAAND8bAAAAAAAAAAAAAAD+q33oG1gAAAAAAAAAAAAAAA0M3xAAAAAAAAAAAAAAAAAAABp/nQAAAAAAAAAAAAAAAB1W99AAAAAAAAAAAAAAADxPbAAAAAAAAA5/z4AAAAAPg/H5AAAADlAAAAAAAAD8g+P5H2A5/lUAAAAH0gAAAAAAAADzHn/AB9IfSH0h9HkAAAAAAAAAAAD8g/IOf8/n/I+j5AAAAAAAAAAAAB+f5+T4+v8+f8+QAAAAAAAAAAAAH6PyD8/n8g/I+gAAAAAAAAAAAAA/IPyD8/n/H8g+QAAAAAAAAAAAAH4/kH6fP+D8n0AAAAAAAAAAAAAA/I/x/Afz/g/J9AAAAAAAAAAAAAH6/5P8Aj83yAAAAAAAAAD//Z';
const VIDEO_CALL_ROOM_ID = '_ariana_video_call_room_';
const VIDEO_CALL_ROOM_NAME = 'استدیو تماس';
const NUM_VIDEO_SLOTS = 6;

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
let videoCallListeners = []; // To store Firestore unsubscribers
let isMicOn = true;
let isCameraOn = true;
const stunServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Ensure user ID is persisted
if (!localStorage.getItem(USER_ID_KEY)) {
  localStorage.setItem(USER_ID_KEY, currentUserId);
}

// --- State for Settings Modal ---
let tempStaticBackground = null;
let tempVideoStaticBackground = null;
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
const initialUserAvatarInput = document.getElementById('initial-user-avatar-input');
const initialUserAvatarPreview = document.getElementById('initial-user-avatar-preview');
const chatListContainer = document.getElementById('chat-list-container');
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
const removePasswordBtn = document.getElementById('remove-password-btn');
const removePasswordModal = document.getElementById('remove-password-modal');
const removePasswordForm = document.getElementById('remove-password-form');
const passwordForRemoveInput = document.getElementById('password-for-remove');
const removePasswordStatus = document.getElementById('remove-password-status');
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
// New Navigation Elements
const navChatBtn = document.getElementById('nav-chat-btn');
const navStudioBtn = document.getElementById('nav-studio-btn');
// Video Call Elements
const videoCallContainer = document.getElementById('video-call-container');
const videoCallBackground = document.getElementById('video-call-background');
const videoGridContainer = document.getElementById('video-grid-container');
const videoControlsBar = document.getElementById('video-controls-bar');
const toggleMicBtn = document.getElementById('toggle-mic-btn');
const toggleCameraBtn = document.getElementById('toggle-camera-btn');
// Video Background Settings Elements
const videoBgModeOptions = document.getElementById('video-bg-mode-options');
const videoStaticBackgroundUploader = document.getElementById('video-static-background-uploader');
const videoBackgroundImageInput = document.getElementById('video-background-image-input');
const videoBackgroundUploadStatus = document.getElementById('video-background-upload-status');


// --- View Management ---
const showView = (viewId) => {
  [
    chatListContainer, chatContainer, usernameModal, createRoomModal, passwordModal, settingsModal,
    chatSettingsModal, deleteChatModal, viewAvatarModal, changeUserAvatarInChatModal, roomInfoModal,
    fileConfirmModal, videoCallContainer, removePasswordModal
  ].forEach(el => {
    if (el.id === viewId) {
      el.classList.remove('view-hidden');
    } else {
      el.classList.add('view-hidden');
    }
  });
};

const switchTab = async (tabName) => {
    if (tabName === 'chat') {
        if (currentRoomId === VIDEO_CALL_ROOM_ID) {
            await cleanUpVideoCall();
        }
        showView('chat-list-container');
        navChatBtn.classList.add('glass-button-blue', 'text-white');
        navChatBtn.classList.remove('glass-button-gray', 'text-gray-700');
        navStudioBtn.classList.add('glass-button-gray', 'text-gray-700');
        navStudioBtn.classList.remove('glass-button-blue', 'text-white');
    } else if (tabName === 'studio') {
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
        }
        enterVideoCallRoom();
        navStudioBtn.classList.add('glass-button-blue', 'text-white');
        navStudioBtn.classList.remove('glass-button-gray', 'text-gray-700');
        navChatBtn.classList.add('glass-button-gray', 'text-gray-700');
        navChatBtn.classList.remove('glass-button-blue', 'text-white');
    }
};

navChatBtn.addEventListener('click', () => switchTab('chat'));
navStudioBtn.addEventListener('click', () => switchTab('studio'));


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

const applyVideoBgModeSelection = (mode) => {
    videoStaticBackgroundUploader.classList.toggle('hidden', mode !== 'static');
    videoBgModeOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('glass-button-blue', btn.dataset.mode === mode);
        btn.classList.toggle('text-white', btn.dataset.mode === mode);
        btn.classList.toggle('glass-button-gray', btn.dataset.mode !== mode);
    });
};

videoBgModeOptions.addEventListener('click', (e) => {
    if (e.target.matches('.video-bg-mode-btn')) {
        applyVideoBgModeSelection(e.target.dataset.mode);
    }
});

videoBackgroundImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    videoBackgroundUploadStatus.textContent = 'در حال پردازش...';
    try {
        tempVideoStaticBackground = await compressImage(file, IMAGE_MAX_DIMENSION);
        videoBackgroundUploadStatus.textContent = 'عکس آماده شد. برای ذخیره تایید را بزنید.';
        videoBackgroundUploadStatus.classList.add('text-green-600');
    } catch (error) {
        console.error("Error compressing video background image:", error);
        videoBackgroundUploadStatus.textContent = 'خطا در پردازش تصویر.';
        videoBackgroundUploadStatus.classList.add('text-red-600');
    }
});

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
    initialSettingsState = {
        staticBg: currentStaticBackground,
        videoBgMode: localStorage.getItem(VIDEO_BG_MODE_KEY) || 'animated',
        videoStaticBg: localStorage.getItem(VIDEO_BG_STATIC_KEY)
    };
    
    changeUsernameInput.value = currentUsername;
    userAvatarPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    applyFontSize(currentFontSize);
    applyGlassModeSelection(currentGlassMode);
    applySendWithEnterSelection(currentSendWithEnter);
    applyVideoBgModeSelection(initialSettingsState.videoBgMode);
    
    tempStaticBackground = null;
    tempVideoStaticBackground = null;
    backgroundImageInput.value = '';
    videoBackgroundImageInput.value = '';
    backgroundUploadStatus.textContent = '';
    videoBackgroundUploadStatus.textContent = '';

    showView('settings-modal');
});

settingsCancelBtn.addEventListener('click', () => {
    applyBackgroundSettings(initialSettingsState.staticBg || DEFAULT_BACKGROUND_BASE64);
    const activeTabContainerId = videoCallContainer.classList.contains('view-hidden') ? 'chat-list-container' : 'video-call-container';
    showView(activeTabContainerId);
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
    
    userUpdates.avatarUrl = currentUserAvatar || null;
    localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar || '');

    localStorage.setItem(FONT_SIZE_KEY, currentFontSize);
    localStorage.setItem(GLASS_MODE_KEY, currentGlassMode);
    localStorage.setItem(SEND_WITH_ENTER_KEY, currentSendWithEnter);
    
    if (tempStaticBackground) {
        try {
            await setDoc(doc(db, 'app_settings', 'global'), { backgroundUrl: tempStaticBackground }, { merge: true });
        } catch (error) { console.error("Error updating global background:", error); }
    }
    
    // Handle Video Background Update
    const videoBgMode = videoBgModeOptions.querySelector('.glass-button-blue').dataset.mode;
    localStorage.setItem(VIDEO_BG_MODE_KEY, videoBgMode);
    const videoRoomUpdates = {};
    if (videoBgMode === 'animated') {
        videoRoomUpdates.backgroundUrl = null;
        localStorage.removeItem(VIDEO_BG_STATIC_KEY);
    } else if (tempVideoStaticBackground) {
        videoRoomUpdates.backgroundUrl = tempVideoStaticBackground;
        localStorage.setItem(VIDEO_BG_STATIC_KEY, tempVideoStaticBackground);
    }

    if (Object.keys(videoRoomUpdates).length > 0) {
        await updateDoc(doc(db, 'rooms', VIDEO_CALL_ROOM_ID), videoRoomUpdates);
    }

    if (Object.keys(userUpdates).length > 0) {
        try {
            await setDoc(doc(db, 'users', currentUserId), userUpdates, { merge: true });
            userProfilesCache[currentUserId] = { username: currentUsername, avatarUrl: currentUserAvatar };
        } catch (error) { console.error("Error syncing user settings:", error); }
    }
    
    const activeTabContainerId = videoCallContainer.classList.contains('view-hidden') ? 'chat-list-container' : 'video-call-container';
    showView(activeTabContainerId);
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
    switchTab('studio');
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
          bubbleTailClass = 'rounded-br-none';
          nameAlignmentClass = 'text-right pr-1';
          nameColorClass = 'text-gray-200/90';
          timeColorClass = 'text-gray-200/90';
      } else { // Others' messages on the LEFT
          liClasses = 'justify-end';
          bubbleClasses = `${selectedModeClasses.other} text-black shadow`;
          bubbleTailClass = 'rounded-bl-none';
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

      if (isUser) {
          li.innerHTML = avatarContainer + bubbleContainer;
      } else {
          li.innerHTML = bubbleContainer + avatarContainer;
      }
      fragment.appendChild(li);
      lastAuthorIdForMargin = message.authorId;
  }
  
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
        
        await setDoc(doc(db, 'users', currentUserId), { avatarUrl: currentUserAvatar }, { merge: true });
        userProfilesCache[currentUserId] = { ...userProfilesCache[currentUserId], avatarUrl: currentUserAvatar };

        document.querySelectorAll(`.message-avatar[data-author-id="${currentUserId}"]`).forEach(el => {
            el.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
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
    fileInput.value = '';

    filePreviewContainer.innerHTML = '';
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
        await addDoc(messagesCol, { type: isImage ? 'image' : 'file', fileName: file.name, fileDataUrl, authorId: currentUserId, authorName: currentUsername, authorAvatar: currentUserAvatar, timestamp: serverTimestamp() });
        showView('chat-container');
        setTimeout(() => scrollToBottom('smooth'), 150);
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
initialUserAvatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            initialUserAvatarPreview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover" />`;
        };
        reader.readAsDataURL(file);
    }
});


usernameForm.addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    const newUsername = usernameInput.value.trim(); 
    const password = initialPasswordInput.value;
    const avatarFile = initialUserAvatarInput.files[0];

    if (!avatarFile) {
        alert('لطفا یک عکس پروفایل انتخاب کنید.');
        return;
    }
    if (password !== CREATOR_PASSWORD) {
        alert('رمز ورود به برنامه اشتباه است.');
        initialPasswordInput.value = '';
        initialPasswordInput.focus();
        return;
    }
    if (newUsername) { 
        try {
            const compressedAvatar = await compressImage(avatarFile, AVATAR_MAX_DIMENSION);
            localStorage.setItem(APP_ACCESS_KEY, 'true');
            localStorage.setItem(USERNAME_KEY, newUsername);
            localStorage.setItem(USER_AVATAR_KEY, compressedAvatar);

            await setDoc(doc(db, 'users', currentUserId), { 
                username: newUsername,
                avatarUrl: compressedAvatar 
            }, { merge: true });

            startApp(); 
        } catch (error) {
            console.error("Error processing avatar or creating user:", error);
            alert('خطا در پردازش عکس یا ساخت کاربر.');
        }
    } 
});

createRoomBtn.addEventListener('click', () => { createRoomForm.reset(); showView('create-room-modal'); newRoomNameInput.focus(); });
cancelCreateRoomBtn.addEventListener('click', () => showView('chat-list-container'));

createRoomForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const name = newRoomNameInput.value.trim(); const creatorPassword = creatorPasswordInput.value;
  if (creatorPassword !== CREATOR_PASSWORD) { alert('رمز سازنده اشتباه است.'); creatorPasswordInput.value = ''; creatorPasswordInput.focus(); return; }
  if (!name) return;
  try { await addDoc(roomsCollection, { name, password: null, createdAt: serverTimestamp(), avatarUrl: null, backgroundUrl: null }); showView('chat-list-container'); } catch (error) { console.error("Error creating room:", error); alert('خطا در ایجاد اتاق.'); }
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

cancelPasswordEntryBtn.addEventListener('click', () => showView('chat-list-container'));
backToLobbyBtn.addEventListener('click', () => { if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; } currentRoomId = null; chatBackground.style.backgroundImage = ''; showView('chat-list-container'); });

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
        await addDoc(messagesCol, { type: 'text', text, authorId: currentUserId, authorName: currentUsername, authorAvatar: currentUserAvatar, timestamp: serverTimestamp() });
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

chatHeaderInfo.addEventListener('click', async () => {
    if (!currentRoomId || currentRoomId === VIDEO_CALL_ROOM_ID) return;
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
            if (updates.backgroundUrl) chatBackground.style.backgroundImage = `url(${updates.backgroundUrl})`;

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

removePasswordBtn.addEventListener('click', () => {
    removePasswordForm.reset();
    removePasswordStatus.textContent = '';
    showView('remove-password-modal');
});

removePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentRoomId) return;
    const password = passwordForRemoveInput.value;
    removePasswordStatus.textContent = 'در حال بررسی رمز...';
    removePasswordStatus.className = 'text-sm mt-2 text-center h-4 text-gray-700';

    try {
        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("اتاق یافت نشد.");
        const roomData = roomDoc.data();
        const correctPassword = roomData.password || CREATOR_PASSWORD;
        if (password !== correctPassword) {
            throw new Error("رمز فعلی اشتباه است.");
        }
        await updateDoc(roomRef, { password: null });
        localStorage.removeItem(`room_access_${currentRoomId}`);
        removePasswordStatus.textContent = 'رمز با موفقیت حذف شد.';
        removePasswordStatus.classList.add('text-green-600');
        setTimeout(() => showView('chat-container'), 1500);

    } catch(error) {
        console.error("Error removing password:", error);
        removePasswordStatus.textContent = error.message || 'خطا در حذف رمز.';
        removePasswordStatus.classList.add('text-red-600');
    }
});


document.querySelectorAll('.cancel-btn').forEach(btn => {
    const parentModal = btn.closest('.fixed');
    if (!parentModal) return;
    if (parentModal.id === 'delete-chat-modal' || parentModal.id === 'remove-password-modal') {
        btn.addEventListener('click', () => showView('chat-settings-modal'));
    } else if (parentModal.id === 'room-info-modal') {
        btn.addEventListener('click', () => showView('chat-container'));
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

const resetVideoSlot = (slotEl) => {
    if(!slotEl) return;
    const video = slotEl.querySelector('video');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    slotEl.querySelector('.video-feed').classList.add('hidden');
    slotEl.querySelector('.avatar-placeholder').classList.add('hidden');
    slotEl.querySelector('.empty-placeholder').classList.remove('hidden');
    slotEl.querySelector('.name-pill').textContent = '';
    delete slotEl.dataset.occupantId;
};

const findAndJoinEmptySlot = async (withMedia) => {
    const slotsRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots');
    const slotsSnapshot = await getDocs(slotsRef);
    const occupiedSlots = new Set(slotsSnapshot.docs.map(d => parseInt(d.id.split('_')[1])));
    
    let targetSlotId = -1;
    for (let i = 1; i <= NUM_VIDEO_SLOTS; i++) {
      if (!occupiedSlots.has(i)) {
        targetSlotId = i;
        break;
      }
    }
  
    if (targetSlotId !== -1) {
        if (withMedia) {
          await joinVideoSlot(targetSlotId);
        } else {
          await joinVideoSlotWithoutMedia(targetSlotId);
        }
    } else {
      alert("استدیو تماس پر است.");
      switchTab('chat');
    }
};

const joinVideoSlotWithoutMedia = async (slotId) => {
    if (myVideoSlotId) {
        await hangUp(false);
    }
    myVideoSlotId = slotId;
    const slotEl = document.getElementById(`video-slot-${slotId}`);
    
    slotEl.querySelector('.video-feed').classList.add('hidden');
    slotEl.querySelector('.empty-placeholder').classList.add('hidden');
    const avatarPlaceholder = slotEl.querySelector('.avatar-placeholder');
    avatarPlaceholder.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    avatarPlaceholder.classList.remove('hidden');
    slotEl.querySelector('.name-pill').textContent = currentUsername;

    const slotRef = doc(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots', `slot_${slotId}`);
    await setDoc(slotRef, { 
        occupantId: currentUserId, 
        occupantName: currentUsername,
        occupantAvatar: currentUserAvatar,
        isCameraOff: true
    });
};

const enterVideoCallRoom = async () => {
    showView('video-call-container');
    currentRoomId = VIDEO_CALL_ROOM_ID;

    try {
        const roomDoc = await getDoc(doc(db, 'rooms', VIDEO_CALL_ROOM_ID));
        if (roomDoc.exists()) {
            const roomData = roomDoc.data();
            if (roomData.backgroundUrl) {
                videoCallBackground.style.animation = 'none';
                videoCallBackground.style.backgroundImage = `url(${roomData.backgroundUrl})`;
                videoCallBackground.style.backgroundSize = 'cover';
                videoCallBackground.style.backgroundPosition = 'center';
            } else {
                videoCallBackground.style.backgroundImage = '';
                videoCallBackground.style.animation = 'gradient 15s ease infinite';
            }
        }
    } catch (e) {
        console.error("Error fetching video room background", e);
    }

    initializeVideoUI();
    setupVideoCallListeners();

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        toggleMicBtn.disabled = false;
        toggleCameraBtn.disabled = false;
        toggleMicBtn.classList.add('bg-green-500/80');
        toggleCameraBtn.classList.add('bg-green-500/80');
        toggleMicBtn.classList.remove('bg-white/40');
        toggleCameraBtn.classList.remove('bg-white/40');
        await findAndJoinEmptySlot(true);
    } catch (err) {
        console.error("Error accessing media devices. Joining without media.", err);
        localStream = null;
        isMicOn = false;
        isCameraOn = false;
        toggleMicBtn.disabled = true;
        toggleCameraBtn.disabled = true;
        await findAndJoinEmptySlot(false);
    }
};

const initializeVideoUI = () => {
  document.querySelectorAll('.video-slot').forEach((slot, index) => {
    const slotId = index + 1;
    slot.innerHTML = `
      <div class="relative w-full h-full bg-white/10 backdrop-blur-3xl rounded-2xl overflow-hidden flex items-center justify-center">
        <video class="video-feed w-full h-full object-cover hidden transform -scale-x-100" autoplay playsinline></video>
        <div class="avatar-placeholder absolute inset-0 w-full h-full hidden flex items-center justify-center"></div>
        <div class="empty-placeholder absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 hover:bg-black/10">
          <svg class="w-1/4 h-1/4 max-w-[64px] max-h-[64px] text-gray-400/80"><use href="#placeholder-person-svg" /></svg>
          <span class="text-white/70 text-sm mt-2 font-semibold">متصل شوید</span>
        </div>
        <div class="name-pill absolute bottom-2 right-2 px-3 py-1 bg-white/20 backdrop-blur-lg text-gray-300 text-xs font-semibold rounded-full whitespace-nowrap"></div>
      </div>
    `;
    slot.querySelector('.empty-placeholder').addEventListener('click', () => {
        if(localStream) joinVideoSlot(slotId)
        else alert('برای جابجایی نیاز به دسترسی دوربین و میکروفون دارید.');
    });
  });
  
  toggleMicBtn.disabled = true;
  toggleCameraBtn.disabled = true;
  toggleMicBtn.classList.remove('bg-green-500/80');
  toggleCameraBtn.classList.remove('bg-green-500/80');
  toggleMicBtn.classList.add('bg-white/40');
  toggleCameraBtn.classList.add('bg-white/40');
};

const joinVideoSlot = async (slotId) => {
  if (!localStream) {
      alert("دسترسی به مدیا وجود ندارد. لطفا صفحه را رفرش کنید.");
      return;
  }
  if (myVideoSlotId) {
    if (confirm("شما در حال حاضر در تماس هستید. آیا می‌خواهید تماس فعلی را قطع کرده و به جایگاه جدیدی بپیوندید؟")) {
        await hangUp(false);
    } else {
        return;
    }
  }

  myVideoSlotId = slotId;
  const slotEl = document.getElementById(`video-slot-${slotId}`);
  const videoEl = slotEl.querySelector('video');
  videoEl.srcObject = localStream;
  videoEl.muted = true;
  slotEl.querySelector('.video-feed').classList.remove('hidden');
  slotEl.querySelector('.empty-placeholder').classList.add('hidden');
  slotEl.querySelector('.name-pill').textContent = currentUsername;

  isMicOn = true;
  isCameraOn = true;
  localStream.getAudioTracks()[0].enabled = true;
  localStream.getVideoTracks()[0].enabled = true;
  
  const slotRef = doc(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots', `slot_${slotId}`);
  await setDoc(slotRef, { 
    occupantId: currentUserId, 
    occupantName: currentUsername,
    occupantAvatar: currentUserAvatar,
    isCameraOff: false 
  });
  
  const allSlotsQuery = query(collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots'));
  const allSlotsSnapshot = await getDocs(allSlotsQuery);
  allSlotsSnapshot.forEach(docSnap => {
      const { occupantId } = docSnap.data();
      if (occupantId && occupantId !== currentUserId) {
          startPeerConnection(occupantId, parseInt(docSnap.id.split('_')[1]));
      }
  });

};

const startPeerConnection = async (remoteUserId, remoteSlotId) => {
    if(!localStream) return;
    const pc = createPeerConnection(remoteUserId, remoteSlotId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const offersRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'users', remoteUserId, 'offers');
    await addDoc(offersRef, { 
        from: currentUserId, 
        fromSlot: myVideoSlotId,
        offer: { type: offer.type, sdp: offer.sdp } 
    });
}

const createPeerConnection = (remoteUserId, remoteSlotId) => {
    if (peerConnections[remoteUserId]) return peerConnections[remoteUserId];

    const pc = new RTCPeerConnection(stunServers);
    
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.ontrack = event => {
        const slotEl = document.getElementById(`video-slot-${remoteSlotId}`);
        if (slotEl) {
            const remoteVideo = slotEl.querySelector('video');
            if (remoteVideo.srcObject !== event.streams[0]) {
              remoteVideo.srcObject = event.streams[0];
            }
            slotEl.querySelector('.video-feed').classList.remove('hidden');
            slotEl.querySelector('.avatar-placeholder').classList.add('hidden');
        }
    };
    
    pc.onicecandidate = event => {
        if (event.candidate && localStream) {
            const signalingRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'users', remoteUserId, 'offers');
            addDoc(signalingRef, { 
                from: currentUserId, 
                fromSlot: myVideoSlotId,
                candidate: event.candidate.toJSON() 
            });
        }
    };
    
    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
            pc.close();
            delete peerConnections[remoteUserId];
        }
    };

    peerConnections[remoteUserId] = pc;
    return pc;
};


const setupVideoCallListeners = () => {
    if (videoCallListeners.length > 0) {
      videoCallListeners.forEach(unsub => unsub());
      videoCallListeners = [];
    }
    const slotsCol = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots');
    const unsubscribeSlots = onSnapshot(slotsCol, async (snapshot) => {
      const onlineUsers = new Map();
      for (const docSnap of snapshot.docs) {
          const slotData = docSnap.data();
          const slotId = parseInt(docSnap.id.split('_')[1]);
          onlineUsers.set(slotData.occupantId, { ...slotData, slotId });

          const slotEl = document.getElementById(`video-slot-${slotId}`);
          if (!slotEl) continue;

          slotEl.dataset.occupantId = slotData.occupantId;
          slotEl.querySelector('.name-pill').textContent = slotData.occupantName;
          slotEl.querySelector('.empty-placeholder').classList.add('hidden');

          if (slotData.occupantId === currentUserId) continue;
          
          if (slotData.isCameraOff) {
            slotEl.querySelector('.avatar-placeholder').innerHTML = generateAvatar(slotData.occupantName, slotData.occupantAvatar);
            slotEl.querySelector('.avatar-placeholder').classList.remove('hidden');
            slotEl.querySelector('.video-feed').classList.add('hidden');
          } else {
            slotEl.querySelector('.avatar-placeholder').classList.add('hidden');
            slotEl.querySelector('.video-feed').classList.remove('hidden');
            if (myVideoSlotId && !peerConnections[slotData.occupantId]) {
                 startPeerConnection(slotData.occupantId, slotId);
            }
          }
      }

      document.querySelectorAll('.video-slot').forEach(slotEl => {
          const occupant = slotEl.dataset.occupantId;
          if (occupant && !onlineUsers.has(occupant)) {
               if(peerConnections[occupant]) {
                  peerConnections[occupant].close();
                  delete peerConnections[occupant];
               }
               resetVideoSlot(slotEl);
          }
      });
    });
    videoCallListeners.push(unsubscribeSlots);

    const offersCol = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'users', currentUserId, 'offers');
    const unsubscribeSignaling = onSnapshot(query(offersCol), async (snapshot) => {
        for (const change of snapshot.docChanges()) {
            if (change.type === 'added') {
                const data = change.doc.data();
                const remoteUserId = data.from;
                const remoteSlotId = data.fromSlot;

                const pc = peerConnections[remoteUserId] || createPeerConnection(remoteUserId, remoteSlotId);

                if (data.offer) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    if (localStream) { // Only create answer if we can send media back
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        const answerRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'users', remoteUserId, 'offers');
                        await addDoc(answerRef, { 
                            from: currentUserId, 
                            fromSlot: myVideoSlotId,
                            answer: { type: answer.type, sdp: answer.sdp } 
                        });
                    }
                } else if (data.answer) {
                    if (pc.signalingState !== 'stable') {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                } else if (data.candidate) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) { console.error('Error adding received ice candidate', e); }
                }
                
                await deleteDoc(change.doc.ref);
            }
        }
    });
    videoCallListeners.push(unsubscribeSignaling);
};

const hangUp = async (fullCleanup = true) => {
    if (fullCleanup && localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};

    if (myVideoSlotId) {
        const slotRef = doc(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots', `slot_${myVideoSlotId}`);
        await deleteDoc(slotRef).catch(err => console.error("Error deleting slot doc:", err));
        const slotEl = document.getElementById(`video-slot-${myVideoSlotId}`);
        if(slotEl) resetVideoSlot(slotEl);
        myVideoSlotId = null;
    }
    
    if (fullCleanup) {
        toggleMicBtn.disabled = true;
        toggleCameraBtn.disabled = true;
        toggleMicBtn.classList.remove('bg-green-500/80');
        toggleCameraBtn.classList.remove('bg-green-500/80');
        toggleMicBtn.classList.add('bg-white/40');
        toggleCameraBtn.classList.add('bg-white/40');
    }
};

const cleanUpVideoCall = async () => {
    await hangUp(true);
    videoCallListeners.forEach(unsub => unsub());
    videoCallListeners = [];
    currentRoomId = null;
    
    try {
        const offersRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'users', currentUserId, 'offers');
        const offerSnapshot = await getDocs(offersRef);
        const batch = writeBatch(db);
        offerSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    } catch(err) { console.error("Error cleaning up signaling docs:", err); }
};

toggleMicBtn.addEventListener('click', () => {
    if (!localStream) return;
    isMicOn = !isMicOn;
    localStream.getAudioTracks()[0].enabled = isMicOn;
    toggleMicBtn.classList.toggle('bg-green-500/80', isMicOn);
    toggleMicBtn.classList.toggle('bg-white/40', !isMicOn);
});

toggleCameraBtn.addEventListener('click', async () => {
    if (!localStream || !myVideoSlotId) return;
    isCameraOn = !isCameraOn;
    localStream.getVideoTracks()[0].enabled = isCameraOn;
    
    const slotEl = document.getElementById(`video-slot-${myVideoSlotId}`);
    slotEl.querySelector('.video-feed').classList.toggle('hidden', !isCameraOn);
    const avatarPlaceholder = slotEl.querySelector('.avatar-placeholder');
    avatarPlaceholder.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    avatarPlaceholder.classList.toggle('hidden', isCameraOn);
    
    toggleCameraBtn.classList.toggle('bg-green-500/80', isCameraOn);
    toggleCameraBtn.classList.toggle('bg-white/40', !isCameraOn);

    const slotRef = doc(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots', `slot_${myVideoSlotId}`);
    await updateDoc(slotRef, { isCameraOff: !isCameraOn });
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
        avatarUrl: null,
        backgroundUrl: null
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
  const storedFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'md';
  const storedGlassMode = localStorage.getItem(GLASS_MODE_KEY) || 'off';
  currentSendWithEnter = localStorage.getItem(SEND_WITH_ENTER_KEY) || 'on';
  
  applyFontSize(storedFontSize);
  applyGlassModeSelection(storedGlassMode);
  applySendWithEnterSelection(currentSendWithEnter);

  const appAccessGranted = localStorage.getItem(APP_ACCESS_KEY);

  currentStaticBackground = localStorage.getItem(STATIC_BACKGROUND_KEY);
  applyBackgroundSettings(currentStaticBackground || DEFAULT_BACKGROUND_BASE64);
  
  listenForGlobalSettings();
  
  try {
    await ensureVideoCallRoomExists();
  } catch(e) {
    console.error("Fatal error during startup (ensureVideoCallRoomExists):", e);
    return;
  }

  if (appAccessGranted) {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            currentUsername = userData.username || localStorage.getItem(USERNAME_KEY);
            currentUserAvatar = userData.avatarUrl || localStorage.getItem(USER_AVATAR_KEY);
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
        switchTab('chat');
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