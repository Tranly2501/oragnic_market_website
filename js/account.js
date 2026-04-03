
function showToast(message, type = "success") {
    let backgroundColor = "#82ae46"; // Màu xanh Vegefoods mặc định (Success)
    
    if (type === "error") {
        backgroundColor = "#dc3545"; // Màu đỏ (Error)
    } else if (type === "warning") {
        backgroundColor = "#ffc107"; // Màu vàng (Warning)
    }

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "bottom", // Hiển thị ở trên
        position: "left", // Hiển thị bên phải
        stopOnFocus: true, // Tạm dừng đếm ngược khi di chuột vào
        style: {
            background: backgroundColor,
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600"
        },
        onClick: function(){} // Callback khi click vào toast (nếu cần)
    }).showToast();
}
  
$(document).ready(function() {

    // ==========================================
    // 1. TÍNH NĂNG ẨN/HIỆN MẬT KHẨU
    // ==========================================
    $(".toggle-password").click(function() {
        var input = $("#password");
        if (input.attr("type") === "password") {
            input.attr("type", "text");
            $(this).removeClass("fa-eye").addClass("fa-eye-slash");
        } else {
            input.attr("type", "password");
            $(this).removeClass("fa-eye-slash").addClass("fa-eye");
        }
    });

    $(".toggle-password2").click(function() {
        var input = $("#confirmPassword");
        if (input.attr("type") === "password") {
            input.attr("type", "text");
            $(this).removeClass("fa-eye").addClass("fa-eye-slash");
        } else {
            input.attr("type", "password");
            $(this).removeClass("fa-eye-slash").addClass("fa-eye");
        }
    });

    // ==========================================
    // 2. TÍNH NĂNG KIỂM TRA ĐIỀU KIỆN (VALIDATION)
    // ==========================================
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^0\d{9}$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    const $email = $("#reg-email");
    const $phone = $("#reg-phone");
    const $password = $("#password");
    const $confirmPassword = $("#confirmPassword");
    const $btnRegister = $("#btn-register");

    function validateForm() {
        let isValid = true;

        // Kiểm tra Email
        if ($email.val()?.length > 0 && !emailRegex.test($email.val())) {
            showError($email, "#err-email", "Email phải có đuôi @gmail.com");
            isValid = false;
        } else if ($email.val()?.length > 0) {
            showSuccess($email, "#err-email");
        } else { isValid = false; }

        // Kiểm tra Số điện thoại
        if ($phone.val()?.length > 0 && !phoneRegex.test($phone.val())) {
            showError($phone, "#err-phone", "SĐT gồm 10 số và bắt đầu bằng số 0!");
            isValid = false;
        } else if ($phone.val()?.length > 0) {
            showSuccess($phone, "#err-phone");
        } else { isValid = false; }

        // Kiểm tra Mật khẩu
        if ($password.val()?.length > 0 && !passRegex.test($password.val())) {
            showError($password, "#err-password", "Mật khẩu ≥ 6 ký tự, gồm chữ HOA, chữ thường và số!");
            isValid = false;
        } else if ($password.val()?.length > 0) {
            showSuccess($password, "#err-password");
        } else { isValid = false; }

        // Kiểm tra Xác nhận mật khẩu
        if ($confirmPassword.val()?.length > 0 && $confirmPassword.val() !== $password.val()) {
            showError($confirmPassword, "#err-confirmPassword", "Mật khẩu xác nhận không khớp!");
            isValid = false;
        } else if ($confirmPassword.val()?.length > 0) {
            showSuccess($confirmPassword, "#err-confirmPassword");
        } else { isValid = false; }

        // Bật/tắt và đổi màu nút Đăng Ký
        if (isValid) {
            $btnRegister.css({"background-color": "#82ae46", "border-color": "#82ae46"}).prop("disabled", false);
        } else {
            $btnRegister.css({"background-color": "#dc3545", "border-color": "#dc3545"}).prop("disabled", true);
        }

        return isValid;
    }

    // Hàm hiện lỗi (Viền đỏ, chữ đỏ)
    function showError($input, errId, message) {
        $input.css("border-color", "#dc3545");
        $(errId).text(message).show();
    }

    // Hàm báo đúng (Viền xanh, ẩn chữ)
    function showSuccess($input, errId) {
        $input.css("border-color", "#82ae46");
        $(errId).hide();
    }

    // Lắng nghe sự kiện gõ phím
    $email.on('input', validateForm);
    $phone.on('input', validateForm);
    $password.on('input', validateForm);
    $confirmPassword.on('input', validateForm);


    // ==========================================
    // 3. XỬ LÝ GỌI API ĐĂNG KÝ KHI SUBMIT
    // ==========================================
    const API_URL = 'http://127.0.0.1:8080'; 
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Ngăn trình duyệt load lại trang
            
            // Lấy dữ liệu từ form
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('password').value;
            
            // Gộp Họ và Tên thành Fullname nếu Backend yêu cầu fullname
            const fullname = firstName.trim() + " " + lastName.trim();
            const username = firstName+lastName;

            try {
                // Gọi API Đăng ký
                const response = await fetch(`${API_URL}/api/auth/register`, { 
                    method: 'POST',
                    credentials: 'include', // 🔒 HttpOnly Cookie tự động gửi
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        fullname: fullname,
                        username:username,
                        email: email,
                        phone: phone,
                        password: password,
                        rePassword: password // Gửi kèm theo format Backend yêu cầu
                    })
                });

                let data;
                try { data = await response.json(); } 
                catch (err) { data = { message: "Đăng ký thành công!" }; }

                if (response.ok || response.status === 201) {
                    window.location.href = "login.html"; 
                    showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
                } else {
                    showToast("Lỗi đăng ký: " + (data.message || "Tài khoản hoặc Email đã tồn tại!"), "error");
                }
            } catch (error) {
                console.error("Lỗi:", error);
                showToast("Có lỗi xảy ra khi đăng ký.", "error");
            }
        });
    }


    // ==========================================
    // 4. XỬ LÝ GỌI API ĐĂNG NHẬP KHI SUBMIT
    // ==========================================
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Ngăn trình duyệt load lại trang
            
            // Lấy dữ liệu từ form
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('password').value;

            try {
            
                const response = await fetch(`${API_URL}/api/auth/login`, { 
                    method: 'POST',
                    credentials: 'include', // 🔒 HttpOnly Cookie tự động gửi
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: email,
                        password: password
                    })
                });

                console.log('[account.js] Login API request sent, status:', response.status);

                let data;
                try { data = await response.json(); } 
                catch (err) { data = { message: "Đăng nhập thành công!" }; }

                console.log('[account.js] Login API response body:', data);

                if (response.ok || response.status === 200) {
                  
                    
                    // LƯU THÔNG TIN ĐĂNG NHẬP VÀO LOCALSTORAGE TRÌNH DUYỆT
                    try {
                        localStorage.setItem('currentUser', JSON.stringify(data));
                    } catch (err) {
                        console.warn('[account.js] Cannot write currentUser to localStorage:', err);
                    }
                      showToast("Xác thực thành công!", "success");
                    // Chuyển hướng người dùng về trang chủ
                    window.location.href = "index.html"; 
                } else {
                    showToast("Đăng nhập thất bại: " + (data.message || "Sai email hoặc mật khẩu!"), "error");
                }
            } catch (error) {
                console.error("Lỗi:", error);
                showToast("Không thể kết nối tới máy chủ API.", "error");
            }
        });
    }

});

