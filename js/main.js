 AOS.init({
 	duration: 800,
 	easing: 'slide'
 });

(function($) {

	"use strict";

	var isMobile = {
		Android: function() {
			return navigator.userAgent.match(/Android/i);
		},
			BlackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
			iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
			Opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
			Windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
			any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};


	$(window).stellar({
    responsive: true,
    parallaxBackgrounds: true,
    parallaxElements: true,
    horizontalScrolling: false,
    hideDistantElements: false,
    scrollProperty: 'scroll'
  });


	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	// loader
	var loader = function() {
		setTimeout(function() { 
			if($('#ftco-loader').length > 0) {
				$('#ftco-loader').removeClass('show');
			}
		}, 1);
	};
	loader();

	var carousel = function() {
		$('.home-slider').owlCarousel({
	    loop:true,
	    autoplay: true,
	    margin:0,
	    animateOut: 'fadeOut',
	    animateIn: 'fadeIn',
	    nav:false,
	    autoplayHoverPause: false,
	    items: 1,
	    navText : ["<span class='ion-md-arrow-back'></span>","<span class='ion-chevron-right'></span>"],
	    responsive:{
	      0:{
	        items:1
	      },
	      600:{
	        items:1
	      },
	      1000:{
	        items:1
	      }
	    }
		});
	
		$('.carousel-testimony').owlCarousel({
			center: true,
			loop: true,
			items:1,
			margin: 30,
			stagePadding: 0,
			nav: false,
			navText: ['<span class="ion-ios-arrow-back">', '<span class="ion-ios-arrow-forward">'],
			responsive:{
				0:{
					items: 1
				},
				600:{
					items: 3
				},
				1000:{
					items: 3
				}
			}
		});

	};
	carousel();

	$('nav .dropdown').hover(function(){
		var $this = $(this);
		// 	 timer;
		// clearTimeout(timer);
		$this.addClass('show');
		$this.find('> a').attr('aria-expanded', true);
		// $this.find('.dropdown-menu').addClass('animated-fast fadeInUp show');
		$this.find('.dropdown-menu').addClass('show');
	}, function(){
		var $this = $(this);
			// timer;
		// timer = setTimeout(function(){
			$this.removeClass('show');
			$this.find('> a').attr('aria-expanded', false);
			// $this.find('.dropdown-menu').removeClass('animated-fast fadeInUp show');
			$this.find('.dropdown-menu').removeClass('show');
		// }, 100);
	});


	$('#dropdown04').on('show.bs.dropdown', function () {
	  console.log('show');
	});

	// scroll
	var scrollWindow = function() {
		$(window).scroll(function(){
			var $w = $(this),
					st = $w.scrollTop(),
					navbar = $('.ftco_navbar'),
					sd = $('.js-scroll-wrap');

			if (st > 150) {
				if ( !navbar.hasClass('scrolled') ) {
					navbar.addClass('scrolled');	
				}
			} 
			if (st < 150) {
				if ( navbar.hasClass('scrolled') ) {
					navbar.removeClass('scrolled sleep');
				}
			} 
			if ( st > 350 ) {
				if ( !navbar.hasClass('awake') ) {
					navbar.addClass('awake');	
				}
				
				if(sd.length > 0) {
					sd.addClass('sleep');
				}
			}
			if ( st < 350 ) {
				if ( navbar.hasClass('awake') ) {
					navbar.removeClass('awake');
					navbar.addClass('sleep');
				}
				if(sd.length > 0) {
					sd.removeClass('sleep');
				}
			}
		});
	};
	scrollWindow();

	
	var counter = function() {
		
		$('#section-counter').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {

				var comma_separator_number_step = $.animateNumber.numberStepFactories.separator(',')
				$('.number').each(function(){
					var $this = $(this),
						num = $this.data('number');
						console.log(num);
					$this.animateNumber(
					  {
					    number: num,
					    numberStep: comma_separator_number_step
					  }, 7000
					);
				});
				
			}

		} , { offset: '95%' } );

	}
	counter();

	var contentWayPoint = function() {
		var i = 0;
		$('.ftco-animate').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {
				
				i++;

				$(this.element).addClass('item-animate');
				setTimeout(function(){

					$('body .ftco-animate.item-animate').each(function(k){
						var el = $(this);
						setTimeout( function () {
							var effect = el.data('animate-effect');
							if ( effect === 'fadeIn') {
								el.addClass('fadeIn ftco-animated');
							} else if ( effect === 'fadeInLeft') {
								el.addClass('fadeInLeft ftco-animated');
							} else if ( effect === 'fadeInRight') {
								el.addClass('fadeInRight ftco-animated');
							} else {
								el.addClass('fadeInUp ftco-animated');
							}
							el.removeClass('item-animate');
						},  k * 50, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '95%' } );
	};
	contentWayPoint();


	// navigation
	var OnePageNav = function() {
		$(".smoothscroll[href^='#'], #ftco-nav ul li a[href^='#']").on('click', function(e) {
		 	e.preventDefault();

		 	var hash = this.hash,
		 			navToggler = $('.navbar-toggler');
		 	$('html, body').animate({
		    scrollTop: $(hash).offset().top
		  }, 700, 'easeInOutExpo', function(){
		    window.location.hash = hash;
		  });


		  if ( navToggler.is(':visible') ) {
		  	navToggler.click();
		  }
		});
		$('body').on('activate.bs.scrollspy', function () {
		  console.log('nice');
		})
	};
	OnePageNav();


	// magnific popup
	$('.image-popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    fixedContentPos: true,
    mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
     gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      verticalFit: true
    },
    zoom: {
      enabled: true,
      duration: 300 // don't foget to change the duration also in CSS
    }
  });

  $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
    disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,

    fixedContentPos: false
  });



	var goHere = function() {

		$('.mouse-icon').on('click', function(event){
			
			event.preventDefault(); 

			$('html,body').animate({
				scrollTop: $('.goto-here').offset().top
			}, 500, 'easeInOutExpo');
			
			return false;
		});
	};
	goHere();


	function makeTimer() {

		var endTime = new Date("21 December 2019 9:56:00 GMT+01:00");			
		endTime = (Date.parse(endTime) / 1000);

		var now = new Date();
		now = (Date.parse(now) / 1000);

		var timeLeft = endTime - now;

		var days = Math.floor(timeLeft / 86400); 
		var hours = Math.floor((timeLeft - (days * 86400)) / 3600);
		var minutes = Math.floor((timeLeft - (days * 86400) - (hours * 3600 )) / 60);
		var seconds = Math.floor((timeLeft - (days * 86400) - (hours * 3600) - (minutes * 60)));

		if (hours < "10") { hours = "0" + hours; }
		if (minutes < "10") { minutes = "0" + minutes; }
		if (seconds < "10") { seconds = "0" + seconds; }

		$("#days").html(days + "<span>Days</span>");
		$("#hours").html(hours + "<span>Hours</span>");
		$("#minutes").html(minutes + "<span>Minutes</span>");
		$("#seconds").html(seconds + "<span>Seconds</span>");		

}

