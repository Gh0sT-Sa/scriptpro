/* 
   ⚡ Ghost-Pro Hybrid v4.0 | الترسانة الموحدة
   🚀 يدعم: JawalHost | TigerHost | FoonHost | YoucamHost
*/

(function() {
    'use strict';
    
    // 1. تعريف البيئات (محرك التوافق)
    const HostEngines = {
        JawwalHost: { 
            detect: () => typeof upro === 'function' && document.querySelector('.uzr') !== null,
            selectors: { userList: '.uzr', pic: '.u-pic', searchBox: '#usearch', count: '.lonline' } 
        },
        PhoneHost: { 
            detect: () => document.querySelector('.ph-user') !== null,
            selectors: { userList: '.ph-user', pic: '.ph-img', searchBox: '#ph-search', count: '.ph-online' } 
        },
        UCamHost: { 
            detect: () => typeof window.MSDevice !== 'undefined' || document.querySelector('.ucam-chat-class') !== null,
            selectors: { userList: '.user-item', pic: 'img.avatar', searchBox: '#search-users', count: '.online-count' } 
        },
        TigerHost: { 
            detect: () => typeof TigerChat !== 'undefined' || document.querySelector('.tiger-user') !== null,
            selectors: { userList: '.tiger-user', pic: '.t-pic', searchBox: '#t-search', count: '.tc span' } 
        }
    };

    // كشف البيئة الحالية
    let CurrentEnv = null;
    for (let key in HostEngines) {
        if (HostEngines[key].detect()) {
            CurrentEnv = HostEngines[key];
            console.log("✅ Ghost-Pro متصل بـ:", key);
            break;
        }
    }
    if (!CurrentEnv) CurrentEnv = HostEngines.JawwalHost; // افتراضي

    // 2. الحقن والتنسيق
    const styles = document.createElement('style');
    styles.innerHTML = `
        .ghost-revealed { border: 2px solid #3498db !important; background: rgba(52, 152, 219, 0.1) !important; }
        #ghost-toast-container { position:fixed; top:60px; right:20px; z-index:999999; display:flex; flex-direction:column; gap:10px; }
        .ghost-toast { background:#1a1a1a; color:#fff; padding:10px; border-radius:8px; border-right:4px solid #3498db; box-shadow:0 4px 10px rgba(0,0,0,0.5); display:flex; align-items:center; gap:10px; width:280px; }
    `;
    document.head.appendChild(styles);

    // 3. المحرك الأساسي (إظهار المخفيين)
    function cleanAndReveal() {
        const users = document.querySelectorAll(CurrentEnv.selectors.userList);
        users.forEach(el => {
            // إزالة الإخفاء
            if (el.style.display === 'none' || el.style.maxHeight === '0px' || el.classList.contains('hid')) {
                el.style.setProperty('display', 'block', 'important');
                el.style.setProperty('max-height', 'none', 'important');
                el.style.setProperty('opacity', '1', 'important');
                el.classList.add('ghost-revealed');
                
                // تنبيه (اختياري)
                showToast("🚨 رادار المخفيين", "تم كشف مستخدم مخفي جديد");
            }
        });
    }

    // 4. نظام التنبيهات
    function showToast(title, msg) {
        if (!document.getElementById("ghost-toast-container")) {
            const cont = document.createElement("div"); cont.id = "ghost-toast-container"; document.body.appendChild(cont);
        }
        const toast = document.createElement("div");
        toast.className = "ghost-toast";
        toast.innerHTML = `<div><b>${title}</b><br>${msg}</div>`;
        document.getElementById("ghost-toast-container").appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    // 5. المراقبة (Observer)
    const observer = new MutationObserver(() => {
        cleanAndReveal();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // تشغيل
    cleanAndReveal();
    console.log("🚀 Ghost-Pro Hybrid Active");

})();
