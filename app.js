// State Management
const state = {
    activeTab: 'view-community',
    activeSubsection: 'messages',
    isNSFW: false,
    isIncognito: false,
    userRank: 'Pack Dawg', // 'Mutt' or 'Pack Dawg'
    notificationMode: 'Both', // 'Both', 'Classic', 'Modern'
    chatMessageCount: 0,
    chatCooldownActive: false,
    packPoints: 4.25,
    hasUnreadPack: true,
    hasUnreadMind: true
};

// Subsections Registry
const subsections = {
    'view-community': [],
    'view-pack': ['messages', 'chat', 'wall', 'events', 'havens'],
    'view-body': ['nutrition', 'exercise'],
    'view-mind': ['checklist', 'modules', 'sounds', 'secrets']
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUserMenu();
    initMap();
    initChatSystem();
    initSlideToBlock();
    initModals();
    initSettings();
    updateNotificationVisibility();
});

// Navigation & Tab Switching
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            
            // Handle Proactive Notification Auto-Jump Cycle
            if (target === 'view-mind' && state.hasUnreadMind) {
                switchTab('view-mind');
                switchSubsection('view-mind', 'checklist');
                state.hasUnreadMind = false;
                document.getElementById('dot-mind').classList.add('hidden');
                return;
            }

            if (target === 'view-pack' && state.hasUnreadPack) {
                switchTab('view-pack');
                switchSubsection('view-pack', 'messages');
                state.hasUnreadPack = false;
                document.getElementById('dot-pack').classList.add('hidden');
                return;
            }

            switchTab(target);
        });
    });

    // Subsection Pill Toggle
    const pillBtn = document.getElementById('subsection-pill-btn');
    const dropdown = document.getElementById('subsection-dropdown');
    
    pillBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        dropdown.classList.add('hidden');
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const targetView = document.getElementById(tabId);
    if (targetView) targetView.classList.add('active');

    const activeNav = document.querySelector(`.nav-item[data-target="${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update Subsections Header Pill
    const pillText = document.getElementById('pill-text');
    const pillBtn = document.getElementById('subsection-pill-btn');

    if (subsections[tabId].length > 0) {
        pillBtn.classList.remove('hidden');
        switchSubsection(tabId, subsections[tabId][0]);
    } else {
        pillBtn.classList.add('hidden');
    }
}

function switchSubsection(tabId, subId) {
    state.activeSubsection = subId;
    const pillText = document.getElementById('pill-text');
    pillText.innerText = subId.charAt(0).toUpperCase() + subId.slice(1);

    // Hide all subviews inside this view
    const parentView = document.getElementById(tabId);
    if (parentView) {
        parentView.querySelectorAll('.subview').forEach(el => el.classList.add('hidden'));
        const activeSub = document.getElementById(`subview-${tabId.replace('view-', '')}-${subId}`);
        if (activeSub) activeSub.classList.remove('hidden');
    }

    // Populate Dropdown
    const dropdown = document.getElementById('subsection-dropdown');
    dropdown.innerHTML = '';
    subsections[tabId].forEach(sub => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerText = sub.charAt(0).toUpperCase() + sub.slice(1);
        item.addEventListener('click', () => {
            switchSubsection(tabId, sub);
        });
        dropdown.appendChild(item);
    });
}

// User Menu & Global Toggles
function initUserMenu() {
    const avatarBtn = document.getElementById('avatar-menu-btn');
    const overlay = document.getElementById('user-menu-overlay');
    const closeBtn = document.getElementById('close-user-menu');
    const nsfwToggle = document.getElementById('toggle-global-nsfw');

    avatarBtn.addEventListener('click', () => {
        overlay.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
    });

    document.getElementById('menu-my-profile').addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('hidden');
        switchTab('view-profile');
    });

    document.getElementById('menu-settings').addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('hidden');
        switchTab('view-settings');
    });

    nsfwToggle.addEventListener('change', (e) => {
        if (state.userRank === 'Mutt') {
            alert('Global NSFW mode is locked for Mutt rank. Verify ID to unlock.');
            e.target.checked = false;
            return;
        }
        state.isNSFW = e.target.checked;
        applyNSFWMode();
    });

    document.getElementById('radius-slider').addEventListener('input', (e) => {
        document.getElementById('radius-val').innerText = `${e.target.value} mi`;
    });
}

function applyNSFWMode() {
    const dmHeadspace = document.getElementById('dm-headspace');
    const nsfwMatrix = document.getElementById('nsfw-stats-matrix');
    const nsfwBio = document.getElementById('nsfw-bio-card');
    const tier2Flirts = document.getElementById('tier-2-container');

    if (state.isNSFW) {
        dmHeadspace.innerText = '😈';
        nsfwMatrix.classList.remove('hidden');
        nsfwBio.classList.remove('hidden');
        tier2Flirts.classList.remove('hidden');
    } else {
        dmHeadspace.innerText = '👼';
        nsfwMatrix.classList.add('hidden');
        nsfwBio.classList.add('hidden');
        tier2Flirts.classList.add('hidden');
    }
    renderMapPins();
}

// Map Component Simulation
function initMap() {
    renderMapPins();
    
    document.getElementById('map-filter-trigger').addEventListener('click', () => {
        document.getElementById('map-filter-menu').classList.toggle('hidden');
    });
}

function renderMapPins() {
    const canvas = document.getElementById('map-canvas');
    canvas.innerHTML = '';

    const pins = [
        { name: 'User A', type: 'people', top: '20%', left: '25%', nsfw: false, badge: 'badge-cyan' },
        { name: 'User B', type: 'people', top: '50%', left: '60%', nsfw: true, badge: 'badge-purple' },
        { name: 'Gym Sanctuary', type: 'gyms', top: '75%', left: '30%', nsfw: false, badge: 'badge-amber' }
    ];

    pins.forEach(pin => {
        // Eyes-Only Filter Logic: Hide non-NSFW users in NSFW Hookup mode
        if (state.isNSFW && pin.type === 'people' && !pin.nsfw) {
            return;
        }

        const pinEl = document.createElement('div');
        pinEl.className = `map-pin badge ${pin.badge}`;
        pinEl.style.top = pin.top;
        pinEl.style.left = pin.left;
        pinEl.innerHTML = `${pin.nsfw && state.isNSFW ? '😈' : '👤'} ${pin.name}`;
        
        // Integrity Score Emblem on bottom-left
        const emblem = document.createElement('span');
        emblem.className = 'emblem';
        emblem.innerText = '⭐';
        pinEl.appendChild(emblem);

        pinEl.addEventListener('click', () => {
            switchTab('view-profile');
        });

        canvas.appendChild(pinEl);
    });
}

// Chat & Anti-Spam Safeguards
function initChatSystem() {
    const sendBtn = document.getElementById('public-chat-send-btn');
    const input = document.getElementById('public-chat-input');
    const stream = document.getElementById('public-chat-stream');
    const cooldownBanner = document.getElementById('chat-cooldown-banner');

    sendBtn.addEventListener('click', () => {
        if (state.chatCooldownActive || input.value.trim() === '') return;

        const msg = document.createElement('div');
        msg.className = 'chat-bubble sender';
        msg.innerText = input.value;
        stream.appendChild(msg);
        input.value = '';

        state.chatMessageCount++;

        // 3 consecutive messages triggers 30s cooldown
        if (state.chatMessageCount >= 3) {
            state.chatCooldownActive = true;
            cooldownBanner.classList.remove('hidden');
            setTimeout(() => {
                state.chatCooldownActive = false;
                state.chatMessageCount = 0;
                cooldownBanner.classList.add('hidden');
            }, 30000);
        }
    });
}

// Slide-to-Confirm Block Action UI
function initSlideToBlock() {
    const thumb = document.getElementById('slide-thumb');
    const track = document.getElementById('slide-track');
    let isDragging = false;

    thumb.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        thumb.style.left = '3px';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = track.getBoundingClientRect();
        let offsetX = e.clientX - rect.left - 11;
        if (offsetX < 3) offsetX = 3;
        if (offsetX > rect.width - 25) {
            offsetX = rect.width - 25;
            // Block Action Confirmed
            alert('User @AlphaMarcus has been blocked.');
            document.getElementById('block-modal').classList.add('hidden');
            isDragging = false;
        }
        thumb.style.left = `${offsetX}px`;
    });
}

// Modals Setup
function initModals() {
    document.getElementById('action-block').addEventListener('click', () => {
        document.getElementById('block-modal').classList.remove('hidden');
    });
    document.getElementById('close-block-modal').addEventListener('click', () => {
        document.getElementById('block-modal').classList.add('hidden');
    });

    document.getElementById('action-flirt').addEventListener('click', () => {
        document.getElementById('flirt-modal').classList.remove('hidden');
    });
    document.getElementById('close-flirt-modal').addEventListener('click', () => {
        document.getElementById('flirt-modal').classList.add('hidden');
    });

    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const timestamp = item.getAttribute('data-timestamp');
            document.getElementById('photo-timestamp-display').innerText = `📅 Uploaded: ${timestamp}`;
            document.getElementById('photo-preview-modal').classList.remove('hidden');
        });
    });
    document.getElementById('close-photo-modal').addEventListener('click', () => {
        document.getElementById('photo-preview-modal').classList.add('hidden');
    });

    // Camera Reward Logic
    document.getElementById('in-app-camera-btn').addEventListener('click', () => {
        state.packPoints += 0.01;
        alert(`Photo uploaded! Daily Reward: +0.01 Pack Points earned. Total: ${state.packPoints.toFixed(2)} pts.`);
    });

    // Global Notifications Bell
    document.getElementById('notif-bell').addEventListener('click', () => {
        document.getElementById('notif-drawer-modal').classList.remove('hidden');
    });
    document.getElementById('close-notif-drawer').addEventListener('click', () => {
        document.getElementById('notif-drawer-modal').classList.add('hidden');
    });
}

// Settings & Notification Mode Rules
function initSettings() {
    const select = document.getElementById('notification-style-select');
    select.addEventListener('change', (e) => {
        state.notificationMode = e.target.value;
        updateNotificationVisibility();
    });

    document.getElementById('view-blocked-btn').addEventListener('click', () => {
        switchTab('view-blocked-users');
    });

    document.querySelectorAll('.unblock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.blocked-item').remove();
            alert('User unblocked.');
        });
    });
}

function updateNotificationVisibility() {
    const bell = document.getElementById('notif-bell');
    const dots = document.querySelectorAll('.notif-dot, .pill-dot');

    if (state.notificationMode === 'Classic') {
        bell.classList.remove('hidden');
        dots.forEach(d => d.style.display = 'none');
    } else if (state.notificationMode === 'Modern') {
        bell.classList.add('hidden');
        dots.forEach(d => d.style.display = 'block');
    } else { // 'Both'
        bell.classList.remove('hidden');
        dots.forEach(d => d.style.display = 'block');
    }
}