(function ($) {
    if (!$) return;
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    // Initiate the wowjs
    if (typeof WOW !== "undefined") {
        new WOW().init();
    }

    // Boxup's original sticky navbar behavior.
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').addClass('shadow-sm').css('top', '15px');
        } else {
            $('.sticky-top').removeClass('shadow-sm').css('top', '-100px');
        }
    });

    // Boxup's original header carousel, initialized only on pages that include it.
    if ($.fn.owlCarousel && $(".header-carousel").length) {
        $(".header-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            items: 1,
            dots: false,
            loop: true,
            nav: true,
            navText: [
                '<i class="bi bi-chevron-left"></i>',
                '<i class="bi bi-chevron-right"></i>'
            ]
        });
    }

    // Boxup Minimal homepage carousel with image-dot navigation.
    if ($.fn.owlCarousel && $(".full-header-carousel").length) {
        $(".full-header-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            loop: true,
            nav: false,
            dots: true,
            items: 1,
            dotsData: true
        });
    }
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow').css('display', 'flex');
        } else {
            $('.back-to-top').fadeOut('slow').css('display', 'none');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });
    
})(window.jQuery);

