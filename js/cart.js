const API_BASE_URL = 'http://127.0.0.1:8080';

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

document.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});
// Biến toàn cục (đặt ở đầu file cart.js)
let currentSubTotal = 0; 
let currentDiscountValue = 0;
let currentShippingFee = 0; 
// 1. Hàm định dạng tiền tệ
function formatPrice(price) {
    let num = Number(price) || 0;
    return num.toLocaleString('vi-VN') + "đ";
}

// 2. Hàm xử lý ảnh (Theo định dạng {id1: "images/..."})
function getImageUrl(product) {
    let rawImg = product.image_url || product.ImageURL || product.img;
    if (!rawImg) return "images/product-1.jpg";
    
    let path = "";
    // Nếu là Object giống trong ảnh {id1: "images/product_2"}
    if (typeof rawImg === 'object' && rawImg !== null) {
        path = rawImg[Object.keys(rawImg)[0]]; // Lấy giá trị đầu tiên (id1)
    } else {
        path = rawImg;
    }

    if (!path) return "images/product-1.jpg";

    // Tự động thêm đuôi .jpg nếu thiếu
    if (!path.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        path = path + ".jpg";
    }

    if (!path.startsWith('http')) {
        path = path.startsWith('/') ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;
    }
    return path;
}

// 3. Tải và hiển thị giỏ hàng
async function loadCartItems() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = "login.html";
        return;
    }

    const responseData = JSON.parse(userStr);
    const userId = responseData.user ? responseData.user.id : responseData.id;

    try {
        const response = await fetch(`${API_BASE_URL}/get-cart/${userId}`, {
            credentials: 'include' // 🔒 HttpOnly Cookie tự động gửi
        });
        const result = await response.json();
        
        const cartBody = document.getElementById("cart-body");
        
        // KIỂM TRA ĐÚNG CẤU TRÚC: result.data.cartItemData
        if (result.errCode === 0 && result.data && result.data.cartItemData && result.data.cartItemData.length > 0) {
            let html = "";
             currentSubTotal = 0;

            result.data.cartItemData.forEach(item => {
                const p = item.product; // Thông tin sản phẩm
                if (!p) return;

                // Lấy giá: Nếu item.price null thì lấy giá từ p.price
                const currentPrice = Number(item.price);
                const quantity = parseFloat(item.quantity) || 0; // Chuyển "1.000" thành 1
                const subtotal = currentPrice * quantity;
               currentSubTotal += subtotal;

                html += `
                <tr class="text-center">
                    <td class="product-remove">
                        <a href="javascript:void(0)" onclick="removeFromCart(${item.id})">
                            <span class="ion-ios-close"></span>
                        </a>
                    </td>
                    <td class="image-prod">
                        <div class="img" style="background-image:url(${getImageUrl(p)});"></div>
                    </td>
                    <td class="product-name">
                        <h3>${p.name}</h3>
                        <p>Kích thước: ${item.size|| 'Mặc định'}</p>
                         <p>Đơn vị: ${p.unit|| 'Mặc định'}</p>
                    </td>
                    <td class="price">${formatPrice(currentPrice)}</td>
                    
                    <td class="quantity">
                        <div class="input-group mb-3 d-flex align-items-center justify-content-center" style="max-width: 150px; margin: 0 auto;">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary" type="button" onclick="changeQtyBtn(${item.id}, -1, ${parseInt(quantity)})" style="height: 40px; width: 40px; padding: 0;">-</button>
                            </div>
                            
                            <input type="text" class="form-control text-center input-number" value="${parseInt(quantity)}" min="1" max="100" onchange="updateCartQuantity(${item.id}, this.value)" style="height: 40px; padding: 0;">
                            
                            <div class="input-group-append">
                                <button class="btn btn-outline-secondary" type="button" onclick="changeQtyBtn(${item.id}, 1, ${parseInt(quantity)})" style="height: 40px; width: 40px; padding: 0;">+</button>
                            </div>
                        </div>
                    </td>
                    <td class="total">${formatPrice(subtotal)}</td>
                    <td>
                            <input type="checkbox" class="item-check" data-id="${item.id}" data-subtotal="${subtotal}" checked onchange="calculateSelectedTotal()" style="transform: scale(1.5); cursor: pointer;">
                    </td>
                </tr>`;
            });

            cartBody.innerHTML = html;
            
            // Cập nhật bảng tổng tiền
            updateCartTotals();

        } else {
            cartBody.innerHTML = '<tr><td colspan="6" class="py-5"><h4>Giỏ hàng của bạn đang trống!</h4></td></tr>';
           // Nếu giỏ trống, reset sạch sẽ các biến
            currentSubTotal = 0;
            currentDiscountValue = 0;
            updateCartTotals();
        }
    } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
    }
}

