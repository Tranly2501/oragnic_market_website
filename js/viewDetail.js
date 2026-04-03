
// Hàm hiển thị thông báo thay cho alert()
function showToast(message, type = "success") {
    let backgroundColor = "#82ae46"; // Màu xanh Vegefoods mặc định (Success)
    
    if (type === "error") {
        backgroundColor = "#dc3545"; // Màu đỏ (Error)
    } else if (type === "warning") {
        backgroundColor = "#e1c46d"; // Màu vàng (Warning)
    }

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "bottom", 
        position: "left", 
        stopOnFocus: true, // Tạm dừng đếm ngược khi di chuột vào
        className: "custom-toast-slide",
        style: {
            background: backgroundColor,
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "450"
        },
        onClick: function(){} 
    }).showToast();
}


// ==========================================
// CẤU HÌNH API VÀ DANH MỤC
// ==========================================
const API_URL = 'http://127.0.0.1:8080/all-products'; 
const categoryMap = {
    1: "Rau củ",
    2: "Trái cây",
    3: "Hạt",
    4: "Nước ép"
};

let currentProduct = null; 
let currentSelectedPrice = 0; 
let selectedSizeLabel = "";

// ==========================================
// HÀM LẤY ID TỪ URL VÀ GỌI API
// ==========================================
async function loadProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        document.querySelector(".product-details").innerHTML = "<h3 class='text-danger'>Không tìm thấy mã sản phẩm!</h3>";
        return;
    }

    try {
        // Lấy dữ liệu từ API
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Lỗi kết nối Server");
        const data = await response.json();
        
        let rawData = data.products ? data.products : data;
        
        // Tìm sản phẩm khớp với ID trên URL
        const product = rawData.find(item => (item.ProductID == productId || item.id == productId));

        if (product) {
            currentProduct = product;
            renderProductData(product);
            // SẢN PHẨM LIÊN QUAN:
            renderRelatedProducts(product, rawData); 
            // đánh giá 
            loadFeedbacks(productId);
            
        } else {
            document.querySelector(".product-details").innerHTML = "<h3 class='text-danger'>Sản phẩm không tồn tại hoặc đã bị xóa!</h3>";
        }
    } catch (error) {
        console.error("Lỗi:", error);
        document.querySelector(".product-details").innerHTML = "<h3 class='text-danger'>Lỗi tải dữ liệu từ máy chủ!</h3>";
    }
}

// ==========================================
// HÀM FORMAT GIÁ VÀ RENDER GIAO DIỆN
// ==========================================


