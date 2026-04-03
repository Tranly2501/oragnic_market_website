const API_URL = 'http://127.0.0.1:8080'; 

// Hàm hiển thị thông báo 
function showToast(message, type = "success") {
    let backgroundColor = "#82ae46"; 
    if (type === "error") {
        backgroundColor = "#dc3545"; 
    } else if (type === "warning") {
        backgroundColor = "#ffc107"; 
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
        onClick: function(){} // Callback sau khi click
    }).showToast();
}


const infoUser = document.getElementById('profile');
const orderInfor = document.getElementById('order');
const select = document.getElementById('selection');

let nameUser = document.getElementById('user');
let mailUser = document.getElementById('mail');

const usernameInput = document.getElementById('username');
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');

let userOrder = [];
// đẩy dữ liệu từ database vào trang
window.onload = async (userOrder) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/getProfile`, {
            method: 'GET',
            credentials: 'include', 
            headers: {
                'Content-Type': 'application/json'
            }
        });

    

    const data = await response.json();

    if (!response.ok) throw new Error('Không thể lấy dữ liệu');
    

    if(response.ok) { 
        //Cập nhật số lượng đơn hàng , giao 
        document.getElementById('txt-order-count').innerText = data.orderCount || 0;
        document.getElementById('txt-review-count').innerText = data.reviewCount || 0;
        
        usernameInput.value = data.username || 'Tên đăng nhập';
        fullnameInput.value = data.fullname || 'Họ và tên';
        emailInput.value = data.email || 'Email';
        phoneInput.value = data.phone || 'Phone';

        nameUser.innerText = data.username;
        mailUser.innerText = data.email;

        console.log("đã lấy dữ liệu thành công");
        userOrder = data.orders || [];
        renderOrderTable(userOrder);

        }
    } catch(e) {
        console.error(e)
    }
};


// cập nhật thông tin mới nhất từ ô input
if(infoUser){
    infoUser.addEventListener('submit', async function(e) {
        e.preventDefault();
        const updateData = {
            username: usernameInput.value,
            fullname: fullnameInput.value,
            email: emailInput.value,
            phone: phoneInput.value
        }
        try {
           
            const response = await fetch(`${API_URL}/api/auth/updateProfile`, { 
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if(response.ok || response.status == 200) {
                window.location.href = 'profile.html'
                if(nameUser) {
                    alert("Cập nhật thành công");
                    nameUser.innerText = updateData.username;
                    mailUser.innerText = updateData.email
                }
            }

        } catch (error) {
            alert("Lỗi");
            console.error("Lỗi:", error);
        }
    });
}

function renderOrderTable(orders) {
    const orderWrap = document.getElementById('order-wrapper');
    const table = document.getElementById('order-list-content');

    // kiểm tra đơn hàng
    if(!orders || orders.length === 0) {
        orderWrap.style.display = 'block';
    } else {
       table.innerHTML = '';

        orders.forEach((order, index) => {
            const ui = renderOrder(order.status);
            const formattedPrice = Number(order.totalPrice).toLocaleString('vi-VN');
            table.innerHTML += `
                    <td class = "number">${index +1}</td>
                    <td ><input type = "checkbox"></td>
                    <td class = "font-weight-bold">${order.id}</td>
                    <td>${order.lastname || 'Khách'}</td>
                    <td>${order.address}</td>
                    <td>${order.phone}</td>
                    <td>${order.note || ''}</td>
                    <td>
                        <span class = "badge ${ui.class}">
                            <i class = "${ui.icon}"></i> ${ui.text}
                        </span>
                    </td>
                    <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '---'}</td>
                    <td class = "font-weight-bold">${formattedPrice}</td>     
            `
        })
    }
}

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('username').value = data.username;
//     document.getElementById('fullname').value = data.fullname;
//     document.getElementById('email').value = data.email;
//     document.getElementById('phone').value = data.phone;
// });

// Đơn hàng
function  renderOrder(status) {
    // Xử lý giao diện
    switch(status) {
        case 'Đang xử lý': return { text: 'Đang xử lý', class: 'badge-pending', icon: 'fas fa-clock' };
        case 'Đã xác nhận': return { text: 'Đã xác nhận', class: 'badge-confirm', icon: 'fas fa-' };
        case 'Đang giao hàng': return { text: 'Đang giao hàng', class: 'badge-waiting', icon: 'fas fa-truck' };
        case 'Hoàn thành': return { text: 'Hoàn thành', class: 'badge-complete', icon: 'fas fa-check' };
        case 'Đã hủy': return { text: 'Đã hủy', class: 'badge-cancel', icon: 'fas fa-times'};
        default: return { text: 'Không thành công', class: 'badge-unsuccess', icon: 'fas fa-times' };
    }

}

 // Đăng xuất và token
async function logout(){
     try {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include' // Bắt buộc phải có để gửi cookie lên server yêu cầu xóa
        });

        if (response.ok) {
            // 1. Xóa thêm các dữ liệu linh tinh trong localStorage (nếu có)
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');

            // 2. Thông báo và đá về trang chủ hoặc trang login
            showToast("Đã đăng xuất!", "success");
            window.location.href = "/login.html";
        }
    } catch (error) {
        console.error("Lỗi đăng xuất:", error);
    }

}

function showTab(tabId){
    let tabs = document.querySelectorAll(".tab-content");
    tabs.forEach(function(t){
        t.style.display = "none";
        t.classList.remove("active");
    });

    const activeTab = document.getElementById(tabId);
    if(activeTab ) {
        activeTab.style.display = 'block';
        activeTab.classList.add("active");
    } 

    if (tabId === 'orders') { 
        // Hiện luôn cả thẻ con chứa bảng (nếu lồng nhau)
        const subTab = document.getElementById('order-tab');
        if (subTab) subTab.style.display = "block";
        
        const wrapper = document.getElementById('order-wrapper');
        if (wrapper) wrapper.style.display = "block";

        // Gọi hàm render dữ liệu (như đã fix ở các bước trước)
        if (typeof userOrder !== 'undefined') {
            renderOrderTable(userOrder);
        }
    }
};

async function callAPI(url, option = {}) {
    // 🔒 Bổ sung credentials nếu chưa có
    if (!option.credentials) {
        option.credentials = 'include';
    }
    const respone = await fetch(url, option);

    if (respone.status === 401) {
        logout();
        return;
    }

    return respone.json();
}

(function() {
    emailjs.init("BY4aniXi-QLXg13gG"); 
})();

const EMAILJS_SERVICE_ID = "service_w0i2xqq";   
const EMAILJS_TEMPLATE_ID = "template_prjqlyo"; 
let expectedPin = "";
let currentResetEmail = "";


window.validateAndSendOTP = async function() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 1. Kiểm tra dữ liệu cơ bản
    if (!oldPassword || !newPassword || !confirmPassword) {
        showToast("Vui lòng điền đầy đủ mật khẩu!", "warning");
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast("Mật khẩu mới không khớp!", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/getProfile`, {
            method: 'GET',
            credentials: 'include'
        });
        const result = await response.json();
        
       if (result && result.email) {
            currentResetEmail = result.email; 
            console.log(">>> Đã lấy được Email để gửi PIN:", currentResetEmail);
        } else {
            showToast("Không tìm thấy email trong hồ sơ!", "error");
            return;
        }
    } catch (error) {
        showToast("Lỗi kết nối khi lấy Profile!", "error");
        return;
    }

    // 3. Tạo mã PIN ngẫu nhiên 6 số
    expectedPin = Math.floor(100000 + Math.random() * 900000).toString();
    // 4. Gửi Mail qua EmailJS
    const btn = document.querySelector('button[onclick="validateAndSendOTP()"]');
    btn.innerText = "Đang gửi mã...";
    btn.disabled = true;

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: currentResetEmail,
            pin_code: expectedPin
        });

        showToast("Mã PIN đã được gửi vào Email của bạn!", "success");
        // HIỆN POPUP NHẬP PIN
        $('#otpModal').modal('show'); 
        
    } catch (error) {
        console.error("Lỗi EmailJS:", error);
        showToast("Gửi mail thất bại, hãy kiểm tra cấu hình EmailJS!", "error");
    } finally {
        btn.innerText = "Lưu thay đổi";
        btn.disabled = false;
    }
};


window.finalSubmitChangePassword = async function(event) {
    event.preventDefault();
    const userEnteredPin = document.getElementById('otpCode').value;
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (userEnteredPin !== expectedPin) {
        showToast("Mã PIN không chính xác!", "error");
        return;
    }

   try {
        const response = await fetch(`${API_URL}/api/auth/change-password`, { 
            method: 'POST',
            credentials: 'include', // Dùng nếu bạn lưu session/cookie
            headers: { 
                'Content-Type': 'application/json',
                // Nếu dự án dùng Bearer Token, hãy thêm dòng dưới đây:
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ oldPassword: oldPassword, newPassword: newPassword })
        });


        const result = await response.json();
        if (result.errCode === 0) {
            $('#otpModal').modal('hide');
            showToast("Đổi mật khẩu thành công!", "success");
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        showToast("Lỗi hệ thống khi đổi mật khẩu!", "error");
    }
};