// 4. Hàm cập nhật số liệu tổng tiền lên giao diện
function updateTotalDisplay(total) {
    const subtotalEl = document.querySelector('.cart-total p:nth-child(2) span:last-child');
    const totalEl = document.querySelector('.total-price span:last-child');
    
    if (subtotalEl) subtotalEl.innerText = formatPrice(total);
    if (totalEl) totalEl.innerText = formatPrice(total);
}

// 5. Hàm xóa sản phẩm
async function removeFromCart(cartItemId) {
    if (confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
        try {
            // Thay đường dẫn này cho khớp với Route ở Backend của bạn
            const response = await fetch(`${API_BASE_URL}/delete-cart-item/${cartItemId}`, { 
                method: 'DELETE',
                credentials: 'include' // 🔒 HttpOnly Cookie tự động gửi
            });
            
            const data = await response.json();
            
            if (response.ok && data.errCode === 0)
                 {showToast(data.message, "success");

                // Xóa xong thì gọi lại hàm load để bảng cập nhật lại ngay lập tức
                loadCartItems(); 

            } else {
                alert("Lỗi xóa: " + (data.message || "Không xác định"));
            }
        } catch (error) {
            console.error("Lỗi xóa sản phẩm:", error);
            alert("Mất kết nối với máy chủ!");
        }
    }
}

// Hàm xử lý khi bấm nút [+] hoặc [-]
window.changeQtyBtn = function(cartItemId, changeAmount, currentQty) {
    const newQty = parseInt(currentQty) + changeAmount;
    
    // Chỉ cập nhật nếu số lượng lớn hơn hoặc bằng 1
    if (newQty >= 1) {
        updateCartQuantity(cartItemId, newQty);
    } else {
        removeFromCart(cartItemId);
    }
}

// 6. Hàm cập nhật số lượng

async function updateCartQuantity(cartItemId, newQty) {
    if (newQty < 1) return;
    
    // 1. LƯU LẠI TRẠNG THÁI CHECKBOX HIỆN TẠI TRƯỚC KHI RE-LOAD
    const checkedBoxes = document.querySelectorAll('.item-check:checked');
    const checkedIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));

    try {
        const response = await fetch(`${API_BASE_URL}/update-cart`, {
            method: 'PUT',
            credentials: 'include', // 🔒 HttpOnly Cookie tự động gửi
            headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
                cart_item_id: cartItemId,    
                product_quantity: newQty     
            })
        });

        // kết quả từ Backend trả về
        const data = await response.json();

       if (response.ok && data.errCode === 0) {
            // Chờ hàm loadCartItems vẽ xong bảng mới
            await loadCartItems(); 

            // 2. PHỤC HỒI LẠI TRẠNG THÁI CHECKBOX NHƯ CŨ
            const allCheckboxes = document.querySelectorAll('.item-check');
            allCheckboxes.forEach(cb => {
                const id = cb.getAttribute('data-id');
                // Nếu ID của dòng này không nằm trong danh sách đã lưu -> Bỏ tích
                if (!checkedIds.includes(id)) {
                    cb.checked = false; 
                }
            });
            // 3. TÍNH TOÁN LẠI TỔNG TIỀN THEO CÁC Ô ĐANG TÍCH
            calculateSelectedTotal();
        } else {
            alert("Không thể cập nhật: " + (data.message || "Lỗi không xác định"));
            loadCartItems(); 
        }
    } catch (error) {
        console.error("Lỗi cập nhật số lượng:", error);
        alert("Mất kết nối với máy chủ!");
    }
}

