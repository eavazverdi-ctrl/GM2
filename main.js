// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc,
  limit, getDocs, startAfter, writeBatch, setDoc, deleteDoc, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG } from './config.js';

// --- App Initialization ---
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// --- App Check Initialization ---
// TODO: Replace 'YOUR_RECAPTCHA_V3_SITE_KEY' with your actual site key from the Google reCAPTCHA admin console.
// This is a public key and is safe to be exposed in the client-side code.
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LfPjdcrAAAAAFBVZqhaXAsFqekQhBgvKWu24rTm'),
  isTokenAutoRefreshEnabled: true
});


// --- User Identity & Settings ---
const APP_ACCESS_KEY = 'chat_app_access_v1';
const USER_ID_KEY = 'chat_user_id_v2';
const USERNAME_KEY = 'chat_username_v2';
const USER_AVATAR_KEY = 'chat_user_avatar_v1';
const FONT_SIZE_KEY = 'chat_font_size_v1';
const GLASS_MODE_KEY = 'chat_glass_mode_v1';
const SEND_WITH_ENTER_KEY = 'chat_send_with_enter_v1';
const STATIC_BACKGROUND_KEY = 'chat_background_static_v2'; // Updated key for unified background
const CREATOR_PASSWORD = '2025';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for non-image files
const IMAGE_MAX_DIMENSION = 1280; // max width/height for compressed images
const AVATAR_MAX_DIMENSION = 200; // max width/height for avatars
const MESSAGES_PER_PAGE = 15;
const VIDEO_CALL_ROOM_ID = '_ariana_video_call_room_';
const VIDEO_CALL_ROOM_NAME = 'استدیو';
const GLOBAL_CHAT_ROOM_ID = '_ariana_global_chat_';
const GLOBAL_CHAT_ROOM_NAME = 'خودمونی ها';
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
let lastActiveViewId = 'chat-container'; 

// --- New Navigation/Animation State ---
let activeTab = 'chat';
let isSwitchingTabs = false;
let isInitialLoad = true;


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
let initialSettingsState = {};
let fileToUpload = null;

// Pagination state
let oldestMessageDoc = null;
let isLoadingOlderMessages = false;
let reachedEndOfMessages = false;

// --- DOM Elements ---
const appBackground = document.getElementById('app-background');
const globalNav = document.getElementById('global-nav');
const mainContentWrapper = document.getElementById('main-content-wrapper');
const usernameModal = document.getElementById('username-modal');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const initialPasswordInput = document.getElementById('initial-password-input');
const initialUserAvatarInput = document.getElementById('initial-user-avatar-input');
const initialUserAvatarPreview = document.getElementById('initial-user-avatar-preview');
const settingsBtn = document.getElementById('settings-btn');
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
const deleteAllMessagesBtn = document.getElementById('delete-all-messages-btn');
const clearStudioCacheBtn = document.getElementById('clear-studio-cache-btn');
const updateAppBtn = document.getElementById('update-app-btn');
const updateStatusText = document.getElementById('update-status-text');
const chatContainer = document.getElementById('chat-container');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const sendButton = document.getElementById('send-button');
const loadingSpinner = document.getElementById('loading-spinner');
const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
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
const navChatBtn = document.getElementById('nav-chat-btn');
const navStudioBtn = document.getElementById('nav-studio-btn');
const videoCallContainer = document.getElementById('video-call-container');
const videoGridContainer = document.getElementById('video-grid-container');
const videoControlsBar = document.getElementById('video-controls-bar');
const toggleMicBtn = document.getElementById('toggle-mic-btn');
const toggleCameraBtn = document.getElementById('toggle-camera-btn');

// --- In-memory Caching for profiles ---
const profileCache = new Map();


// --- View Management ---
const showView = (viewId) => {
    const modals = [
        usernameModal, settingsModal, viewAvatarModal, 
        changeUserAvatarInChatModal, fileConfirmModal
    ];
    
    modals.forEach(el => el.classList.add('view-hidden'));
    
    const targetModal = document.getElementById(viewId);
    if (targetModal && modals.includes(targetModal)) {
        targetModal.classList.remove('view-hidden');
    }

    if (viewId === 'username-modal') {
        globalNav.classList.add('view-hidden');
        mainContentWrapper.classList.add('view-hidden');
    } else {
        globalNav.classList.remove('view-hidden');
        mainContentWrapper.classList.remove('view-hidden');
    }
};

