/* Lightweight page translations for secondary pages.
   Uses strict English fallback only (never cross-locale borrowing). */
(function () {
  var STORAGE_KEY = "vibecart-locale";
  var SUPPORTED = ["en", "pl", "fr", "pt", "sw", "sn", "nd", "xh", "zu", "pcm", "lg", "tn", "af", "zh", "ko", "hi", "ar"];

  var COPY = {
    en: {
      "common.home": "Home",
      "common.settingsLegal": "Settings & legal",
      "common.continue": "Continue",
      "regional.title": "Regional folders",
      "regional.intro": "Each lane opens curated external shops plus a fast return to VibeCart checkout.",
      "regional.bridge": "Trade bridge",
      "regional.europe.desc": "EU & UK high-traffic retailers, campus lanes, Allegro to Zara scale.",
      "regional.africa.desc": "ZA, KE, NG, ZW corridors — Takealot, Jumia, national grocers.",
      "regional.asia.desc": "Shopee, Lazada, Flipkart, Dubai-facing routes.",
      "regional.scents.desc": "Fragrance-forward discovery lane.",
      "regional.global.desc": "Worldwide megamalls and marketplaces.",
      "regional.live.desc": "Jump straight into Hot Picks with a guided buy lane.",
      "hot.title": "Hot picks",
      "hot.intro": "Open live listings and buy without breaking your flow.",
      "hot.stepBuy": "Step-by-step buy",
      "hot.openLive": "Open live marketplace",
      "hot.browse": "Browse regional lanes",
      "live.title": "Live market folders",
      "live.intro": "Pick a focused popular lane or the full live-market lane.",
      "live.openPicks": "Open live picks",
      "live.popular.title": "Popular market",
      "live.popular.desc": "Trending categories and faster browse path.",
      "live.shops.title": "Live market shops",
      "live.shops.desc": "All live listings and full product grid.",
      "seller.title": "Seller Boost",
      "seller.intro": "Growth tools stay in one clean workspace.",
      "seller.checklist": "Selling checklist",
      "seller.open": "Open Seller Boost",
      "account.title": "Account access",
      "account.intro": "Login, roles, and saved preferences in one place.",
      "account.planActive": "Plan active:",
      "account.none": "No active plan",
      "account.signin": "Sign in / register",
      "account.signin.desc": "Open the Lane passport page to create an account or sign in.",
      "account.insurance.desc": "Plans and partner offers.",
      "account.health.desc": "Goals and wearable preferences.",
      "account.myPlan": "My active plan",
      "account.myPlan.desc": "Open routines, updates, meals, and AI notifications.",
      "account.orders.desc": "Shipment timeline tools.",
      "account.booking.title": "Booking availability",
      "account.booking.default": "Select a date and service to see available slots.",
      "account.slot.morning": "Morning slot · Available",
      "account.slot.latemorning": "Late morning · Available",
      "account.slot.afternoon": "Afternoon slot · Available",
      "account.slot.lateafternoon": "Late afternoon · Available",
      "account.booking.confirm": "Continue to login to confirm booking",
      "account.booking.edit": "Edit booking details",
      "buy.title": "Buy in a straight line",
      "buy.step": "Step 1 of 3",
      "buy.skip": "Skip to marketplace",
      "buy.s1.title": "1 · Pick your lane",
      "buy.s1.desc": "Regional folders help you discover trusted external shops; checkout stays on the live marketplace.",
      "buy.s1.cta": "Open regional lanes",
      "buy.s2.title": "2 · Accept responsibility",
      "buy.s2.desc": "On the marketplace, tick the risk disclaimer once to unlock one-tap buy for this session.",
      "buy.s3.title": "3 · Shop live listings",
      "buy.s3.desc": "You are routed to Hot Picks with buyer context until you finish or leave.",
      "buy.enter": "Enter marketplace",
      "security.title": "Security",
      "security.intro": "Fraud checks, device history, and audit posture are configured on the main hub under Security."
    },
    sw: {
      "common.home": "Nyumbani",
      "regional.title": "Folda za kanda",
      "regional.intro": "Kila njia hufungua maduka yaliyopangwa na kurudi kwa haraka kwenye malipo ya VibeCart.",
      "hot.title": "Machaguo moto",
      "hot.intro": "Fungua bidhaa za moja kwa moja na ununue bila kuvunja mtiririko wako.",
      "live.title": "Folda za soko la moja kwa moja",
      "live.intro": "Chagua njia ya bidhaa maarufu au njia kamili ya soko la moja kwa moja.",
      "seller.title": "Nguvu ya Muuzaji",
      "seller.intro": "Zana za ukuaji ziko kwenye sehemu moja iliyo wazi.",
      "account.title": "Upatikanaji wa akaunti",
      "account.intro": "Ingia, majukumu, na mapendeleo yako mahali pamoja.",
      "buy.title": "Nunua kwa mpangilio wa moja kwa moja",
      "buy.step": "Hatua ya 1 kati ya 3",
      "common.settingsLegal": "Mipangilio na sheria",
      "common.continue": "Endelea",
      "hot.stepBuy": "Ununuzi wa hatua kwa hatua",
      "live.popular.title": "Soko maarufu",
      "live.shops.title": "Maduka ya soko la moja kwa moja",
      "seller.checklist": "Orodha ya kuuza",
      "seller.open": "Fungua Seller Boost",
      "account.myPlan": "Mpango wangu unaotumika"
    },
    sn: {
      "common.home": "Kumba",
      "regional.title": "Mafolda ematunhu",
      "regional.intro": "Nzira imwe neimwe inovhura zvitoro zvakasarudzwa uye inodzokera nekukurumidza kuVibeCart checkout.",
      "hot.title": "Zvinopisa",
      "hot.intro": "Vhura maristing ari live uye tenga usingakanganiswe.",
      "live.title": "Mafolda eLive Market",
      "live.intro": "Sarudza lane inonyanya kufarirwa kana lane yakazara ye live market.",
      "seller.title": "Seller Boost",
      "seller.intro": "Maturusi ekukura ari panzvimbo imwe yakachena.",
      "account.title": "Kupinda muaccount",
      "account.intro": "Login, ma role, nemapreferences zviri panzvimbo imwe.",
      "buy.title": "Tenga nenzira yakatwasuka",
      "buy.step": "Danho 1 pa3",
      "common.settingsLegal": "Settings nemutemo",
      "common.continue": "Ramba mberi",
      "hot.stepBuy": "Kutenga nhanho nenhanho",
      "live.popular.title": "Musika unonyanya kufarirwa",
      "live.shops.title": "Zvitoro zve live market",
      "seller.checklist": "Checklist yekutengesa",
      "seller.open": "Vhura Seller Boost",
      "account.myPlan": "Plan yangu irikushanda"
    },
    nd: {
      "common.home": "Ekhaya",
      "regional.title": "Amafolda ezindawo",
      "regional.intro": "Indlela ngayinye ivula izitolo ezikhethiwe njalo ibuyisele masinyane kuVibeCart checkout.",
      "hot.title": "Okudumileyo",
      "hot.intro": "Vula izinto eziphilayo (live listings) uthenge ngaphandle kokuphazamiseka.",
      "live.title": "Amafolda eLive Market",
      "live.intro": "Khetha i-lane ethandwayo kumbe i-lane egcweleyo ye live market.",
      "seller.title": "Seller Boost",
      "seller.intro": "Amathuluzi okukhulisa agcinwe endaweni eyodwa ecacileyo.",
      "account.title": "Ukungena ku-akhawunti",
      "account.intro": "Login, ama-role, lama-preference endaweni eyodwa.",
      "buy.title": "Thenga ngendlela eqondileyo",
      "buy.step": "Isinyathelo 1 ku-3",
      "common.settingsLegal": "Izilungiselelo lomthetho",
      "common.continue": "Qhubeka",
      "hot.stepBuy": "Thenga ngesinyathelo",
      "live.popular.title": "Imakethe ethandwayo",
      "live.shops.title": "Amashop e live market",
      "seller.checklist": "Uhlu lokuthengisa",
      "seller.open": "Vula Seller Boost",
      "account.myPlan": "Iplani yami esebenzayo"
    },
    xh: {
      "common.home": "Ekhaya",
      "regional.title": "Iifolda zemimandla",
      "regional.intro": "Indlela nganye ivula iivenkile ezikhethiweyo kwaye ibuyisele ngokukhawuleza kwi-checkout yeVibeCart.",
      "hot.title": "Okushushu",
      "hot.intro": "Vula uluhlu oluphilayo uthenge ngaphandle kokuphazamiseka.",
      "live.title": "Iifolda zeLive Market",
      "live.intro": "Khetha indlela ethandwayo okanye indlela epheleleyo ye live market.",
      "seller.title": "Seller Boost",
      "seller.intro": "Izixhobo zokukhulisa zigcinwe kwindawo enye ecocekileyo.",
      "account.title": "Ukungena kwiakhawunti",
      "account.intro": "Login, iindima, kunye nezinto ozikhethayo kwindawo enye.",
      "buy.title": "Thenga ngendlela ethe ngqo",
      "buy.step": "Inyathelo 1 ku-3",
      "common.settingsLegal": "Iisetingi nomthetho",
      "common.continue": "Qhubeka",
      "hot.stepBuy": "Thenga inyathelo ngenyathelo",
      "live.popular.title": "Imarike ethandwayo",
      "live.shops.title": "Iivenkile ze live market",
      "seller.checklist": "Uluhlu lokuthengisa",
      "seller.open": "Vula Seller Boost",
      "account.myPlan": "Isicwangciso sam esisebenzayo"
    },
    zu: {
      "common.home": "Ekhaya",
      "regional.title": "Amafolda ezifunda",
      "regional.intro": "Umzila ngamunye uvula izitolo ezikhethiwe bese ubuyela ngokushesha ku-checkout yeVibeCart.",
      "hot.title": "Okushisayo",
      "hot.intro": "Vula uhlu olubukhoma uthenge ngaphandle kokuphuka komzila wakho.",
      "live.title": "Amafolda eLive Market",
      "live.intro": "Khetha umzila odumile noma umzila ogcwele we live market.",
      "seller.title": "Seller Boost",
      "seller.intro": "Amathuluzi okukhula ahlala endaweni eyodwa ehlanzekile.",
      "account.title": "Ukungena kwe-akhawunti",
      "account.intro": "Login, izindima, nezilungiselelo zakho endaweni eyodwa.",
      "buy.title": "Thenga ngendlela eqondile",
      "buy.step": "Isinyathelo 1 ku-3",
      "common.settingsLegal": "Izilungiselelo nomthetho",
      "common.continue": "Qhubeka",
      "hot.stepBuy": "Thenga ngesinyathelo",
      "live.popular.title": "Imakethe edumile",
      "live.shops.title": "Izitolo ze live market",
      "seller.checklist": "Uhlu lokuthengisa",
      "seller.open": "Vula Seller Boost",
      "account.myPlan": "Uhlelo lwami olusebenzayo"
    }
  };

  function getLang() {
    try {
      var raw = String(localStorage.getItem(STORAGE_KEY) || "en").trim().toLowerCase();
      return SUPPORTED.indexOf(raw) >= 0 ? raw : "en";
    } catch {
      return "en";
    }
  }

  function t(lang, key) {
    var pack = COPY[lang] || {};
    if (pack[key]) return pack[key];
    return (COPY.en && COPY.en[key]) || "";
  }

  function apply() {
    var lang = getLang();
    document.documentElement.setAttribute("lang", lang === "other" ? "en" : lang);
    Array.prototype.slice.call(document.querySelectorAll("[data-page-i18n]")).forEach(function (el) {
      var key = String(el.getAttribute("data-page-i18n") || "").trim();
      if (!key) return;
      var value = t(lang, key);
      if (value) el.textContent = value;
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-page-i18n-placeholder]")).forEach(function (el) {
      var pkey = String(el.getAttribute("data-page-i18n-placeholder") || "").trim();
      if (!pkey) return;
      var pval = t(lang, pkey);
      if (pval) el.setAttribute("placeholder", pval);
    });
  }

  apply();
  window.VibeCartPageI18n = { apply: apply, t: t, getLang: getLang };
})();