//  HÀM CHỌN SP CẦN MUA
window.toggleSelectAll = function() {
    const checkAllBtn = document.getElementById("check-all");
    const itemChecks = document.querySelectorAll(".item-check");
    
    // Đồng bộ tất cả các ô con theo trạng thái của ô tổng
    itemChecks.forEach(cb => {
        cb.checked = checkAllBtn.checked;
    });
    
    // Tính lại tiền
    calculateSelectedTotal();
};
window.calculateSelectedTotal = function() {
    const itemChecks = document.querySelectorAll(".item-check");
    let newSubTotal = 0;
    let allChecked = true;
    let hasItem = false;

    // Lặp qua tất cả ô checkbox sản phẩm
    itemChecks.forEach(cb => {
        hasItem = true;
        if (cb.checked) {
            // Nếu có tích -> Cộng tiền
            newSubTotal += parseFloat(cb.getAttribute("data-subtotal"));
        } else {
            // Nếu có 1 ô bỏ tích -> Ô "Chọn tất cả" sẽ bị tắt
            allChecked = false;
        }
    });

    // Cập nhật trạng thái ô "Chọn tất cả"
    const checkAllBtn = document.getElementById("check-all");
    if (checkAllBtn && hasItem) {
        checkAllBtn.checked = allChecked;
    }

    // Gán lại tiền vào biến toàn cục
    currentSubTotal = newSubTotal;
    
    // Nếu không chọn món nào (tiền = 0), hủy luôn mã giảm giá
    if (currentSubTotal === 0) {
        currentDiscountValue = 0;
        const discountInput = document.getElementById("discount-code-input");
        if(discountInput) discountInput.value = "";
    }

    updateCartTotals();
};


// --------------------------
// Áp mã giảm giá , tính phí vận chuyển và hiện thị giá tiền cần thanh toán 

function updateCartTotals() {
    const subTotalEl = document.getElementById("cart-subtotal");
    const shippingEl = document.getElementById("cart-shipping");
    const discountEl = document.getElementById("cart-discount");
    const totalEl = document.getElementById("cart-total");

    // Tính tổng cuối cùng (Tổng phụ + Vận chuyển - Giảm giá)
    let finalTotal = currentSubTotal + currentShippingFee - currentDiscountValue;
    if (finalTotal < 0) finalTotal = 0; // Tránh tình trạng tiền âm

    // Cập nhật lên UI
    if (subTotalEl) subTotalEl.innerText = formatPrice(currentSubTotal);
    if (shippingEl) shippingEl.innerText = formatPrice(currentShippingFee);
    
    if (discountEl) {
        if (currentDiscountValue > 0) {
            discountEl.innerText = "- " + formatPrice(currentDiscountValue);
            discountEl.style.color = "#dc3545"; // Màu đỏ cho tiền giảm
        } else {
            discountEl.innerText = "0 VNĐ";
            discountEl.style.color = "inherit"; // Trả về màu mặc định
        }
    }
    
    if (totalEl) {
        totalEl.innerText = formatPrice(finalTotal);
    }

    // (Tuỳ chọn) Lưu vào localStorage để mang sang trang Thanh toán (Checkout)
    const cartSummary = {
        subTotal: currentSubTotal,
        discount: currentDiscountValue,
        shipping: currentShippingFee,
        total: finalTotal
    };
    localStorage.setItem('cartSummary', JSON.stringify(cartSummary));
}

