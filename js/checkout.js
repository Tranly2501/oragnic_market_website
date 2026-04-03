const GOONG_API_KEY = '2cOgcI71FvX8VsxCWsN8wuygMNCKj7UZ8amqllaz'; 
const API_BASE_URL = 'http://127.0.0.1:8080';
        
let currentSubtotal = 0; 
let currentShipping = 0;
let currentDiscount = 0;

function showToast(message, type = "success") {          
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "bottom", 
        position: "left", 
        stopOnFocus: true, 
        style: {
            background: type === "success" ? "#82ae46" : (type === "warning" ? "#ffe595" : "#dc3545"),
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            color: type === "warning" ? "#000" : "#fff" // Nếu là warning (vàng) thì chữ đen cho dễ đọc
        },
        onClick: function(){} 
    }).showToast();
}

// Hàm định dạng tiền tệ VNĐ
const formatVND = (number) => {
    return new Intl.NumberFormat('vi-VN').format(number) + ' VNĐ';
};
      

async function goToCheckout() {
    try{    
        const saveData = localStorage.getItem("checkoutData");

        if (saveData) {
            const data = JSON.parse(saveData);
            console.log("Dữ liệu đã lưu trong localStorage:", data);

         
            if(data.city) $("#checkout-city").val(data.city);
            if(data.address) $("#checkout-address").val(data.address); 
            // Nếu bạn có ô chi tiết, bạn có thể truyền nó từ cart.js sang data.addressDetail
            
            currentSubtotal = data.subtotal || 0;
            currentShipping = data.shipping || 0;
            currentDiscount = data.discount || 0;

        } else {
            showToast("Không tìm thấy thông tin giỏ hàng!", "warning");
            window.location.href = "cart.html";
        }

    } catch(error) {
        console.error("Lỗi khi chuyển đến trang thanh toán:", error);
    }

    //   Lấy danh sách sản phẩm từ API
    fetchItemsFromDatabase();
    
    updateCheckoutTotals();
   
}

// ==========================================
//  LẤY DANH SÁCH GIỎ HÀNG TỪ API
// ==========================================
async function fetchItemsFromDatabase() {
    try {
        const currentUserStr = localStorage.getItem('currentUser');
        const checkoutDataStr = localStorage.getItem('checkoutData');
        
        if (!currentUserStr || !checkoutDataStr) {
            showToast("Dữ liệu không hợp lệ, quay lại giỏ hàng!", "error");
            setTimeout(() => window.location.href = "cart.html", 1500);
            return;
        }

        const currentUser = JSON.parse(currentUserStr);
        const checkoutData = JSON.parse(checkoutDataStr);
        const selectedIds = checkoutData.selectedItems || []; // Mảng ID Ly gửi từ cart.js

        const userId = currentUser.user?.id || currentUser.id;

        const response = await fetch(`${API_BASE_URL}/get-cart/${userId}`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        });

        const result = await response.json();

        if (result.errCode === 0 && result.data && result.data.cartItemData) {
            const allItemsInCart = result.data.cartItemData;

            //  BƯỚC LỌC: Chỉ lấy những món hàng Ly đã tích chọn ở trang Cart
            const itemsToPay = allItemsInCart.filter(item => selectedIds.includes(item.id));

            if (itemsToPay.length === 0) {
                showToast("Không có sản phẩm nào được chọn!", "warning");
                return;
            }

            // Hiển thị danh sách đã lọc
            displayCheckoutItems(itemsToPay);
            
            // Cập nhật lại số tiền dựa trên danh sách đã lọc này
            calculateOrderSummary(itemsToPay);
            
            console.log("✅ Đã lọc thành công các món cần thanh toán:", itemsToPay);
        }
    } catch (error) {
        console.error("Lỗi fetch giỏ hàng tại checkout:", error);
        showToast("Lỗi tải dữ liệu đơn hàng!", "error");
    }
}