setInterval(function() { makeTimer(); }, 1000);



})(jQuery);

/// Lưu trữ thông tin và hiện thị tkk 
document.addEventListener("DOMContentLoaded", function() {
    // 1. Kiểm tra trạng thái đăng nhập từ LocalStorage
    const userJson = localStorage.getItem('currentUser');
    
    const userNameDisplay = document.getElementById('user-name-display');
    const accountLink = document.getElementById('account-link');

    if (userJson) {
        // ĐÃ ĐĂNG NHẬP
        const userData = JSON.parse(userJson);
        
        // Lấy tên hiển thị
        const displayName =  userData.user.username;

        // Hiện tên cạnh icon
        if (userNameDisplay) {
            userNameDisplay.innerText = displayName;
            userNameDisplay.style.display = "inline-block";
			userNameDisplay.style.fontSize = "8px";
        }
        if (accountLink) {
            accountLink.href = "profile.html";
        }
    } else {
        // CHƯA ĐĂNG NHẬP
        if (userNameDisplay) userNameDisplay.style.display = "hidden";
        if (accountLink) accountLink.href = "login.html";
    }
});


// Hàm định dạng tiền tệ
function formatPrice(price) {
    let numPrice = Number(price);
    if(isNaN(numPrice)) return "0 VNĐ";
    return numPrice.toLocaleString("vi-VN") + " VNĐ";
}