const switchTab = async (tabName) => {
    if (tabName === activeTab || isSwitchingTabs) return;

    isSwitchingTabs = true;
    const previousTab = activeTab;
    activeTab = tabName;

    const studioBtn = navStudioBtn;
    const chatBtn = navChatBtn;
    
    const activeContainer = document.getElementById(`${previousTab === 'studio' ? 'video-call' : 'chat'}-container`);
    const newContainer = document.getElementById(`${tabName === 'studio' ? 'video-call' : 'chat'}-container`);

    // 1. Animate buttons
    const activeBtnClasses = ['bg-green-500', 'text-white'];
    const inactiveBtnClasses = ['bg-white/20', 'text-black', 'backdrop-blur-lg'];

    if (tabName === 'studio') {
        studioBtn.style.flexBasis = '50%';
        chatBtn.style.flexBasis = '35%';

        studioBtn.classList.remove(...inactiveBtnClasses, 'backdrop-blur-lg');
        studioBtn.classList.add(...activeBtnClasses);
        chatBtn.classList.remove(...activeBtnClasses);
        chatBtn.classList.add(...inactiveBtnClasses);
    } else { // chat becomes active
        chatBtn.style.flexBasis = '50%';
        studioBtn.style.flexBasis = '35%';

        chatBtn.classList.remove(...inactiveBtnClasses, 'backdrop-blur-lg');
        chatBtn.classList.add(...activeBtnClasses);
        studioBtn.classList.remove(...activeBtnClasses);
        studioBtn.classList.add(...inactiveBtnClasses);
    }
    settingsBtn.style.flexBasis = '15%';

    // 2. Animate containers
    if (!isInitialLoad) {
        activeContainer.classList.add('opacity-0');
        setTimeout(() => {
            activeContainer.classList.add('view-hidden');
            newContainer.classList.remove('view-hidden');
            setTimeout(() => newContainer.classList.remove('opacity-0'), 20);
        }, 300); // Match CSS transition duration
    }

    // 3. Handle room logic
    if (tabName === 'studio') {
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
        }
        await enterVideoCallRoom();
    } else { // chat
        if (currentRoomId === VIDEO_CALL_ROOM_ID) {
            await cleanUpVideoCall();
        }
        if (currentRoomId !== GLOBAL_CHAT_ROOM_ID) {
            const roomDoc = await getDoc(doc(db, 'rooms', GLOBAL_CHAT_ROOM_ID));
            if (roomDoc.exists()) {
                enterChatRoom(GLOBAL_CHAT_ROOM_ID, roomDoc.data());
            }
        }
    }
    
    lastActiveViewId = newContainer.id;
    setTimeout(() => { isSwitchingTabs = false; }, 500);
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

const avatarColors = [
    'rgba(255, 99, 132, 0.5)',  // Red
    'rgba(54, 162, 235, 0.5)',  // Blue
    'rgba(255, 206, 86, 0.5)',  // Yellow
    'rgba(75, 192, 192, 0.5)',  // Green
    'rgba(153, 102, 255, 0.5)', // Purple
    'rgba(255, 159, 64, 0.5)',  // Orange
];

const getColorForName = (name) => {
    if (!name) return 'rgba(231, 233, 237, 0.5)'; // Gray for fallback
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % avatarColors.length);
    return avatarColors[index];
};

const generateAvatar = (name, url) => {
    if (url && url !== 'null' && url !== 'undefined') {
        return `<img src="${url}" class="w-full h-full object-cover" alt="${name || 'avatar'}"/>`;
    }
    const initial = (name || '?').charAt(0).toUpperCase();
    const color = getColorForName(name);
    return `<div class="w-full h-full flex items-center justify-center text-white font-bold text-xl" style="background-color: ${color}; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);">${initial}</div>`;
};


// --- Profile Caching ---
const getUserProfile = async (userId) => {
    // 1. Check in-memory cache first
    if (profileCache.has(userId)) {
        return profileCache.get(userId);
    }

    // 2. If not in cache, fetch from Firestore
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = { userId, ...userDoc.data() };
            // 3. Store in cache for future use
            profileCache.set(userId, userData);
            return userData;
        }
        return { username: 'کاربر ناشناس', avatarUrl: null };
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
        btn.classList.toggle('bg-green-500', btn.dataset.size === size);
        btn.classList.toggle('text-white', btn.dataset.size === size);
        btn.classList.toggle('bg-white/50', btn.dataset.size !== size);
        btn.classList.toggle('text-gray-800', btn.dataset.size !== size);
    });
};

const applyGlassModeSelection = (mode) => {
    currentGlassMode = mode;
    glassModeOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('bg-green-500', btn.dataset.glass === mode);
        btn.classList.toggle('text-white', btn.dataset.glass === mode);
        btn.classList.toggle('bg-white/50', btn.dataset.glass !== mode);
        btn.classList.toggle('text-gray-800', btn.dataset.glass !== mode);
    });
};

const applySendWithEnterSelection = (value) => {
    currentSendWithEnter = value;
    sendWithEnterOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('bg-green-500', btn.dataset.value === value);
        btn.classList.toggle('text-white', btn.dataset.value === value);
        btn.classList.toggle('bg-white/50', btn.dataset.value !== value);
        btn.classList.toggle('text-gray-800', btn.dataset.value !== value);
    });
};

const applyBackgroundSettings = (staticBgData) => {
    if (staticBgData) {
        appBackground.style.backgroundImage = `url(${staticBgData})`;
        appBackground.style.backgroundSize = 'cover';
        appBackground.style.backgroundPosition = 'center';
    } else {
        appBackground.style.backgroundImage = ''; // Clear inline style to fallback to CSS class
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
    backgroundUploadStatus.className = 'text-sm text-center h-4 text-gray-600';

    try {
        tempStaticBackground = await compressImage(file, IMAGE_MAX_DIMENSION);
        applyBackgroundSettings(tempStaticBackground); // Preview
        backgroundUploadStatus.textContent = 'عکس آماده شد. برای ذخیره تایید را بزنید.';
        backgroundUploadStatus.classList.add('text-green-600');

    } catch (error) {
        console.error("Error compressing background image:", error);
        backgroundUploadStatus.textContent = 'خطا در پردازش تصویر.';
        backgroundUploadStatus.classList.add('text-red-600');
    }
});