// ===============================================
// 2. HÀM GỌI API ÁP DỤNG MÃ GIẢM GIÁ
// ===============================================
window.applyDiscountCode = async function() {
    const codeInput = document.getElementById("discount-code-input").value;
    
    if (!codeInput || codeInput.trim() === "") {
        showToast("Vui lòng nhập mã giảm giá!", "warning");
        return;
    }

    if (currentSubTotal === 0) {
        showToast("Giỏ hàng đang trống, không thể áp dụng mã!", "error");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8080/apply-discount`, {
            method: 'POST',
            credentials: 'include', // 🔒 HttpOnly Cookie tự động gửi
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: codeInput,
                order_total: currentSubTotal 
            })
        });

        const result = await response.json();

        if (result.errCode === 0) {
            alert(result.message); // Hiển thị "Áp dụng thành công"
            
        
            currentDiscountValue = result.data.discountValue; 
            
            // Gọi hàm để vẽ lại các con số
            updateCartTotals();
        } else {
            // Hiển thị lỗi từ Backend (Mã sai, chưa đủ min_order_price...)
            alert(result.message); 
            
            // Hủy giảm giá nếu mã không hợp lệ
            currentDiscountValue = 0; 
            document.getElementById("discount-code-input").value = ""; // Xóa trắng ô nhập
            updateCartTotals();
        }
    } catch (error) {
        console.error("Lỗi áp mã giảm giá:", error);
        alert("Mất kết nối với máy chủ!");
    }
}


// ===============================================
// HÀM LẤY GIÁ TRỊ KHOẢNG CÁCH TỪ ĐỊA CHỈ GỬI ĐẾN ĐỊA CHỈ NHẬN 
// ===============================================

const GOONG_API_KEY = '2cOgcI71FvX8VsxCWsN8wuygMNCKj7UZ8amqllaz';

// Hàm gọi API Goong để đổi địa chỉ thành tọa độ
async function getCoordsFromGoong(address) {
    try {
            const response = await fetch(
            `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${GOONG_API_KEY}`
        );
        const data = await response.json();

        // Nếu Goong tìm thấy địa chỉ
        if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            console.log("Tọa độ tìm thấy từ Goong:", location);
            return {
                lat: location.lat,
                lng: location.lng
            };
        } else {
            console.error("Goong không nhận diện được địa chỉ này!");
            return null;
        }
    } catch (error) {
        console.error("Lỗi kết nối với Goong API:", error);
        return null;
    }
}

// ===============================================
// HÀM ƯỚC TÍNH PHÍ VẬN CHUYỂN 
// ===============================================
window.estimateShipping = async function() {
    // 1. Lấy thông tin khách nhập
    const cityInput = document.getElementById("ship-city");
    const addressInput = document.getElementById("ship-address");
  
    const city = cityInput ? cityInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";

    // Bắt lỗi nếu khách để trống
    if (!city || !address) {
        alert("Vui lòng nhập đầy đủ Tỉnh/Thành phố và Quận/Huyện để tính phí!");
        return;
    }
    
    const btn = document.querySelector('button[onclick="estimateShipping()"]') || document.querySelector('a[onclick="estimateShipping()"]');
    const fullAddress = `${address}, ${city}, Việt Nam`;
    const originalText = "Ước Lượng Phí";

    // 2. KHÓA NÚT 
    if (btn) {
        btn.innerText = "Đang định vị...";
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.pointerEvents = "none";
    }

    try {
        // GỌI GOONG ĐỂ LẤY TỌA ĐỘ
        const coords = await getCoordsFromGoong(fullAddress);

        if (!coords) {
            showToast("Không tìm thấy địa chỉ này, vui lòng nhập rõ hơn!", "error");
            return; 
        }

        if (btn) {
            btn.innerText = "Đang tính...";
        }

        // GỌI XUỐNG BACKEND
        const response = await fetch(`${API_BASE_URL}/calculate-shipping`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_address: fullAddress,
                lat: coords.lat, 
                lng: coords.lng 
            })
        });

        const result = await response.json();

        if (result.errCode === 0) {
            alert(`Ahamove báo giá thành công! Khoảng cách: ${result.distance}km`);
            currentShippingFee = result.fee;
            updateCartTotals(); 
        } else {
            alert("Lỗi: " + result.message);
            currentShippingFee = 0;
            updateCartTotals();
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Mất kết nối máy chủ!");
    } finally {
        // 3. MỞ KHÓA NÚT (Luôn chạy dù thành công hay thất bại)
        if (btn) {
            btn.innerText = originalText;    
            btn.disabled = false;             
            btn.style.opacity = "1";          
            btn.style.pointerEvents = "auto"; 
        }
    }
};

// ===============================================
// HÀM TẢI DỮ LIỆU GIỎ HÀNG SANG TRANG THANH TOÁN (CHECKOUT)
// ===============================================

window.goToCheckout = function() {
    try {
        const checkedBoxes = document.querySelectorAll('.item-check:checked');

        if (checkedBoxes.length === 0) {
            showToast("Vui lòng chọn ít nhất một sản phẩm để thanh toán!", "warning");
            return;
        }

        const selectedItems = [];
        checkedBoxes.forEach(cb => {
            const itemId = cb.getAttribute('data-id');
            if (itemId) {
                selectedItems.push(parseInt(itemId));
            }
        });

        // 2. Lấy các số tiền từ giao diện 
        const getPriceFromHTML = (elementId) => {
            const el = document.getElementById(elementId);
            if (!el) return 0;
            return parseInt(el.innerText.replace(/[^0-9]/g, '')) || 0;
        };

        const subtotal = getPriceFromHTML("cart-subtotal");
        const shipping = getPriceFromHTML("cart-shipping");
        const discount = getPriceFromHTML("cart-discount");
        const total = getPriceFromHTML("cart-total");

        // 3. Đóng gói dữ liệu gửi sang Checkout
        const checkoutData = {
            city: document.getElementById("ship-city")?.value.trim() || "",
            address: document.getElementById("ship-address")?.value.trim() || "", 
            subtotal: subtotal,
            shipping: shipping,
            discount: discount,
            total: total,
            selectedItems: selectedItems 
        };

        localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        console.log(" Dữ liệu gửi sang checkout:", checkoutData);
        
        window.location.href = "checkout.html";

    } catch (error) {
        console.error("Lỗi khi chuẩn bị checkout:", error);
        showToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
    }
};