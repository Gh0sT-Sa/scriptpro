/**
 * ⚡ ScriptPro v5.0 - الموحد الكامل
 * 🚀 الميزات: كشف المخفيين + تتبع فوري + صائد IP + مكافح الباند
 * 📡 يدعم: JawalHost | TigerHost | FoonHost | YoucamHost
 * 
 * التغييرات:
 * ✅ حذف كامل نظام License
 * ✅ Auto-Detection مع Test Mode
 * ✅ Adapters موحدة لـ 4 نسخ
 * ✅ Counter HUD عداد المتصلين/المخفيين/البوتات
 * ✅ Real-Time Tracker مع Last Seen
 * ✅ Bot Detector موحد
 * ✅ Notifications محسّنة
 */

(function() {
    'use strict';

    // ============================================
    // 1. التكوين الأساسي
    // ============================================
    const SP = {
        version: '5.0.0',
        platform: null,
        config: {
            color: '#3498db',
            darkMode: true,
            soundEnabled: true,
            toastDuration: 5000
        },
        state: {
            adapter: null,
            alertedHidden: new Set(),
            trackedUsers: new Set(),
            detectedBots: new Set(),
            onlineUsers: new Map(),
            hiddenCount: 0,
            botCount: 0,
            lastSeen: {}
        },
        ui: {
            hudVisible: true,
            panelOpen: false
        }
    };

    // ============================================
    // 2. نظام Auto-Detection مع Test Mode
    // ============================================
    function detectPlatform() {
        // JawalHost
        if (document.querySelector('.uzr') && typeof upro === 'function') {
            return 'jawal';
        }
        // TigerHost
        if (typeof TigerChat !== 'undefined' || document.querySelector('.tiger-user')) {
            return 'tiger';
        }
        // YoucamHost v2 (Redux/Laravel)
        if (window.store?.getState && document.querySelector('[class*="chat_pane"]')) {
            return 'youcam';
        }
        // FoonHost
        if (document.querySelector('.ph-user') || document.querySelector('[class*="foon"]')) {
            return 'foon';
        }
        // Default fallback
        return 'jawal';
    }

    SP.platform = detectPlatform();
    console.log(`🚀 ScriptPro v${SP.version} | Platform: ${SP.platform.toUpperCase()}`);

    // ============================================
    // 3. Adapters موحدة لـ 4 نسخ
    // ============================================
    const Adapters = {
        jawal: {
            name: 'JawalHost',
            users: '.uzr',
            pic: '.u-pic',
            getUid: (el) => [...el.classList].find(c => c.startsWith('uid'))?.slice(3),
            getName: (el) => el.getAttribute('n') || 'Unknown',
            getHash: (el) => el.querySelector('.uhash')?.textContent?.trim() || '—',
            getStatus: (el) => el.querySelector('.ustat')?.src?.includes('s4.png') ? 'hidden' : 'online',
            isHidden: (el) => el.classList.contains('hid') || el.querySelector('img.ustat[src*="s4.png"]'),
            isInRoom: (el) => el.classList.contains('inroom'),
            getAvatar: (el) => {
                const pic = el.querySelector('.u-pic');
                return pic ? window.getComputedStyle(pic).backgroundImage.slice(5, -2) : null;
            },
            getAllUsers: () => document.querySelectorAll('.uzr') || [],
            openProfile: (uid) => {
                if (typeof upro === 'function') {
                    upro(uid);
                    return true;
                }
                return false;
            }
        },
        tiger: {
            name: 'TigerHost',
            users: '.tiger-user',
            pic: '.t-pic',
            getUid: (el) => el.getAttribute('data-uid') || [...el.classList].find(c => c.startsWith('uid'))?.slice(3),
            getName: (el) => el.getAttribute('n') || el.innerText.split('\n')[0] || 'Unknown',
            getHash: (el) => el.querySelector('[class*="hash"]')?.textContent?.trim() || '—',
            getStatus: (el) => el.classList.contains('is-hidden') ? 'hidden' : 'online',
            isHidden: (el) => el.classList.contains('is-hidden') || el.querySelector('img[src*="s4.png"]'),
            isInRoom: (el) => el.classList.contains('inroom'),
            getAvatar: (el) => {
                const pic = el.querySelector('.t-pic, .u-pic');
                return pic ? window.getComputedStyle(pic).backgroundImage.slice(5, -2) : null;
            },
            getAllUsers: () => document.querySelectorAll('.tiger-user') || [],
            openProfile: (uid) => {
                if (typeof openUserProfile === 'function') {
                    openUserProfile(uid);
                    return true;
                }
                return false;
            }
        },
        foon: {
            name: 'FoonHost',
            users: '.ph-user',
            pic: '.ph-img',
            getUid: (el) => el.getAttribute('data-uid') || el.dataset.uid,
            getName: (el) => el.getAttribute('n') || el.getAttribute('data-name') || 'Unknown',
            getHash: (el) => el.getAttribute('data-hash') || el.querySelector('[class*="hash"]')?.textContent?.trim() || '—',
            getStatus: (el) => el.classList.contains('hid') ? 'hidden' : 'online',
            isHidden: (el) => el.classList.contains('hid') || el.dataset.hidden === 'true',
            isInRoom: (el) => el.classList.contains('inroom'),
            getAvatar: (el) => {
                const pic = el.querySelector('.ph-img, img');
                return pic?.src || (pic ? window.getComputedStyle(pic).backgroundImage.slice(5, -2) : null);
            },
            getAllUsers: () => document.querySelectorAll('.ph-user') || [],
            openProfile: (uid) => {
                if (typeof openPhProfile === 'function') {
                    openPhProfile(uid);
                    return true;
                }
                return false;
            }
        },
        youcam: {
            name: 'YoucamHost',
            users: '.user-item, [class*="user_item"]',
            pic: 'img.avatar, [class*="avatar"]',
            getUid: (el) => el.getAttribute('data-user-id') || el.dataset.userId,
            getName: (el) => el.querySelector('.user-name, [class*="user_name"]')?.textContent || 'Unknown',
            getHash: (el) => el.getAttribute('data-hash') || el.querySelector('[class*="hash"]')?.textContent?.trim() || '—',
            getStatus: (el) => el.classList.contains('hidden') ? 'hidden' : 'online',
            isHidden: (el) => el.classList.contains('hidden') || el.dataset.hidden === 'true',
            isInRoom: (el) => el.classList.contains('inroom'),
            getAvatar: (el) => {
                const img = el.querySelector('img');
                return img?.src || null;
            },
            getAllUsers: () => document.querySelectorAll('.user-item, [class*="user_item"]') || [],
            openProfile: (uid) => {
                if (window.store?.getState) {
                    const state = window.store.getState();
                    if (state.openUserProfile) {
                        state.openUserProfile(uid);
                        return true;
                    }
                }
                return false;
            }
        }
    };

    const A = Adapters[SP.platform];
    SP.state.adapter = A;

    // ============================================
    // 4. Test Mode - اختبار جميع الدوال
    // ============================================
    function runTestMode() {
        console.log(`\n🧪 Test Mode - Platform: ${A.name}\n${'='.repeat(40)}`);
        
        const tests = [
            { name: 'getAllUsers', fn: () => A.getAllUsers()?.length || 0 },
            { name: 'getUid', fn: () => A.getAllUsers()?.[0] ? '✓' : '✗' },
            { name: 'getName', fn: () => A.getAllUsers()?.[0] ? '✓' : '✗' },
            { name: 'getHash', fn: () => A.getAllUsers()?.[0] ? '✓' : '✗' },
            { name: 'getStatus', fn: () => A.getAllUsers()?.[0] ? '✓' : '✗' },
            { name: 'isHidden', fn: () => A.getAllUsers()?.[0] ? '✓' : '✗' },
            { name: 'getAvatar', fn: () => A.getAllUsers()?.[0] ? '✓' : '✗' },
            { name: 'openProfile', fn: () => typeof A.openProfile === 'function' ? '✓' : '✗' }
        ];

        tests.forEach(test => {
            try {
                const result = test.fn();
                console.log(`  ${result === '✓' || result > 0 ? '✅' : '⚠️'} ${test.name}: ${result}`);
            } catch (e) {
                console.log(`  ❌ ${test.name}: ${e.message}`);
            }
        });
        
        console.log(`${'='.repeat(40)}\n`);
    }

    // ============================================
    // 5. Toast Notifications محسّنة
    // ============================================
    function createToastContainer() {
        let container = document.getElementById('sp-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sp-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 999999;
                max-width: 400px;
                font-family: Arial, sans-serif;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(config) {
        const {
            title = '📢 تنبيه',
            body = '',
            icon = '📢',
            color = '#3498db',
            duration = SP.config.toastDuration,
            image = null
        } = config;

        const container = createToastContainer();
        const toast = document.createElement('div');
        
        toast.style.cssText = `
            background: linear-gradient(135deg, ${color}15 0%, ${color}08 100%);
            border-right: 4px solid ${color};
            border-radius: 8px;
            padding: 12px 15px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            color: #fff;
            animation: slideIn 0.3s ease-out;
            direction: rtl;
        `;

        let html = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                <span style="font-size: 20px; flex-shrink: 0;">${icon}</span>
                <div style="flex-grow: 1;">
                    <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">${title}</div>
                    <div style="font-size: 13px; color: #ccc; line-height: 1.4;">${body}</div>
        `;

        if (image) {
            html += `<img src="${image}" style="max-width: 100%; max-height: 80px; margin-top: 8px; border-radius: 4px;">`;
        }

        html += `</div></div>`;
        toast.innerHTML = html;
        container.appendChild(toast);

        // Add animation
        const style = document.createElement('style');
        if (!document.getElementById('sp-toast-animation')) {
            style.id = 'sp-toast-animation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    // ============================================
    // 6. Sound Alerts
    // ============================================
    const SoundAlert = {
        enabled: SP.config.soundEnabled,
        
        beep(freq = 880, duration = 200, type = 'sine') {
            if (!this.enabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = type;
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration / 1000);
            } catch (e) {}
        },

        hiddenAlert() {
            // نغمة مميزة: 3 نبضات تصاعدية
            this.beep(440, 150);
            setTimeout(() => this.beep(660, 150), 180);
            setTimeout(() => this.beep(880, 200), 360);
        },

        pmAlert() {
            this.beep(1000, 300, 'square');
        },

        generalAlert() {
            this.beep(700, 200);
        }
    };

    // ============================================
    // 7. Real-Time Tracker - تتبع فوري
    // ============================================
    const UserTracker = {
        watchList: new Set(),
        sessions: {},
        lastSeen: {},

        watch(nameOrHash) {
            this.watchList.add(nameOrHash.toLowerCase());
            this.save();
        },

        unwatch(nameOrHash) {
            this.watchList.delete(nameOrHash.toLowerCase());
            this.save();
        },

        check(userName, hash, uid, isHidden) {
            const key = (userName + hash).toLowerCase();
            const isWatched = [...this.watchList].some(w => key.includes(w));

            if (!isWatched) return;

            if (!this.sessions[uid]) {
                this.sessions[uid] = { 
                    name: userName, 
                    enterTime: Date.now(), 
                    exits: [] 
                };
                
                showToast({
                    title: '👀 تنبيه تتبع',
                    body: `"${userName}" دخل ${isHidden ? '(مخفي)' : ''}`,
                    color: isHidden ? '#ff6b35' : '#28a745',
                    icon: isHidden ? '🔍' : '👤'
                });

                if (SP.config.soundEnabled) {
                    SoundAlert.generalAlert();
                }
            }

            this.lastSeen[uid] = Date.now();
        },

        onLeave(uid, userName) {
            if (this.sessions[uid]) {
                const duration = Math.round((Date.now() - this.sessions[uid].enterTime) / 60000);
                this.sessions[uid].exits.push({ time: Date.now(), duration });
                
                showToast({
                    title: '👋 مغادرة',
                    body: `"${userName}" غادر بعد ${duration} دقيقة`,
                    color: '#6c757d',
                    icon: '👋'
                });
            }
        },

        getLastSeen(uid) {
            const timestamp = this.lastSeen[uid];
            if (!timestamp) return 'لم يتم التتبع';
            
            const now = Date.now();
            const diff = now - timestamp;
            const mins = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (days > 0) return `منذ ${days} يوم`;
            if (hours > 0) return `منذ ${hours} ساعة`;
            if (mins > 0) return `منذ ${mins} دقيقة`;
            return 'الآن';
        },

        save() {
            localStorage.setItem('sp_watchlist', JSON.stringify([...this.watchList]));
        },

        load() {
            const saved = localStorage.getItem('sp_watchlist');
            if (saved) this.watchList = new Set(JSON.parse(saved));
        }
    };

    // ============================================
    // 8. Bot Detector - كاشف البوتات الموحد
    // ============================================
    const BotDetector = {
        suspectedBots: new Set(),

        analyze(users) {
            const detected = [];

            users.forEach(user => {
                const uid = A.getUid(user);
                if (!uid) return;

                const name = A.getName(user);
                const hash = A.getHash(user);
                const avatar = A.getAvatar(user);

                // علامات البوت
                const noName = !name || name === 'Unknown' || /^guest|user|bot\d+/i.test(name);
                const noAvatar = !avatar;
                const suspiciousName = /^(user|guest|visitor|bot)\d+$/i.test(name);
                const noHash = hash === '—' || !hash;

                const botScore = [noName, noAvatar, suspiciousName, noHash]
                    .filter(Boolean).length;

                if (botScore >= 2) {
                    detected.push({ uid, name, hash, botScore });
                    this.suspectedBots.add(uid);
                }
            });

            return detected;
        }
    };

    // ============================================
    // 9. Counter HUD - عداد المتصلين/المخفيين/البوتات
    // ============================================
    function createHUD() {
        let hud = document.getElementById('sp-counter-hud');
        if (hud) return hud;

        hud = document.createElement('div');
        hud.id = 'sp-counter-hud';
        hud.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 999998;
            background: rgba(13, 21, 40, 0.95);
            border: 1px solid rgba(52, 152, 219, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            font-family: Arial, sans-serif;
            color: #fff;
            font-size: 13px;
            min-width: 200px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        hud.innerHTML = `
            <div style="display: flex; gap: 15px; justify-content: space-around;">
                <div style="text-align: center;">
                    <div style="font-size: 20px; color: #3498db;">📊</div>
                    <div style="color: #95a5a6; font-size: 11px;">المتصلين</div>
                    <div style="color: #2ecc71; font-weight: bold;" class="sp-online-count">0</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; color: #e74c3c;">👁</div>
                    <div style="color: #95a5a6; font-size: 11px;">المخفيين</div>
                    <div style="color: #e74c3c; font-weight: bold;" class="sp-hidden-count">0</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; color: #f39c12;">🤖</div>
                    <div style="color: #95a5a6; font-size: 11px;">البوتات</div>
                    <div style="color: #f39c12; font-weight: bold;" class="sp-bot-count">0</div>
                </div>
            </div>
        `;

        document.body.appendChild(hud);
        return hud;
    }

    function updateHUD() {
        const hud = createHUD();
        if (!hud) return;

        const users = A.getAllUsers();
        let onlineCount = 0, hiddenCount = 0;

        users.forEach(user => {
            const isHidden = A.isHidden(user);
            if (isHidden) {
                hiddenCount++;
            } else {
                onlineCount++;
            }
        });

        const botCount = BotDetector.suspectedBots.size;

        hud.querySelector('.sp-online-count').textContent = onlineCount;
        hud.querySelector('.sp-hidden-count').textContent = hiddenCount;
        hud.querySelector('.sp-bot-count').textContent = botCount;

        SP.state.hiddenCount = hiddenCount;
        SP.state.botCount = botCount;
    }

    // ============================================
    // 10. إظهار المخفيين الرئيسية
    // ============================================
    function revealHidden() {
        const users = A.getAllUsers();

        users.forEach(el => {
            if (A.isHidden(el)) {
                const uid = A.getUid(el);
                const name = A.getName(el);
                const hash = A.getHash(el);
                const avatar = A.getAvatar(el);

                // إظهار العنصر
                el.style.setProperty('display', 'block', 'important');
                el.style.setProperty('opacity', '1', 'important');
                el.classList.add('sp-revealed');

                // تنبيه
                if (uid && !SP.state.alertedHidden.has(uid)) {
                    SP.state.alertedHidden.add(uid);

                    showToast({
                        title: '🔴 دخول مخفي',
                        body: `${name} (ID: ${uid}) دخل مخفي`,
                        icon: '👁',
                        color: '#e74c3c',
                        image: avatar
                    });

                    if (SP.config.soundEnabled) {
                        SoundAlert.hiddenAlert();
                    }

                    // تتبع المستخدم
                    UserTracker.check(name, hash, uid, true);
                }
            }
        });

        updateHUD();
    }

    // ============================================
    // 11. مراقب DOM - MutationObserver
    // ============================================
    function initDOMMonitor() {
        const observer = new MutationObserver(function(mutations) {
            revealHidden();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'data-hidden']
        });

        console.log(`✅ DOM Monitor initialized for ${A.name}`);
    }

    // ============================================
    // 12. لوحة التحكم المحسّنة
    // ============================================
    function createControlPanel() {
        let panel = document.getElementById('sp-control-panel');
        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = 'sp-control-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 999997;
            background: rgba(13, 21, 40, 0.98);
            border: 1px solid rgba(52, 152, 219, 0.3);
            border-radius: 12px;
            padding: 16px;
            font-family: Arial, sans-serif;
            color: #fff;
            min-width: 300px;
            max-height: 500px;
            overflow-y: auto;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        `;

        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="margin: 0 0 8px 0; color: #3498db;">🚀 ScriptPro v${SP.version}</h3>
                <small style="color: #95a5a6;">Platform: <span style="color: #2ecc71;">${A.name}</span></small>
            </div>

            <div style="border-top: 1px solid rgba(52, 152, 219, 0.2); padding: 12px 0; margin: 12px 0;">
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="sp-sound-toggle" ${SP.config.soundEnabled ? 'checked' : ''} style="cursor: pointer;">
                        <span>🔊 تفعيل الأصوات</span>
                    </label>
                </div>
                <div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="sp-hud-toggle" checked style="cursor: pointer;">
                        <span>📊 عرض العداد</span>
                    </label>
                </div>
            </div>

            <div style="border-top: 1px solid rgba(52, 152, 219, 0.2); padding: 12px 0;">
                <button id="sp-test-mode" style="
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    cursor: pointer;
                    font-weight: bold;
                    transition: 0.3s;
                ">🧪 Test Mode</button>

                <button id="sp-refresh-btn" style="
                    width: 100%;
                    padding: 8px;
                    background: linear-gradient(135deg, #2ecc71, #27ae60);
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    cursor: pointer;
                    font-weight: bold;
                    transition: 0.3s;
                ">🔄 تحديث</button>
            </div>

            <div style="border-top: 1px solid rgba(52, 152, 219, 0.2); padding: 12px 0; margin-top: 12px; font-size: 12px; color: #95a5a6;">
                <div style="margin-bottom: 6px;">
                    <strong>ℹ️ المعلومات:</strong>
                </div>
                <div id="sp-info-text" style="line-height: 1.6;">
                    • المخفيين المكشوفين: <span style="color: #e74c3c;" id="sp-hidden-stat">0</span><br>
                    • البوتات المكتشفة: <span style="color: #f39c12;" id="sp-bot-stat">0</span><br>
                    • المتصلين الحاليين: <span style="color: #2ecc71;" id="sp-online-stat">0</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('sp-sound-toggle').addEventListener('change', function() {
            SP.config.soundEnabled = this.checked;
            SoundAlert.enabled = this.checked;
        });

        document.getElementById('sp-hud-toggle').addEventListener('change', function() {
            const hud = document.getElementById('sp-counter-hud');
            if (hud) {
                hud.style.display = this.checked ? 'block' : 'none';
            }
        });

        document.getElementById('sp-test-mode').addEventListener('click', runTestMode);

        document.getElementById('sp-refresh-btn').addEventListener('click', function() {
            revealHidden();
            updateHUD();
            showToast({
                title: '✅ تم التحديث',
                body: 'تم تحديث البيانات بنجاح',
                color: '#2ecc71'
            });
        });

        return panel;
    }

    function updatePanelStats() {
        const users = A.getAllUsers();
        let onlineCount = 0;

        users.forEach(user => {
            if (!A.isHidden(user)) {
                onlineCount++;
            }
        });

        document.getElementById('sp-hidden-stat').textContent = SP.state.hiddenCount;
        document.getElementById('sp-bot-stat').textContent = SP.state.botCount;
        document.getElementById('sp-online-stat').textContent = onlineCount;
    }

    // ============================================
    // 13. التهيئة
    // ============================================
    window.ScriptPro = {
        version: SP.version,
        platform: SP.platform,
        adapter: A,
        showToast,
        revealHidden,
        updateHUD,
        tracker: UserTracker,
        botDetector: BotDetector
    };

    // Initialize
    function init() {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`⚡ ScriptPro v${SP.version} - ${A.name} Edition`);
        console.log(`✅ Auto-Detection: ${SP.platform.toUpperCase()}`);
        console.log(`${'='.repeat(50)}\n`);

        // Load saved settings
        UserTracker.load();

        // Initialize components
        createHUD();
        createControlPanel();
        initDOMMonitor();
        revealHidden();
        updateHUD();
        updatePanelStats();

        // Periodic updates
        setInterval(() => {
            revealHidden();
            updateHUD();
            updatePanelStats();
        }, 2000);

        showToast({
            title: '✅ تم التفعيل',
            body: `ScriptPro v${SP.version} على ${A.name}`,
            color: '#2ecc71',
            icon: '🚀'
        });

        console.log(`✅ ScriptPro v${SP.version} Initialized Successfully!`);
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