deleteAllMessagesBtn.addEventListener('click', async () => {
    if (confirm('آیا از حذف تمام پیام‌ها در چت عمومی مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
        const originalText = deleteAllMessagesBtn.textContent;
        settingsOkBtn.disabled = true;
        settingsCancelBtn.disabled = true;
        deleteAllMessagesBtn.disabled = true;
        clearStudioCacheBtn.disabled = true;
        deleteAllMessagesBtn.textContent = 'در حال حذف...';

        try {
            const messagesCol = collection(db, 'rooms', GLOBAL_CHAT_ROOM_ID, 'messages');
            const snapshot = await getDocs(messagesCol);
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit(); // Clear Firestore
            alert('تمام پیام‌ها با موفقیت حذف شدند.');
            messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">هنوز پیامی در این گفتگو وجود ندارد.</li>';
        } catch (error) {
            console.error("Error deleting all messages:", error);
            alert('خطا در حذف پیام‌ها.');
        } finally {
            deleteAllMessagesBtn.textContent = originalText;
            settingsOkBtn.disabled = false;
            settingsCancelBtn.disabled = false;
            deleteAllMessagesBtn.disabled = false;
            clearStudioCacheBtn.disabled = false;
            showView(lastActiveViewId); // Close settings modal
        }
    }
});

clearStudioCacheBtn.addEventListener('click', async () => {
    if (confirm('آیا از پاکسازی تمام جایگاه‌های استدیو مطمئن هستید؟ این کار ممکن است تماس‌های فعال را قطع کند.')) {
        const originalText = clearStudioCacheBtn.textContent;
        settingsOkBtn.disabled = true;
        settingsCancelBtn.disabled = true;
        deleteAllMessagesBtn.disabled = true;
        clearStudioCacheBtn.disabled = true;
        clearStudioCacheBtn.textContent = 'در حال پاکسازی...';

        try {
            const slotsRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots');
            const snapshot = await getDocs(slotsRef);
            if (snapshot.empty) {
                alert('استدیو از قبل خالی بود.');
            } else {
                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                alert('استدیو با موفقیت پاکسازی شد.');
            }
        } catch (error) {
            console.error("Error clearing studio slots:", error);
            alert('خطا در پاکسازی استدیو.');
        } finally {
            clearStudioCacheBtn.textContent = originalText;
            settingsOkBtn.disabled = false;
            settingsCancelBtn.disabled = false;
            deleteAllMessagesBtn.disabled = false;
            clearStudioCacheBtn.disabled = false;
        }
    }
});

const performHardUpdate = async () => {
    updateStatusText.textContent = 'در حال به‌روزرسانی...';
    updateStatusText.className = 'text-sm text-center h-4 text-blue-600';
    if(settingsModal.classList.contains('view-hidden')) {
        // This case is for automatic update on start
        alert('نسخه جدیدی از برنامه نصب خواهد شد. برنامه مجددا راه‌اندازی می‌شود.');
    } else {
        // This case is for manual update from settings
        updateAppBtn.disabled = true;
        settingsOkBtn.disabled = true;
        settingsCancelBtn.disabled = true;
    }

    try {
        const preservedUsername = localStorage.getItem(USERNAME_KEY);
        const preservedAvatar = localStorage.getItem(USER_AVATAR_KEY);
        const preservedUserId = localStorage.getItem(USER_ID_KEY);
        const preservedAccessKey = localStorage.getItem(APP_ACCESS_KEY);

        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }

        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        
        localStorage.clear();

        if (preservedUsername) localStorage.setItem(USERNAME_KEY, preservedUsername);
        if (preservedAvatar) localStorage.setItem(USER_AVATAR_KEY, preservedAvatar);
        if (preservedUserId) localStorage.setItem(USER_ID_KEY, preservedUserId);
        if (preservedAccessKey) localStorage.setItem(APP_ACCESS_KEY, preservedAccessKey);
        
        window.location.reload(true);

    } catch (error) {
        console.error('Hard update failed:', error);
        const errorMsg = 'به‌روزرسانی ناموفق بود. لطفاً صفحه را رفرش کنید.';
        if (!settingsModal.classList.contains('view-hidden')) {
            updateStatusText.textContent = errorMsg;
            updateStatusText.className = 'text-sm text-center h-4 text-red-500';
            updateAppBtn.disabled = false;
            settingsOkBtn.disabled = false;
            settingsCancelBtn.disabled = false;
        } else {
            alert(errorMsg);
        }
    }
};

updateAppBtn.addEventListener('click', async () => {
    const confirmation = confirm(
        'این کار تمام اطلاعات برنامه (بجز پروفایل) را پاک کرده و آن را مجدداً بارگیری می‌کند تا آخرین نسخه را دریافت کنید. آیا مطمئن هستید؟'
    );
    if (confirmation) {
        await performHardUpdate();
    }
});

settingsBtn.addEventListener('click', () => {
    initialSettingsState = {
        staticBg: currentStaticBackground
    };
    
    changeUsernameInput.value = currentUsername;
    userAvatarPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
    applyFontSize(currentFontSize);
    applyGlassModeSelection(currentGlassMode);
    applySendWithEnterSelection(currentSendWithEnter);
    
    tempStaticBackground = null;
    backgroundImageInput.value = '';
    backgroundUploadStatus.textContent = '';
    updateStatusText.textContent = '';


    showView('settings-modal');
});