function renderProductData(p) {

    const name = p.ProductName || p.name || "Tên sản phẩm";
    const img = getImageUrl(p);
    const desc = p.descriptionDetail|| "Sản phẩm chưa có bài mô tả chi tiết.";
    const code = p.ProductCode || p.code || "SP00" + (p.ProductID || p.id);
    const stock = Number(p.Stock || p.stock || 0);
    const supplier = p.supplier || "Đang cập nhập";
    
    
    // Dịch categoryID sang chữ
    let catId = p.CategoryID || p.category_id || p.category;
    const categoryText = categoryMap[catId] || "Khác"; 

    // Gán dữ liệu cơ bản
    document.getElementById("product-name").innerText = name;
    document.getElementById("product-img").src = img;
    document.getElementById("product-img").alt = name;
    document.getElementById("product-desc").innerText = desc;
    document.getElementById("product-code").innerText = code;
    document.getElementById("product-category").innerText = categoryText;
    document.getElementById("product-supplier").innerText = supplier;

        // --- PHẦN 4: HIỂN THỊ GIÁ  ---
    const priceBox = document.getElementById("price");
    const packagingInfo = document.getElementById("packaging-info");
    if(packagingInfo) packagingInfo.innerText = `/ ${p.unit || "Sản phẩm"}`;

    // Hiển thị giá và giá cũ (nếu có giảm giá)
    if (p.discount > 0) {
        let oldPrice = currentSelectedPrice / (1 - p.discount/100);
        priceBox.innerHTML = `
            <span class="mr-2 text-muted" style="text-decoration: line-through; font-size: 20px;">${formatPrice(oldPrice)}</span>
            <span class="text-success">${formatPrice(currentSelectedPrice)}</span>`;
    } else {
        priceBox.innerHTML = `<span>${formatPrice(currentSelectedPrice)}</span>`;
    }

   const sizeWrapper = document.getElementById("product-size-wrapper");
const sizeContainer = document.getElementById("product-size");
let sizes = [];

try {
    sizes = typeof p.size === 'string' ? JSON.parse(p.size) : p.size;
} catch (e) { sizes = []; }

if (Array.isArray(sizes) && sizes.length > 0) {
    sizeWrapper.style.display = "flex";
    let sizeHtml = "";
    
    const hasOneKgOption = sizes.some(item => item.val == 1);

    sizes.forEach((item, index) => {
        const label = formatWeightLabel(item.val, p.unit);
        
        // Nếu sản phẩm có 1kg -> nút nào là 1kg thì active. 
        // Nếu không có 1kg -> nút đầu tiên được active.
        let isActive = false;
        if (hasOneKgOption) {
            if (item.val == 1) isActive = true;
        } else if (index === 0) {
            isActive = true;
        }
        
        
        if (isActive) {
            currentSelectedPrice = item.price;
            selectedSizeLabel = label;
        }

        sizeHtml += `
            <button class="btn btn-outline-primary btn-size-option mr-2 mb-2 ${isActive ? 'active' : ''}" 
                    style="border-radius: 5px; padding: 5px 15px;"
                    onclick="updatePriceByObject(this, ${item.price}, '${label}')">
                ${label}
            </button>`;
    });
    sizeContainer.innerHTML = sizeHtml;
    updatePriceDisplay();
    } else {
        sizeWrapper.style.display = "none";
    }



    // Xử lý Tình trạng Hàng (Còn/Hết)
    const status = document.getElementById("product-status");
    const addToCartBtn = document.querySelector(".product-details a[href='cart.html']");

    if (stock > 0) {
        status.innerText = `Còn hàng (${stock})`;
        status.className = "text-success ml-3 font-weight-bold";
    } else {
        status.innerText = "Hết hàng";
        status.className = "text-danger ml-3 font-weight-bold";
        // Ẩn nút Thêm vào giỏ hàng và ô chọn số lượng nếu hết hàng
        if (addToCartBtn) addToCartBtn.style.pointerEvents = "none";
        if (addToCartBtn) addToCartBtn.style.background = "#ccc";
        document.querySelector(".input-group").style.display = "none";
    }


    function formatWeightLabel(val,unit) {
            const u = unit ? unit.toLowerCase() : "";
            const value = Number(val);

            if (u === 'chai' && value < 1) return (value * 1000) + "ml";
            if (value < 1) return (value * 1000) + "g";
            return value + (u === 'chai' ? "L" : "kg");
    }

        // --- Hàm khi bấm nút chọn trọng lượng ---
        window.updatePriceByObject = function(btn, price, label) {
                // 1. Tìm tất cả các nút cùng loại và xóa class 'active'
                document.querySelectorAll('.btn-size-option').forEach(b => {
                    b.classList.remove('active');
                });

                // 2. Thêm class 'active' vào nút vừa được click
                btn.classList.add('active');
                
                // 3. Cập nhật các biến logic và hiển thị giá
                currentSelectedPrice = price;
                selectedSizeLabel = label;
                updatePriceDisplay();
            };

        function updatePriceDisplay() {
            document.getElementById("price").innerText = formatPrice(currentSelectedPrice);
        }


        // =====================================
    // XỬ LÝ ĐỔ DỮ LIỆU SPECIFICATION VÀO BẢNG TAB
    // =====================================
    const specTable = document.getElementById("specification-table");
    if (p.specification) {
        let spec = p.specification;
        
        // Nếu database trả về chuỗi JSON (string), parse nó thành Object
        if (typeof spec === 'string') {
            try { spec = JSON.parse(spec); } catch (e) { console.error("Lỗi đọc dữ liệu specification:", e); }
        }

        if (typeof spec === 'object' && spec !== null) {
            let html = "";
            // Chỉ render những dòng có dữ liệu từ Database
            if(spec.origin) html += `<tr><td style="width: 25%; font-weight: 600; color: #000;">Nguồn gốc</td><td>${spec.origin}</td></tr>`;
            if(spec.weight) html += `<tr><td style="font-weight: 600; color: #000;">Khối lượng</td><td>${spec.weight}</td></tr>`;
            if(spec.nutrition) html += `<tr><td style="font-weight: 600; color: #000;">Dinh dưỡng</td><td>${spec.nutrition}</td></tr>`;
            if(spec.exp) html += `<tr><td style="font-weight: 600; color: #000;">Bảo quản</td><td>${spec.exp}</td></tr>`;
            if(spec.benefits) html += `<tr><td style="font-weight: 600; color: #000;">Lợi ích</td><td>${spec.benefits}</td></tr>`;
            
            // Đổ vào bảng, nếu rỗng thì báo chưa cập nhật
            specTable.innerHTML = html !== "" ? html : `<tr><td colspan="1" class="text-center text-muted">Sản phẩm chưa cập nhật thông số chi tiết</td></tr>`;
        } else {
            specTable.innerHTML = `<tr><td colspan="1" class="text-center text-muted">Sản phẩm chưa cập nhật thông số chi tiết</td></tr>`;
        }
    } else {
        specTable.innerHTML = `<tr><td colspan="1" class="text-center text-muted">Sản phẩm chưa cập nhật thông số chi tiết</td></tr>`;
    }
}

