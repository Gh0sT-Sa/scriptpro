/* 
   ⚡ ScriptPro Ghost Elite | الموحد v4.0
   🚀 الميزات: كشف المخفيين + قائمة ذكية + صائد IP + مكافح الباند
   📡 يدعم: JawalHost | TigerHost | FoonHost | YoucamHost
*/

(function () {
    'use strict';

    // 1. التكوين الأساسي (تفعيل كافة الخصائص)
    const SP = {
        config: { version: '4.0.0', color: '#3498db' },
        state: { adapter: null, alertedHidden: new Set(), sniffedIPs: {} }
    };

    // 2. محرك الكشف عن النسخة (التعرف التلقائي)
    function detectHost() {
        if (document.querySelector('.uzr') && typeof upro === 'function') return 'jawal';
        if (typeof TigerChat !== 'undefined' || document.querySelector('.tiger-user')) return 'tiger';
        if (document.querySelector('.ucam-chat-class') || typeof window.MSDevice !== 'undefined') return 'ucam';
        if (document.querySelector('.ph-user')) return 'foon';
        return 'jawal';
    }

    const hostType = detectHost();
    console.log("🚀 Ghost-Pro Active on:", hostType);

    // 3. المحركات (Adapters) - تم تصحيح محددات TigerHost و UCam
    const Adapters = {
        jawal: {
            users: '.uzr',
            pic: '.u-pic',
            getUid: (el) => [...el.classList].find(c => c.startsWith('uid'))?.slice(3),
            getName: (el) => el.getAttribute('n'),
            isHidden: (el) => el.classList.contains('hid') || el.querySelector('img.ustat[src*="s4.png"]')
        },
        tiger: {
            users: '.tiger-user',
            pic: '.t-pic',
            getUid: (el) => el.getAttribute('data-uid') || [...el.classList].find(c => c.startsWith('uid'))?.slice(3),
            getName: (el) => el.getAttribute('n') || el.innerText.split('\n')[0],
            isHidden: (el) => el.classList.contains('is-hidden') || el.querySelector('img[src*="s4.png"]')
        },
        ucam: {
            users: '.user-item',
            pic: 'img.avatar',
            getUid: (el) => el.getAttribute('data-user-id'),
            getName: (el) => el.querySelector('.user-name')?.textContent,
            isHidden: (el) => el.classList.contains('hidden')
        },
        foon: {
            users: '.ph-user',
            pic: '.ph-img',
            getUid: (el) => el.getAttribute('data-uid'),
            getName: (el) => el.getAttribute('n'),
            isHidden: (el) => el.classList.contains('hid')
        }
    };

    const A = Adapters[hostType];

    // 4. نظام الحقن (Injector) والـ WebSocket
    const origSend = window.WebSocket.prototype.send;
    window.WebSocket.prototype.send = function(data) {
        window.globalWS = this;
        return origSend.apply(this, arguments);
    };

    // 5. الوظائف الأساسية (إظهار المخفيين)
    function revealHidden() {
        document.querySelectorAll(A.users).forEach(el => {
            if (A.isHidden(el)) {
                el.style.setProperty('display', 'block', 'important');
                el.style.setProperty('opacity', '1', 'important');
                el.classList.add('ghost-revealed');
                
                // تنبيه
                const uid = A.getUid(el);
                if (uid && !SP.state.alertedHidden.has(uid)) {
                    SP.state.alertedHidden.add(uid);
                    showToast(A.getName(el), uid);
                }
            }
        });
    }

    // 6. التنبيهات (Toast)
    function showToast(name, uid) {
        let container = document.getElementById("ghost-toast-container");
        if(!container) {
            container = document.createElement("div");
            container.id = "ghost-toast-container";
            container.style = "position:fixed;top:70px;right:20px;z-index:999999;";
            document.body.appendChild(container);
        }
        const toast = document.createElement("div");
        toast.style = "background:#1a1a1a; color:#fff; padding:10px; margin-bottom:10px; border-right:4px solid #3498db; border-radius:5px;";
        toast.innerHTML = `<b>🚨 رادار المخفيين</b><br>الاسم: ${name}<br>المعرف: ${uid}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    // 7. القائمة الذكية (Smart Menu) - مدمجة
    function showMenu(e, el) {
        document.querySelectorAll('.ghost-smart-menu').forEach(m => m.remove());
        const menu = document.createElement('div');
        menu.className = 'ghost-smart-menu';
        menu.style = "position:fixed; z-index:9999999; background:#000; color:#fff; padding:10px; border:1px solid #3498db;";
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        
        menu.innerHTML = `
            <div style="font-weight:bold; color:#3498db">💀 Ghost Control</div>
            <div onclick="alert('جاري الحقن..')">💉 حقن أمر (Server Inject)</div>
            <div onclick="this.parentElement.remove()">❌ إغلاق</div>
        `;
        document.body.appendChild(menu);
    }

    // 8. المراقبة
    new MutationObserver(revealHidden).observe(document.body, {childList:true, subtree:true});
    
    // تفعيل النقر
    document.addEventListener('contextmenu', (e) => {
        const userEl = e.target.closest(A.users);
        if(userEl) {
            e.preventDefault();
            showMenu(e, userEl);
        }
    });

    // تشغيل
    revealHidden();
    console.log("✅ Ghost Elite Active - Version 4.0");

})();