// ==========================================
//  HIỂN THỊ DANH SÁCH SẢN PHẨM
// ==========================================
function displayCheckoutItems(items) {
    let html = '';
    
    if (!Array.isArray(items) || items.length === 0) {
        $('#checkout-items-list').html('<p class="text-center">Giỏ hàng trống!</p>');
        return;
    }

    items.forEach((item) => {
        try {
          
            const itemName = item.product?.name || 'Sản phẩm';
            const itemQty = parseFloat(item.quantity) || 0;
            const itemPrice = parseFloat(item.price) || 0;
            
            
            // Trọng lượng lấy từ trường "size" trong JSON của bạn (ví dụ: "1kg")
            const itemWeight = item.size || item.product?.unit || 'N/A';
            
            const itemTotal = itemPrice * itemQty;

            html += `
                <div class="d-flex mb-3 align-items-center border-bottom pb-2">
                    <div style="flex: 1;">
                        <h6 class="mb-0" style="font-weight: 300;">${itemName} <span class="text-success">x ${itemQty}</span></h6>
                        <small class="text-muted">Trọng lượng: <strong>${itemWeight}</strong></small>
                    </div>
                    <div class="text-right">
                        <small class="d-block text-muted" style="font-size: 11px;">${formatVND(itemPrice)}</small>
                        <span class="font-weight-bold" style="color: #82ae46;">${formatVND(itemTotal)}</span>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("Lỗi render item:", e);
        }
    });

    $('#checkout-items-list').html(html);
}

// Tính toán lại tiền dựa trên dữ liệu thật từ DB
function calculateOrderSummary(items) {
    if (!Array.isArray(items)) return;

    currentSubtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseFloat(item.quantity) || 0;
        return sum + (price * qty);
    }, 0);
    
    updateCheckoutTotals();
}

// ==========================================
// CẬP NHẬT GIAO DIỆN TỔNG TIỀN
// ==========================================
window.updateCheckoutTotals = function() {
    const total = currentSubtotal + currentShipping - currentDiscount;

    $('#checkout-subtotal').text(formatVND(currentSubtotal));
    $('#checkout-shipping').text(formatVND(currentShipping));
    
    if (currentDiscount > 0) {
        $('#checkout-discount').text('- ' + formatVND(currentDiscount)); 
    }
    
    $('#checkout-total').text(formatVND(total));
};

// ==========================================
// TÍNH LẠI PHÍ VẬN CHUYỂN KHI ĐỔI ĐỊA CHỈ
// ==========================================
window.calculateCheckoutShipping = async function() {
    const city = $('#checkout-city').val().trim();
    const address = $('#checkout-address').val().trim();
    // Kiểm tra field có tồn tại không
    const addressDetail = $('#checkout-address-detail').length 
        ? $('#checkout-address-detail').val().trim() 
        : '';

    if (!city || !address) {
        showToast("Vui lòng nhập đầy đủ Tỉnh/Thành phố và Quận/Huyện để tính phí!", "warning");
        return;
    }
    
    const fullAddress = addressDetail 
        ? `${addressDetail}, ${address}, ${city}, Việt Nam` 
        : `${address}, ${city}, Việt Nam`;
    
    const btn = $('#btn-recalc-ship');
    
    btn.text("Đang định vị...").prop("disabled", true);

    try {
        //   Thêm timeout cho API call
        const goongRes = await Promise.race([
            fetch(`https://rsapi.goong.io/geocode?address=${encodeURIComponent(fullAddress)}&api_key=${GOONG_API_KEY}`),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Goong API timeout")), 10000))
        ]);

        //   Kiểm tra response status
        if (!goongRes.ok) {
            throw new Error(`Goong API error: ${goongRes.status}`);
        }

        const goongData = await goongRes.json();

        if (!goongData.results || goongData.results.length === 0) {
            showToast("Không tìm thấy địa chỉ, vui lòng kiểm tra lại!", "error");
            return;
        }

        const coords = goongData.results[0].geometry.location;
        btn.text("Đang tính phí...");

        //   Add timeout cho backend API call
        const response = await Promise.race([
            fetch(`${API_BASE_URL}/calculate-shipping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_address: fullAddress,
                    lat: coords.lat, 
                    lng: coords.lng 
                })
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Backend API timeout")), 10000))
        ]);

        //   Kiểm tra response status
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const result = await response.json();

        if (result.errCode === 0) {
            //   Validate fee trước khi lưu
            const fee = Number(result.fee);
            if (!Number.isFinite(fee) || fee < 0) {
                throw new Error("Phí vận chuyển không hợp lệ");
            }
            
            showToast(`Đã cập nhật phí ship: ${formatVND(fee)}`, "success");
            currentShipping = fee;
            
            updateCheckoutTotals();
            
            const savedData = JSON.parse(localStorage.getItem('checkoutData')) || {};
            savedData.shipping = fee;
            localStorage.setItem('checkoutData', JSON.stringify(savedData));

        } else {
            throw new Error(result.message || "Lỗi tính phí vận chuyển");
        }
    } catch (error) {
        console.error("Lỗi khi tính phí vận chuyển:", error);
        
        if (error.message.includes("timeout")) {
            showToast("API timeout! Vui lòng thử lại.", "error");
        } else if (error.message.includes("Failed to fetch")) {
            showToast("Mất kết nối mạng!", "error");
        } else {
            showToast("Lỗi tính phí: " + error.message, "error");
        }
    } finally {
        btn.text("Cập nhật phí vận chuyển theo địa chỉ mới").prop("disabled", false);
    }
};

// ==========================================
// XỬ LÝ NÚT TIẾN HÀNH THANH TOÁN (ĐẶT HÀNG)
// ==========================================
window.placeOrder = async function(event) {
    const submitBtn = $('#place-order-btn'); 
    
    // Ngăn submit lại nếu đang xử lý
    if (submitBtn.length && submitBtn.prop('disabled')) {
        return;
    }
    if (event) event.preventDefault();

    console.log(">>> [1] Đã bấm nút Thanh Toán, bắt đầu kiểm tra dữ liệu...");

    // 1. LẤY DỮ LIỆU AN TOÀN (Dùng toán tử Optional Chaining "?." để chống sập web)
    const firstName = $('#checkout-firstname').val()?.trim() || "";
    const lastName = $('#checkout-lastname').val()?.trim() || "";
    const phone = $('#checkout-phone').val()?.trim() || "";
    const email = $('#checkout-email').val()?.trim() || "";
    const city = $('#checkout-city').val()?.trim() || "";
    const address = $('#checkout-address').val()?.trim() || "";
    const addressDetail = $('#checkout-address-detail').val()?.trim() || "";

    // 2. BẮT BUỘC NHẬP ĐẦY ĐỦ THÔNG TIN CƠ BẢN
    if (!firstName || !lastName || !phone || !email || !city || !address) {
        showToast("Vui lòng điền đầy đủ Tên, SĐT, Email và Địa chỉ giao hàng!", "warning");
        return;
    }

    console.log(">>> [2] Thông tin khách hàng hợp lệ:", `${firstName} ${lastName}`);

    // 3. KIỂM TRA ĐỊNH DẠNG SỐ ĐIỆN THOẠI
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(phone)) {
        showToast("Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số.", "warning");
        return;
    }

    // 4. KIỂM TRA ĐỊNH DẠNG EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast("Địa chỉ Email không đúng định dạng!", "warning");
        return;
    }

    // 5. Kiểm tra checkbox Điều khoản
    if (!$('#terms-check').is(':checked')) {
        showToast("Vui lòng đồng ý với các điều khoản trước khi thanh toán!", "warning");
        return;
    }

    // 6. Kiểm tra giỏ hàng
    if (currentSubtotal <= 0) {
        showToast("Giỏ hàng của bạn đang trống hoặc không hợp lệ!", "warning");
        return;
    }
    
    // 7. Lấy phương thức thanh toán
    const paymentMethod = $('input[name="payment_method"]:checked').parent().text().trim();
    if (!paymentMethod) {
        showToast("Vui lòng chọn phương thức thanh toán!", "warning");
        return;
    }

    // 8. Lấy danh sách ID đã chọn một cách an toàn
    let selectedIds = [];
    try {
        const localData = JSON.parse(localStorage.getItem('checkoutData') || "{}");

        selectedIds = localData.selectedItems || [];
    } catch (e) {
        console.warn("Không đọc được localStorage", e);
    }

    if (selectedIds.length === 0) {
        showToast("Không tìm thấy danh sách sản phẩm cần thanh toán!", "error");
        return;
    }

    // 9. Chuẩn bị gói dữ liệu
    const fullAddress = addressDetail ? `${addressDetail}, ${address}` : address;
  
    const orderData = {
        firstname: firstName,
        lastname: lastName,
        phone: phone,
        email: email,
        provinces: city,
        address: fullAddress,
        basePrice: currentSubtotal,
        dilivery: currentShipping,
        discount_amount: currentDiscount,
        discount_id: null,
        payment_method: paymentMethod,
        selectedCartItemIds: selectedIds ,
        total: currentSubtotal + currentShipping - currentDiscount
    };

    // ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT: IN DỮ LIỆU RA CONSOLE
    console.log(">>> [3] DỮ LIỆU GỬI XUỐNG BACKEND:", orderData);

    // Disable nút submit
    if (submitBtn.length) {
        submitBtn.prop('disabled', true).text('Đang xử lý...');
    }
    showToast("Đang gửi yêu cầu đặt hàng...", "success");

    try {
        const response = await fetch(`${API_BASE_URL}/create-order`, { 
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            let errorMessage = "Đặt hàng thất bại!";
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `HTTP Error ${response.status}`;
            }
            showToast(errorMessage, "error");
            return;
        }

        const data = await response.json();
        
        if (data.errCode !== 0 || !data.orderId) {
            showToast(data.message || "Dữ liệu phản hồi không hợp lệ!", "error");
            return;
        }

        showToast("Đặt hàng thành công! Mã đơn: " + data.orderId, "success");
        
        // Dọn dẹp LocalStorage
        localStorage.removeItem('checkoutData');
        
        setTimeout(() => {
            window.location.href = "/profile.html"; 
        }, 1500);
        
    } catch (error) {
        console.error("Lỗi khi gửi yêu cầu đặt hàng:", error);
        // ĐÃ FIX: Hiển thị lỗi rõ ràng thay vì biến errorMsg bị undefined
        showToast("Mất kết nối mạng. Vui lòng thử lại!", "error");
    } finally {
        if (submitBtn.length) {
            submitBtn.prop('disabled', false).text('Thanh Toán');
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    goToCheckout();


    $('#checkout-city, #checkout-address').on('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            calculateCheckoutShipping(); // Tự động tính phí ship
        }
    });
}); 