// ==========================================
// HÀM THÊM SẢN PHẨM VÀO GIỎ HÀNG 
// ==========================================
window.addCart = async function () {

    const params = new URLSearchParams(window.location.search);
    let  productId = params.get("id");
    if (!productId) {
        productId = params.get("ProductID");
    }

    if (!productId && currentProduct) {
        productId = currentProduct.id || currentProduct.ProductID;
    }

    // Kiểm tra cuối cùng
    if (!productId) {
        console.error("URL hiện tại:", window.location.href);
        showToast("Lỗi: Không tìm thấy ID sản phẩm trên đường dẫn!","error");
        return;
    }
    console.log("ID sản phẩm xác định được:", productId);

    // 1. Kiểm tra đăng nhập
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        alert("Bạn cần đăng nhập để mua hàng!");
        window.location.href = "login.html";
        return;
    }

    const responseData = JSON.parse(userStr);
    const userId = responseData.user ? responseData.user.id : responseData.id;
    const quantity = document.getElementById("quantity").value;

    // Lấy giá từ biến toàn cục (đã được gán trong loadProductDetail)
    let priceToSend = 0;
    if (currentProduct) {
        let originalPrice = Number(currentProduct.Price || currentProduct.price);
        let discountPrice = Number(  currentSelectedPrice );

        // Ưu tiên giá khuyến mãi nếu có
        if (discountPrice > 0 && discountPrice < originalPrice) {
            priceToSend = discountPrice;
        } else {
            priceToSend = originalPrice;
        }
    }
    
    console.log("Giá sẽ gửi đi là:", priceToSend);
    // 2. Gửi dữ liệu lên API Giỏ hàng
    try {
        const response = await fetch(`http://127.0.0.1:8080/add-to-cart`, {
            method: 'POST',
            credentials: 'include', // 🔒 HttpOnly Cookie tự động gửi
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: Number(userId),
                product_id: Number(productId),
                quantity: Number(quantity),
                price:  Number(priceToSend),
                size: selectedSizeLabel || null,
                unit: currentProduct?.unit || ""
            })
        });

        const result = await response.json();

        if (response.ok || result.errCode === 0) {
            showToast(result.message, "success");
        } else {
            alert("Lỗi: " + (result.message || "Không thể thêm vào giỏ"));
        }
    } catch (error) {
        console.error("Lỗi thêm giỏ hàng:", error);
        alert("Mất kết nối với máy chủ Backend!");
    }
}


// XỬ LÝ BÌNH LUẬN (ĐÁNH GIÁ SAO VÀ GỌI API)
// ==========================================
let selectedRating = 0;
// 1. Khởi tạo hiệu ứng chọn Sao và điền tên tự động
document.addEventListener("DOMContentLoaded", () => {
    // Hiệu ứng click sao
    const stars = document.querySelectorAll("#star-rating span");
    stars.forEach(star => {
        star.addEventListener("click", function() {
            selectedRating = this.dataset.value;
            updateStars(selectedRating);
        });
        star.addEventListener("mouseover", function() {
            updateStars(this.dataset.value);
        });
        star.addEventListener("mouseout", function() {
            updateStars(selectedRating);
        });
    });

    // Tự động điền tên nếu người dùng đã đăng nhập
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        console.log(user);
        const nameInput = document.getElementById("review-name");
        if (nameInput) {
            // Lấy tên từ LocalStorage hiển thị vào ô Tên và khóa lại không cho sửa
            nameInput.value =  user.user.username;
            nameInput.disabled = true; 
        }
    }
});

