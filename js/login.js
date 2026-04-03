// ==========================================
// CẤU HÌNH EMAILJS VÀ API
// ==========================================
(function() {
    emailjs.init("BY4aniXi-QLXg13gG"); 
})();

const EMAILJS_SERVICE_ID = "service_w0i2xqq";   
const EMAILJS_TEMPLATE_ID = "template_prjqlyo"; 
const API_RESET_PASSWORD = "http://127.0.0.1:8080/api/auth/reset-password"; 

// Biến lưu trữ trạng thái
let expectedPin = "";
let currentResetEmail = "";

// ==========================================
// CÁC HÀM XỬ LÝ GIAO DIỆN VÀ LOGIC
// ==========================================

// Hàm hiển thị thông báo Toastify
function showToast(message, type = "success") {
    let backgroundColor = "#82ae46"; 
    
    if (type === "error") {
        backgroundColor = "#dc3545"; // Màu đỏ (Error)
    } else if (type === "warning") {
        backgroundColor = "#ffc107"; // Màu vàng (Warning)
    }

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "bottom", 
        position: "left", 
        stopOnFocus: true, 
        style: {
            background: backgroundColor,
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600"
        },
        onClick: function(){} 
    }).showToast();
}
  

// Hàm chuyển đổi form Đăng nhập <-> Quên mật khẩu
window.toggleForgotPassword = function(showForgot) {
    const loginBox = document.getElementById('login-container');
    const forgotBox = document.getElementById('forgot-password-container');

    if (showForgot) {
        loginBox.classList.add('d-none');
        forgotBox.classList.remove('d-none');
        // Reset lại form về bước 1
        document.getElementById('forgot-step-1').classList.remove('d-none');
        document.getElementById('forgot-step-2').classList.add('d-none');
        document.getElementById('forgot-step-3').classList.add('d-none');
        document.getElementById('email-forgot').value = "";
        document.getElementById('pin-input').value = "";
        document.getElementById('new-password').value = "";
    } else {
        forgotBox.classList.add('d-none');
        loginBox.classList.remove('d-none');
    }
};

// BƯỚC 1: Gửi mã PIN
window.sendPinCode = async function() {
    const emailInput = document.getElementById('email-forgot').value.trim();
    if (!emailInput) {
        showToast("Vui lòng nhập Email của bạn!", "warning");
        return;
    }

    const btn = document.getElementById('btn-send-pin');
    btn.innerText = "Đang gửi...";
    btn.disabled = true;

    expectedPin = Math.floor(100000 + Math.random() * 900000).toString();
    currentResetEmail = emailInput;

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: emailInput,
            pin_code: expectedPin
        });
        
        showToast("Mã PIN đã được gửi tới email!", "success");
        document.getElementById('forgot-step-1').classList.add('d-none');
        document.getElementById('forgot-step-2').classList.remove('d-none');
    } catch (error) {
        console.error("Lỗi EmailJS:", error);
        showToast("Lỗi gửi mail, vui lòng kiểm tra lại!", "error");
    } finally {
        btn.innerText = "Gửi Mã PIN";
        btn.disabled = false;
    }
};

// BƯỚC 2: Xác thực PIN
window.verifyPinCode = function() {
    const userPin = document.getElementById('pin-input').value.trim();
    if (userPin === expectedPin) {
        showToast("Xác thực thành công!", "success");
        document.getElementById('forgot-step-2').classList.add('d-none');
        document.getElementById('forgot-step-3').classList.remove('d-none');
    } else {
        showToast("Mã PIN không chính xác!", "error");
    }
};

// BƯỚC 3: Lưu mật khẩu mới
window.saveNewPassword = async function() {
    const newPassword = document.getElementById('new-password').value;
    if (!newPassword || newPassword?.length < 6) {
        showToast("Mật khẩu phải có ít nhất 6 ký tự!", "warning");
        return;
    }

    const btn = document.getElementById('btn-save-pass');
    btn.innerText = "Đang lưu...";
    btn.disabled = true;

    try {
        const response = await fetch(API_RESET_PASSWORD, { 
            method: 'POST',
            credentials: 'include', // 🔒 HttpOnly Cookie
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: currentResetEmail,
                newPassword: newPassword 
            })
        });

        const result = await response.json();

        if (response.ok && result.errCode === 0) {
            showToast("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", "success");
            setTimeout(() => {
                toggleForgotPassword(false);
                btn.innerText = "Lưu Mật Khẩu Mới";
                btn.disabled = false;
            }, 2000);
        } else {
            showToast(result.message || "Lỗi cập nhật mật khẩu!", "error");
            btn.innerText = "Lưu Mật Khẩu Mới";
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Lỗi server:", error);
        showToast("Lỗi kết nối máy chủ!", "error");
        btn.innerText = "Lưu Mật Khẩu Mới";
        btn.disabled = false;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Tự động điền Email nếu đã lưu trước đó
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        document.getElementById('email').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }
});


async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isRemember = document.getElementById('rememberMe').checked;

    // ... code validation ...

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                password, 
                rememberMe: isRemember // Gửi trạng thái này xuống Backend
            })
        });

        const result = await response.json();

        if (result.errCode === 0) {
            // 2. Xử lý lưu Email vào máy khách
            if (isRemember) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            showToast("Đăng nhập thành công!", "success");
            window.location.href = "index.html";
        }
    } catch (error) { /* xử lý lỗi */ }
}