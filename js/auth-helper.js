// ==========================================
// 🔐 AUTH HELPER - Xử lý Token & Cookie
// ==========================================

/**
 * ✅ Xóa tất cả token cũ từ Storage
 * (Dùng khi migrate từ SessionStorage sang HttpOnly Cookie)
 */
function clearOldTokens() {
    const keysToRemove = [
        'accessToken',
        'token',
        'jwtToken',
        'authToken',
        'Bearer'
    ];
    
    // Xóa từ sessionStorage
    keysToRemove.forEach(key => {
        if (sessionStorage.getItem(key)) {
            console.log(`✅ Xóa token cũ từ sessionStorage:`, key);
            sessionStorage.removeItem(key);
        }
    });
    
    // Xóa từ localStorage
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            console.log(`✅ Xóa token cũ từ localStorage:`, key);
            localStorage.removeItem(key);
        }
    });
}

/**
 * ✅ Kiểm tra HttpOnly Cookie có tồn tại không
 * (Chỉ mang tính chất debug, JS không thể đọc HttpOnly)
 */
function checkHttpOnlyCookie() {
    const cookies = document.cookie;
    console.log("=== Cookies Debug ===");
    console.log("document.cookie:", cookies || "(trống)");
    
    if (!cookies.includes('accessToken')) {
        console.log("✅ accessToken không hiện (HttpOnly flag bật)");
        return false;
    } else {
        console.warn("❌ accessToken hiện trong document.cookie (Nguy hiểm!)");
        return true;
    }
}

/**
 * ✅ Monitor: Cảnh báo nếu code cố gắng lưu token
 */
function monitorStorageSetItem() {
    const originalSessionSetItem = sessionStorage.setItem;
    const originalLocalSetItem = localStorage.setItem;
    
    // Monitor sessionStorage
    sessionStorage.setItem = function(key, value) {
        if (key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('auth')) {
            console.warn(`❌ CẢNH BÁO: Code đang cố lưu "${key}" vào sessionStorage`);
            console.trace(); // Hiện stack trace
            
            // Không lưu token vào storage
            if (key.includes('Token') || key.includes('token')) {
                console.warn("→ Bỏ qua vì dùng HttpOnly Cookie");
                return;
            }
        }
        return originalSessionSetItem.apply(sessionStorage, arguments);
    };
    
    // Monitor localStorage
    localStorage.setItem = function(key, value) {
        if (key.toLowerCase().includes('token') && 
            !key.includes('currentUser')) { // Cho phép lưu currentUser
            console.warn(`❌ CẢNH BÁO: Code đang cố lưu "${key}" vào localStorage`);
            console.trace();
            
            if (key.includes('Token') || key.includes('token')) {
                console.warn("→ Bỏ qua vì dùng HttpOnly Cookie");
                return;
            }
        }
        return originalLocalSetItem.apply(localStorage, arguments);
    };
    
    console.log("✅ Đã bật monitoring - sẽ cảnh báo nếu code lưu token");
}

/**
 * ✅ Gọi khi page load (index.html)
 */
function initAuthHelper() {
    console.log("=== Auth Helper Initialized ===");
    console.log("1. Xóa token cũ...");
    clearOldTokens();
    
    console.log("2. Kiểm tra HttpOnly Cookie...");
    checkHttpOnlyCookie();
    
    console.log("3. Bật monitoring...");
    monitorStorageSetItem();
    
    console.log("✅ Auth Helper Ready - Bạn có thể mở Console (F12) để xem logs");
}

// ==========================================
// 🔍 Utility Functions
// ==========================================

/**
 * ✅ Check xem user có login không
 */
function isLoggedIn() {
    // Cách 1: Check currentUser ở localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) return true;
    
    // Cách 2: Gọi API protected để kiểm tra
    // (Backend sẽ trả 401 nếu token hết hạn)
    return false;
}

/**
 * ✅ Logout - Clear localStorage & Cookie
 */
async function logout() {
    console.log("Đăng xuất...");
    
    // Xóa user info từ localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('checkoutData');
    localStorage.removeItem('cartItems');
    
    // Gọi API logout (Backend clear HttpOnly Cookie)
    try {
        await fetch('http://127.0.0.1:8080/api/auth/logout', {
            method: 'POST',
            credentials: 'include' // Gửi cookie, nhận clear command
        });
    } catch (error) {
        console.warn("Logout API error:", error);
    }
    
    console.log("✅ Logout thành công");
    window.location.href = 'login.html';
}

/**
 * ✅ Redirect nếu chưa login
 */
function redirectIfNotLoggedIn() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.log("❌ Chưa login, redirect về login.html");
        window.location.href = 'login.html';
    }
}

// ==========================================
// 🚀 Auto-run on page load
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Gọi init helper
    initAuthHelper();
    
    // Nếu page cần authentication, check login
    // const needsAuth = document.body.getAttribute('data-requires-auth');
    // if (needsAuth === 'true') {
    //     redirectIfNotLoggedIn();
    // }
});