settingsCancelBtn.addEventListener('click', () => {
    applyBackgroundSettings(initialSettingsState.staticBg);
    showView(lastActiveViewId);
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

    let settingsChanged = false;

    if (newUsername && newUsername !== currentUsername) {
        userUpdates.username = newUsername;
        settingsChanged = true;
    }

    if (currentUserAvatar !== localStorage.getItem(USER_AVATAR_KEY)) {
        userUpdates.avatarUrl = currentUserAvatar;
        settingsChanged = true;
    }

    try {
        if (settingsChanged) {
            await updateDoc(doc(db, 'users', currentUserId), userUpdates);
            if(userUpdates.username) {
                currentUsername = userUpdates.username;
                localStorage.setItem(USERNAME_KEY, currentUsername);
            }
            if(userUpdates.avatarUrl) {
                 localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar);
            }
            // Update profile cache
            profileCache.set(currentUserId, { userId: currentUserId, username: currentUsername, avatarUrl: currentUserAvatar });
        }

        // Save other settings to localStorage
        localStorage.setItem(FONT_SIZE_KEY, currentFontSize);
        localStorage.setItem(GLASS_MODE_KEY, currentGlassMode);
        localStorage.setItem(SEND_WITH_ENTER_KEY, currentSendWithEnter);
        
        if(tempStaticBackground) {
            currentStaticBackground = tempStaticBackground;
            localStorage.setItem(STATIC_BACKGROUND_KEY, currentStaticBackground);
        }

    } catch (error) {
        console.error("Error saving settings:", error);
        alert('خطا در ذخیره تنظیمات.');
    } finally {
        showView(lastActiveViewId);
    }
});


// --- Video Call Logic ---

const updateMediaButtonsUI = () => {
    const micUse = toggleMicBtn.querySelector('use');
    const camUse = toggleCameraBtn.querySelector('use');

    micUse.setAttribute('href', isMicOn ? '#mic-on-svg' : '#mic-off-svg');
    toggleMicBtn.classList.toggle('bg-red-500', !isMicOn);
    toggleMicBtn.classList.toggle('bg-white/40', isMicOn);
     
    const hasAudioTrack = localStream && localStream.getAudioTracks().length > 0;
    toggleMicBtn.disabled = !hasAudioTrack;

    camUse.setAttribute('href', isCameraOn ? '#camera-on-svg' : '#camera-off-svg');
    toggleCameraBtn.classList.toggle('bg-red-500', !isCameraOn);
    toggleCameraBtn.classList.toggle('bg-white/40', isCameraOn);
    
    const hasVideoTrack = localStream && localStream.getVideoTracks().length > 0;
    toggleCameraBtn.disabled = !hasVideoTrack;
};

const toggleMediaTrack = (type, enabled) => {
    if (localStream) {
        const tracks = type === 'video' 
            ? localStream.getVideoTracks() 
            : localStream.getAudioTracks();
        if (tracks.length > 0) {
            tracks[0].enabled = enabled;
        }
    }
};

toggleMicBtn.addEventListener('click', () => {
    if (toggleMicBtn.disabled) return;
    isMicOn = !isMicOn;
    toggleMediaTrack('audio', isMicOn);
    updateMediaButtonsUI();
});

toggleCameraBtn.addEventListener('click', () => {
    if (toggleCameraBtn.disabled) return;
    isCameraOn = !isCameraOn;
    toggleMediaTrack('video', isCameraOn);
    updateMediaButtonsUI();
});

const setupLocalMedia = async () => {
    try {
        // Try with both video and audio
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        isMicOn = true;
        isCameraOn = true;
    } catch (error) {
        console.warn("Could not get video and audio, trying audio only.", error);
        try {
            // Fallback to audio only
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            isMicOn = true;
            isCameraOn = false;
        } catch (audioError) {
            console.error("Could not get any media devices.", audioError);
            localStream = null;
            isMicOn = false;
            isCameraOn = false;
            alert('دسترسی به دوربین و میکروفون ممکن نیست. شما به عنوان تماشاگر وارد می‌شوید.');
        }
    }
    updateMediaButtonsUI();
};

const updateVideoSlot = async (slotId, slotData) => {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;

    const userId = slotData.userId;
    const { username, avatarUrl } = await getUserProfile(userId);

    const setupNameButton = (container) => {
        let nameBtn = container.querySelector('.name-btn');
        if (!nameBtn) {
            nameBtn = document.createElement('button');
            nameBtn.className = 'name-btn bg-black/40 text-white text-sm px-2 py-1 rounded-lg backdrop-blur-sm z-10';
            container.appendChild(nameBtn);
        }
        nameBtn.textContent = username;
        return nameBtn;
    };

    if (userId === currentUserId) {
        if (!localStream) return;
        let videoEl = slotEl.querySelector('video');
        if (!videoEl) {
            slotEl.innerHTML = '';
            videoEl = document.createElement('video');
            videoEl.muted = true;
            videoEl.playsInline = true;
            videoEl.className = 'w-full h-full object-cover rounded-2xl bg-gray-800 transform -scale-x-100';
            slotEl.appendChild(videoEl);
            videoEl.srcObject = localStream;
            videoEl.play().catch(e => console.error("Local video play failed", e));
        }
        const nameBtn = setupNameButton(slotEl);
        nameBtn.classList.add('absolute', 'bottom-2', 'left-2');
    } else { // Remote user
        if (slotEl.dataset.userId === userId) {
            const nameBtn = setupNameButton(slotEl); // User is already in this slot, just update name if needed
            if (!nameBtn.classList.contains('absolute')) {
                 nameBtn.classList.add('absolute', 'bottom-2', 'left-2');
            }
            return;
        }

        // New user for this slot, set up loading state
        slotEl.innerHTML = '';
        slotEl.dataset.userId = userId;
        slotEl.className = 'video-slot bg-gray-700/50 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center gap-2';
        
        const videoEl = document.createElement('video');
        videoEl.playsInline = true;
        videoEl.className = 'w-full h-full object-cover absolute inset-0 hidden';
        slotEl.appendChild(videoEl);

        const spinnerTemplate = document.getElementById('loading-spinner').querySelector('svg');
        const spinner = spinnerTemplate.cloneNode(true);
        spinner.classList.add('loading-spinner-video', 'w-10', 'h-10', 'text-white');
        slotEl.appendChild(spinner);
        
        const nameBtn = setupNameButton(slotEl);
        // nameBtn's position will be handled by flexbox for now

        if (!peerConnections[userId]) {
            const pc = new RTCPeerConnection(stunServers);
            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            }

            pc.ontrack = event => {
                if (videoEl.srcObject) return; // Already handling stream
                videoEl.srcObject = event.streams[0];
                videoEl.play().catch(e => console.error("Remote video play failed", e));
                
                // Transition from loading to video
                slotEl.classList.remove('flex', 'flex-col', 'items-center', 'justify-center', 'gap-2');
                videoEl.classList.remove('hidden');
                spinner.remove();
                nameBtn.classList.add('absolute', 'bottom-2', 'left-2');
            };

            pc.onicecandidate = event => {
                if (event.candidate) {
                    const signalDoc = doc(collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'signaling'));
                    setDoc(signalDoc, {
                        from: currentUserId,
                        to: userId,
                        candidate: event.candidate.toJSON()
                    });
                }
            };
            
            peerConnections[userId] = pc;
            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const signalDoc = doc(collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'signaling'));
            await setDoc(signalDoc, {
                from: currentUserId,
                to: userId,
                offer: { type: offer.type, sdp: offer.sdp }
            });
        }
    }
};