function updateStars(rating) {
    const stars = document.querySelectorAll("#star-rating span");
    stars.forEach(star => {
        if (star.dataset.value <= rating) {
            star.classList.add("active", "text-warning");
        } else {
            star.classList.remove("active", "text-warning");
        }
    });
}

// ==========================================
// 2. HÀM TẢI DANH SÁCH ĐÁNH GIÁ TỪ API
// ==========================================
async function loadFeedbacks(productId) {
    try {
        const response = await fetch(`http://127.0.0.1:8080/get-feedback/${productId}`);
        const result = await response.json();
        const reviewList = document.getElementById("review-list");

        if (result.errCode === 0 && result.data && result.data.length > 0) {
            let html = "";
            
            result.data.forEach(fb => { 
                // Sử dụng 'userData' như bạn đã cấu hình alias ở Backend
                const reviewerName = fb.userData ? fb.userData.username : "Khách hàng";
                
                const dateObj = new Date(fb.createdAt);
                const dateString = dateObj.toLocaleDateString('vi-VN');
                
                const starHTML = "★".repeat(fb.star) + "☆".repeat(5 - fb.star);

                // Avatar ngẫu nhiên dựa trên ID bình luận
                const randomAvatarNum = (fb.id % 4) + 1; 
                const avatarUrl = `images/person_${randomAvatarNum}.jpg`;

                html += `
                <div class="review-item d-flex mb-4 pb-4 border-bottom">
                    <div class="review-avatar mr-4">
                        <img src="${avatarUrl}" alt="${reviewerName}" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover;">
                    </div>
                    <div class="review-content flex-grow-1">
                        <h6 class="mb-1" style="font-weight: 600; color: #000; font-size: 16px;">
                            ${reviewerName} 
                            <span class="text-muted" style="font-weight: 400; font-size: 13px; margin-left: 8px;">– ${dateString}</span>
                        </h6>
                        <div class="stars text-warning mb-2" style="font-size: 15px; letter-spacing: 2px;">
                            ${starHTML}
                        </div>
                        <p class="text-muted mb-0" style="font-size: 15px; line-height: 1.6;">${fb.context}</p>
                    </div>
                </div>
                `;
            });
            reviewList.innerHTML = html;
        } else {
            reviewList.innerHTML = '<p class="text-muted" id="no-review-msg">Chưa có đánh giá nào cho sản phẩm này.</p>';
        }
    } catch (error) {
        console.log("Lỗi tải bình luận:", error);
    }
}

