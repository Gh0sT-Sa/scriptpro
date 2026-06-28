/**
 * 🚀 ScriptPro v5.0 - BookmarkLet
 * نسخ هذا الكود وأنشئ Bookmark جديد والصق الكود
 * 
 * استخدام:
 * 1. انقر على الـ Bookmark
 * 2. السكريبت سيتحمل تلقائياً
 */

javascript:(function(){
    console.log('🚀 ScriptPro Loader v5.0 - Starting...');
    
    // إزالة النسخ القديمة
    const oldScripts = document.querySelectorAll('script[src*="scriptpro"]');
    oldScripts.forEach(s => s.remove());
    
    // إنشاء عنصر script جديد
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/Gh0sT-Sa/scriptpro@main/scriptpro-v5-unified.js?t=' + Date.now();
    
    // معالج النجاح
    s.onload = function() {
        console.log('✅ ScriptPro v5.0 Loaded Successfully!');
        if (window.ScriptPro) {
            console.log('🎯 Platform:', window.ScriptPro.platform.toUpperCase());
            console.log('📊 Adapter:', window.ScriptPro.adapter.name);
        }
    };
    
    // معالج الخطأ
    s.onerror = function() {
        console.error('❌ فشل تحميل السكربت');
        alert('❌ فشل تحميل ScriptPro v5.0\n\nيرجى التأكد من:\n• الاتصال بالإنترنت\n• الموقع متاح');
    };
    
    // إضافة الـ Script للصفحة
    s.async = true;
    document.head.appendChild(s);
    
    console.log('⏳ ScriptPro Loading from CDN...');
})();