const cleanUpVideoCall = async () => {
    // Stop local media
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    // Close peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};
    // Unsubscribe from Firestore listeners
    videoCallListeners.forEach(unsub => unsub());
    videoCallListeners = [];
    // Leave my slot
    if (myVideoSlotId) {
        try {
            await deleteDoc(doc(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots', myVideoSlotId));
        } catch(e) { console.error("Error deleting my slot:", e); }
        myVideoSlotId = null;
    }
    // Clear video grid
    document.querySelectorAll('.video-slot').forEach(el => {
        el.innerHTML = '';
        el.className = el.id.includes('1') || el.id.includes('2') ? 'video-slot row-span-2' : 'video-slot';
        delete el.dataset.userId;
    });
};

const setupPeerConnectionsForExistingUsers = async () => {
    const slotsRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots');
    const q = query(slotsRef, where('userId', '!=', currentUserId));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        const userId = doc.data().userId;
        if (userId && !peerConnections[userId]) {
            // The logic in updateVideoSlot will handle creating the peer connection
            updateVideoSlot(doc.id, doc.data());
        }
    });
};

const enterVideoCallRoom = async () => {
    if (currentRoomId === VIDEO_CALL_ROOM_ID) return;
    currentRoomId = VIDEO_CALL_ROOM_ID;

    await setupLocalMedia();
    
    // Listen for slots
    const slotsRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots');
    const slotsUnsub = onSnapshot(slotsRef, (snapshot) => {
        const occupiedSlots = new Set();
        snapshot.docChanges().forEach((change) => {
            const slotId = change.doc.id;
            const slotData = change.doc.data();
            occupiedSlots.add(slotId);
            if (change.type === "added" || change.type === "modified") {
                if (slotData.userId) {
                    updateVideoSlot(slotId, slotData);
                }
            } else if (change.type === "removed") {
                const slotEl = document.getElementById(slotId);
                const removedUserId = slotData.userId;
                if (slotEl) {
                    slotEl.innerHTML = '';
                    delete slotEl.dataset.userId;
                }
                if (peerConnections[removedUserId]) {
                    peerConnections[removedUserId].close();
                    delete peerConnections[removedUserId];
                }
            }
        });
        // Clear slots that are no longer in the collection
        for (let i = 1; i <= NUM_VIDEO_SLOTS; i++) {
            const slotId = `video-slot-${i}`;
            if (!occupiedSlots.has(slotId)) {
                const slotEl = document.getElementById(slotId);
                if (slotEl && slotEl.dataset.userId) {
                    const removedUserId = slotEl.dataset.userId;
                     if (peerConnections[removedUserId]) {
                        peerConnections[removedUserId].close();
                        delete peerConnections[removedUserId];
                    }
                    slotEl.innerHTML = '';
                    delete slotEl.dataset.userId;
                }
            }
        }
    });
    videoCallListeners.push(slotsUnsub);
    
    // Occupy a slot if we have media
    if (localStream) {
        const slotsSnapshot = await getDocs(slotsRef);
        const occupiedSlotIds = new Set(slotsSnapshot.docs.map(d => d.id));
        let emptySlotId = null;
        for (let i = 1; i <= NUM_VIDEO_SLOTS; i++) {
            const slotId = `video-slot-${i}`;
            if (!occupiedSlotIds.has(slotId)) {
                emptySlotId = slotId;
                break;
            }
        }

        if (emptySlotId) {
            myVideoSlotId = emptySlotId;
            const slotDoc = doc(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots', myVideoSlotId);
            await setDoc(slotDoc, { userId: currentUserId, joinedAt: serverTimestamp() });
            await setupPeerConnectionsForExistingUsers();
        } else {
            alert('استدیو پر است. شما به عنوان تماشاگر وارد می‌شوید.');
            // Stop own media if spectator
            if(localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
        }
    }

    // Listen for signaling
    const signalingRef = collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'signaling');
    const signalingQuery = query(signalingRef, where('to', '==', currentUserId));
    const signalingUnsub = onSnapshot(signalingQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const signal = change.doc.data();
                const remoteUserId = signal.from;
                
                if (!peerConnections[remoteUserId]) {
                    // This can happen if the offer arrives before the slot update
                    // We can choose to ignore or pre-emptively create a connection
                    console.warn(`Received signal from unknown user ${remoteUserId}. Awaiting slot update.`);
                    return;
                }

                const pc = peerConnections[remoteUserId];
                if (!pc) return;

                if (signal.offer && !pc.currentRemoteDescription) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    const signalDoc = doc(collection(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'signaling'));
                    await setDoc(signalDoc, {
                        from: currentUserId,
                        to: remoteUserId,
                        answer: { type: answer.type, sdp: answer.sdp }
                    });
                } else if (signal.answer && !pc.currentRemoteDescription) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
                } else if (signal.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } catch (e) {
                        console.error('Error adding received ICE candidate', e);
                    }
                }
                // Delete signal doc after processing
                await deleteDoc(change.doc.ref);
            }
        });
    });
    videoCallListeners.push(signalingUnsub);
};

