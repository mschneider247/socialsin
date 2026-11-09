// A dressed monster from the app, for the static pages (get/, privacy/): the
// plain-JS twin of src/dice/ShowcaseMonster.tsx on the home page; keep the
// two in step. Fills every [data-specimen] box (a .specimen-stage, styled in
// /theme/lab.css) with a random outfit from /lab/showcase.json, which
// `npm run sync:art` pre-rolls from the app's wardrobe. [data-backdrop] adds
// one of the app's Closet backgrounds behind it, and a [data-specimen-name]
// inside the same [data-specimen-card] gets the monster's name. It blinks
// and looks around, unless the visitor prefers reduced motion.
(function () {
  var boxes = document.querySelectorAll('[data-specimen]');
  if (!boxes.length || !window.fetch) { return; }

  var EYES = ['open', 'partial', 'partialLeft', 'partialRight', 'closed'];
  var RESTING = ['open', 'partial', 'partialLeft', 'partialRight'];
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pick(pool) { return pool[Math.floor(Math.random() * pool.length)]; }
  function between(min, max) { return min + Math.random() * (max - min); }
  function layer(path, className) {
    var img = document.createElement('img');
    img.src = '/lab/a/' + path;
    img.alt = '';
    img.decoding = 'async';
    if (className) { img.className = className; }
    return img;
  }

  // Blink or glance every 1.8–3.6s, like the app's useFriendlyIdleFace.
  function idle(eyes) {
    var showing = 'partial';
    function show(state) {
      eyes[showing].style.opacity = '0';
      eyes[state].style.opacity = '1';
      showing = state;
    }
    function tick() {
      if (Math.random() < 0.4) {
        show('closed');
        setTimeout(function () {
          show(pick(RESTING));
          setTimeout(tick, between(1800, 3600));
        }, 140);
        return;
      }
      show(pick(RESTING));
      setTimeout(tick, between(1800, 3600));
    }
    setTimeout(tick, between(900, 1800));
  }

  fetch('/lab/showcase.json')
    .then(function (response) { return response.json(); })
    .then(function (showcase) {
      Array.prototype.forEach.call(boxes, function (box) {
        var monster = pick(showcase.monsters);
        var label = monster.species + ', a HabitBeast monster';
        if (box.hasAttribute('data-backdrop') && showcase.backgrounds.length) {
          var backdrop = pick(showcase.backgrounds);
          box.appendChild(layer(backdrop.image, 'specimen-bg'));
          label += ' in the ' + backdrop.name;
        }
        var figure = document.createElement('div');
        figure.className = 'specimen-figure';
        monster.layers.forEach(function (path) { figure.appendChild(layer(path)); });
        var eyes = {};
        EYES.forEach(function (state) {
          var img = layer(monster.eyes[state]);
          img.style.opacity = state === 'partial' ? '1' : '0';
          eyes[state] = img;
          figure.appendChild(img);
        });
        box.appendChild(figure);
        box.setAttribute('role', 'img');
        box.setAttribute('aria-label', label);
        var card = box.closest('[data-specimen-card]');
        var name = card && card.querySelector('[data-specimen-name]');
        if (name) { name.textContent = monster.species.toUpperCase(); }
        if (!still) { idle(eyes); }
      });
    })
    .catch(function () {
      // No monster; the page reads fine without one.
    });
})();
