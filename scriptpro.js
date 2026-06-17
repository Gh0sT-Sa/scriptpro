// ==UserScript==
// @name         ScriptPro Ghost Elite v3.1
// @namespace    ScriptPro
// @version      3.1
// @description  كشف المخفيين + تتبع الزوار + لوحة تحكم كاملة - جميع الميزات مجانية
// @author       Gh0sT-Sa
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // منع التشغيل المزدوج
    if (window.__SPGE_LOADED__) return;
    window.__SPGE_LOADED__ = true;

    console.log('%c🛡️ ScriptPro Ghost Elite v3.1', 'font-size: 20px; color: #00ffcc; font-weight: bold;');
    console.log('%c👤 Author: Gh0sT-Sa', 'font-size: 14px; color: #888;');
    console.log('%c🔓 جميع الميزات مجانية - أنت المدير', 'font-size: 14px; color: #4CAF50;');

    // ═══════════════════════════════════════════════════════════
    // 🛠️ الإعدادات الرئيسية
    // ═══════════════════════════════════════════════════════════
    const SPGE = {
        config: {
            VERSION: '3.1',
            AUTHOR: 'Gh0sT-Sa',
            COLOR: '#00ffcc',
            DETECTION_INTERVAL: 3000,
            LOG_RETENTION: 1000,
            SOUND_ENABLED: true,
            VISUAL_ALERTS: true
        },

        store: {
            users: [],
            hiddenUsers: [],
            visitors: [],
            logs: [],
            stats: {
                totalDetections: 0,
                totalHidden: 0,
                totalVisitors: 0,
                startTime: Date.now()
            },
            alertedHidden: new Set(),
            myId: null,
            myRoom: null
        },

        ui: {
            button: null,
            panel: null,
            isPanelOpen: false,
            isPanelInit: false
        },

        // ═══════════════════════════════════════════════════════
        // 🔍 كشف المنصة
        // ═══════════════════════════════════════════════════════
        detectPlatform() {
            const url = window.location.hostname;
            const html = document.documentElement.innerHTML.toLowerCase();
            
            if (url.includes('njd') || url.includes('tiger') || html.includes('tigerhost')) return 'TigerHost';
            if (url.includes('jawal') || url.includes('foon') || html.includes('jawalhost') || html.includes('foonhost')) return 'JawalHost/FoonHost';
            if (typeof users !== 'undefined') return 'Generic-V3';
            return 'Unknown';
        },

        // ═══════════════════════════════════════════════════════
        // 📡 API Detector - يعتمد على users array
        // ═══════════════════════════════════════════════════════
        detector: {
            interval: null,
            waitTimer: null,
            usersInterval: null,
            
            start() {
                console.log('[SPGE] بدء تشغيل الكاشف...');
                
                // أولاً: فحص إذا users موجود بالفعل
                if (typeof users !== 'undefined' && Array.isArray(users)) {
                    console.log(`[SPGE] ✅ users متاح فوراً! الطول: ${users.length}`);
                    this.scan();
                    this.interval = setInterval(() => this.scan(), SPGE.config.DETECTION_INTERVAL);
                    return;
                }
                
                // ثانياً: انتظار users لحين ظهورها
                console.log('[SPGE] ⏳ انتظار users array...');
                this.waitForUsers();
            },
            
            waitForUsers() {
                // فحص كل 500ms لمدة 30 ثانية كحد أقصى
                let attempts = 0;
                const maxAttempts = 60; // 30 ثانية
                
                this.usersInterval = setInterval(() => {
                    attempts++;
                    
                    if (typeof users !== 'undefined' && Array.isArray(users) && users.length > 0) {
                        console.log(`[SPGE] ✅ users ظهرت بعد ${attempts * 0.5} ثانية! الطول: ${users.length}`);
                        clearInterval(this.usersInterval);
                        
                        this.scan();
                        this.interval = setInterval(() => this.scan(), SPGE.config.DETECTION_INTERVAL);
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        console.warn('[SPGE] ❌ لم تظهر users بعد 30 ثانية، إعادة المحاولة...');
                        clearInterval(this.usersInterval);
                        setTimeout(() => this.waitForUsers(), 5000);
                    }
                }, 500);
            },

            scan() {
                try {
                    if (typeof users === 'undefined' || !users) {
                        console.warn('[SPGE] users غير متاح حالياً');
                        return;
                    }
                    
                    // حفظ myId و myRoom إذا لم نحصل عليهما بعد
                    if (!SPGE.store.myId) {
                        SPGE.store.myId = typeof MY_T !== 'undefined' ? String(MY_T) : null;
                    }
                    if (!SPGE.store.myRoom) {
                        SPGE.store.myRoom = typeof M_ROOM !== 'undefined' ? M_ROOM : null;
                    }

                    const currentUsers = [];
                    let foundNewHidden = false;

                    users.forEach((u, index) => {
                        if (!u) return;
                        
                        const userId = u.id || u.uid || u._id || `user_${index}`;
                        const isHidden = SPGE.detector.isHidden(u);
                        const userName = u.nick || u.name || u.nickname || u.username || `مستخدم_${index}`;

                        currentUsers.push({
                            id: userId,
                            nick: userName,
                            isHidden: isHidden,
                            power: u.power || u.rank || u.level || 0,
                            room: u.room || u.r || '',
                            status: u.s || u.status
                        });

                        // كشف مخفي جديد
                        if (isHidden && !SPGE.store.alertedHidden.has(userId)) {
                            SPGE.store.alertedHidden.add(userId);
                            foundNewHidden = true;
                            
                            SPGE.addLog(`🕵️ مخفي جديد: ${userName}`, 'hidden');
                            
                            // تنبيه صوتي ومرئي
                            if (SPGE.config.SOUND_ENABLED) SPGE.playAlert();
                            if (SPGE.config.VISUAL_ALERTS) SPGE.showHiddenAlert(userName);
                        }
                    });

                    SPGE.store.users = currentUsers;
                    SPGE.store.hiddenUsers = currentUsers.filter(u => u.isHidden);

                    if (foundNewHidden || SPGE.store.hiddenUsers.length > 0) {
                        SPGE.store.stats.totalDetections++;
                        SPGE.ui.updateStats();
                        SPGE.ui.renderPanel();
                    }

                } catch (e) {
                    console.error('[SPGE] ❌ خطأ في المسح:', e.message);
                }
            },

            isHidden(u) {
                // جميع طرق كشف المخفي
                return !!(
                    u.hidden === true ||
                    u.Hidden === true ||
                    u.isHidden === true ||
                    u.hide === true ||
                    u.hide_online === true ||
                    u.isMonitor === true ||
                    u.monitor === true ||
                    u.role === 'monitor' ||
                    u.role === 'admin_hidden' ||
                    u.role === 'super_hidden' ||
                    u.role === 'supervisor' ||
                    u.role === 'hidden_admin' ||
                    u.type === 'monitor' ||
                    u.type === 'hidden_admin' ||
                    u.type === 'supervisor' ||
                    u.s === 'invis' ||
                    u.s === 'hidden' ||
                    u.s === 2 ||
                    u.s === 4 ||
                    u.status === 'invis' ||
                    u.status === 'hidden' ||
                    u.status === 'invisible' ||
                    (u.rank !== undefined && Number(u.rank) >= 99999) ||
                    (u.power !== undefined && Number(u.power) >= 99999) ||
                    (u.level !== undefined && Number(u.level) >= 99999)
                );
            },

            stop() {
                if (this.interval) clearInterval(this.interval);
                if (this.usersInterval) clearInterval(this.usersInterval);
            }
        },

        // ═══════════════════════════════════════════════════════
        // 📋 نظام السجلات
        // ═══════════════════════════════════════════════════════
        addLog(message, type = 'info') {
            SPGE.store.logs.unshift({
                time: new Date().toLocaleTimeString('ar-SA'),
                message: message,
                type: type
            });
            if (SPGE.store.logs.length > SPGE.config.LOG_RETENTION) {
                SPGE.store.logs.pop();
            }
        },

        // ═══════════════════════════════════════════════════════
        // 🔊 تنبيه صوتي
        // ═══════════════════════════════════════════════════════
        playAlert() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                osc.type = 'sine';
                gain.gain.value = 0.3;
                osc.start();
                setTimeout(() => {
                    osc.frequency.value = 660;
                    setTimeout(() => { osc.stop(); ctx.close(); }, 150);
                }, 150);
            } catch (e) { /* صوت غير متاح */ }
        },

        // ═══════════════════════════════════════════════════════
        // 🚨 تنبيه مرئي
        // ═══════════════════════════════════════════════════════
        showHiddenAlert(userName) {
            try {
                const alertDiv = document.createElement('div');
                alertDiv.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 999999;
                    background: linear-gradient(135deg, rgba(255,68,68,0.95), rgba(204,0,0,0.95));
                    color: white; padding: 15px 25px; border-radius: 12px;
                    font-family: Tahoma, Arial, sans-serif; font-size: 14px;
                    box-shadow: 0 8px 32px rgba(255,0,0,0.4);
                    border: 1px solid #ff6666;
                    animation: spgeSlideIn 0.3s ease;
                    max-width: 350px;
                    direction: rtl;
                    backdrop-filter: blur(5px);
                    cursor: pointer;
                `;
                alertDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">🕵️</span>
                        <div>
                            <div style="font-weight: bold; font-size: 15px; margin-bottom: 3px;">🚨 تم كشف مخفي!</div>
                            <div style="font-size: 13px; opacity: 0.9;">${userName} ${SPGE.store.myRoom ? `في ${SPGE.store.myRoom}` : ''}</div>
                        </div>
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; opacity: 0.7; text-align: left;">
                        اضغط للتجاهل
                    </div>
                `;
                alertDiv.onclick = () => {
                    alertDiv.style.opacity = '0';
                    alertDiv.style.transform = 'translateX(100px)';
                    setTimeout(() => alertDiv.remove(), 300);
                };
                document.body.appendChild(alertDiv);
                
                // إزالة تلقائية بعد 10 ثواني
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.style.opacity = '0';
                        alertDiv.style.transform = 'translateX(100px)';
                        setTimeout(() => alertDiv.remove(), 300);
                    }
                }, 10000);
            } catch (e) { /* */ }
        },

        // ═══════════════════════════════════════════════════════
        // 👤 متتبع الزوار
        // ═══════════════════════════════════════════════════════
        visitorTracker: {
            interval: null,
            
            start() {
                this.interval = setInterval(() => this.track(), 5000);
            },
            
            track() {
                if (typeof upro !== 'function') return;
                try {
                    const profile = upro();
                    if (profile && profile.id) {
                        const exists = SPGE.store.visitors.find(v => String(v.id) === String(profile.id));
                        if (!exists) {
                            SPGE.store.visitors.push({
                                id: profile.id,
                                nick: profile.nick || profile.name || 'زائر',
                                firstSeen: new Date().toLocaleString('ar-SA'),
                                lastSeen: new Date().toLocaleString('ar-SA'),
                                visits: 1,
                                avatar: profile.pic || profile.avatar || ''
                            });
                            SPGE.store.stats.totalVisitors++;
                            SPGE.addLog(`👤 زائر جديد: ${profile.nick || profile.name || profile.id}`, 'info');
                        } else {
                            exists.lastSeen = new Date().toLocaleString('ar-SA');
                            exists.visits++;
                        }
                    }
                } catch (e) { /* */ }
            },
            
            stop() {
                if (this.interval) clearInterval(this.interval);
            }
        },

        // ═══════════════════════════════════════════════════════
        // 🎨 بناء الواجهة - التصميم الأصلي
        // ═══════════════════════════════════════════════════════
        ui: {
            build() {
                // منع البناء المزدوج
                if (document.getElementById('spge-btn')) return;
                
                console.log('[SPGE] بناء الواجهة...');
                
                // إضافة الأنماط
                this.injectStyles();
                
                // بناء الزر العائم
                this.createButton();
                
                // بناء اللوحة
                this.createPanel();
                
                // التحديث الأولي
                this.renderPanel();
                this.updateStats();
            },

            injectStyles() {
                if (document.getElementById('spge-styles')) return;
                
                const style = document.createElement('style');
                style.id = 'spge-styles';
                style.textContent = `
                    @keyframes spgeSlideIn {
                        from { opacity: 0; transform: translateX(100px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes spgeFadeIn {
                        from { opacity: 0; transform: translateY(-20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes spgePulse {
                        0% { box-shadow: 0 4px 20px rgba(0,255,204,0.3); }
                        50% { box-shadow: 0 4px 30px rgba(0,255,204,0.6); }
                        100% { box-shadow: 0 4px 20px rgba(0,255,204,0.3); }
                    }
                    
                    #spge-btn {
                        position: fixed !important;
                        bottom: 20px !important;
                        left: 20px !important;
                        width: 50px !important;
                        height: 50px !important;
                        border-radius: 50% !important;
                        background: linear-gradient(135deg, #0a0a0a, #1a1a2e) !important;
                        border: 2px solid #00ffcc !important;
                        box-shadow: 0 4px 20px rgba(0,255,204,0.3) !important;
                        z-index: 999998 !important;
                        cursor: grab !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-size: 22px !important;
                        user-select: none !important;
                        touch-action: none !important;
                        transition: transform 0.2s, box-shadow 0.2s !important;
                        animation: spgePulse 2s infinite !important;
                    }
                    #spge-btn:hover {
                        transform: scale(1.1) !important;
                    }
                    #spge-btn:active {
                        cursor: grabbing !important;
                    }
                    
                    #spge-panel {
                        position: fixed !important;
                        bottom: 80px !important;
                        left: 20px !important;
                        width: 380px !important;
                        max-height: 600px !important;
                        background: rgba(13, 17, 23, 0.98) !important;
                        border-radius: 12px !important;
                        border: 1px solid #00ffcc !important;
                        box-shadow: 0 8px 40px rgba(0,255,204,0.15) !important;
                        z-index: 999997 !important;
                        overflow: hidden !important;
                        display: none !important;
                        font-family: Tahoma, Arial, sans-serif !important;
                        direction: rtl !important;
                        backdrop-filter: blur(10px) !important;
                    }
                    
                    #spge-panel-header {
                        padding: 12px 15px !important;
                        background: rgba(0, 0, 0, 0.8) !important;
                        border-bottom: 1px solid rgba(0,255,204,0.2) !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        cursor: move !important;
                    }
                    
                    #spge-panel::-webkit-scrollbar { width: 5px !important; }
                    #spge-panel::-webkit-scrollbar-track { background: #1a1a2e !important; }
                    #spge-panel::-webkit-scrollbar-thumb { background: #00ffcc !important; border-radius: 3px !important; }
                    
                    .spge-section { padding: 12px 15px !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
                    .spge-section-title { color: #00ffcc !important; font-size: 12px !important; font-weight: bold !important; margin-bottom: 8px !important; }
                    
                    .spge-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 8px !important;
                        margin-bottom: 10px !important;
                    }
                    
                    .spge-stat-box {
                        background: rgba(255,255,255,0.03) !important;
                        padding: 12px !important;
                        border-radius: 8px !important;
                        text-align: center !important;
                        border: 1px solid rgba(0,255,204,0.1) !important;
                    }
                    
                    .spge-stat-num {
                        font-size: 22px !important;
                        font-weight: bold !important;
                        margin-bottom: 4px !important;
                    }
                    
                    .spge-stat-label {
                        font-size: 11px !important;
                        color: #888 !important;
                    }
                    
                    .spge-hidden-item {
                        background: rgba(255,68,68,0.08) !important;
                        padding: 8px 12px !important;
                        border-radius: 6px !important;
                        margin-bottom: 4px !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        border-right: 3px solid #ff4444 !important;
                        font-size: 12px !important;
                    }
                    
                    .spge-log-item {
                        padding: 4px 0 !important;
                        font-size: 11px !important;
                        border-bottom: 1px solid rgba(255,255,255,0.03) !important;
                    }
                    
                    .spge-btn {
                        padding: 8px 12px !important;
                        border: none !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        font-size: 12px !important;
                        font-weight: bold !important;
                        font-family: inherit !important;
                        transition: opacity 0.2s !important;
                    }
                    .spge-btn:hover { opacity: 0.8 !important; }
                    
                    .spge-badge {
                        display: inline-block !important;
                        padding: 2px 8px !important;
                        border-radius: 10px !important;
                        font-size: 10px !important;
                        font-weight: bold !important;
                    }
                `;
                document.head.appendChild(style);
            },

            createButton() {
                const btn = document.createElement('div');
                btn.id = 'spge-btn';
                btn.title = '🛡️ ScriptPro Ghost Elite - اسحب للتحريك، اضغط للفتح';
                btn.textContent = '🛡️';
                document.body.appendChild(btn);
                SPGE.ui.button = btn;
                
                // نظام السحب
                SPGE.makeDraggable(btn, () => {
                    SPGE.ui.togglePanel();
                });
            },

            createPanel() {
                const panel = document.createElement('div');
                panel.id = 'spge-panel';
                
                // الهيدر
                const header = document.createElement('div');
                header.id = 'spge-panel-header';
                header.innerHTML = `
                    <span style="color: #00ffcc; font-weight: bold; font-size: 13px;">
                        🛡️ ScriptPro Ghost Elite
                        <span style="font-size: 10px; color: #4CAF50; background: rgba(76,175,80,0.15); padding: 2px 6px; border-radius: 8px; margin-right: 6px;">🔓 مجاني كامل</span>
                    </span>
                    <span id="spge-close-btn" style="color: #666; cursor: pointer; font-size: 16px;">✕</span>
                `;
                panel.appendChild(header);
                
                // الجسم
                const body = document.createElement('div');
                body.id = 'spge-content';
                body.style.cssText = 'padding: 0; overflow-y: auto; max-height: 500px;';
                panel.appendChild(body);
                
                document.body.appendChild(panel);
                SPGE.ui.panel = panel;
                
                // ربط الأحداث
                document.getElementById('spge-close-btn').onclick = () => SPGE.ui.closePanel();
                
                // سحب اللوحة
                SPGE.makeDraggable(panel, null, header);
            },

            renderPanel() {
                const body = document.getElementById('spge-content');
                if (!body) return;
                
                const hidden = SPGE.store.hiddenUsers;
                const logs = SPGE.store.logs.slice(0, 15);
                
                body.innerHTML = `
                    <div class="spge-section">
                        <div class="spge-section-title">📊 الإحصائيات</div>
                        <div class="spge-grid">
                            <div class="spge-stat-box">
                                <div class="spge-stat-num" style="color: #ff4444;">${hidden.length}</div>
                                <div class="spge-stat-label">🕵️ مخفي الآن</div>
                            </div>
                            <div class="spge-stat-box">
                                <div class="spge-stat-num" style="color: #4CAF50;">${SPGE.store.users.length}</div>
                                <div class="spge-stat-label">👥 جميع المستخدمين</div>
                            </div>
                            <div class="spge-stat-box">
                                <div class="spge-stat-num" style="color: #2196F3;">${SPGE.store.visitors.length}</div>
                                <div class="spge-stat-label">👤 الزوار المسجلين</div>
                            </div>
                            <div class="spge-stat-box">
                                <div class="spge-stat-num" style="color: #FF9800;">${SPGE.store.stats.totalDetections}</div>
                                <div class="spge-stat-label">🚨 عدد الكشوفات</div>
                            </div>
                        </div>
                        <div style="font-size: 11px; color: #555; text-align: center; padding: 4px;">
                            ⏱ ${Math.floor((Date.now() - SPGE.store.stats.startTime) / 1000 / 60)} دقيقة تشغيل
                            ${SPGE.store.myId ? `| 🆔 ${SPGE.store.myId}` : ''}
                            ${SPGE.store.myRoom ? `| 🏠 ${SPGE.store.myRoom}` : ''}
                        </div>
                    </div>
                    
                    <div class="spge-section">
                        <div class="spge-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>🕵️ المخفيين</span>
                            <span class="spge-badge" style="background: ${hidden.length > 0 ? 'rgba(255,68,68,0.2)' : 'rgba(76,175,80,0.2)'}; color: ${hidden.length > 0 ? '#ff4444' : '#4CAF50'};">${hidden.length}</span>
                        </div>
                        ${hidden.length > 0 ? hidden.map(h => `
                            <div class="spge-hidden-item">
                                <span>${h.nick}</span>
                                <div>
                                    ${h.power > 0 ? `<span style="font-size: 10px; color: #888;">رتبة ${h.power}</span>` : ''}
                                </div>
                            </div>
                        `).join('') : `
                            <div style="background: rgba(76,175,80,0.05); padding: 12px; border-radius: 8px; text-align: center; font-size: 12px; color: #4CAF50;">
                                ✅ لا يوجد مخفيين الآن
                            </div>
                        `}
                    </div>
                    
                    <div class="spge-section">
                        <div class="spge-section-title">📋 آخر السجلات</div>
                        <div style="max-height: 150px; overflow-y: auto;">
                            ${logs.length > 0 ? logs.map(l => `
                                <div class="spge-log-item" style="color: ${l.type === 'hidden' ? '#ff4444' : '#888'};">
                                    <span style="color: #555;">[${l.time}]</span> ${l.message}
                                </div>
                            `).join('') : `
                                <div style="text-align: center; color: #555; padding: 8px; font-size: 11px;">
                                    لا توجد سجلات بعد
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="spge-section">
                        <div class="spge-section-title" style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <button onclick="SPGE.exportLogs()" class="spge-btn" style="flex:1; background: #2196F3; color: white;">📥 تصدير السجلات</button>
                            <button onclick="SPGE.clearLogs()" class="spge-btn" style="flex:1; background: #666; color: white;">🗑️ مسح</button>
                            <button onclick="SPGE.toggleSound()" class="spge-btn" style="flex:1; background: ${SPGE.config.SOUND_ENABLED ? '#4CAF50' : '#666'}; color: white;">${SPGE.config.SOUND_ENABLED ? '🔊 صوت' : '🔇 صوت'}</button>
                            <button onclick="SPGE.exportHidden()" class="spge-btn" style="flex:1; background: #FF9800; color: white;">📊 تصدير المخفيين</button>
                        </div>
                    </div>
                    
                    <div class="spge-section" style="text-align: center; font-size: 10px; color: #444; border-bottom: none;">
                        ⚡ ScriptPro Ghost Elite v${SPGE.config.VERSION} | 👤 ${SPGE.config.AUTHOR}
                    </div>
                `;
            },

            togglePanel() {
                if (SPGE.ui.isPanelOpen) {
                    SPGE.ui.closePanel();
                } else {
                    SPGE.ui.openPanel();
                }
            },

            openPanel() {
                SPGE.ui.isPanelOpen = true;
                SPGE.ui.panel.style.display = 'block';
                SPGE.ui.button.style.transform = 'scale(1.1)';
                SPGE.ui.button.style.boxShadow = '0 4px 30px rgba(0,255,204,0.6)';
                SPGE.ui.renderPanel();
            },

            closePanel() {
                SPGE.ui.isPanelOpen = false;
                SPGE.ui.panel.style.display = 'none';
                SPGE.ui.button.style.transform = 'scale(1)';
                SPGE.ui.button.style.boxShadow = '0 4px 20px rgba(0,255,204,0.3)';
            },

            updateStats() {
                // تحديث الزر إذا كانت اللوحة مغلقة
                if (SPGE.store.hiddenUsers.length > 0) {
                    SPGE.ui.button.textContent = '🕵️';
                    SPGE.ui.button.style.borderColor = '#ff4444';
                } else {
                    SPGE.ui.button.textContent = '🛡️';
                    SPGE.ui.button.style.borderColor = '#00ffcc';
                }
            }
        },

        // ═══════════════════════════════════════════════════════
        // 🖱️ نظام السحب
        // ═══════════════════════════════════════════════════════
        makeDraggable(el, onClick, dragHandle) {
            let isDragging = false;
            let hasMoved = false;
            let startX, startY, origLeft, origTop;
            
            const handle = dragHandle || el;
            
            const onStart = (e) => {
                const touch = e.touches ? e.touches[0] : e;
                isDragging = true;
                hasMoved = false;
                startX = touch.clientX;
                startY = touch.clientY;
                origLeft = el.offsetLeft;
                origTop = el.offsetTop;
                el.style.transition = 'none';
                el.style.cursor = 'grabbing';
                e.preventDefault();
            };
            
            const onMove = (e) => {
                if (!isDragging) return;
                const touch = e.touches ? e.touches[0] : e;
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
                el.style.left = `${origLeft + dx}px`;
                el.style.top = `${origTop + dy}px`;
                if (el.id === 'spge-btn') {
                    el.style.bottom = 'auto';
                }
            };
            
            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                el.style.cursor = 'grab';
                el.style.transition = '';
                
                if (!hasMoved && onClick) {
                    onClick();
                }
            };
            
            handle.addEventListener('mousedown', onStart);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            handle.addEventListener('touchstart', onStart, { passive: false });
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        },

        // ═══════════════════════════════════════════════════════
        // 📤 دوال التصدير
        // ═══════════════════════════════════════════════════════
        exportLogs() {
            const text = SPGE.store.logs.map(l => `[${l.time}] ${l.message}`).join('\n');
            SPGE.download(text, `SPGE_Logs_${new Date().toISOString().slice(0,10)}.txt`, 'text/plain');
        },

        clearLogs() {
            SPGE.store.logs = [];
            SPGE.ui.renderPanel();
        },

        toggleSound() {
            SPGE.config.SOUND_ENABLED = !SPGE.config.SOUND_ENABLED;
            SPGE.ui.renderPanel();
        },

        exportHidden() {
            if (SPGE.store.hiddenUsers.length === 0) {
                alert('لا يوجد مخفيين للتصدير');
                return;
            }
            const text = SPGE.store.hiddenUsers.map(h =>
                `🕵️ ${h.nick} | ID: ${h.id} | رتبة: ${h.power}`
            ).join('\n');
            SPGE.download(text, `SPGE_Hidden_${new Date().toISOString().slice(0,10)}.txt`, 'text/plain');
        },

        download(content, filename, type) {
            const blob = new Blob([content], { type: type });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }, 1000);
        },

        // ═══════════════════════════════════════════════════════
        // 🚀 التشغيل الرئيسي
        // ═══════════════════════════════════════════════════════
        init() {
            const platform = SPGE.detectPlatform();
            console.log(`[SPGE] 🌐 المنصة: ${platform}`);
            
            // بناء الواجهة
            SPGE.ui.build();
            
            // بدء كشف المخفيين
            SPGE.detector.start();
            
            // بدء متتبع الزوار
            SPGE.visitorTracker.start();
            
            // مراقبة openw للدخول الجديد
            if (typeof openw === 'function') {
                const orig = window.openw;
                window.openw = function(...args) {
                    SPGE.addLog(`👤 دخول مستخدم جديد`, 'info');
                    return orig.apply(this, args);
                };
            }
            
            console.log('%c✅ السكربت يعمل بنجاح', 'font-size: 14px; color: #4CAF50;');
            console.log('%c🕵️ انتظار كشف المخفيين...', 'font-size: 12px; color: #FF9800;');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // 🏁 تشغيل السكربت
    // ═══════════════════════════════════════════════════════════
    SPGE.init();

    // جعل SPGE عام للوصول من الأزرار
    window.SPGE = SPGE;

})();