// --- Chat Room Logic ---
const enterChatRoom = (roomId, roomData) => {
    if (currentRoomId === roomId) return;
    currentRoomId = roomId;

    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }
    messagesList.innerHTML = '';
    oldestMessageDoc = null;
    reachedEndOfMessages = false;
    
    loadInitialMessages(roomId);

    const messagesCol = collection(db, 'rooms', roomId, 'messages');
    let q = query(messagesCol, orderBy('timestamp', 'desc'), limit(1));

    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const messageData = change.doc.data();
                if (!messageData.timestamp || messageData.timestamp.toMillis() > (oldestMessageDoc?.data().timestamp.toMillis() || 0)) {
                    if (document.getElementById(`msg-${change.doc.id}`)) return;
                    
                    const wasScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 150;
                    appendMessage(change.doc.id, messageData);
                    if (messageData.userId !== currentUserId) {
                        // Logic for notifications could go here
                    } else {
                        sendSound.play().catch(e => console.log("sound play failed"));
                    }
                    if (wasScrolledToBottom) {
                        scrollToBottom();
                    }
                }
            }
        });
    });
};

const appendMessage = async (id, data, prepend = false) => {
    if (!data.timestamp) return;

    const { userId, text, fileUrl, fileType, fileName, timestamp } = data;
    const { username, avatarUrl } = await getUserProfile(userId);
    const messageDate = timestamp.toDate();
    const isMe = userId === currentUserId;

    const li = document.createElement('li');
    li.id = `msg-${id}`;

    // Date separator
    const lastMessageEl = prepend ? messagesList.firstChild : messagesList.lastChild;
    let needsDateSeparator = true;
    if (lastMessageEl) {
        const lastTimestamp = parseInt(lastMessageEl.dataset.timestamp, 10);
        const lastDate = new Date(lastTimestamp);
        if (lastDate.toDateString() === messageDate.toDateString()) {
            needsDateSeparator = false;
        }
    }
    if (needsDateSeparator) {
        const dateSeparator = document.createElement('li');
        dateSeparator.className = 'text-center text-xs text-gray-500 my-4';
        dateSeparator.innerHTML = formatDateSeparator(messageDate);
        dateSeparator.dataset.timestamp = messageDate.getTime();
        if (prepend) {
            messagesList.prepend(dateSeparator);
        } else {
            messagesList.appendChild(dateSeparator);
        }
    }

    let fileContent = '';
    if (fileUrl && fileType) {
        if (fileType.startsWith('image/')) {
            fileContent = `<img src="${fileUrl}" alt="${fileName || 'image'}" class="mt-2 rounded-lg max-w-full h-auto cursor-pointer" onclick="window.open('${fileUrl}', '_blank')">`;
        } else {
            fileContent = `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="mt-2 block bg-gray-200 p-3 rounded-lg hover:bg-gray-300">
                <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path></svg>
                    <span class="truncate text-gray-800 font-medium">${fileName || 'فایل ضمیمه'}</span>
                </div>
            </a>`;
        }
    }

    const messageHtml = `
        <div class="flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}">
            <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer user-avatar-trigger" data-user-id="${userId}" data-username="${username}">
                ${generateAvatar(username, avatarUrl)}
            </div>
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <div class="px-4 py-2 rounded-2xl max-w-xs md:max-w-md ${isMe ? 'bg-green-400 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}">
                    <p class="font-bold text-sm mb-1 ${isMe ? 'text-right' : 'text-left'}">${isMe ? 'شما' : username}</p>
                    <p class="message-text whitespace-pre-wrap break-words">${text || ''}</p>
                    ${fileContent}
                </div>
                <span class="text-xs text-gray-500 mt-1">${formatTime(messageDate)}</span>
            </div>
        </div>
    `;

    li.innerHTML = messageHtml;
    li.className = 'my-2';
    li.dataset.timestamp = messageDate.getTime();
    if (prepend) {
        messagesList.prepend(li);
    } else {
        messagesList.appendChild(li);
    }
};

const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || reachedEndOfMessages || !currentRoomId) return;

    isLoadingOlderMessages = true;
    loadingSpinner.classList.remove('hidden');

    const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
    let q;
    if (oldestMessageDoc) {
        q = query(messagesCol, orderBy('timestamp', 'desc'), startAfter(oldestMessageDoc), limit(MESSAGES_PER_PAGE));
    } else {
        // This case should not be hit if initial load is handled separately
        q = query(messagesCol, orderBy('timestamp', 'desc'), limit(MESSAGES_PER_PAGE));
    }

    try {
        const snapshot = await getDocs(q);
        const oldScrollHeight = messagesContainer.scrollHeight;

        if (snapshot.empty) {
            reachedEndOfMessages = true;
            if(messagesList.getElementsByTagName('li').length > 0) {
                 messagesList.insertAdjacentHTML('afterbegin', '<li class="text-center text-gray-500 p-4">شما به ابتدای گفتگو رسیده‌اید.</li>');
            } else {
                 messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">هنوز پیامی در این گفتگو وجود ندارد.</li>';
            }
        } else {
            snapshot.docs.forEach(doc => {
                appendMessage(doc.id, doc.data(), true);
            });
            oldestMessageDoc = snapshot.docs[snapshot.docs.length - 1];
            messagesContainer.scrollTop = messagesContainer.scrollHeight - oldScrollHeight;
        }
    } catch (error) {
        console.error("Error loading older messages: ", error);
    } finally {
        isLoadingOlderMessages = false;
        loadingSpinner.classList.add('hidden');
    }
};

