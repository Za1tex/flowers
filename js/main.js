// Анимации сайта. Контент страницы лежит в index.html, здесь его нет.
(function () {
  'use strict';

  function rand(min, max) { return min + Math.random() * (max - min); }

  // Создаёт `count` падающих лепестков внутри `container`.
  function spawnPetals(container, count) {
    if (!container) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      p.className = 'petal' + (i % 3 === 0 ? ' light' : '');
      p.style.left = rand(4, 98).toFixed(1) + '%';
      p.style.setProperty('--s', rand(10, 20).toFixed(0) + 'px');
      p.style.setProperty('--d', rand(10, 17).toFixed(1) + 's');
      p.style.setProperty('--delay', (-rand(0, 17)).toFixed(1) + 's');
      p.style.setProperty('--drift', rand(-160, 40).toFixed(0) + 'px');
      frag.appendChild(p);
    }
    container.appendChild(frag);
  }

  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Плавное появление блоков [data-reveal] при прокрутке.
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || !items.length) return;
    // Небольшая задержка между соседними карточками.
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--reveal-delay', ((idx % 4) * 0.09).toFixed(2) + 's');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.documentElement.classList.add('js-reveal');
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  // Останавливает лепестки, когда первый экран не виден.
  function initHeroPause() {
    var hero = document.querySelector('.hero');
    if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      hero.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    }).observe(hero);
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    spawnPetals(document.querySelector('.hero .petals'), window.innerWidth < 700 ? 7 : 12);
    initReveal();
    initHeroPause();
  }
  initHeader();
})();
