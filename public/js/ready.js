// Keep the page usable even when a third-party library fails to load.
(function () {
    var hideSpinner = function () {
        document.getElementById('spinner')?.classList.remove('show');
    };
    document.addEventListener('DOMContentLoaded', function () {
        hideSpinner();
    }, { once: true });
    window.addEventListener('load', hideSpinner, { once: true });
    window.setTimeout(hideSpinner, 3000);
})();
