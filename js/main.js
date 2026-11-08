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

  spawnPetals(document.querySelector('.hero .petals'), window.innerWidth < 700 ? 7 : 12);
  initHeader();
})();
