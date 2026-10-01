/* newspectrum.org — header behavior: stuck shadow + language dropdown */
(function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var lang = document.querySelector('.lang');
  if (lang) {
    var toggle = lang.querySelector('.lang-toggle');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = lang.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      lang.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        lang.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();