// HÀM FORMAT GIÁ VÀ RENDER GIAO DIỆN
// ==========================================
function formatPrice(price) {
    let numPrice = Number(price);
    if(isNaN(numPrice)) return "0 VNĐ";
    return numPrice.toLocaleString("vi-VN") + " VNĐ";
}

// ==========================================
// HÀM XỬ LÝ LẤY ĐƯỜNG DẪN ẢNH (TỪ BACKEND)
// ==========================================
function getImageUrl(product) {
    // KHAI BÁO ĐỊA CHỈ BACKEND CỦA BẠN Ở ĐÂY
    // (Nếu backend chạy cổng khác, hãy sửa lại cho đúng)
    const BACKEND_URL = 'http://127.0.0.1:8080'; 

    let rawImg = product.image_url || product.ImageURL || product.img;
    
    if (!rawImg) return "images/product-1.jpg"; // Ảnh mặc định nếu ko có data

    let extractedPath = "";

    if (typeof rawImg === 'string' && rawImg.trim().startsWith('{')) {
        try { rawImg = JSON.parse(rawImg); } 
        catch (e) { console.error("Lỗi đọc hình ảnh:", e); }
    }

    if (typeof rawImg === 'object' && rawImg !== null) {
        const keys = Object.keys(rawImg);
        if (keys.length > 0) {
            extractedPath = rawImg[keys[0]]; 
        }
    } else if (typeof rawImg === 'string') {
        extractedPath = rawImg;
    }

    if (!extractedPath) return "images/product-1.jpg";

    // Xử lý tự động thêm đuôi .jpg nếu thiếu
    if (!extractedPath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        extractedPath = extractedPath + ".jpg"; 
    }

    // --- ĐIỂM MẤU CHỐT ---
    // Kiểm tra xem đường dẫn đã có http:// chưa. Nếu chưa thì ghép địa chỉ backend vào
    if (!extractedPath.startsWith('http')) {
        // Đảm bảo không bị dư hoặc thiếu dấu gạch chéo '/'
        if(extractedPath.startsWith('/')) {
            extractedPath = BACKEND_URL + extractedPath;
        } else {
            extractedPath = BACKEND_URL + '/' + extractedPath;
        }
    }

    return extractedPath;
}

// TÌM KIẾM SẢN PHẨM 
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");
    let timeout = null;

    if (searchInput) {
        // Bắt sự kiện mỗi khi người dùng gõ phím
        searchInput.addEventListener("input", function (e) {
            clearTimeout(timeout); // Hủy bộ đếm cũ
            const keyword = e.target.value.trim();

            // Nếu xóa hết chữ thì ẩn dropdown đi
            if (keyword.length === 0) {
                searchResults.style.display = "none";
                return;
            }

            // Thiết lập bộ đếm mới (Đợi 400ms sau khi ngừng gõ mới gọi API)
            timeout = setTimeout(async () => {
                try {
                    // Gọi API Tìm kiếm 
                    const response = await fetch(`http://127.0.0.1:8080/search-products?keyword=${encodeURIComponent(keyword)}`);
                    const result = await response.json();

                  
                    if (result.errCode === 0 && result.data.length > 0) {
                        let html = "";
                        result.data.forEach(p => {
                           
                            let price = p.discount_price ? p.discount_price : p.price;
                            
                            html += `
                            <a href="Viewdetails.html?id=${p.id}" class="d-flex align-items-center p-2 border-bottom text-dark" style="text-decoration: none; transition: background 0.2s;">
                                <img src="${getImageUrl(p)}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                                <div>
                                    <h6 class="mb-0" style="font-weight: 600; font-size: 14px;">${p.name}</h6>
                                    <small class="text-success" style="font-weight: 500;">${formatPrice(price)}</small>
                                </div>
                            </a>`;
                        });
                        searchResults.innerHTML = html;
                        searchResults.style.display = "block"; // Hiện Dropdown
                    } else {
                        searchResults.innerHTML = `<div class="p-3 text-center text-muted">Không tìm thấy "${keyword}"</div>`;
                        searchResults.style.display = "block";
                    }
                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                }
            }, 400); 
        });

        // Ẩn dropdown khi click ra ngoài màn hình

    }
});