const loadInitialMessages = async (roomId) => {
    messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">در حال بارگیری پیام‌ها...</li>';
    
    const messagesCol = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(MESSAGES_PER_PAGE));
    
    try {
        const snapshot = await getDocs(q);
        messagesList.innerHTML = ''; 

        if (snapshot.empty) {
            messagesList.innerHTML = '<li class="text-center text-gray-500 p-4">هنوز پیامی در این گفتگو وجود ندارد.</li>';
            return;
        }
            
        const firestoreMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        firestoreMessages.forEach(msg => appendMessage(msg.id, msg));
            
        oldestMessageDoc = snapshot.docs[snapshot.docs.length - 1];
        scrollToBottom();
        
    } catch (error) {
        console.error("Error loading initial messages:", error);
         messagesList.innerHTML = '<li class="text-center text-red-500 p-4">خطا در بارگیری پیام‌ها.</li>';
    }
};

const compressImage = (file, maxSize) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality JPEG
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};


const sendMessage = async () => {
    const text = messageInput.value.trim();
    if (text === '' && !fileToUpload) return;
    
    const originalText = text;
    const originalFile = fileToUpload;

    // Immediately clear input and disable send button
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    fileToUpload = null;

    try {
        const messagesCol = collection(db, 'rooms', currentRoomId, 'messages');
        const messageData = {
            userId: currentUserId,
            text: originalText,
            timestamp: serverTimestamp(),
        };

        if (originalFile) {
            // In a real app, you would upload to Firebase Storage here and get a URL.
            // For simplicity, we'll use a data URL for images and a placeholder for other files.
             if (originalFile.type.startsWith('image/')) {
                messageData.fileUrl = await compressImage(originalFile, IMAGE_MAX_DIMENSION);
            } else {
                 messageData.fileUrl = URL.createObjectURL(originalFile); // This is temporary
            }
            messageData.fileType = originalFile.type;
            messageData.fileName = originalFile.name;
        }

        await addDoc(messagesCol, messageData);

    } catch (error) {
        console.error("Error sending message: ", error);
        alert('خطا در ارسال پیام.');
        // Restore input if sending failed
        messageInput.value = originalText;
        fileToUpload = originalFile;
        sendButton.disabled = false;
    }
};

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (currentSendWithEnter === 'on' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener('input', () => {
    sendButton.disabled = messageInput.value.trim() === '' && !fileToUpload;
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight) + 'px';
});

