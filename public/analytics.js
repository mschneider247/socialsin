// Google Analytics for socialsin.com. Every page loads this: index.html,
// get/ and privacy/. It reports to the HabitBeast GA4 property
// (habitbeast-3f09d) through its "habitBeast web" stream, so site visits sit
// next to the app's own data and BigQuery export.
//
// Cookies: none in the EEA, the UK or Switzerland, where analytics cookies
// need consent and the site has no consent banner. Consent mode defaults
// analytics_storage to denied there, so Google gets only cookieless pings.
// Ad storage, ad personalization and Google signals are off everywhere. The
// privacy policy describes all of this (/privacy/#website).
//
// Besides page views:
//   store_click / discord_click  which button, and where on the page (placement)
//   invite_landing               someone opened an in-app invite (/get/?m=NAME)
// A Google Play click also carries the visit's campaign tags (utm_*) into the
// Play install referrer. The app's analytics then credits the install to its
// source; see `npm run analytics -- acquisition` in the habitBeast repo.
(function () {
  var MEASUREMENT_ID = 'G-T8S1REL9L4';

  // App Store Connect provider token (the pt= in an App Store campaign link,
  // under Analytics > Acquisition > Campaigns). Empty leaves App Store links
  // untouched. Set it and App Store installs show up by campaign in App Store
  // Connect.
  var APPLE_PROVIDER_TOKEN = '';

  // EEA (EU + Iceland, Liechtenstein, Norway), the UK and Switzerland.
  var COOKIE_CONSENT_REGIONS = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
    'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    'IS', 'LI', 'NO', 'GB', 'CH',
  ];

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var ADS_OFF = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', Object.assign({ analytics_storage: 'denied', region: COOKIE_CONSENT_REGIONS }, ADS_OFF));
  gtag('consent', 'default', Object.assign({ analytics_storage: 'granted' }, ADS_OFF));
  gtag('js', new Date());

  var params = new URLSearchParams(location.search);
  var path = location.pathname;
  var page = path.indexOf('/get') === 0 ? 'invite' : path.indexOf('/privacy') === 0 ? 'privacy' : 'home';

  // An invite link's monster name (?m=) stays out of Analytics; utm tags stay
  // in, since GA reads a visit's source from them.
  var pageLocation = new URL(location.href);
  pageLocation.searchParams.delete('m');

  gtag('config', MEASUREMENT_ID, {
    page_location: pageLocation.toString(),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(loader);

  if (page === 'invite') {
    gtag('event', 'invite_landing', { has_monster: params.get('m') ? 1 : 0 });
  }

  // This visit's campaign tags. With none, label it by how the visitor got
  // here: an in-app invite, or the site itself.
  function campaignTags(placement) {
    var tags = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
      var value = params.get(key);
      if (value) { tags[key] = value.slice(0, 100); }
    });
    if (!tags.utm_source) {
      if (page === 'invite') {
        tags.utm_source = 'invite';
        tags.utm_medium = 'referral';
        tags.utm_campaign = 'player_invite';
      } else {
        tags.utm_source = 'socialsin.com';
        tags.utm_medium = 'website';
        tags.utm_campaign = 'site';
      }
    }
    if (!tags.utm_content) { tags.utm_content = placement; }
    return tags;
  }

  // Google Play hands `referrer` to the app on first open (Play Install
  // Referrer). Firebase reads utm_* from it.
  function playLink(href, tags) {
    var url = new URL(href);
    url.searchParams.set('referrer', new URLSearchParams(tags).toString());
    return url.toString();
  }

  function appStoreLink(href, tags) {
    if (!APPLE_PROVIDER_TOKEN) { return href; }
    var url = new URL(href);
    url.searchParams.set('pt', APPLE_PROVIDER_TOKEN);
    url.searchParams.set('ct', (tags.utm_source + '-' + tags.utm_content).slice(0, 40));
    url.searchParams.set('mt', '8');
    return url.toString();
  }

  // Where on the page a button sits. Matches App.tsx's sections on the home page.
  function placementOf(link) {
    if (page !== 'home') { return page; }
    if (link.closest('header')) { return 'header'; }
    if (link.closest('.hero')) { return 'hero'; }
    if (link.closest('.download-section')) { return 'download'; }
    if (link.closest('footer')) { return 'footer'; }
    return 'page';
  }

  // Capture phase, so the href is rewritten before the browser follows it.
  // That works for the React-rendered home page and the static pages alike.
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) { return; }
    var store = link.hostname === 'play.google.com' ? 'google_play'
      : link.hostname === 'apps.apple.com' ? 'app_store'
        : link.hostname === 'discord.gg' ? 'discord'
          : null;
    if (!store) { return; }
    var placement = placementOf(link);
    if (store === 'discord') {
      gtag('event', 'discord_click', { placement: placement });
      return;
    }
    try {
      var tags = campaignTags(placement);
      link.href = store === 'google_play' ? playLink(link.href, tags) : appStoreLink(link.href, tags);
    } catch (err) {
      // Leave the link as it was; the click itself must always work.
    }
    gtag('event', 'store_click', { store: store, placement: placement });
  }, true);
})();