// ==========================================
// 3. HÀM GỬI ĐÁNH GIÁ MỚI LÊN API
// ==========================================
window.addReview = async function() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    const content = document.getElementById("review-content").value;

    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        showToast("Vui lòng đăng nhập tài nhập!","warning");
        window.location.href = "login.html";
        return;
    }
    
    const responseData = JSON.parse(userStr);
    const userId = responseData.user ? responseData.user.id : responseData.id;

    if (content.trim() === "" || selectedRating == 0) {
       showToast("Vui lòng nhập nội dung bình luận và chọn số sao đánh giá!","warning");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8080/add-feedback`, {
            method: 'POST',
            credentials: 'include', // 🔒 HttpOnly Cookie tự động gửi
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: Number(productId),
                user_id: Number(userId),
                star: Number(selectedRating),
                context: content
            })
        });

        const data = await response.json(); // Sửa lỗi chữ 'c' và thiếu await ở đây

        if (data.errCode === 0) {
            showToast("Đánh giá của bạn đã được gửi thành công!","success");
            
            // Xóa form và reset sao
            document.getElementById("review-content").value = "";
            selectedRating = 0;
            updateStars(0);
            
            // Gọi lại hàm loadFeedbacks để cập nhật danh sách ngay lập tức
            loadFeedbacks(productId); 
        } else {
            alert("Lỗi: " + data.message);
        }

    } catch (error) {
        console.error("Lỗi gửi bình luận:", error);
        alert("Không thể kết nối đến máy chủ API!");
    }
}

//xử nút số lượng 
$(document).ready(function() {
    $('.quantity-right-plus').click(function(e) {
        e.preventDefault();
        var quantity = parseInt($('#quantity').val());
        $('#quantity').val(quantity + 1);
    });

    $('.quantity-left-minus').click(function(e) {
        e.preventDefault();
        var quantity = parseInt($('#quantity').val());
        if (quantity > 1) { // Không cho số lượng tụt xuống dưới 1
            $('#quantity').val(quantity - 1);
        }
    });
});



// ==========================================
// HÀM RENDER SẢN PHẨM LIÊN QUAN (CÙNG DANH MỤC)
// ==========================================

function renderRelatedProducts(currentProduct, allProducts) {
    const container = document.getElementById("related-products-list");
    if (!container) return;

    // 1. Lấy ID danh mục và ID sản phẩm hiện tại
    const currentCatId = currentProduct.CategoryID || currentProduct.category_id || currentProduct.category;
    const currentProductId = currentProduct.ProductID || currentProduct.id;

    // 2. Lọc ra các sản phẩm CÙNG DANH MỤC nhưng KHÁC sản phẩm đang xem
    const relatedProducts = allProducts.filter(p => {
        let pCatId = p.CategoryID || p.category_id || p.category;
        let pId = p.ProductID || p.id;
        return (pCatId == currentCatId) && (pId != currentProductId);
    });

    // 3. Lấy tối đa 4 sản phẩm
    const limitRelated = relatedProducts.slice(0, 4);

    if (limitRelated.length === 0) {
        container.innerHTML = "<div class='col-12 text-center text-muted'><p>Không có sản phẩm liên quan nào.</p></div>";
        return;
    }

   // 4. Render HTML cho các sản phẩm liên quan
    let html = "";
    limitRelated.forEach(p => {
        const name = p.ProductName || p.name || "Tên sản phẩm";
        const img = getImageUrl(p); // BIẾN LÀ 'img'
        const id =  p.id;
        
        let originalPrice = Number(p.Price || p.price);
        let discountPrice = Number(p.DiscountPrice || p.discount_price);
        
        let priceHTML = ""; // BIẾN LÀ 'priceHTML' VIẾT HOA
        if (discountPrice > 0 && discountPrice < originalPrice) {
            priceHTML = `<span class="mr-2 price-dc" style="text-decoration: line-through; color:#b3b3b3;">${formatPrice(originalPrice)}</span>
                         <span class="price-sale text-success">${formatPrice(discountPrice)}</span>`;
        } else {
            priceHTML = `<span>${formatPrice(originalPrice)}</span>`;
        }

        html += `
         <div class="col-md-6 col-lg-3 product-item ftco-animate fadeInUp ftco-animated" data-category="${p.category}" >
                    <div class="product">
                        <a href="Viewdetails.html?id=${id}" class="img-prod">
                            <img class="img-fluid" src="${img}" alt="${name}" style ="height:250px; object-fit:cover align-item:center">
                            <div class="overlay"></div>
                        </a>
                        <div class="text py-3 pb-4 px-3 text-center">
                            <h3><a href="Viewdetails.html?id=${id}">${name}</a></h3>
                          
                            <div class="d-flex">
                                <div class="pricing">
                                    <p class="price">${priceHTML}</p>
                                </div>
                            </div>
                            <div class="bottom-area d-flex px-3">
                                <div class="m-auto d-flex">
                                    <a href="cart.html?id=${id}" class="buy-now d-flex justify-content-center align-items-center mx-1">
                                        <span><i class="ion-ios-cart"></i></span>
                                    </a>
                                    <a href="quikView.html?id=${id}" class="eye d-flex justify-content-center align-items-center">
                                        <span><i class="ion-ios-eye"></i></span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        `;
    });
    container.innerHTML = html;
}


// ==========================================
// KHỞI CHẠY LẤY DATA KHI TRANG LOAD XONG
// ==========================================
document.addEventListener("DOMContentLoaded", loadProductDetail);