// --- File Handling ---
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset for next selection
    fileInput.value = ''; 
    
    if (file.size > MAX_FILE_SIZE && !file.type.startsWith('image/')) {
        alert(`فایل بزرگتر از 5MB است. حجم فایل: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
    }
    
    fileToUpload = file;
    filePreviewContainer.innerHTML = ''; // Clear previous preview

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'max-w-full max-h-48 object-contain';
            filePreviewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    } else {
        filePreviewContainer.innerHTML = `<div class="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-gray-500 mx-auto" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path></svg>
            <p class="mt-2 text-gray-700 font-semibold truncate">${file.name}</p>
        </div>`;
    }
    
    fileConfirmStatus.textContent = "برای ارسال تایید کنید.";
    showView('file-confirm-modal');
});

cancelFileUploadBtn.addEventListener('click', () => {
    fileToUpload = null;
    sendButton.disabled = messageInput.value.trim() === '';
    showView(lastActiveViewId);
});

confirmFileUploadBtn.addEventListener('click', () => {
    // File is already in fileToUpload, just need to enable send and close modal
    sendButton.disabled = false;
    showView(lastActiveViewId);
    // Combine file with any text in the input and send
    sendMessage();
});


// --- Scroll Handling ---
messagesContainer.addEventListener('scroll', () => {
    if (messagesContainer.scrollTop === 0) {
        loadOlderMessages();
    }
    const isScrolled = messagesContainer.scrollHeight > messagesContainer.clientHeight &&
                       messagesContainer.scrollTop < messagesContainer.scrollHeight - messagesContainer.clientHeight - 150;

    if (isScrolled) {
        scrollToBottomBtn.classList.remove('opacity-0', 'view-hidden');
    } else {
        scrollToBottomBtn.classList.add('opacity-0', 'view-hidden');
    }
});
scrollToBottomBtn.addEventListener('click', () => scrollToBottom('smooth'));


// --- User Profile/Avatar Modals ---
messagesList.addEventListener('click', async (e) => {
    const avatarTrigger = e.target.closest('.user-avatar-trigger');
    if (!avatarTrigger) return;
    
    const userId = avatarTrigger.dataset.userId;
    if (!userId) return;

    if (userId === currentUserId) {
        // Show modal to change own avatar
        userAvatarInChatPreview.innerHTML = generateAvatar(currentUsername, currentUserAvatar);
        userAvatarInChatInput.value = '';
        changeUserAvatarInChatStatus.textContent = '';
        showView('change-user-avatar-in-chat-modal');
    } else {
        // Show modal to view other user's avatar
        const { username, avatarUrl } = await getUserProfile(userId);
        viewAvatarName.textContent = username;
        viewAvatarDisplay.innerHTML = generateAvatar(username, avatarUrl);
        showView('view-avatar-modal');
    }
});

closeViewAvatarModalBtn.addEventListener('click', () => showView(lastActiveViewId));
changeUserAvatarInChatModal.querySelector('.cancel-btn').addEventListener('click', () => showView(lastActiveViewId));

userAvatarInChatInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        changeUserAvatarInChatStatus.textContent = 'در حال پردازش...';
        const compressedAvatar = await compressImage(file, AVATAR_MAX_DIMENSION);
        userAvatarInChatPreview.innerHTML = generateAvatar(currentUsername, compressedAvatar);
        changeUserAvatarInChatStatus.textContent = 'برای ذخیره تایید را بزنید.';
    } catch (error) {
        console.error("Error compressing avatar in-chat:", error);
        changeUserAvatarInChatStatus.textContent = 'خطا در پردازش تصویر.';
    }
});

changeUserAvatarInChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newAvatarDataUrl = userAvatarInChatPreview.querySelector('img')?.src;
    if (!newAvatarDataUrl || newAvatarDataUrl === currentUserAvatar) {
        showView(lastActiveViewId);
        return;
    }
    
    try {
        changeUserAvatarInChatStatus.textContent = 'در حال ذخیره...';
        currentUserAvatar = newAvatarDataUrl;
        await updateDoc(doc(db, 'users', currentUserId), { avatarUrl: currentUserAvatar });
        localStorage.setItem(USER_AVATAR_KEY, currentUserAvatar);
        profileCache.set(currentUserId, { userId: currentUserId, username: currentUsername, avatarUrl: currentUserAvatar });
        showView(lastActiveViewId);
        // We don't need to re-render all messages, new ones will have the new avatar.
    } catch (error) {
        console.error("Error updating avatar:", error);
        changeUserAvatarInChatStatus.textContent = 'خطا در ذخیره.';
    }
});


// --- App Initialization Logic ---
const initApp = async () => {
    // Automatic update check on startup
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                             if (confirm('نسخه جدیدی از برنامه موجود است. برای نصب، تایید کنید.')) {
                                 installingWorker.postMessage({ action: 'SKIP_WAITING' });
                                 performHardUpdate();
                             }
                        }
                    };
                };
            }
        });
    }

    // Check for saved user credentials
    const savedAccess = localStorage.getItem(APP_ACCESS_KEY);
    if (savedAccess === CREATOR_PASSWORD) {
        currentUsername = localStorage.getItem(USERNAME_KEY);
        currentUserAvatar = localStorage.getItem(USER_AVATAR_KEY);
        mainContentWrapper.classList.remove('view-hidden');
        globalNav.classList.remove('view-hidden');
    } else {
        showView('username-modal');
        return;
    }

    // Apply saved settings
    currentFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'md';
    currentGlassMode = localStorage.getItem(GLASS_MODE_KEY) || 'off';
    currentSendWithEnter = localStorage.getItem(SEND_WITH_ENTER_KEY) || 'on';
    currentStaticBackground = localStorage.getItem(STATIC_BACKGROUND_KEY);

    applyFontSize(currentFontSize);
    applyGlassModeSelection(currentGlassMode);
    applySendWithEnterSelection(currentSendWithEnter);
    applyBackgroundSettings(currentStaticBackground);

    // Initial setup
    await switchTab('chat');
    isInitialLoad = false;
};

usernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = initialPasswordInput.value;
    const username = usernameInput.value.trim();

    if (password !== CREATOR_PASSWORD) {
        alert('رمز برنامه اشتباه است!');
        return;
    }
    if (!username) {
        alert('لطفا یک نام کاربری وارد کنید.');
        return;
    }
    
    let avatarDataUrl = null;
    const avatarFile = initialUserAvatarInput.files[0];
    if (avatarFile) {
        try {
            avatarDataUrl = await compressImage(avatarFile, AVATAR_MAX_DIMENSION);
        } catch (error) {
            console.error("Error compressing initial avatar:", error);
            alert("خطا در پردازش تصویر پروفایل.");
            return;
        }
    }

    currentUsername = username;
    currentUserAvatar = avatarDataUrl;

    localStorage.setItem(APP_ACCESS_KEY, password);
    localStorage.setItem(USERNAME_KEY, username);
    if (avatarDataUrl) {
        localStorage.setItem(USER_AVATAR_KEY, avatarDataUrl);
    }

    try {
        await setDoc(doc(db, 'users', currentUserId), {
            username: currentUsername,
            avatarUrl: currentUserAvatar
        }, { merge: true });
        
        profileCache.set(currentUserId, {userId: currentUserId, username: currentUsername, avatarUrl: currentUserAvatar});

    } catch (error) {
        console.error("Error saving user profile to Firestore:", error);
    }
    
    showView(lastActiveViewId);
    initApp(); // Re-initialize after login
});

initialUserAvatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const compressedAvatar = await compressImage(file, AVATAR_MAX_DIMENSION);
        initialUserAvatarPreview.innerHTML = `<img src="${compressedAvatar}" class="w-full h-full object-cover">`;
    } catch (error) {
        console.error("Error processing initial avatar preview:", error);
    }
});


document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('beforeunload', async () => {
    if (currentRoomId === VIDEO_CALL_ROOM_ID && myVideoSlotId) {
       await deleteDoc(doc(db, 'videoRooms', VIDEO_CALL_ROOM_ID, 'slots', myVideoSlotId));
    }
});