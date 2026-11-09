// This visit's lab (Steam, Chem or Bio), for every page. Loaded in <head>,
// after the theme-color meta and before anything paints, so the right
// background, colors and panel skins (/theme/lab.css) load straight away.
// The home page's D20 moves to another lab on every roll (src/lab/labs.ts,
// whose THEME_COLORS match these).
(function () {
  var labs = { steam: '#120e08', chem: '#060a12', bio: '#0e1d0a' };
  var lab = Object.keys(labs)[Math.floor(Math.random() * 3)];
  document.documentElement.setAttribute('data-lab', lab);
  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) { themeColor.setAttribute('content', labs[lab]); }
})();
