
  // Hàm hiển thị thông báo thay cho alert()
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
        onClick: function(){} // Callback sau khi click
    }).showToast();
}
  
  
  // Biến toàn cục lưu trữ danh sách sản phẩm lấy từ DB
        let allProducts = [];
        let currentCategory = "Tất cả";

        // URL của API
        const API_URL = 'http://127.0.0.1:8080/all-products'; 

        // chuyển categori_id sang tên 
        const categoryMap = {
            1: "Rau củ",
            2: "Trái cây",
            3: "Hạt",
            4: "Nước ép"
        };

        // Hàm gọi API lấy dữ liệu
        async function fetchProductsFromDB() {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();

               let rawData = data.products ? data.products : data;

                // Dịch Category ID (số) sang chữ ("Rau củ", "Trái cây")
            allProducts = rawData.map(p => {
            
            return {
                ...p, // Giữ nguyên các thuộc tính cũ
                categoryText: categoryMap[p.category_id ] || "Khác" // Thêm cột mới là chữ để giao diện dễ đếm
                };
            });
                    
            // ----------------------------------------------------------------
        // [ĐIỂM MỚI]: KIỂM TRA XEM CÓ THAM SỐ CATEGORY TỪ URL KHÔNG
        // ----------------------------------------------------------------
        const urlParams = new URLSearchParams(window.location.search);
        const categoryIdFromUrl = urlParams.get('category');
        
        if (categoryIdFromUrl && categoryMap[categoryIdFromUrl]) {
            // Nếu có ID hợp lệ trên URL -> Đổi currentCategory thành "Trái cây"
            currentCategory = categoryMap[categoryIdFromUrl];
            
            // Xóa class active ở nút "Tất cả" mặc định
            document.querySelectorAll(".category-list li").forEach(li => li.classList.remove("active"));
            
            // Làm sáng cái nút tương ứng trên menu bên trái
            const activeLi = document.querySelector(`.category-list li[data-category="${currentCategory}"]`);
            if (activeLi) activeLi.classList.add("active");
        }

                // Khởi tạo hiển thị ban đầu
                renderProducts(allProducts);
                countCategories();
            } catch (error) {
                console.error("Lỗi khi fetch data:", error);
                document.getElementById("product-list").innerHTML = '<div class="col-12 text-center text-danger"><p>Không thể tải sản phẩm từ máy chủ.</p></div>';
            }
        }

        // ===== RENDER SẢN PHẨM =====
        function renderProducts(list) {
            const container = document.getElementById("product-list");
            container.innerHTML = "";

            if (list.length === 0) {
                container.innerHTML = '<div class="col-12 text-center"><p>Không tìm thấy sản phẩm nào phù hợp.</p></div>';
                return;
            }

            list.forEach(p => {
                // Giả định DB trả về field: id, name, price, discount_price, image_url, category
                let priceHtml = '';
                
                let originalPrice = Number(p.Price || p.price || 0);
                 let discountPrice = Number(p.DiscountPrice || p.discount_price || 0);
        
                  // Tính giá để gửi lên Giỏ hàng
                 let priceToSend = (discountPrice > 0 && discountPrice < originalPrice) ? discountPrice : originalPrice;
                // Nếu có giá khuyến mãi (discount_price) và nhỏ hơn giá gốc
                if (p.discount_price && Number(p.discount_price) < Number(p.price)) {
                    priceHtml = `<span class="mr-2 price-dc">${formatPrice(p.price)}</span>
                                 <span class="price-sale">${formatPrice(p.discount_price)}</span>`;
                } else {
                    priceHtml = `<span>${formatPrice(p.price)}</span>`;
                }

                // Dùng p.image_url nếu data từ API trả về tên đó, hoặc sửa lại tùy cấu trúc DB của bạn
                let imageUrl = getImageUrl(p);
                container.innerHTML += `
                <div class="col-md-6 col-lg-3 product-item ftco-animate fadeInUp ftco-animated" data-category="${p.category}"   >
                    <div class="product"  style ="height:21rem";>
                        <a href="Viewdetails.html?id=${p.id}" class="img-prod">
                            <img class="img-fluid" src="${imageUrl}" alt="${p.name}" style ="height:250px; object-fit:cover align-item:center">
                            <div class="overlay"></div>
                        </a>
                        <div class="text py-3 px-3 text-center">
                            <h3><a href="Viewdetails.html?id=${p.id}">${p.name}</a></h3>
                          
                            <div class="d-flex">
                                <div class="pricing">
                                    <p class="price">${priceHtml}</p>
                                </div>
                            </div>
                            <div class="bottom-area d-flex px-1">
                                <div class="m-auto d-flex">
                                    <a href="javascript:void(0)" onclick="addCart(${p.id})" class="buy-now d-flex justify-content-center align-items-center mx-1 " >
                                        <span><i class="ion-ios-cart"></i></span>
                                    </a>
                                    <a href="javascript:void(0)" onclick="openQuickView(${p.id})" class="eye d-flex justify-content-center align-items-center">
                                        <span><i class="ion-ios-eye"></i></span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            });
        }

        // ===== CLICK DANH MỤC =====
        function filterProducts(category) {
            currentCategory = category;
            applyFilters();
        }

        // ===== CẬP NHẬT THANH KÉO GIÁ =====
        function updatePrice() {
            let value = document.getElementById("priceRange").value;
            // Hiển thị text giá trị đang kéo
            if(Number(value) === 0){
                document.getElementById("priceValue").innerText = "Tất cả mức giá";
            } else {
                document.getElementById("priceValue").innerText = "Tối đa: " + Number(value).toLocaleString("vi-VN") + " VNĐ";
            }
            applyFilters();
        }

        // ===== ÁP DỤNG LỌC VÀ SẮP XẾP =====
        function applyFilters() {
            let filteredList = [...allProducts]; // Tạo bản sao từ mảng gốc để lọc

            // 1. Lọc theo Danh mục
            if (currentCategory !== "Tất cả") {
                filteredList = filteredList.filter(p => p.categoryText === currentCategory);
            }

            // 2. Lọc theo Giá trị (thanh trượt)
            const maxPrice = Number(document.getElementById("priceRange").value);
            if (maxPrice > 0) {
                filteredList = filteredList.filter(p => {
                    // Lấy giá đang áp dụng (giá khuyến mãi nếu có, hoặc giá gốc)
                    let currentPrice = (p.discount_price && Number(p.discount_price) > 0) ? Number(p.discount_price) : Number(p.price);
                    return currentPrice <= maxPrice;
                });
            }

            // 3. Sắp xếp
            const sortVal = document.getElementById("sortSelect").value;
            if (sortVal === "asc") {
                filteredList.sort((a, b) => {
                    let priceA = (a.discount_price && Number(a.discount_price) > 0) ? Number(a.discount_price) : Number(a.price);
                    let priceB = (b.discount_price && Number(b.discount_price) > 0) ? Number(b.discount_price) : Number(b.price);
                    return priceA - priceB;
                });
            } else if (sortVal === "desc") {
                filteredList.sort((a, b) => {
                    let priceA = (a.discount_price && Number(a.discount_price) > 0) ? Number(a.discount_price) : Number(a.price);
                    let priceB = (b.discount_price && Number(b.discount_price) > 0) ? Number(b.discount_price) : Number(b.price);
                    return priceB - priceA;
                });
            }

            renderProducts(filteredList);
        }


        // ===== ĐẾM SỐ DANH MỤC =====
        function countCategories() {
            const items = document.querySelectorAll(".category-list li");
            items.forEach(li => {
                const category = li.getAttribute("data-category");
                const span = li.querySelector(".count");
                if (category === "Tất cả") {
                    span.innerText = `(${allProducts.length})`;
                } else {
                    const total = allProducts.filter(p => p.categoryText === category).length;
                    span.innerText = `(${total})`;
                }
            });
        }

        // ===== KÍCH HOẠT HIỆU ỨNG MENU DANH MỤC =====
        const categoryElements = document.querySelectorAll(".category-list li");
        categoryElements.forEach(item => {
            item.addEventListener("click", function() {
                categoryElements.forEach(li => li.classList.remove("active"));
                this.classList.add("active");
            });
        });

        // BẮT ĐẦU: Gọi hàm load dữ liệu khi trang vừa tải xong
        document.addEventListener('DOMContentLoaded', fetchProductsFromDB);

window.addCart = async function (productId) {
    // 1. Kiểm tra đăng nhập
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        showToast("Bạn cần đăng nhập để mua hàng!", "warning");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const responseData = JSON.parse(userStr);
    const userId = responseData.user ? responseData.user.id : responseData.id;

    // 2. Tìm sản phẩm 
    const product = allProducts.find(p => p.id == productId); 
    if (!product) {
        showToast("Lỗi: Không tìm thấy thông tin sản phẩm!", "error");
        return;
    }

    // 3. TÍNH GIÁ VÀ TRỌNG LƯỢNG 
    let finalPrice = Number(product.price || product.Price || 0);
    let finalUnit = product.unit || "Sản phẩm";
    let finalSizeLabel = finalUnit;

    let sizes = [];
    try {
        sizes = typeof product.size === 'string' ? JSON.parse(product.size) : product.size;
    } catch (e) { sizes = []; }

    if (Array.isArray(sizes) && sizes.length > 0) {
        const defaultOption = sizes.find(item => item.val == 1) || sizes[0];
        finalPrice = defaultOption.price; 
        
        const u = finalUnit.toLowerCase();
        const value = Number(defaultOption.val);
        if (u === 'chai' && value < 1) finalSizeLabel = (value * 1000) + "ml";
        else if (value < 1) finalSizeLabel = (value * 1000) + "g";
        else finalSizeLabel = value + (u === 'chai' ? "L" : "kg");
    } else {
        const discountPrice = Number(product.discount_price || product.discountPrice || 0);
        if (discountPrice > 0 && discountPrice < finalPrice) {
            finalPrice = discountPrice;
        }
    }

    console.log(`Đang thêm SP: ${product.name} với giá: ${finalPrice}`);

    // 4. Gửi lên API
    try {
        const response = await fetch(`http://127.0.0.1:8080/add-to-cart`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: Number(userId),
                product_id: Number(productId),
                quantity: 1,
                price: Number(finalPrice),
                size: finalSizeLabel,
                unit: finalUnit
            })
        });

        const result = await response.json();
        if (result.errCode === 0) {
            showToast("Đã thêm " + product.name + " vào giỏ hàng!", "success");
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        showToast("Mất kết nối server!", "error");
    }
}

// ==========================================
// HÀM MUA NGAY (BUY NOW) TỪ TRANG SẢN PHẨM 
// ==========================================
window.buyNow = async function(productId, currentPrice) {
    // 1. Kiểm tra đăng nhập
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        showToast("Vui lòng đăng nhập tài khoản để mua hàng", "warning");
        window.location.href = "login.html";
        return;
    }

    const responseData = JSON.parse(userStr);
    const userId = responseData.user ? responseData.user.id : responseData.id;

    // 2. Gói dữ liệu (Mặc định mua 1 cái)
    const payload = {
        user_id: Number(userId),
        product_id: Number(productId),
        quantity: 1, 
        price: Number(currentPrice),
        size: null,
        unit: null
    };

    // 3. Gọi API thêm vào giỏ và CHUYỂN HƯỚNG
    try {
        const response = await fetch(`http://127.0.0.1:8080/add-to-cart`, {
            method: 'POST',
            credentials: 'include', // 🔒 HttpOnly Cookie
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // NẾU THÊM THÀNH CÔNG -> CHUYỂN SANG TRANG THANH TOÁN
        if (response.ok || result.errCode === 0) {
            window.location.href = "checkout.html"; 
        } else {
            alert("Lỗi: " + (result.message || "Không thể xử lý giao dịch"));
        }
    } catch (error) {
        console.error("Lỗi mua ngay:", error);
        alert("Mất kết nối với máy chủ Backend!");
    }
};

// ==========================================
// HÀM MỞ POPUP XEM NHANH (QUICK VIEW)
// ==========================================
window.openQuickView = function(productId) {
    // 1. Tìm sản phẩm trong mảng allProducts đang có sẵn ở trang Shop
    const p = allProducts.find(item => item.id == productId || item.ProductID == productId);
    
    if (!p) {
        alert("Không tìm thấy dữ liệu sản phẩm!");
        return;
    }

    let finalPrice = Number(p.price || p.Price);
    let finalUnit = p.unit || "Sản phẩm";
    let finalSizeLabel = finalUnit;
    
    let sizes = [];
    try {
        sizes = typeof p.size === 'string' ? JSON.parse(p.size) : p.size;
    } catch (e) { sizes = []; }

    if (Array.isArray(sizes) && sizes.length > 0) {
        const defaultOption = sizes.find(item => item.val == 1) || sizes[0];
        finalPrice = defaultOption.price;
        
        const u = finalUnit.toLowerCase();
        const value = Number(defaultOption.val);
        if (u === 'chai' && value < 1) finalSizeLabel = (value * 1000) + "ml";
        else if (value < 1) finalSizeLabel = (value * 1000) + "g";
        else finalSizeLabel = value + (u === 'chai' ? "L" : "kg");
    } else {
        const discountPrice = Number(p.discount_price || p.DiscountPrice || 0);
        if (discountPrice > 0 && discountPrice < finalPrice) {
            finalPrice = discountPrice;
        }
    }

    // 2. Đổ dữ liệu vào các thẻ HTML trong Modal
    document.getElementById("qv-img").src = getImageUrl(p);
    document.getElementById("qv-name").innerText = p.ProductName || p.name;
    document.getElementById("qv-desc").innerText = p.description || "Sản phẩm chưa có mô tả chi tiết.";
    document.getElementById("qv-category").innerText = p.categoryText || "Khác";

    document.getElementById("qv-price").innerText = `${formatPrice(finalPrice)} / ${finalSizeLabel}`;

    // Xử lý trạng thái còn/hết hàng
    const stock = Number(p.Stock || p.stock || 0);
    const statusEl = document.getElementById("qv-status");
    if (stock > 0) {
        statusEl.innerText = `Còn hàng (${stock})`;
        statusEl.className = "text-success";
    } else {
        statusEl.innerText = "Hết hàng";
        statusEl.className = "text-danger";
    }

    // 3. Gắn sự kiện cho các nút bên trong Popup
    const buyNowBtn = document.getElementById("qv-buy-now-btn");
    
    // Nếu hết hàng thì ẩn nút hoặc khóa lại
    if (stock <= 0) {


        buyNowBtn.style.opacity = "0.5";
        buyNowBtn.style.pointerEvents = "none";
    }

    // 4. Hiển thị Popup lên màn hình (sử dụng jQuery của Bootstrap)
    $('#quickViewModal').modal('show');
};

