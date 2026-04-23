/* VibeCart storefront UI strings — [data-i18n="key"]. Locale codes match #siteLanguage values. */
(function () {
  const STORAGE_KEY = "vibecart-locale";

  const BCP47 = {
    en: "en",
    other: "en",
    pl: "pl",
    fr: "fr",
    pt: "pt-BR",
    sw: "sw",
    sn: "sn",
    nd: "nd",
    xh: "xh",
    zu: "zu",
    pcm: "pcm",
    lg: "lg",
    tn: "tn",
    af: "af",
    zh: "zh-CN",
    ko: "ko-KR",
    hi: "hi-IN",
    ar: "ar"
  };

  const STRINGS = {
    en: {
      "nav.categories": "Categories",
      "nav.shops": "Regional shops",
      "nav.hot": "Hot Picks",
      "nav.rewards": "Rewards",
      "nav.insurance": "Insurance",
      "nav.wellbeing": "Health coach",
      "nav.security": "Security",
      "nav.settings": "Settings",
      "nav.account": "Account",
      "nav.sellerBoost": "Seller Boost",
      "nav.sell": "Start Selling",
      "nav.login": "Login",
      "lang.label": "Language",
      "hero.badge": "Africa-Europe-Asia Trade Bridge",
      "hero.title": "Discover bold finds. Buy fast. Sell globally.",
      "hero.regionHeadline":
        "VibeCart is your fun cross-border marketplace with verified sellers, fast checkout, and vibe-first shopping.",
      "hero.subtitleExtended":
        "Discover offers from Poland and Europe, with routes across Africa, Dubai, and selected Asian markets. Pay with trusted methods in your country and ship with vetted logistics. Smart tools sit behind the scenes — you stay in control of every purchase.",
      "hero.shopNow": "Shop Now",
      "hero.listItem": "List an Item",
      "hero.smartTour": "Start Smart Tour",
      "hero.installApp": "Install App",
      "hero.trust1": "Trusted payments",
      "hero.trust2": "Approved logistics",
      "hero.trust3": "AI-assisted safety checks",
      "hero.sig1": "Secure checkout",
      "hero.sig2": "Verified sellers",
      "hero.sig3": "Tracked delivery",
      "hero.chipHintCheckout": "Showing buyer safeguards & checkout flow — scroll the page for live listings next.",
      "hero.chipHintSellers": "Regional shop lanes — each folder opens verified seller routes you can browse.",
      "hero.chipHintDelivery": "Tracking & delivery updates — simulate steps to see how buyers stay informed.",
      "vibe.title": "Vibe Motion Lane",
      "vibe.lead": "Swipe sideways, scroll diagonally, and watch the signal lens reveal hot zones.",
      "vibe.card1h": "Street Drip",
      "vibe.card1p": "Fast-moving fashion drops for youth buyers.",
      "vibe.card2h": "Tech Sparks",
      "vibe.card2p": "Unique gadgets with secure one-click checkout.",
      "vibe.card3h": "Creator Finds",
      "vibe.card3p": "Handpicked products from upcoming sellers.",
      "vibe.card4h": "Global Pulse",
      "vibe.card4p": "Trending cross-border picks routed smartly.",
      "vibe.card5h": "Campus Heat",
      "vibe.card5p": "Student-loved deals built for speed and trust.",
      "quickView.title": "Quick View",
      "quickView.lead": "Choose what you want to focus on first.",
      "quickView.btnDiscover": "Shop & Discover",
      "quickView.btnGrow": "Sell & Grow",
      "quickView.btnAssurance": "Security & Services",
      "quickView.btnAll": "Show All",
      "account.title": "Account Access",
      "account.lead": "Sign in or create an account based on what you want to do.",
      "account.buyerTitle": "Buyer Account",
      "account.buyerBody": "Create a buyer profile to track orders, save favorites, and use rewards securely.",
      "account.buyerCta": "Buyer Login / Sign Up",
      "account.sellerTitle": "Seller Account",
      "account.sellerBody": "Create a seller profile to list products, manage inventory, and receive payouts.",
      "account.sellerCta": "Seller Login / Sign Up",
      "marketFit.title": "Built for Students, Families, and Growing Businesses",
      "marketFit.lead":
        "VibeCart is designed for fast, trustworthy cross-border trading between African and European markets, with clear support for both modern and traditional shoppers.",
      "marketFit.p1h": "For Students and Young Buyers",
      "marketFit.p1p": "Affordable deals, verified sellers, secure checkout, and rewards for safe shopping behavior.",
      "marketFit.p2h": "For Families and Mature Buyers",
      "marketFit.p2p": "Clear product information, dependable delivery routes, and stronger fraud checks for peace of mind.",
      "marketFit.p3h": "For Sellers and Service Providers",
      "marketFit.p3p": "AI management support, trust score visibility, and owner-reviewed controls for key operational decisions.",
      "tax.title": "Tax and Payout Transparency",
      "tax.lead":
        "Every transaction includes tax calculation and withholding records before payout. Net revenue and payable tax are tracked to reduce tax-evasion risk.",
      "ai.title": "AI Shopping Assistant",
      "ai.lead": "Need help choosing? Tell the assistant your budget, category, and what you need. It ranks live listings on this page — not a remote model.",
      "ai.suggest": "Get AI suggestions",
      "orbit.title": "Seller AI toolkit",
      "orbit.lead":
        "Aura turns on warm motion, glow, and playful spacing sitewide. Exclusive switches to a sharp, editorial layout with cooler contrast — same marketplace, different energy.",
      "orbit.personaFun": "Aura",
      "orbit.personaEff": "Exclusive",
      "orbit.personaHint": "Full Aura embrace: gradients, pulse logo, softer corners — tuned for phones first.",
      "orbit.personaHintEff": "Exclusive layout: minimal chrome, crisp grids, faster visual rhythm on small screens.",
      "orbit.legalTitle": "Law-safe copilot (rules, not magic)",
      "orbit.legalBody":
        "Automated checks use jurisdiction tables, category bans, and risk prompts. Unclear cases go to manual review. This is compliance assistance — not legal advice and not autonomous enforcement.",
      "orbit.radarTitle": "Route hints for your growth plan",
      "orbit.radarLead":
        "Heuristic hints from your region and language — meant for sellers planning outreach, not shopper-facing promises.",
      "persona.status.aura": "Aura layout live — warm gradients, pulse mark, softer motion on phones.",
      "persona.status.exclusive": "Exclusive layout live — crisp grids, cooler contrast, faster visual rhythm.",
      "search.label": "Search shops",
      "search.placeholder": "Search Europe, Africa, Asia, scents…",
      "search.submit": "Find",
      "search.reset": "All regional folders visible.",
      "search.matchCount": "{n} shop lanes match your search.",
      "search.none": "No matches — try another keyword.",
      "buyerAdv.title": "Why buying on VibeCart is smoother",
      "buyerAdv.lead":
        "Built for speed: one place for trusted checkout, delivery tracking, and clear policies — without turning the homepage into an internal tools dashboard.",
      "buyerAdv.li1": "One-tap style checkout with buyer protections and fraud checks on high-risk orders.",
      "buyerAdv.li2": "Live order tracking and return/refuse windows that mirror what you see in your account.",
      "buyerAdv.li3": "AI shopping assistant ranks listings on this page to match budget and category — you stay in control.",
      "sellerHub.kicker": "For sellers & businesses",
      "sellerHub.title": "Sell in 3 easy steps — then use the tools below",
      "sellerHub.intro":
        "Scroll on this page for marketing, growth AI, and ads. Internal signals and policy rails stay here so everyday shoppers are not overwhelmed up top.",
      "sellerAdv.title": "What you unlock as a seller",
      "sellerAdv.li1": "Trust-forward storefronts with owner-reviewed controls on sensitive operations.",
      "sellerAdv.li2": "AI growth workspace (counter + plan builder) to move from zero to ten verified sellers.",
      "sellerAdv.li3": "Marketing tiles for drops, launches, and geo-targeted campaigns once you are live.",
      "settingsHub.title": "Settings & legal",
      "settingsHub.lead": "Security, experience, and legal documents — kept off the homepage so shopping stays fast.",
      "settingsHub.legalH": "Legal center",
      "settingsHub.legalP": "Read platform terms, privacy controls, and marketplace policy before buying or selling.",
      "settingsHub.accountH": "Account controls",
      "settingsHub.accountP": "Use Account Access to switch between buyer and seller profiles securely.",
      "settingsHub.experienceH": "Shop experience",
      "settingsHub.experienceMode": "Market mode: Global default. The interface can localize messaging and visual style by audience region.",
      "settingsHub.experienceLabel": "Choose your interaction style",
      "settingsHub.modeGuided": "Guided (AI + helper tips)",
      "settingsHub.modeSimple": "Simple (minimal interface)",
      "settingsHub.modePro": "Pro (full marketplace controls)",
      "settingsHub.securityH": "Security overview",
      "settingsHub.securityLead": "The same protections apply sitewide — we only surface the detail here so the storefront stays lightweight.",
      "settingsHub.sec1": "Owner-only admin with multi-factor authentication and hardware key support.",
      "settingsHub.sec2": "Country-aware fraud detection and transaction monitoring.",
      "settingsHub.sec3": "Buyer and seller protection with suspicious-activity checks, identity verification, and high-risk order review.",
      "settingsHub.sec4": "Escalation and dispute workflow with temporary account lock for suspected fraud.",
      "settingsHub.sec5": "Payments are routed only through vetted providers with encryption, 3D Secure, anti-fraud scoring, and tokenized transactions.",
      "settingsHub.sec6": "Delivery uses trusted logistics partners with tracking, delivery verification, and route risk controls.",
      "settingsHub.sec7": "Encrypted traffic (HTTPS), secure cookies, and strict security headers.",
      "settingsHub.sec8": "Role-based permissions and immutable audit logs.",
      "settingsHub.sec9": "Legal-only marketplace with moderation, reporting controls, and proactive listing removal for unlawful content.",
      "settingsHub.compliance":
        "Compliance mode: listings and orders are screened against country/state/city rules. If legality is unclear, the transaction is blocked or sent to manual review.",
      "ai.resultEffPrefix": "Ranked matches",
      "ai.resultFunPrefix": "Vibe-ranked picks",
      "ai.noMatch": "No strong match on this page. Try a higher budget or Any category.",
      "lang.aiOfferCaption": "From your browser languages & time zone (on-device heuristics, not GPS).",
      "lang.aiOfferSwitch": "Switch language",
      "lang.aiOfferDismiss": "No thanks",
      "pathChooser.title": "You are here as",
      "pathChooser.lead": "Pick a lane — we tune next steps. No chatbot, just structure.",
      "pathChooser.buyer": "Buyer",
      "pathChooser.seller": "Seller",
      "pathChooser.curious": "Browsing",
      "pathChooser.hintBuyer": "Next: confirm destination in Hot Picks, then read the bridge truth before checkout.",
      "pathChooser.hintSeller": "Next: open Start Selling — payouts and tax stay human-reviewed.",
      "pathChooser.hintCurious": "Next: skim Trade Bridge truth, then regional folders when you are ready.",
      "laneNote.eyebrow": "Lane note",
      "laneNote.sellerTipLabel": "Seller tip",
      "laneNote.buyerTipLabel": "Buyer tip",
      "laneNote.seller":
        "Lead with one clear origin and one realistic delivery band — buyers forgive ranges; they do not forgive fake precision.",
      "laneNote.buyer":
        "Before checkout, confirm category rules for your country. If something feels off, pause — humans review edge cases.",
      "bridgeTruth.title": "Bridge truth (no fake precision)",
      "bridgeTruth.li1":
        "Duty and tax estimates here are bands, not customs rulings — final charges depend on classification and local law.",
      "bridgeTruth.li2":
        "Typical tracked delivery for many EU→Africa lanes falls in a 7–21 day window; remote handoffs can run longer.",
      "bridgeTruth.li3": "Ambiguous or high-risk orders go to human review — automation flags, people decide.",
      "jurisdiction.explain": "Why this line?",
      "jurisdiction.panel":
        "This strip mirrors your active bridge path and buyer destination (PL vs ZA defaults are examples, not GPS). Language is a browser hint. Nothing here is legal or customs advice — use it to stay oriented.",
      "ritual.title": "Lane saved.",
      "ritual.sub": "One slow breath. Tap OK when you are ready.",
      "ritual.ok": "OK",
      "transparency.title": "Transparency snapshot",
      "transparency.meta":
        "Figures refresh when you load this page. Ranges are normal — exacts are rare in cross-border trade.",
      "transparency.updated": "Loaded {time} · illustrative where live data is thin.",
      "settingsHub.uiSound": "Subtle UI sound (one soft chime when opening a shop folder — off by default)",
      "settingsHub.calmMoment": "Calm moment after browsing (one short screen per session — skips automatically with reduced motion)",
      "accountPassport.title": "Lane passport",
      "accountPassport.tagline": "Create once. Shop or sell with the same secure session.",
      "accountPassport.honest":
        "Real email and password — stored with a salted hash on the server. No fake “one tap” tricks; just honest signup.",
      "accountPassport.active": "Signed in",
      "accountPassport.signOut": "Sign out",
      "accountPassport.tabCreate": "New passport",
      "accountPassport.tabLogin": "Sign in",
      "accountPassport.createLead": "Pick a lane, then three fields — we keep the rest minimal.",
      "accountPassport.roleLabel": "Account type",
      "accountPassport.roleBuyer": "Buyer",
      "accountPassport.roleBuyerHint": "Checkout & orders",
      "accountPassport.roleSeller": "Seller",
      "accountPassport.roleSellerHint": "Listings & payouts (human-reviewed)",
      "accountPassport.fullName": "Display name",
      "accountPassport.email": "Email",
      "accountPassport.password": "Password (8+ characters)",
      "accountPassport.country": "Country",
      "accountPassport.useBridge": "Match my bridge destination",
      "accountPassport.submitCreate": "Create passport",
      "accountPassport.creating": "Creating your account…",
      "accountPassport.redirectingPassport": "Success — opening your passport page…",
      "accountPassport.loginLead": "Use the email and password from when you created your passport.",
      "accountPassport.submitLogin": "Sign in",
      "accountPassport.pwShort": "Add characters — minimum 8.",
      "accountPassport.pwFair": "Okay — add a symbol or digit for strength.",
      "accountPassport.pwStrong": "Strong enough for this lane.",
      "accountPassport.welcome": "Welcome, {name}",
      "accountPassport.meta": "{email} · {role} · {country}",
      "accountPassport.roleBuyerLabel": "Buyer",
      "accountPassport.roleSellerLabel": "Seller",
      "accountPassport.errMissingFields":
        "Please add a display name (2+ letters), a valid email, a password with at least 8 characters, and pick your country.",
      "accountPassport.errInvalidEmail": "That email does not look valid — check for typos.",
      "accountPassport.errGeneric": "Something went wrong. Try again.",
      "accountPassport.err409": "That email is already registered — switch to Sign in.",
      "accountPassport.err401": "Check email and password.",
      "accountPassport.err403": "Role does not match this account — use Sign in without a different lane selected.",
      "accountPassport.signedOut": "Signed out.",
      "accountPassport.paymentsNote":
        "Checkout uses Stripe when the server is configured. Blink Payment is not connected on this site yet.",
      "accountPassport.haveAccount": "Already registered?",
      "accountPassport.goLogin": "Sign in",
      "accountPassport.newHere": "New here?",
      "accountPassport.goCreate": "Create account",
      "accountPassport.createLeadFast": "Email and password first, then what we should call you — country matches your lane automatically.",
      "accountPassport.signingUpAs": "Signing up as",
      "accountPassport.roleBuyerShort": "Buyer",
      "accountPassport.roleSellerShort": "Seller",
      "accountPassport.switchToSeller": "I want to sell",
      "accountPassport.switchToBuyer": "Sign up as buyer instead",
      "accountPassport.sellerNote":
        "Seller accounts get a starter shop. Payouts and tax stay human-reviewed.",
      "accountPassport.countryAuto": "Country prefilled from your shopping lane — change if this is wrong.",
      "originChip.europe": "Origin line: EU hubs → bridge carts",
      "originChip.africa": "Origin line: African makers & importers",
      "originChip.asia": "Origin line: Asia & Gulf bridge nodes",
      "originChip.scents": "Origin line: niche & prestige retailers",
      "originChip.global": "Origin line: mainstream & resale mix",
      "photoPromise.short": "Photo = this listing’s unit",
      "trustRepeat.line":
        "Repeat-lane buyer rate: published when aggregate stats are available — we do not invent percentages.",
      "passportStamp.earned":
        "Bridge passport stamp: earned after your first cross-border order on this device.",
      "sealed.word": "Sealed.",
      "listingHealth.title": "Listing health",
      "listingHealth.lead": "Tick what is true — we never show a fake score, only completion.",
      "listingHealth.photos": "Hero photos + condition notes",
      "listingHealth.shipping": "Shipping band stated (range, not fake precision)",
      "listingHealth.policy": "Returns / customs reality acknowledged",
      "bridgeFaq.summary": "Bridge FAQ snippets (copy-paste friendly)",
      "bridgeFaq.q1":
        "Customs: final duties depend on classification — we show bands, not rulings.",
      "bridgeFaq.q2":
        "Timelines: tracked EU↔Africa often 7–21 days; remote handoffs can run longer.",
      "bridgeFaq.q3": "Ambiguous orders go to human review — say so in your listing if edge-case."
    },
    pl: {
      "nav.account": "Konto",
      "nav.categories": "Kategorie",
      "nav.shops": "Sklepy regionalne",
      "nav.hot": "Hity",
      "nav.rewards": "Nagrody",
      "nav.insurance": "Ubezpieczenie",
      "nav.wellbeing": "Trener zdrowia",
      "nav.security": "Bezpieczeństwo",
      "nav.settings": "Ustawienia",
      "nav.sellerBoost": "Boost sprzedawcy",
      "nav.sell": "Zacznij sprzedawać",
      "nav.login": "Logowanie",
      "lang.label": "Język",
      "hero.badge": "Most handlowy Afryka–Europa–Azja",
      "hero.title": "Odkrywaj, kupuj szybko, sprzedawaj globalnie.",
      "hero.regionHeadline":
        "VibeCart to Twój żywy marketplace transgraniczny ze zweryfikowanymi sprzedawcami, szybkim checkoutem i zakupami „pod vibe”.",
      "hero.subtitleExtended":
        "Odkrywaj oferty z Polski i Europy, z trasami do RPA, Namibii, Kenii, Etiopii, Zimbabwe i innych rynków afrykańskich. Handluj w obie strony między Afryką a Europą, plus Dubaj i wybrane rynki azjatyckie. Płać zaufanymi metodami dostępnymi w Twoim kraju i korzystaj z niezawodnej, bezpiecznej dostawy. AI wspiera odkrywanie i sygnały ryzyka, ale ostateczne decyzje i odpowiedzialność prawna pozostają po stronie ludzi.",
      "hero.shopNow": "Kup teraz",
      "hero.listItem": "Wystaw ogłoszenie",
      "hero.smartTour": "Szybki przewodnik",
      "hero.installApp": "Zainstaluj aplikację",
      "hero.trust1": "Zaufane płatności",
      "hero.trust2": "Zweryfikowana logistyka",
      "hero.trust3": "Kontrole bezpieczeństwa z AI",
      "hero.sig1": "Bezpieczna płatność",
      "hero.sig2": "Zweryfikowani sprzedawcy",
      "hero.sig3": "Śledzenie dostaw",
      "hero.chipHintCheckout":
        "Przejście do zabezpieczeń kupującego i checkoutu — niżej zobaczysz aktywne ogłoszenia.",
      "hero.chipHintSellers":
        "Folderowe sklepy regionalne — każdy otwiera zweryfikowane trasy sprzedawców.",
      "hero.chipHintDelivery":
        "Śledzenie i status dostawy — użyj „Symuluj”, żeby zobaczyć powiadomienia kupującego.",
      "vibe.title": "Pas ruchu Vibe",
      "vibe.lead": "Przesuwaj w bok, przewijaj po skosie i patrz, jak soczewka sygnału podświetla gorące strefy.",
      "vibe.card1h": "Street Drip",
      "vibe.card1p": "Szybkie dropy mody dla młodych kupujących.",
      "vibe.card2h": "Iskry techu",
      "vibe.card2p": "Unikalne gadżety z bezpiecznym checkoutem jednym kliknięciem.",
      "vibe.card3h": "Znaleziska twórców",
      "vibe.card3p": "Produkty wybrane z nadchodzących sprzedawców.",
      "vibe.card4h": "Globalny puls",
      "vibe.card4p": "Transgraniczne hity inteligentnie trasowane.",
      "vibe.card5h": "Campus Heat",
      "vibe.card5p": "Studenckie okazje pod szybkość i zaufanie.",
      "quickView.title": "Szybki widok",
      "quickView.lead": "Wybierz, na czym chcesz się najpierw skupić.",
      "quickView.btnDiscover": "Kupuj i odkrywaj",
      "quickView.btnGrow": "Sprzedawaj i rośnij",
      "quickView.btnAssurance": "Bezpieczeństwo i usługi",
      "quickView.btnAll": "Pokaż wszystko",
      "account.title": "Dostęp do konta",
      "account.lead": "Zaloguj się lub utwórz konto w zależności od tego, co chcesz zrobić.",
      "account.buyerTitle": "Konto kupującego",
      "account.buyerBody": "Profil kupującego: śledzenie zamówień, ulubione i nagrody z zabezpieczeniami.",
      "account.buyerCta": "Logowanie / rejestracja kupującego",
      "account.sellerTitle": "Konto sprzedawcy",
      "account.sellerBody": "Profil sprzedawcy: oferty, magazyn i wypłaty.",
      "account.sellerCta": "Logowanie / rejestracja sprzedawcy",
      "marketFit.title": "Dla studentów, rodzin i rosnących firm",
      "marketFit.lead":
        "VibeCart jest zaprojektowany na szybki, wiarygodny handel transgraniczny między Afryką a Europą, z jasnym wsparciem dla nowoczesnych i tradycyjnych kupujących.",
      "marketFit.p1h": "Dla studentów i młodych kupujących",
      "marketFit.p1p": "Przystępne oferty, zweryfikowani sprzedawcy, bezpieczny checkout i nagrody za bezpieczne zakupy.",
      "marketFit.p2h": "Dla rodzin i dojrzałych kupujących",
      "marketFit.p2p": "Jasne informacje o produktach, niezawodne trasy dostaw i mocniejsze kontrole antyfraudowe.",
      "marketFit.p3h": "Dla sprzedawców i usługodawców",
      "marketFit.p3p": "Wsparcie AI w operacjach, widoczność trust score i kontrola właściciela przy kluczowych decyzjach.",
      "tax.title": "Przejrzystość podatków i wypłat",
      "tax.lead":
        "Każda transakcja zawiera naliczenie podatku i zapisy potrąceń przed wypłatą. Przychód netto i podatek do zapłaty są śledzone, by ograniczać ryzyko uchylania się od podatków.",
      "ai.title": "Asystent zakupów AI",
      "ai.lead": "Napisz, czego potrzebujesz, budżet i kategorię — asystent pokaże ranking z tej strony (lokalnie), bez zewnętrznego modelu.",
      "ai.suggest": "Pobierz propozycje AI",
      "orbit.title": "Panel sygnałów: podwójny AI + polityka",
      "orbit.lead":
        "Wybierz ton wskazówek. Płatności, zgodność z prawem i wypłaty nadal przez API i ludzi — tutaj nic nie instaluje się samo.",
      "orbit.personaFun": "Fun AI (Aura)",
      "orbit.personaEff": "Efficient AI (Ops)",
      "orbit.personaHint": "Persona zmienia tylko styl tekstu propozycji.",
      "orbit.legalTitle": "Copilot zgodności (reguły)",
      "orbit.legalBody":
        "Automatyka: tabele jurysdykcji, zakazy kategorii, sygnały ryzyka. Niejasne sprawy → ręczna weryfikacja. To nie jest porada prawna.",
      "orbit.radarTitle": "Radar rynku (sygnały)",
      "orbit.radarLead": "Podpowiedzi z regionu i języka — do planu wzrostu; nie wdrażają kodu ani sklepów.",
      "ai.resultEffPrefix": "Dopasowania",
      "ai.resultFunPrefix": "Wybrane vibe",
      "ai.noMatch": "Słabe dopasowanie. Zwiększ budżet lub wybierz Dowolna kategoria.",
      "lang.aiOfferCaption": "Z języków przeglądarki i strefy czasowej (heurystyka lokalna).",
      "lang.aiOfferSwitch": "Zmień język",
      "lang.aiOfferDismiss": "Nie teraz"
    },
    fr: {
      "nav.categories": "Catégories",
      "nav.shops": "Boutiques régionales",
      "nav.hot": "Tendances",
      "nav.rewards": "Récompenses",
      "nav.insurance": "Assurance",
      "nav.wellbeing": "Coach santé",
      "nav.security": "Sécurité",
      "nav.settings": "Paramètres",
      "nav.sellerBoost": "Boost vendeur",
      "nav.sell": "Vendre",
      "nav.login": "Connexion",
      "lang.label": "Langue",
      "hero.badge": "Pont commercial Afrique–Europe–Asie",
      "hero.title": "Découvrez, achetez vite, vendez dans le monde.",
      "ai.title": "Assistant d’achat IA",
      "ai.lead": "Budget, catégorie, besoin — classement des fiches visibles sur cette page (local), pas un modèle distant.",
      "ai.suggest": "Suggestions IA",
      "orbit.title": "Deck signaux : double IA + politiques",
      "orbit.lead":
        "Choisissez le ton des conseils. Paiements et conformité restent dans vos flux habituels — rien ne s’installe tout seul.",
      "orbit.personaFun": "IA fun (Aura)",
      "orbit.personaEff": "IA efficace (Ops)",
      "orbit.personaHint": "La persona ne change que la formulation.",
      "orbit.legalTitle": "Copilote conformité (règles)",
      "orbit.legalBody":
        "Tables juridictions, catégories interdites, signaux risque ; revue manuelle si doute — pas un avis juridique.",
      "orbit.radarTitle": "Radar marché (signaux)",
      "orbit.radarLead": "Indices selon région/langue — pour votre plan ; pas de déploiement auto.",
      "ai.resultEffPrefix": "Correspondances",
      "ai.resultFunPrefix": "Choix vibe",
      "ai.noMatch": "Peu de résultats. Budget plus haut ou catégorie Tout.",
      "lang.aiOfferCaption": "Selon langues du navigateur et fuseau (heuristique locale).",
      "lang.aiOfferSwitch": "Changer de langue",
      "lang.aiOfferDismiss": "Pas maintenant"
    },
    pt: {
      "nav.categories": "Categorias",
      "nav.shops": "Lojas regionais",
      "nav.hot": "Destaques",
      "nav.rewards": "Recompensas",
      "nav.insurance": "Seguros",
      "nav.wellbeing": "Coach de saúde",
      "nav.security": "Segurança",
      "nav.settings": "Configurações",
      "nav.sellerBoost": "Impulso vendedor",
      "nav.sell": "Começar a vender",
      "nav.login": "Entrar",
      "lang.label": "Idioma",
      "hero.badge": "Ponte comercial África–Europa–Ásia",
      "hero.title": "Descubra, compre rápido, venda no mundo.",
      "ai.title": "Assistente de compras IA",
      "ai.lead": "Orçamento, categoria e necessidade — ranqueia anúncios desta página (local), sem modelo remoto.",
      "ai.suggest": "Sugestões de IA",
      "orbit.title": "Deck de sinais: IA dupla + políticas",
      "orbit.lead":
        "Escolha o tom das dicas. Pagamentos e conformidade seguem nos fluxos normais — nada instala sozinho.",
      "orbit.personaFun": "IA divertida (Aura)",
      "orbit.personaEff": "IA eficiente (Ops)",
      "orbit.personaHint": "A persona só muda o texto das sugestões.",
      "orbit.legalTitle": "Copiloto de conformidade (regras)",
      "orbit.legalBody":
        "Tabelas de jurisdição, bloqueios de categoria, sinais de risco; revisão manual se dúvida — não é assessoria jurídica.",
      "orbit.radarTitle": "Radar de mercado (sinais)",
      "orbit.radarLead": "Dicas por região/idioma — para o plano; sem deploy automático.",
      "ai.resultEffPrefix": "Correspondências",
      "ai.resultFunPrefix": "Escolhas vibe",
      "ai.noMatch": "Pouco match. Aumente o orçamento ou categoria Qualquer.",
      "lang.aiOfferCaption": "Com base nos idiomas do navegador e fuso (heurística local).",
      "lang.aiOfferSwitch": "Mudar idioma",
      "lang.aiOfferDismiss": "Agora não"
    },
    sw: {
      "nav.categories": "Makundi",
      "nav.shops": "Maduka kwa kanda",
      "nav.hot": "Vinavyovutia",
      "nav.rewards": "Zawadi",
      "nav.insurance": "Bima",
      "nav.wellbeing": "Kocha wa afya",
      "nav.security": "Usalama",
      "nav.settings": "Mipangilio",
      "nav.sellerBoost": "Kuongeza mauzo",
      "nav.sell": "Anza kuuza",
      "lang.label": "Lugha",
      "hero.badge": "Daraja la biashara Afrika–Ulaya–Asia",
      "hero.title": "Gundua, nunua haraka, uza duniani.",
      "hero.sig1": "Malipo salama",
      "hero.sig2": "Wauzaji walithibitishwa",
      "hero.sig3": "Uwasilishaji unaofuatiliwa",
      "hero.chipHintCheckout":
        "Tunaonyesha ulinzi wa mnunuzi na mchakato wa malipo — skroleni chini muone matangazo yanayoendelea.",
      "hero.chipHintSellers":
        "Folda za maduka kanda kwa kanda — kila moja inafungua njia ya wauzaji waliodhihirishwa unayoweza kupitia.",
      "hero.chipHintDelivery":
        "Ufuatiliaji na masasisho ya uwasilishaji — bonyeza kitufe cha kuigiza hatua muone jinsi mnunuzi anavyoarifiwa.",
      "ai.title": "Msaidizi wa manunuzi AI",
      "ai.lead": "Bajeti, aina, mahitaji — huonyesha orodha ya bidhaa kwenye ukurasa huu (ndani), si mfano wa mbali.",
      "ai.suggest": "Pata mapendekezo ya AI",
      "orbit.title": "Deck ya ishara: AI mbili + sera",
      "orbit.lead":
        "Chagua mtindo wa vidokezo. Malipo na sheria bado kwenye mifumo yako — hakuna kinachojisakinisha peke yake.",
      "orbit.personaFun": "AI ya kuchekesha (Aura)",
      "orbit.personaEff": "AI bora (Ops)",
      "orbit.personaHint": "Persona inabadilisha maneno tu.",
      "orbit.legalTitle": "Copilot wa kisheria (kanuni)",
      "orbit.legalBody":
        "Jedwali la nchi, marufuku ya aina, ishara za hatari; ukishuku — ukaguzi wa mtu. Si ushauri wa kisheria.",
      "orbit.radarTitle": "Radar ya soko (ishara)",
      "orbit.radarLead": "Vidokezo kwa eneo/lugha — kwa mpango; hakuna kusakinisha moja kwa moja.",
      "ai.resultEffPrefix": "Vilinganifu",
      "ai.resultFunPrefix": "Chaguo la vibe",
      "ai.noMatch": "Hakuna mechi bora. Ongeza bajeti au chagua Aina yoyote.",
      "lang.aiOfferCaption": "Kutoka kwa lugha za kivinjari na ukanda wa saa (heuristiki ya ndani).",
      "lang.aiOfferSwitch": "Badilisha lugha",
      "lang.aiOfferDismiss": "Sio sasa"
    },
    ar: {
      "nav.categories": "الفئات",
      "nav.shops": "متاجر إقليمية",
      "nav.hot": "الأكثر رواجًا",
      "nav.rewards": "المكافآت",
      "nav.insurance": "التأمين",
      "nav.wellbeing": "مدرب الصحة",
      "nav.security": "الأمان",
      "nav.settings": "الإعدادات",
      "nav.sellerBoost": "دفع المبيعات",
      "nav.sell": "ابدأ البيع",
      "lang.label": "اللغة",
      "hero.badge": "جسر تجاري أفريقيا–أوروبا–آسيا",
      "hero.title": "اكتشف، اشترِ بسرعة، بِع حول العالم.",
      "ai.title": "مساعد تسوق بالذكاء الاصطناعي",
      "ai.lead": "الميزانية والفئة والاحتياج — يرتّب العروض في هذه الصفحة محليًا وليس نموذجًا خارجيًا.",
      "ai.suggest": "احصل على اقتراحات",
      "orbit.title": "لوحة الإشارات: ذكاء مزدوج + سياسات",
      "orbit.lead":
        "اختر نبرة النصائح. المدفوعات والامتثال تبقى في مساراتك — لا يُثبّت شيء تلقائيًا هنا.",
      "orbit.personaFun": "ذكاء ممتع (Aura)",
      "orbit.personaEff": "ذكاء فعّال (Ops)",
      "orbit.personaHint": "الشخصية تغيّر الصياغة فقط.",
      "orbit.legalTitle": "مساعد امتثال (قواعد)",
      "orbit.legalBody":
        "جداول الولاية، حظر الفئات، إشارات المخاطر؛ المراجعة اليدوية عند الشك — وليست استشارة قانونية.",
      "orbit.radarTitle": "رادار السوق (إشارات)",
      "orbit.radarLead": "تلميحات حسب المنطقة واللغة — للتخطيط دون نشر تلقائي.",
      "ai.resultEffPrefix": "أفضل تطابق",
      "ai.resultFunPrefix": "اختيارات مميزة",
      "ai.noMatch": "لا تطابق قوي. زد الميزانية أو اختر أي فئة.",
      "lang.aiOfferCaption": "حسب لغات المتصفح والمنطقة الزمنية (استدلال محلي).",
      "lang.aiOfferSwitch": "تغيير اللغة",
      "lang.aiOfferDismiss": "لا شكرًا"
    },
    sn: {
      "nav.categories": "Makonde",
      "nav.shops": "Mashops emaereni",
      "nav.hot": "Zvinokwezva",
      "nav.rewards": "Mubairo",
      "nav.insurance": "Chirwere",
      "nav.security": "Chengetedzo",
      "nav.settings": "Zvirongwa",
      "nav.sellerBoost": "Kuvandudza kutengesa",
      "nav.sell": "Tanga kutengesa",
      "lang.label": "Mutauro",
      "hero.badge": "Dandira rekushambadzira Africa–Europe–Asia",
      "hero.title": "Wana, tenga nekukurumidza, tengesa pasi rose.",
      "hero.sig1": "Checkout yakachengeteka",
      "hero.sig2": "Vatengesi vakapendekwa",
      "hero.sig3": "Kutumwa kunotaridzwa",
      "hero.chipHintCheckout":
        "Tiri kusvikira pane zvakanzurwa zvevatengi necheckout — puruzivira pasi peji kuti uone zvirongwa zviri pano.",
      "hero.chipHintSellers":
        "Madhire emashop emunyika — rimwe rimwe rinovhurira nzira dzevatengesi vakachengetedzwa dzinowanikwa.",
      "hero.chipHintDelivery":
        "Kutevera mumugwagwa uye mashandiro ekutumira — simbura kuti uone zvekunyorerwa kuvatengi.",
      "ai.title": "Mubatsiri weAI wekutenga",
      "ai.lead": "Bajeti, chikamu, zvaunoda — inoratidza zviri pamu peji iyi (mukati), kwete muenzaniso uri kure.",
      "ai.suggest": "Wana mazano eAI",
      "orbit.title": "Deck yesign: AI mbiri + mitemo",
      "orbit.lead": "Sarudza mutauro wezvamazano. Kubhadharwa uye mutemo zvakachengeteka — hapana chinozvisakisa.",
      "orbit.personaFun": "AI yekufara (Aura)",
      "orbit.personaEff": "AI inoshanda (Ops)",
      "orbit.personaHint": "Chimiro chinongoshandura mashoko.",
      "orbit.legalTitle": "Rubatsiro rwemitemo",
      "orbit.legalBody": "Matafura enyika, zvakadzimwa, zviratidzo zvesingori — kuongorora kwaoko. Kwete mushumo wechokwadi.",
      "orbit.radarTitle": "Radar yesoko",
      "orbit.radarLead": "Mazano kubva kune nzvimbo nemutauro — kwemapurani; kwete kuisa kodhi.",
      "ai.resultEffPrefix": "Zvakakodzera",
      "ai.resultFunPrefix": "Zvasarudzwa neAura",
      "ai.noMatch": "Hapana kukodzera chaunoita. Wedzera bajeti kana Sarudza Chikamu Chose.",
      "lang.suggestHook": "ChiShona chekutanga here?",
      "lang.aiOfferCaption": "Kubva kune mutauro webhrawuza neAfrica/Harare kana zvakafanana.",
      "lang.aiOfferSwitch": "Shandisa ChiShona",
      "lang.aiOfferDismiss": "Kwete iye zvino"
    },
    nd: {
      "nav.categories": "Iintlobo",
      "nav.shops": "Amashophu endaweni",
      "nav.hot": "Okudumileyo",
      "nav.rewards": "Imiklomelo",
      "nav.insurance": "Isivikelo",
      "nav.security": "Ivikelo",
      "nav.settings": "Izilungiselelo",
      "nav.sellerBoost": "Ukukhuthaza ukuthengisa",
      "nav.sell": "Qala ukuthengisa",
      "lang.label": "Ulimi",
      "hero.badge": "Ibhasi lebhizinisi i-Afrika–Yurophu–E-Asia",
      "hero.title": "Thola, thenge ngokushesha, thengise emhlabeni wonke.",
      "hero.sig1": "Ukukhokha okuphephile",
      "hero.sig2": "Abathengisi abaqinisekisiwe",
      "hero.sig3": "Ukulethwa okulandelwayo",
      "hero.chipHintCheckout":
        "Sibuyela ekuvikelweni kokuthenga nendlela yokukhokha — skrola ikhasi uze ubone okubhalwe lapha.",
      "hero.chipHintSellers":
        "Amahhovu ezitolo zendaweni — ngamunye uvula indlela yabathengisi abaqinisekisiwe ongayibuka.",
      "hero.chipHintDelivery":
        "Ukulandelela nokushintsha kokulethwa — chofoza ukuhlela isinyathelo ubona ukuthi abathengi banolwazi kanjani.",
      "ai.title": "Isisekeli se-AI sokuthenga",
      "ai.lead": "Isabelo, isigaba, okudingayo — libonisa okuleli khasi (lapha), hhayi imodeli ekude.",
      "ai.suggest": "Thola iziphakamiso ze-AI",
      "orbit.title": "Ikhadi lezimpawu: i-AI mbili + imithetho",
      "orbit.lead": "Khetha indlela yezeluleko. Inkokhelo nemithetho ihlala ezindleleni zakho.",
      "orbit.personaFun": "I-AI ejabulisayo (Aura)",
      "orbit.personaEff": "I-AI esebenzayo (Ops)",
      "orbit.personaHint": "I-persona iguqule amazwi kuphela.",
      "orbit.legalTitle": "Isiqondisi semithetho",
      "orbit.legalBody": "Amatafula ezifundazwe, izivinjelwa, izimpawu zengozi — ukubuyekezwa. Akuyona icebiso lomthetho.",
      "orbit.radarTitle": "I-radar yemakethe",
      "orbit.radarLead": "Izeluleko ngendawo nolimi — hhayi ukufaka ikhodi.",
      "ai.resultEffPrefix": "Okufanayo",
      "ai.resultFunPrefix": "Okukhethiwe",
      "ai.noMatch": "Akukho okufanayo okuqinile. Khuphula isabelo noma Khetha noma yisiphi isigaba.",
      "lang.suggestHook": "IsiNdebele sesikhashana?",
      "lang.aiOfferCaption": "Kusuka ezilimini zesiphequluli nesikhathi sendawo (i-Harare noma eBulawayo).",
      "lang.aiOfferSwitch": "Sebenzisa isiNdebele",
      "lang.aiOfferDismiss": "Cha, kalokhu"
    },
    xh: {
      "nav.categories": "Iindidi",
      "nav.shops": "Iivenkile zesithili",
      "nav.hot": "Ezi khethekileyo",
      "nav.rewards": "Izipho",
      "nav.insurance": "Inshurensi",
      "nav.security": "Ukhuseleko",
      "nav.settings": "Iisetingi",
      "nav.sellerBoost": "Ukukhuthaza ukuthengisa",
      "nav.sell": "Qala ukuthengisa",
      "lang.label": "Ulwimi",
      "hero.badge": "Ibhondi yerhwebo i-Afrika–Yurophu–E-Asia",
      "hero.title": "Fumanisa, thenge ngokukhawuleza, thengise ehlabathini lonke.",
      "hero.sig1": "Ukutsaliswa okukhuselekileyo",
      "hero.sig2": "Abathengisi abaqinisekisiweyo",
      "hero.sig3": "Ukuhanjelwa okulandelwayo",
      "hero.chipHintCheckout":
        "Sibonisa ukhuseleko lwabathengi nendlela yokutsalisa — skrolela iphepha uze ubone iintengiso eziphilayo eziphantsi.",
      "hero.chipHintSellers":
        "Iifolda zevenkile zendawo — nganye ivula indlela yabathengisi abaqinisekisiweyo ongazihambela.",
      "hero.chipHintDelivery":
        "Ukulandelwa kunye nezihlaziyo zokuhanjiswa — cofa ukuzenza ukuze ubone ukuba zazisa njani umthengi.",
      "ai.title": "Umxhasi we-AI wokuthenga",
      "ai.lead": "Isabelo, udidi, oko ufunayo — ibonisa oku kweli phepha (apha), hayi imodeli ekude.",
      "ai.suggest": "Fumana iingcebiso ze-AI",
      "orbit.title": "Ikhadi leempawu: i-AI mbini + imithetho",
      "orbit.lead": "Khetha indlela yengcebiso. Iintlawulo nemigaqo zihlala kwindlela yakho.",
      "orbit.personaFun": "I-AI yonwabo (Aura)",
      "orbit.personaEff": "I-AI esebenzayo (Ops)",
      "orbit.personaHint": "I-persona iguqule amazwi kuphela.",
      "orbit.legalTitle": "Umncedisi wemigaqo",
      "orbit.legalBody": "Amatafile ezifundwe, izithintelo, iimpawu zengozi — uphononongo. Ayiyo icebiso lomthetho.",
      "orbit.radarTitle": "I-radar yemarike",
      "orbit.radarLead": "Iingcebiso ngendawo nolwimi — hayi ukufaka ikhowudi.",
      "ai.resultEffPrefix": "Ezi hambelanayo",
      "ai.resultFunPrefix": "Ezikhethiweyo",
      "ai.noMatch": "Akukho hambelano eliqinile. Yandisa isabelo okanye Khetha nayiphi na ididi.",
      "lang.suggestHook": "IsiXhosa sesikhethe?",
      "lang.aiOfferCaption": "Kusuka kolwimi lwebhrawuza kunye nesithuba sendawo (eMzantsi Afrika nokufana).",
      "lang.aiOfferSwitch": "Sebenzisa isiXhosa",
      "lang.aiOfferDismiss": "Hayi, ngoku"
    },
    zh: {
      "nav.categories": "分类",
      "nav.shops": "地区店铺",
      "nav.hot": "热门精选",
      "nav.rewards": "奖励",
      "nav.insurance": "保险",
      "nav.security": "安全",
      "nav.settings": "设置",
      "nav.sellerBoost": "卖家助推",
      "nav.sell": "开始销售",
      "lang.label": "语言",
      "hero.badge": "非洲–欧洲–亚洲贸易桥",
      "hero.title": "发现好物，快速购买，全球销售。",
      "ai.title": "AI 购物助手",
      "ai.lead": "预算、品类、需求 — 在本页对商品排序（本地），非远程大模型。",
      "ai.suggest": "获取 AI 推荐",
      "orbit.title": "信号面板：双 AI + 合规护栏",
      "orbit.lead": "选择提示语气。支付与合规仍在您的正常流程中 — 此处不会自动安装软件。",
      "orbit.personaFun": "趣味 AI（Aura）",
      "orbit.personaEff": "高效 AI（Ops）",
      "orbit.personaHint": "人设仅改变建议措辞。",
      "orbit.legalTitle": "合规副驾驶（规则）",
      "orbit.legalBody": "司法辖区表、品类限制、风险提示；存疑人工复核 — 非法律意见。",
      "orbit.radarTitle": "市场雷达（信号）",
      "orbit.radarLead": "按地区与语言的启发式提示 — 用于规划，不自动部署。",
      "ai.resultEffPrefix": "匹配结果",
      "ai.resultFunPrefix": "氛围精选",
      "ai.noMatch": "匹配较弱。可提高预算或选择任意品类。",
      "lang.suggestHook": "是否切换到简体中文界面？",
      "lang.aiOfferCaption": "根据浏览器语言与时区（本地启发，非 GPS）。",
      "lang.aiOfferSwitch": "切换语言",
      "lang.aiOfferDismiss": "暂不"
    },
    ko: {
      "nav.categories": "카테고리",
      "nav.shops": "지역 샵",
      "nav.hot": "인기 상품",
      "nav.rewards": "리워드",
      "nav.insurance": "보험",
      "nav.security": "보안",
      "nav.settings": "설정",
      "nav.sellerBoost": "셀러 부스트",
      "nav.sell": "판매 시작",
      "lang.label": "언어",
      "hero.badge": "아프리카–유럽–아시아 무역 브릿지",
      "hero.title": "발견하고 빠르게 사고, 전 세계에 팔아요.",
      "ai.title": "AI 쇼핑 도우미",
      "ai.lead": "예산·카테고리·필요 — 이 페이지의 상품을 정렬합니다(로컬). 원격 모델이 아닙니다.",
      "ai.suggest": "AI 추천 받기",
      "orbit.title": "시그널 덱: 듀얼 AI + 정책 가드",
      "orbit.lead": "톤을 고르세요. 결제·컴플라이언스는 기존 흐름을 따릅니다 — 여기서 자동 설치는 없습니다.",
      "orbit.personaFun": "재미 AI (Aura)",
      "orbit.personaEff": "효율 AI (Ops)",
      "orbit.personaHint": "페르소나는 문구만 바꿉니다.",
      "orbit.legalTitle": "규칙 기반 컴플라이언스",
      "orbit.legalBody": "관할·금지 카테고리·리스크 신호; 애매하면 수동 검토 — 법률 자문이 아닙니다.",
      "orbit.radarTitle": "마켓 레이더(신호)",
      "orbit.radarLead": "지역·언어 기반 힌트 — 계획용이며 자동 배포는 없습니다.",
      "ai.resultEffPrefix": "순위 매칭",
      "ai.resultFunPrefix": "바이브 픽",
      "ai.noMatch": "매칭이 약합니다. 예산을 늘리거나 전체 카테고리를 선택하세요.",
      "lang.suggestHook": "한국어 인터페이스로 바꿀까요?",
      "lang.aiOfferCaption": "브라우저 언어와 시간대 기반(로컬 휴리스틱).",
      "lang.aiOfferSwitch": "언어 바꾸기",
      "lang.aiOfferDismiss": "괜찮아요"
    },
    hi: {
      "nav.categories": "श्रेणियाँ",
      "nav.shops": "क्षेत्रीय दुकानें",
      "nav.hot": "लोकप्रिय",
      "nav.rewards": "इनाम",
      "nav.insurance": "बीमा",
      "nav.security": "सुरक्षा",
      "nav.settings": "सेटिंग्स",
      "nav.sellerBoost": "विक्रेता बूस्ट",
      "nav.sell": "बेचना शुरू करें",
      "lang.label": "भाषा",
      "hero.badge": "अफ़्रीका–यूरोप–एशिया व्यापार पुल",
      "hero.title": "खोजें, तेज़ी से खरीदें, दुनिया में बेचें।",
      "ai.title": "AI शॉपिंग सहायक",
      "ai.lead": "बजट, श्रेणी, ज़रूरत — इस पेज पर सूची क्रमबद्ध (स्थानीय), दूर का मॉडल नहीं।",
      "ai.suggest": "AI सुझाव लें",
      "orbit.title": "सिग्नल डेक: दोहरा AI + नीति रेल",
      "orbit.lead": "टिप्स का टोन चुनें। भुगतान और अनुपालन आपके सामान्य फ़्लो में रहते हैं।",
      "orbit.personaFun": "मज़ेदार AI (Aura)",
      "orbit.personaEff": "कुशल AI (Ops)",
      "orbit.personaHint": "पर्सना केवल शब्द बदलता है।",
      "orbit.legalTitle": "नियम-आधारित सहायक",
      "orbit.legalBody": "क्षेत्राधिकार, प्रतिबंध, जोखिम संकेत; संदेह पर मैनुअल समीक्षा — कानूनी सलाह नहीं।",
      "orbit.radarTitle": "बाज़ार रडार (संकेत)",
      "orbit.radarLead": "क्षेत्र व भाषा से संकेत — योजना के लिए, कोड डिप्लॉय नहीं।",
      "ai.resultEffPrefix": "मिलान",
      "ai.resultFunPrefix": "वाइब चयन",
      "ai.noMatch": "कम मिलान। बजट बढ़ाएँ या कोई भी श्रेणी चुनें।",
      "lang.suggestHook": "क्या हिंदी में मेनू दिखाएँ?",
      "lang.aiOfferCaption": "ब्राउज़र भाषाओं और समय क्षेत्र से (स्थानीय अनुमान)।",
      "lang.aiOfferSwitch": "भाषा बदलें",
      "lang.aiOfferDismiss": "अभी नहीं"
    },
    zu: {
      "lang.label": "Ulimi",
      "hero.sig1": "Ukukhokha okuphephile",
      "hero.sig2": "Abathengisi abaqinisekisiwe",
      "hero.sig3": "Ukulethwa okulandelwayo",
      "hero.chipHintCheckout":
        "Sibonisa ukuvikelwa kwabathengi nendlela yokukhokha — skrola ikhasi uze ubone okubhalwe lapha.",
      "hero.chipHintSellers":
        "Amahhovu ezitolo zendaweni — ngamunye uvula indlela yabathengisi abaqinisekisiwe ongayibuka.",
      "hero.chipHintDelivery":
        "Ukulandelela nezibuyekezo zokulethwa — chofoza ukuhlela izinyathelo ubona ukuthi abathengi banolwazi kanjani."
    },
    pcm: {
      "lang.label": "Langwej",
      "hero.sig1": "Checkout wey dey safe",
      "hero.sig2": "Sellers wey dem verify",
      "hero.sig3": "Delivery wey dem dey track",
      "hero.chipHintCheckout":
        "We dey show buyer protection plus how checkout dey work — scroll down make you see live listings.",
      "hero.chipHintSellers":
        "Regional shop folders — each one na verified seller lane wey you fit browse.",
      "hero.chipHintDelivery":
        "Tracking plus delivery update — tap simulate make you see how dem dey inform buyer."
    },
    lg: {
      "lang.label": "Olulimi",
      "hero.sig1": "Okusasula okw'emirembe",
      "hero.sig2": "Abasuubuzi abakakasiddwa",
      "hero.sig3": "Okutwalibwa okulondoolerwa",
      "hero.chipHintCheckout":
        "Tulaga engeri y'okukuuma omusuubuzi n'okusasula — sakira omuko okulaba ebirango ebirala ebirabika.",
      "hero.chipHintSellers":
        "Ebikumba eby'ebidduka mu bitundu — buli kimu kiggula olugendo lw'abasuubuzi abakakasiddwa osobola okwetondera.",
      "hero.chipHintDelivery":
        "Okulondoolera n'amakuru ku butwalibwa — nyiga okwefaananya ebintu okulaba omusuubuzi we bwamutegeezeza."
    },
    tn: {
      "lang.label": "Puo",
      "hero.sig1": "Tefo e e sireletsegileng",
      "hero.sig2": "Barekisi ba ba babatletsweng",
      "hero.sig3": "Tsamiso e e latelwang",
      "hero.chipHintCheckout":
        "Re bontsha ditlamo tsa moreki le mokgwa wa tefo — goga letlakala go bona dilaelo tse di leng teng.",
      "hero.chipHintSellers":
        "Difoltha tsa dishopo tsa kgaolo — ngwe le ngwe e bula tsela ya barekisi ba ba babatletsweng o ka e lebelelang.",
      "hero.chipHintDelivery":
        "Kgatelodiloso le ditlhabololo tsa tsamiso — toba go akanya dikgato go bona gore bareki ba a newa tshedimosetso jang."
    },
    af: {
      "lang.label": "Taal",
      "hero.sig1": "Veilige afhandeling",
      "hero.sig2": "Geverifieerde verkopers",
      "hero.sig3": "Nagespoorde aflewering",
      "hero.chipHintCheckout":
        "Wys kopersbeskerming en afhandeling — rol die blad om live lyste hieronder te sien.",
      "hero.chipHintSellers":
        "Streekwinkel-vouers — elk maak geverifieerde verkoperroetes oop wat jy kan blaai.",
      "hero.chipHintDelivery":
        "Naspoor en afleweringopdaterings — tik simulasie om te sien hoe kopers ingelig word."
    }
  };

  // Phase 2: curated native-copy overrides for high-visibility UI.
  const CURATED_NATIVE_OVERRIDES = {
    zu: {
      "nav.categories": "Izigaba",
      "nav.shops": "Izitolo zesifunda",
      "nav.hot": "Okudume kakhulu",
      "nav.rewards": "Imivuzo",
      "nav.insurance": "Umshuwalense",
      "nav.wellbeing": "Umqeqeshi wezempilo",
      "nav.security": "Ezokuphepha",
      "nav.settings": "Izilungiselelo",
      "nav.account": "I-akhawunti",
      "nav.sellerBoost": "Ukukhulisa ukuthengisa",
      "nav.sell": "Qala ukuthengisa",
      "lang.label": "Ulimi",
      "hero.badge": "Ibhuloho lohwebo lwe-Afrika-Europe-Asia",
      "hero.title": "Thola okusha. Thenga ngokushesha. Thengisa emhlabeni wonke.",
      "hero.shopNow": "Thenga manje",
      "hero.listItem": "Faka umkhiqizo",
      "hero.smartTour": "Qala ukuvakasha okuhlakaniphile",
      "hero.installApp": "Faka uhlelo lokusebenza",
      "hero.sig1": "Ukukhokha okuphephile",
      "hero.sig2": "Abathengisi abaqinisekisiwe",
      "hero.sig3": "Ukulethwa okulandelwayo",
      "account.title": "Ukungena ku-akhawunti",
      "account.lead": "Ngena noma wakhe i-akhawunti ngokuya ngalokho ofuna ukukwenza.",
      "account.buyerTitle": "I-akhawunti yomthengi",
      "account.sellerTitle": "I-akhawunti yomthengisi",
      "quickView.title": "Ukubuka okusheshayo",
      "quickView.btnDiscover": "Thenga futhi uthole",
      "quickView.btnGrow": "Thengisa futhi ukhule",
      "quickView.btnAssurance": "Ezokuphepha nezinsiza",
      "quickView.btnAll": "Bonisa konke",
      "ai.title": "Umsizi wokuthenga we-AI",
      "ai.suggest": "Thola iziphakamiso ze-AI",
      "settingsHub.title": "Izilungiselelo nemithetho",
      "settingsHub.lead": "Ezokuphepha, isipiliyoni, nemibhalo yomthetho."
    },
    sn: {
      "nav.account": "Akaunti",
      "nav.wellbeing": "Mudzidzisi wehutano",
      "hero.title": "Tsvaga zvakanaka. Tenga nekukurumidza. Tengesa pasi rese.",
      "hero.shopNow": "Tenga zvino",
      "hero.listItem": "Isa chigadzirwa",
      "hero.smartTour": "Tanga rwendo rwakangwara",
      "account.title": "Kupinda muakaunti",
      "quickView.title": "Kuona nekukurumidza",
      "ai.title": "Mubatsiri wekutenga weAI",
      "settingsHub.title": "Zvirongwa nemutemo"
    },
    nd: {
      "nav.account": "I-akhawunti",
      "nav.wellbeing": "Umqeqetshi wezempilo",
      "hero.title": "Thola okuhle. Thenga masinyane. Thengisa emhlabeni wonke.",
      "hero.shopNow": "Thenga khathesi",
      "hero.listItem": "Faka umkhiqizo",
      "account.title": "Ukungena ku-akhawunti",
      "quickView.title": "Ukubona masinyane",
      "ai.title": "Umsizi wokuthenga we-AI",
      "settingsHub.title": "Izilungiselelo lomthetho"
    },
    xh: {
      "nav.account": "Iakhawunti",
      "nav.wellbeing": "Umqeqeshi wezempilo",
      "hero.title": "Fumanisa okuhle. Thenga ngokukhawuleza. Thengisa kwihlabathi.",
      "hero.shopNow": "Thenga ngoku",
      "hero.listItem": "Faka imveliso",
      "account.title": "Ukungena kwiakhawunti",
      "quickView.title": "Ukujonga ngokukhawuleza",
      "ai.title": "Umncedisi wokuthenga we-AI",
      "settingsHub.title": "Iisetingi nomthetho"
    }
  };
  Object.keys(CURATED_NATIVE_OVERRIDES).forEach((code) => {
    if (!STRINGS[code]) {
      STRINGS[code] = {};
    }
    Object.assign(STRINGS[code], CURATED_NATIVE_OVERRIDES[code]);
  });

  // Phase 4: curated section-level overrides for marketplace/seller/settings/checkout flows.
  const CURATED_SECTION_OVERRIDES = {
    pl: {
      "marketFit.title": "Stworzone dla studentow, rodzin i rozwijajacych sie firm",
      "sellerHub.kicker": "Dla sprzedawcow i firm",
      "sellerHub.title": "Sprzedawaj w 3 prostych krokach — potem korzystaj z narzedzi ponizej",
      "sellerHub.intro": "Na tej stronie znajdziesz marketing, AI wzrostu i reklamy. Sygnały wewnetrzne i zasady sa tutaj, aby glowna strona zakupow pozostala prosta.",
      "settingsHub.title": "Ustawienia i dokumenty prawne",
      "settingsHub.lead": "Bezpieczenstwo, doswiadczenie i dokumenty prawne — poza strona glowna, aby zakupy byly szybsze.",
      "settingsHub.securityH": "Przeglad bezpieczenstwa",
      "settingsHub.modeGuided": "Tryb prowadzony (AI + wskazowki)",
      "settingsHub.modeSimple": "Tryb prosty (minimalny interfejs)",
      "settingsHub.modePro": "Tryb Pro (pelna kontrola rynku)",
      "accountPassport.paymentsNote": "Platnosci checkout sa obslugiwane przez Stripe, gdy serwer jest skonfigurowany.",
      "search.placeholder": "Szukaj w Europie, Afryce, Azji..."
    },
    fr: {
      "marketFit.title": "Concu pour les etudiants, les familles et les entreprises en croissance",
      "sellerHub.kicker": "Pour les vendeurs et entreprises",
      "sellerHub.title": "Vendez en 3 etapes simples — puis utilisez les outils ci-dessous",
      "sellerHub.intro": "Cette page regroupe marketing, IA de croissance et publicites. Les signaux internes et les regles restent ici pour garder l'accueil shopping clair.",
      "settingsHub.title": "Parametres et mentions legales",
      "settingsHub.lead": "Securite, experience et documents juridiques — hors de la page d'accueil pour des achats plus rapides.",
      "settingsHub.securityH": "Vue d'ensemble de la securite",
      "settingsHub.modeGuided": "Guide (IA + astuces)",
      "settingsHub.modeSimple": "Simple (interface minimale)",
      "settingsHub.modePro": "Pro (controle complet marketplace)",
      "accountPassport.paymentsNote": "Le paiement checkout passe par Stripe lorsque le serveur est configure.",
      "search.placeholder": "Rechercher en Europe, Afrique, Asie..."
    },
    pt: {
      "marketFit.title": "Feito para estudantes, familias e empresas em crescimento",
      "sellerHub.kicker": "Para vendedores e empresas",
      "sellerHub.title": "Venda em 3 passos simples — depois use as ferramentas abaixo",
      "sellerHub.intro": "Nesta pagina voce encontra marketing, IA de crescimento e anuncios. Sinais internos e politicas ficam aqui para manter a home de compras limpa.",
      "settingsHub.title": "Configuracoes e documentos legais",
      "settingsHub.lead": "Seguranca, experiencia e documentos legais — fora da pagina inicial para manter compras rapidas.",
      "settingsHub.securityH": "Visao geral de seguranca",
      "settingsHub.modeGuided": "Guiado (IA + dicas)",
      "settingsHub.modeSimple": "Simples (interface minima)",
      "settingsHub.modePro": "Pro (controle total do marketplace)",
      "accountPassport.paymentsNote": "O checkout usa Stripe quando o servidor esta configurado.",
      "search.placeholder": "Buscar na Europa, Africa, Asia..."
    },
    ar: {
      "marketFit.title": "مصمم للطلاب والعائلات والشركات النامية",
      "sellerHub.kicker": "للبائعين والشركات",
      "sellerHub.title": "بع في 3 خطوات سهلة ثم استخدم الادوات بالاسفل",
      "sellerHub.intro": "في هذه الصفحة ستجد التسويق وادوات النمو بالذكاء الاصطناعي والاعلانات. تبقى الاشارات الداخلية والسياسات هنا حتى تبقى صفحة التسوق واضحة.",
      "settingsHub.title": "الاعدادات والوثائق القانونية",
      "settingsHub.lead": "الامان والتجربة والوثائق القانونية بعيدا عن الصفحة الرئيسية للحفاظ على سرعة التسوق.",
      "settingsHub.securityH": "نظرة عامة على الامان",
      "settingsHub.modeGuided": "موجه (ذكاء اصطناعي + تلميحات)",
      "settingsHub.modeSimple": "بسيط (واجهة خفيفة)",
      "settingsHub.modePro": "احترافي (تحكم كامل في السوق)",
      "accountPassport.paymentsNote": "يتم الدفع عبر Stripe عند تجهيز الخادم.",
      "search.placeholder": "ابحث في اوروبا وافريقيا واسيا..."
    },
    zh: {
      "marketFit.title": "为学生、家庭和成长型企业打造",
      "sellerHub.kicker": "面向卖家和企业",
      "sellerHub.title": "3个简单步骤开始销售，然后使用下方工具",
      "sellerHub.intro": "本页包含营销、增长AI和广告。内部信号与规则放在这里，避免首页购物体验过于复杂。",
      "settingsHub.title": "设置与法律",
      "settingsHub.lead": "安全、体验和法律文件集中在此，首页购物保持轻快。",
      "settingsHub.securityH": "安全概览",
      "settingsHub.modeGuided": "引导模式（AI + 提示）",
      "settingsHub.modeSimple": "简洁模式（最小界面）",
      "settingsHub.modePro": "专业模式（完整市场控制）",
      "accountPassport.paymentsNote": "服务器配置完成后，结账通过 Stripe 处理。",
      "search.placeholder": "搜索欧洲、非洲、亚洲..."
    },
    ko: {
      "marketFit.title": "학생, 가족, 성장 기업을 위한 설계",
      "sellerHub.kicker": "판매자 및 비즈니스를 위한 공간",
      "sellerHub.title": "3단계로 판매 시작 후 아래 도구를 사용하세요",
      "sellerHub.intro": "이 페이지에서 마케팅, 성장 AI, 광고를 제공합니다. 내부 신호와 정책은 여기서 관리해 메인 쇼핑 화면을 단순하게 유지합니다.",
      "settingsHub.title": "설정 및 법적 문서",
      "settingsHub.lead": "보안, 사용자 경험, 법적 문서를 이곳에 모아 메인 쇼핑 화면은 빠르게 유지합니다.",
      "settingsHub.securityH": "보안 개요",
      "settingsHub.modeGuided": "가이드 모드 (AI + 도움말)",
      "settingsHub.modeSimple": "심플 모드 (최소 인터페이스)",
      "settingsHub.modePro": "프로 모드 (전체 마켓 제어)",
      "accountPassport.paymentsNote": "서버가 설정되면 결제는 Stripe로 처리됩니다.",
      "search.placeholder": "유럽, 아프리카, 아시아 검색..."
    },
    hi: {
      "marketFit.title": "छात्रों, परिवारों और बढ़ते व्यवसायों के लिए बनाया गया",
      "sellerHub.kicker": "विक्रेताओं और व्यवसायों के लिए",
      "sellerHub.title": "3 आसान चरणों में बेचें, फिर नीचे के टूल्स उपयोग करें",
      "sellerHub.intro": "इस पेज पर मार्केटिंग, ग्रोथ AI और विज्ञापन मिलते हैं। आंतरिक संकेत और नीतियां यहीं रखी गई हैं ताकि मुख्य शॉपिंग पेज साफ रहे।",
      "settingsHub.title": "सेटिंग्स और कानूनी दस्तावेज",
      "settingsHub.lead": "सुरक्षा, अनुभव और कानूनी दस्तावेज यहां रखे गए हैं ताकि होमपेज पर खरीदारी तेज रहे।",
      "settingsHub.securityH": "सुरक्षा अवलोकन",
      "settingsHub.modeGuided": "गाइडेड (AI + टिप्स)",
      "settingsHub.modeSimple": "सिंपल (न्यूनतम इंटरफेस)",
      "settingsHub.modePro": "प्रो (पूरा मार्केटप्लेस नियंत्रण)",
      "accountPassport.paymentsNote": "सर्वर कॉन्फ़िगर होने पर चेकआउट Stripe से होता है।",
      "search.placeholder": "यूरोप, अफ्रीका, एशिया खोजें..."
    },
    sw: {
      "marketFit.title": "Imejengwa kwa wanafunzi, familia, na biashara zinazokua",
      "sellerHub.kicker": "Kwa wauzaji na biashara",
      "sellerHub.title": "Uza kwa hatua 3 rahisi — kisha tumia zana zilizo hapa chini",
      "sellerHub.intro": "Katika ukurasa huu utapata uuzaji, AI ya ukuaji, na matangazo. Ishara za ndani na sera zipo hapa ili ukurasa mkuu wa ununuzi ubaki mwepesi.",
      "settingsHub.title": "Mipangilio na sheria",
      "settingsHub.lead": "Usalama, uzoefu, na nyaraka za kisheria — zimewekwa hapa ili ununuzi ubaki wa haraka.",
      "settingsHub.securityH": "Muhtasari wa usalama",
      "accountPassport.paymentsNote": "Malipo ya checkout hutumia Stripe pale seva inapokuwa imewekwa."
    },
    zu: {
      "marketFit.title": "Kwakhelwe abafundi, imindeni, namabhizinisi akhulayo",
      "marketFit.lead": "I-VibeCart yakhelwe ukuhweba phakathi kwamazwe ngokushesha nangokwethembeka phakathi kwe-Afrika neYurophu.",
      "buyerAdv.title": "Kungani ukuthenga ku-VibeCart kuba lula",
      "buyerAdv.lead": "Kwakhelwe isivinini: indawo eyodwa ye-checkout ephephile, ukulandelela ukulethwa, nemigomo ecacile.",
      "buyerAdv.li1": "I-checkout esheshayo enokuvikelwa komthengi nokuhlolwa kokukhwabanisa kuma-oda anobungozi.",
      "buyerAdv.li2": "Ukulandelela ama-oda ngesikhathi sangempela kanye newindi lokubuyisa noma ukwenqaba njengoba kubonakala ku-akhawunti yakho.",
      "buyerAdv.li3": "Umsizi we-AI uhlela uhlu lwemikhiqizo kuleli khasi ngokuya ngesabelomali nesigaba; ulokhu unolawulo.",
      "sellerHub.kicker": "Kwabathengisi namabhizinisi",
      "sellerHub.title": "Thengisa ngezinyathelo ezi-3 ezilula — bese usebenzisa amathuluzi angezansi",
      "sellerHub.intro": "Lapha uthola ukumaketha, i-AI yokukhulisa, nezikhangiso. Imithetho yangaphakathi ibekwe lapha ukuze ikhasi lokuthenga lihlale lihlanzekile.",
      "settingsHub.title": "Izilungiselelo nomthetho",
      "settingsHub.lead": "Ukuvikeleka, ulwazi lomsebenzisi, namadokhumenti asemthethweni kugcinwa lapha ukuze ukuthenga kusheshe.",
      "settingsHub.securityH": "Uhlolojikelele lokuphepha",
      "settingsHub.securityLead": "Ukuvikeleka okufanayo kusebenza kuyo yonke iwebhusayithi; imininingwane iboniswa lapha ukuze i-storefront ihlale ilula.",
      "settingsHub.sec1": "I-admin yomnikazi kuphela ene-multi-factor authentication kanye ne-hardware key support.",
      "settingsHub.sec2": "Ukutholwa kokukhwabanisa okuhambisana nezwe kanye nokuqapha ukuthengiselana.",
      "settingsHub.sec3": "Ukuvikelwa komthengi nomthengisi ngokuhlola okungajwayelekile, ukuqinisekisa ubunikazi, nokubuyekezwa kwama-oda anobungozi.",
      "settingsHub.sec4": "I-escalation kanye ne-dispute workflow enokukhiya i-akhawunti okwesikhashana uma kusolwa ukukhwabanisa.",
      "settingsHub.sec5": "Izinkokhelo zidluliselwa kuphela kubahlinzeki abavunyiwe abane-encryption, 3D Secure, anti-fraud scoring, kanye ne-tokenized transactions.",
      "settingsHub.sec6": "Ukulethwa kusebenzisa ozakwethu bezokuthutha abathembekile abane-tracking, delivery verification, kanye ne-route risk controls.",
      "settingsHub.sec7": "I-traffic ebethelwe (HTTPS), ama-cookies avikelekile, kanye ne-strict security headers.",
      "settingsHub.sec8": "Role-based permissions kanye ne-immutable audit logs.",
      "settingsHub.sec9": "I-marketplace esemthethweni kuphela enokumoderetha, reporting controls, kanye nokususwa okusheshayo kokuqukethwe okungekho emthethweni.",
      "accountPassport.paymentsNote": "Ukukhokha kwe-checkout kusebenzisa i-Stripe uma iseva isethiwe.",
      "search.placeholder": "Sesha eYurophu, e-Afrika, e-Asia...",
      "bridgeTruth.title": "Iqiniso leBridge (akukho ukunemba okungamanga)",
      "bridgeTruth.li1": "Ukulinganisa kwe-duty nentela lapha kuyimikhawulo, akusona isinqumo se-customs; inani lokugcina lincike ekuhlukanisweni nasemthethweni wendawo.",
      "bridgeTruth.li2": "Ukulethwa okulandelwayo emizileni eminingi ye-EU kuya e-Afrika kuvamise ukuba phakathi kwezinsuku ezi-7 kuya kwezi-21; izindawo ezikude zingathatha isikhathi eside.",
      "bridgeTruth.li3": "Ama-oda angacacile noma anobungozi aya ku-human review; i-automation iveza kuphela izimpawu.",
      "laneNote.eyebrow": "Inothi lendlela",
      "laneNote.sellerTipLabel": "Ithiphu yomthengisi",
      "laneNote.buyerTipLabel": "Ithiphu yomthengi",
      "transparency.title": "Isifinyezo sokusobala",
      "transparency.meta": "Izibalo zivuselelwa uma ulayisha ikhasi. Imikhawulo ijwayelekile; amanani aqondile avamise ukungatholakali ekuhwebeni kwamazwe."
    },
    sn: {
      "marketFit.title": "Yakagadzirirwa vadzidzi, mhuri, nemabhizimisi ari kukura",
      "marketFit.lead": "VibeCart yakagadzirirwa kutengeserana kwemiganhu nekukurumidza uye kwakavimbika pakati pemisika yeAfrica neEurope.",
      "buyerAdv.title": "Nei kutenga paVibeCart kuri nyore",
      "buyerAdv.lead": "Yakagadzirirwa kukurumidza: nzvimbo imwe chete yecheckout yakachengeteka, kutevera kuendesa, uye mitemo yakajeka.",
      "buyerAdv.li1": "Checkout yekukurumidza ine chengetedzo yemutengi uye ongororo yekubiridzira pamaodha ane njodzi.",
      "buyerAdv.li2": "Kutevera odha munguva chaiyo uye hwindo rekudzorera kana kuramba sezvinoonekwa paaccount yako.",
      "buyerAdv.li3": "Mubatsiri weAI anoisa maristingi pachikamu chino maererano nebajeti nechikamu; iwe unoramba uine kutonga.",
      "sellerHub.kicker": "Kune vatengesi nemabhizimisi",
      "sellerHub.title": "Tengesa mumatanho matatu ari nyore wobva washandisa maturusi ari pasi",
      "sellerHub.intro": "Pano pane kushambadzira, AI yekukura, uye ads. Mitemo yemukati yakarongwa pano kuti peji rekutenga rigare rakachena.",
      "settingsHub.title": "Zvirongwa nemagwaro emutemo",
      "settingsHub.lead": "Kuchengetedzeka, chiitiko chemushandisi, nemagwaro emutemo zviri pano kuti kutenga kukurumidze.",
      "settingsHub.securityH": "Pfupiso yekuchengetedzeka",
      "settingsHub.securityLead": "Dziviriro imwe chete inoshanda papuratifomu yose; tsananguro yakadzama iri pano kuitira kuti storefront irambe yakareruka.",
      "settingsHub.sec1": "Admin yevanotenderwa chete ine multi-factor authentication uye hardware key support.",
      "settingsHub.sec2": "Kuonekwa kwekubiridzira zvinoenderana nenyika uye kutariswa kwekutengeserana.",
      "settingsHub.sec3": "Kudzivirirwa kwemutengi nemutengesi nekutarisa zviitiko zvinofungidzirwa, identity verification, uye kuongorora maodha ane njodzi.",
      "settingsHub.sec4": "Escalation uye dispute workflow ine temporary account lock kana kubiridzira kuchifungidzirwa.",
      "settingsHub.sec5": "Mari inofambiswa chete kuburikidza nevanopa vakavimbika vane encryption, 3D Secure, anti-fraud scoring, uye tokenized transactions.",
      "settingsHub.sec6": "Kuendesa kunoshandisa logistics partners vakavimbika vane tracking, delivery verification, uye route risk controls.",
      "settingsHub.sec7": "Traffic yakavharidzirwa (HTTPS), secure cookies, uye strict security headers.",
      "settingsHub.sec8": "Role-based permissions uye immutable audit logs.",
      "settingsHub.sec9": "Marketplace inobvumira zviri pamutemo chete, ine moderation, reporting controls, uye kubviswa kwecontent isiri pamutemo.",
      "accountPassport.paymentsNote": "Checkout inoshandisa Stripe kana server yagadziriswa.",
      "search.placeholder": "Tsvaga muEurope, Africa, Asia...",
      "bridgeTruth.title": "Chokwadi cheBridge (hapana kunyepa kwenhamba)",
      "bridgeTruth.li1": "Fungidziro dze duty nemutero pano imabhendi, kwete customs rulings; mari yekupedzisira inoenderana neclassification nemutemo wenyika.",
      "bridgeTruth.li2": "Kuendesa kunotevedzwa panzira zhinji dzeEU kuenda kuAfrica kunowanzova mazuva 7 kusvika 21; nzvimbo dziri kure dzinogona kutora nguva yakareba.",
      "bridgeTruth.li3": "Maodha asina kujeka kana ane njodzi anoenda kuhuman review; automation inongoratidza zviratidzo.",
      "laneNote.eyebrow": "Chiziviso chenjira",
      "laneNote.sellerTipLabel": "Zano remutengesi",
      "laneNote.buyerTipLabel": "Zano remutengi",
      "transparency.title": "Pfupiso yekuvhurika",
      "transparency.meta": "Nhamba dzinovandudzwa paunorodha peji. Mabhendi akajairika; manhamba chaiwo anowanzoshaikwa mukutengeserana kwemiganhu."
    },
    nd: {
      "marketFit.title": "Kwenzelwe abafundi, imuli, lamabhizimusi akhulayo",
      "marketFit.lead": "IVibeCart yenzelwe ukuthenga lokuthengisa phakathi kwamazwe ngokuthembeka phakathi kweAfrica leEurope.",
      "buyerAdv.title": "Kungani ukuthenga kuVibeCart kulula",
      "buyerAdv.lead": "Kwakhiwe ngesivinini: indawo eyodwa ye-checkout ephephileyo, ukulandelela ukulethwa, lemigomo ecacileyo.",
      "buyerAdv.li1": "I-checkout esheshayo elokuvikela umthengi lokuhlolwa kokukhwabanisa kuma-oda ayingozi.",
      "buyerAdv.li2": "Ukulandelela ama-oda ngesikhathi sangempela kanye lewindi lokubuyisa loba ukwala njengokubonakala ku-akhawunti yakho.",
      "buyerAdv.li3": "Umsizi we-AI uhlela amalisitini kuleli khasi ngokuya ngebhajethi lesigaba; wena usala ulokulawula.",
      "sellerHub.kicker": "Kwabathengisi lamabhizimusi",
      "sellerHub.title": "Thengisa ngezinyathelo ezintathu ezilula bese usebenzisa amathuluzi angezansi",
      "sellerHub.intro": "Lapha uthola ukumaketha, AI yokukhulisa, lama-ads. Imithetho yangaphakathi ibekwe lapha ukuze ikhasi lokuthenga lihlale licacile.",
      "settingsHub.title": "Izilungiselelo lamaphepha omthetho",
      "settingsHub.lead": "Ukuvikeleka, okuhlangenwe ngumsebenzisi, lamaphepha omthetho kugcinwa lapha ukuze ukuthenga kusheshe.",
      "settingsHub.securityH": "Umbono wokuphepha",
      "settingsHub.securityLead": "Ukuvikeleka okufanayo kusebenza kusayithi lonke; imininingwane ibekwe lapha ukuze isitolo sihlale silula.",
      "settingsHub.sec1": "I-admin yomnikazi kuphela ile-multi-factor authentication kanye le-hardware key support.",
      "settingsHub.sec2": "Ukutholwa kokukhwabanisa okuhambelana lelizwe lokubhekwa kwemisebenzi yokuthenga.",
      "settingsHub.sec3": "Ukuvikelwa komthengi lomthengisi ngokuhlola imisebenzi esolisayo, identity verification, kanye lokubuyekezwa kwama-oda ayingozi.",
      "settingsHub.sec4": "I-escalation le-dispute workflow elokutshiywa kwe-akhawunti okwesikhatshana nxa kusolwa ukukhwabanisa.",
      "settingsHub.sec5": "Imali idlula kuphela kubanikezeli abathembekileyo abale-encryption, 3D Secure, anti-fraud scoring, kanye le-tokenized transactions.",
      "settingsHub.sec6": "Ukulethwa kusebenzisa ama-logistics partners athembekileyo ale-tracking, delivery verification, kanye le-route risk controls.",
      "settingsHub.sec7": "I-traffic ebhalwe ngekhodi (HTTPS), secure cookies, kanye le-strict security headers.",
      "settingsHub.sec8": "Role-based permissions kanye le-immutable audit logs.",
      "settingsHub.sec9": "I-marketplace esemthethweni kuphela enokumoderetha, reporting controls, kanye lokususwa kwezinto ezingekho emthethweni.",
      "accountPassport.paymentsNote": "I-checkout isebenzisa i-Stripe nxa iseva isilungisiwe.",
      "search.placeholder": "Dinga eYurophu, Afrika, Asia...",
      "bridgeTruth.title": "Iqiniso leBridge (akukho manani amanga)",
      "bridgeTruth.li1": "Ukuqagela kwe-duty lentela lapha kungamabhendi, akusizo izinqumo ze-customs; inani lokugcina lincike ekuhlukanisweni lomthetho wakuleyo ndawo.",
      "bridgeTruth.li2": "Ukulethwa okulandelwayo emizileni eminengi yeEU kuya eAfrica kuvamise ukuba phakathi kwamalanga angu-7 kusiya ku-21; izindawo ezikhatshana zingathatha isikhathi eside.",
      "bridgeTruth.li3": "Ama-oda angacacanga loba ayingozi aya kuhuman review; i-automation ikhomba kuphela.",
      "laneNote.eyebrow": "Inothi yomzila",
      "laneNote.sellerTipLabel": "Icebo lomthengisi",
      "laneNote.buyerTipLabel": "Icebo lomthengi",
      "transparency.title": "Isifinyezo sokubonakala",
      "transparency.meta": "Izibalo ziyavuselelwa nxa ulayisha ikhasi. Amabhendi ajwayelekile; izinombolo eziqondileyo zimbalwa ekuthengiseni kwamazwe."
    },
    xh: {
      "marketFit.title": "Yenzelwe abafundi, iintsapho, namashishini akhulayo",
      "marketFit.lead": "I-VibeCart yenzelwe urhwebo lwamazwe ngokukhawuleza nangokuthembeka phakathi kwe-Afrika neYurophu.",
      "buyerAdv.title": "Kutheni ukuthenga kwi-VibeCart kulula",
      "buyerAdv.lead": "Yakhelwe isantya: indawo enye ye-checkout ekhuselekileyo, ukulandelwa kokuhanjiswa, nemigaqo ecacileyo.",
      "buyerAdv.li1": "I-checkout ekhawulezayo enokhuseleko lomthengi kunye nokuhlolwa kobuqhetseba kwii-odolo ezinemingcipheko.",
      "buyerAdv.li2": "Ukulandelwa kwee-odolo ngexesha langempela kunye nefestile yokubuyisa okanye ukwala njengoko kubonakala kwiakhawunti yakho.",
      "buyerAdv.li3": "Umncedisi we-AI ubeka uluhlu lwezinto kweli phepha ngokwebhajethi nodidi; ulawulo lusasezandleni zakho.",
      "sellerHub.kicker": "Yabathengisi namashishini",
      "sellerHub.title": "Thengisa ngamanyathelo amathathu alula, emva koko usebenzise izixhobo ezingezantsi",
      "sellerHub.intro": "Apha ufumana intengiso, i-AI yokukhula, kunye neentengiso. Imigaqo yangaphakathi ibekwe apha ukuze iphepha lokuthenga lihlale licocekile.",
      "settingsHub.title": "Iisetingi namaxwebhu asemthethweni",
      "settingsHub.lead": "Ukhuseleko, amava omsebenzisi, kunye namaxwebhu asemthethweni agcinwe apha ukuze ukuthenga kuhlale kukhawuleza.",
      "settingsHub.securityH": "Isishwankathelo sokhuseleko",
      "settingsHub.securityLead": "Ukhuseleko olufanayo lusebenza kuyo yonke isayithi; iinkcukacha ziboniswa apha ukuze i-storefront ihlale ilula.",
      "settingsHub.sec1": "I-admin yomnini kuphela enee-multi-factor authentication kunye nenkxaso ye-hardware key.",
      "settingsHub.sec2": "Ukufumanisa ubuqhetseba obuhambelana nelizwe kunye nokubeka iliso kutshintshiselwano.",
      "settingsHub.sec3": "Ukhuseleko lomthengi nomthengisi ngokujonga izinto ezikrokrelwayo, ukuqinisekiswa kobuwena, kunye nokuphononongwa kwee-odolo ezisemngciphekweni.",
      "settingsHub.sec4": "I-escalation kunye ne-dispute workflow enokutshixa iakhawunti okwethutyana xa kusolakala ubuqhetseba.",
      "settingsHub.sec5": "Iintlawulo zidlula kuphela kubaboneleli abathembekileyo abane-encryption, 3D Secure, anti-fraud scoring, kunye ne-tokenized transactions.",
      "settingsHub.sec6": "Ukuhanjiswa kusebenzisa amaqabane ezothutho athembekileyo ane-tracking, delivery verification, kunye ne-route risk controls.",
      "settingsHub.sec7": "I-traffic efihliweyo (HTTPS), iicookies ezikhuselekileyo, kunye ne-strict security headers.",
      "settingsHub.sec8": "Role-based permissions kunye ne-immutable audit logs.",
      "settingsHub.sec9": "I-marketplace esemthethweni kuphela enokumodareyitha, reporting controls, kunye nokususwa ngokukhawuleza komxholo ongekho semthethweni.",
      "accountPassport.paymentsNote": "I-checkout isebenzisa i-Stripe xa iseva icwangcisiwe.",
      "search.placeholder": "Khangela eYurophu, eAfrika, eAsia...",
      "bridgeTruth.title": "Inyaniso yeBridge (akukho manani obuxoki)",
      "bridgeTruth.li1": "Uqikelelo lwe-duty nerhafu apha luluhlu lwamabanga, hayi isigqibo se-customs; intlawulo yokugqibela ixhomekeke kuhlelo nakumthetho wasekuhlaleni.",
      "bridgeTruth.li2": "Ukuhanjiswa okulandelwayo kwiindlela ezininzi ze-EU ukuya e-Afrika kuhlala phakathi kweentsuku ezi-7 ukuya kwezi-21; iindawo ezikude zingathatha ixesha elide.",
      "bridgeTruth.li3": "Ii-odolo ezingacacanga okanye ezisemngciphekweni ziya kuhuman review; i-automation ibonisa kuphela imiqondiso.",
      "laneNote.eyebrow": "Inqaku lomzila",
      "laneNote.sellerTipLabel": "Ingcebiso yomthengisi",
      "laneNote.buyerTipLabel": "Ingcebiso yomthengi",
      "transparency.title": "Isishwankathelo sokucaca",
      "transparency.meta": "Amanani ayahlaziywa xa ulayisha iphepha. Uluhlu lwamabanga luqhelekile; amanani achanekileyo ahlala enqabile kurhwebo lwamazwe."
    }
  };
  Object.keys(CURATED_SECTION_OVERRIDES).forEach((code) => {
    if (!STRINGS[code]) {
      STRINGS[code] = {};
    }
    Object.assign(STRINGS[code], CURATED_SECTION_OVERRIDES[code]);
  });

  const FALLBACK_CHAIN = {
    zu: ["en"],
    sn: ["en"],
    nd: ["en"],
    xh: ["en"],
    lg: ["sw", "en"],
    pcm: ["en"],
    tn: ["en"],
    af: ["en"]
  };

  const SUGGEST_HOOK_FALLBACK = "Switch key labels to a closer language?";
  const EN_TEXT_TO_KEY = {};
  Object.keys(STRINGS.en || {}).forEach((key) => {
    const val = STRINGS.en[key];
    if (typeof val !== "string") {
      return;
    }
    const norm = val.trim();
    if (!norm) {
      return;
    }
    if (!EN_TEXT_TO_KEY[norm]) {
      EN_TEXT_TO_KEY[norm] = key;
    }
  });

  // Broader locale inheritance so every selector language gets high coverage
  // before falling back to English.
  const DONOR_LOCALE = {
    zu: ["en"],
    sn: ["en"],
    nd: ["en"],
    xh: ["en"],
    lg: ["sw", "en"],
    tn: ["en"],
    af: ["en"],
    pcm: ["en"],
    pl: ["en"],
    fr: ["en"],
    pt: ["en"],
    ar: ["en"],
    zh: ["en"],
    ko: ["en"],
    hi: ["en"]
  };
  Object.keys(STRINGS).forEach((code) => {
    if (code === "en") {
      return;
    }
    const target = STRINGS[code];
    if (!target) {
      return;
    }
    const donors = DONOR_LOCALE[code] || ["en"];
    donors.forEach((donorCode) => {
      const donor = STRINGS[pick(donorCode)];
      if (!donor) {
        return;
      }
      Object.keys(donor).forEach((k) => {
        if (target[k] == null || target[k] === "") {
          target[k] = donor[k];
        }
      });
    });
  });

  // Broad lexical fallback for untagged UI text.
  const LEXICAL = {
    sw: {
      categories: "makundi",
      category: "kundi",
      regional: "kikanda",
      shops: "maduka",
      shop: "duka",
      health: "afya",
      coach: "kocha",
      account: "akaunti",
      rewards: "zawadi",
      insurance: "bima",
      settings: "mipangilio",
      seller: "muuzaji",
      boost: "ongeza",
      start: "anza",
      selling: "kuuza",
      discover: "gundua",
      buy: "nunua",
      fast: "haraka",
      bridge: "daraja",
      trade: "biashara",
      language: "lugha",
      secure: "salama",
      checkout: "malipo",
      verified: "imehakikiwa",
      delivery: "uletezaji",
      tracking: "ufuatiliaji",
      routine: "ratiba",
      routines: "ratiba",
      daily: "kila siku",
      payment: "malipo",
      package: "kifurushi",
      packages: "vifurushi",
      plan: "mpango",
      plans: "mipango",
      continue: "endelea",
      profile: "wasifu",
      home: "nyumbani",
      search: "tafuta",
      hot: "moto",
      picks: "chaguo",
      buyer: "mnunuzi",
      buyers: "wanunuzi",
      seller: "muuzaji",
      sellers: "wauzaji",
      communication: "mawasiliano",
      order: "agizo",
      orders: "maagizo",
      tracking: "ufuatiliaji",
      delivery: "uwasilishaji",
      deliveries: "uwasilishaji",
      update: "sasisho",
      updates: "masasisho",
      service: "huduma",
      services: "huduma",
      booking: "uhifadhi",
      bookings: "uhifadhi",
      platform: "jukwaa",
      student: "mwanafunzi",
      students: "wanafunzi",
      family: "familia",
      families: "familia",
      support: "msaada",
      insurance: "bima",
      health: "afya",
      fitness: "mazoezi",
      coach: "kocha",
      weight: "uzito",
      loss: "punguza",
      gain: "ongeza",
      muscle: "misuli",
      goal: "lengo",
      goals: "malengo",
      save: "hifadhi",
      profile: "wasifu",
      submit: "wasilisha",
      refresh: "onyesha upya",
      show: "onyesha",
      available: "inapatikana",
      slots: "nafasi",
      legal: "kisheria",
      policy: "sera",
      policies: "sera",
      terms: "masharti",
      privacy: "faragha",
      secure: "salama",
      security: "usalama",
      overview: "muhtasari",
      trusted: "inayoaminika",
      verified: "imehakikiwa",
      mode: "hali",
      guided: "elekezwa",
      simple: "rahisi",
      pro: "kitaalamu",
      filter: "chuja",
      destination: "mwisho",
      risk: "hatari",
      disclaimer: "kanusho",
      understand: "naelewa",
      accept: "nakubali",
      all: "zote",
      any: "yoyote",
      electronics: "elektroniki",
      fashion: "mitindo",
      books: "vitabu",
      gaming: "michezo",
      sponsored: "iliyofadhiliwa",
      brands: "chapa",
      ads: "matangazo",
      marketing: "masoko",
      tools: "zana",
      growth: "ukuaji",
      message: "ujumbe",
      messages: "ujumbe",
      send: "tuma",
      country: "nchi",
      language: "lugha",
      choose: "chagua",
      account: "akaunti",
      login: "ingia",
      sign: "saini",
      create: "unda",
      new: "mpya",
      already: "tayari",
      registered: "imesajiliwa",
      email: "barua pepe",
      password: "nenosiri",
      name: "jina",
      point: "pointi",
      points: "pointi",
      rewards: "zawadi",
      status: "hali",
      open: "fungua",
      close: "funga",
      next: "ifuatayo",
      now: "sasa",
      start: "anza",
      continue: "endelea",
      global: "kimataifa",
      local: "eneo",
      trade: "biashara",
      bridge: "daraja"
    },
    pl: {
      categories: "kategorie", shops: "sklepy", health: "zdrowie", coach: "trener",
      account: "konto", rewards: "nagrody", insurance: "ubezpieczenie", settings: "ustawienia",
      seller: "sprzedawca", start: "zacznij", selling: "sprzedawać", search: "szukaj",
      payment: "płatność", package: "pakiet", plan: "plan", checkout: "kasa",
      secure: "bezpieczny", continue: "kontynuuj", tracking: "śledzenie"
    },
    fr: {
      categories: "catégories", shops: "boutiques", health: "santé", coach: "coach",
      account: "compte", rewards: "récompenses", insurance: "assurance", settings: "paramètres",
      seller: "vendeur", start: "commencer", selling: "vendre", search: "rechercher",
      payment: "paiement", package: "forfait", plan: "plan", checkout: "paiement",
      secure: "sécurisé", continue: "continuer", tracking: "suivi"
    },
    pt: {
      categories: "categorias", shops: "lojas", health: "saúde", coach: "coach",
      account: "conta", rewards: "recompensas", insurance: "seguro", settings: "configurações",
      seller: "vendedor", start: "começar", selling: "vender", search: "buscar",
      payment: "pagamento", package: "pacote", plan: "plano", checkout: "pagamento",
      secure: "seguro", continue: "continuar", tracking: "rastreamento"
    },
    ar: {
      categories: "الفئات", shops: "متاجر", health: "صحة", coach: "مدرب",
      account: "حساب", rewards: "مكافآت", insurance: "تأمين", settings: "إعدادات",
      seller: "بائع", start: "ابدأ", selling: "بيع", search: "بحث",
      payment: "دفع", package: "باقة", plan: "خطة", checkout: "الدفع",
      secure: "آمن", continue: "متابعة", tracking: "تتبع"
    },
    zh: {
      categories: "分类", shops: "店铺", health: "健康", coach: "教练",
      account: "账户", rewards: "奖励", insurance: "保险", settings: "设置",
      seller: "卖家", start: "开始", selling: "销售", search: "搜索",
      payment: "支付", package: "套餐", plan: "计划", checkout: "结账",
      secure: "安全", continue: "继续", tracking: "跟踪"
    },
    ko: {
      categories: "카테고리", shops: "상점", health: "건강", coach: "코치",
      account: "계정", rewards: "리워드", insurance: "보험", settings: "설정",
      seller: "판매자", start: "시작", selling: "판매", search: "검색",
      payment: "결제", package: "패키지", plan: "플랜", checkout: "체크아웃",
      secure: "보안", continue: "계속", tracking: "추적"
    },
    hi: {
      categories: "श्रेणियाँ", shops: "दुकानें", health: "स्वास्थ्य", coach: "कोच",
      account: "खाता", rewards: "इनाम", insurance: "बीमा", settings: "सेटिंग्स",
      seller: "विक्रेता", start: "शुरू", selling: "बेचना", search: "खोज",
      payment: "भुगतान", package: "पैकेज", plan: "योजना", checkout: "चेकआउट",
      secure: "सुरक्षित", continue: "जारी", tracking: "ट्रैकिंग"
    },
    zu: {},
    sn: {},
    nd: {},
    xh: {},
    lg: {},
    tn: {},
    af: {},
    pcm: {}
  };
  LEXICAL.zu = {};
  LEXICAL.sn = {};
  LEXICAL.nd = {};
  LEXICAL.xh = {};
  LEXICAL.lg = LEXICAL.sw;
  LEXICAL.tn = LEXICAL.sw;
  LEXICAL.af = LEXICAL.en || LEXICAL.sw;
  LEXICAL.pcm = LEXICAL.en || LEXICAL.sw;

  function pick(lang) {
    const raw = String(lang || "en").trim().toLowerCase();
    if (raw === "other") {
      return "en";
    }
    if (STRINGS[raw]) {
      return raw;
    }
    const base = raw.split("-")[0];
    if (STRINGS[base]) {
      return base;
    }
    if (base === "zh" || raw.startsWith("zh-")) {
      return "zh";
    }
    if (base === "ko" || raw.startsWith("ko-")) {
      return "ko";
    }
    if (base === "hi" || raw.startsWith("hi-")) {
      return "hi";
    }
    if (base === "sn" || raw.startsWith("sn-")) {
      return "sn";
    }
    if (base === "nd" || raw.startsWith("nd-")) {
      return "nd";
    }
    if (base === "xh" || raw.startsWith("xh-")) {
      return "xh";
    }
    if (base === "zu" || raw.startsWith("zu-")) {
      return "zu";
    }
    if (base === "pcm" || raw.startsWith("pcm")) {
      return "pcm";
    }
    if (base === "lg" || raw.startsWith("lg-")) {
      return "lg";
    }
    if (base === "tn" || raw.startsWith("tn-")) {
      return "tn";
    }
    if (base === "af" || raw.startsWith("af-")) {
      return "af";
    }
    return "en";
  }

  function t(lang, key) {
    const L = pick(lang);
    const chain = [L].concat(FALLBACK_CHAIN[L] || []).concat(["en"]);
    for (let i = 0; i < chain.length; i += 1) {
      const code = pick(chain[i]);
      const pack = STRINGS[code];
      if (pack && pack[key] != null) {
        return pack[key];
      }
    }
    return "";
  }

  function lexicalTranslate(text, lang) {
    const L = pick(lang);
    if (L === "en") {
      return text;
    }
    const primary = LEXICAL[L];
    const fallbacks = (FALLBACK_CHAIN[L] || []).map((x) => LEXICAL[pick(x)]).filter(Boolean);
    const dict = primary || fallbacks[0];
    if (!dict) {
      return text;
    }
    let changed = 0;
    let totalWords = 0;
    const out = String(text || "").replace(/[A-Za-z][A-Za-z'-]*/g, (word) => {
      totalWords += 1;
      const mapped = dict[word.toLowerCase()];
      if (!mapped) {
        return word;
      }
      changed += 1;
      return word[0] === word[0].toUpperCase()
        ? mapped.charAt(0).toUpperCase() + mapped.slice(1)
        : mapped;
    });
    if (changed === 0 || totalWords === 0) {
      return text;
    }
    // Prevent mixed-language sentences (few translated words + mostly English).
    const coverage = changed / totalWords;
    if (coverage < 0.45) {
      return text;
    }
    return out;
  }

  // Final safety net: exact phrase replacements for stubborn homepage lines.
  const FORCE_NATIVE_LINES = {
    sn: {
      "VibeCart is your fun cross-border marketplace with verified sellers, fast checkout, and vibe-first shopping.":
        "VibeCart musika unofadza wemiganhu une vatengesi vakasimbiswa, checkout inokurumidza, uye kutenga kuri nyore.",
      "For Students and Young Buyers": "Kune vadzidzi nevatengi vechidiki",
      "For Families and Mature Buyers": "Kune mhuri nevatengi vakura",
      "For Sellers and Service Providers": "Kune vatengesi nevapi vemasevhisi",
      "Popular Categories": "Mapoka anonyanya kufarirwa",
      "Regional shop folders": "Mafolda ezvitoro zvematunhu",
      "Live Marketplace": "Live Marketplace",
      "Sponsored Brands and Ads": "Sponsored Brands neAds",
      "What do you need?": "Uri kuda chii?",
      "Your max budget (EUR)": "Bhajeti yako yepamusoro (EUR)",
      "Preferred category": "Category yaunoda",
      "Order Tracking and Delivery Updates": "Kutevera maodha neDelivery Updates",
      "Beauty and Service Booking Platform": "Beauty neService Booking Platform",
      "Student Insurance and Well-Being Support": "Student Insurance neWell-Being Support",
      "Tax and Payout Transparency": "Kujeka kweMutero neKubhadhara",
      "Lane passport": "Pasipoti yenzira",
      "Signing up as": "Kusaina se",
      "Account controls": "Kutonga kweAkaunti",
      "Shop experience": "Chiitiko cheShop"
    },
    nd: {
      "VibeCart is your fun cross-border marketplace with verified sellers, fast checkout, and vibe-first shopping.":
        "IVibeCart yimakethe yokuwela imingcele enabathengisi abaqinisekisiweyo, checkout esheshayo, lokuthenga okulula.",
      "For Students and Young Buyers": "Kwabafundi labathengi abatsha",
      "For Families and Mature Buyers": "Kwemuli labathengi abavuthiweyo",
      "For Sellers and Service Providers": "Kwabathengisi labanikezeli bezinsiza",
      "Popular Categories": "Izigaba ezithandwayo",
      "Regional shop folders": "Amafolda ezitolo zendawo",
      "Live Marketplace": "Live Marketplace",
      "Sponsored Brands and Ads": "AmaBrand axhasiweyo lama-Ads",
      "What do you need?": "Udinga ini?",
      "Your max budget (EUR)": "Ibhajethi yakho ephezulu (EUR)",
      "Preferred category": "Isigaba osithandayo",
      "Order Tracking and Delivery Updates": "Ukulandelela ama-oda leDelivery Updates",
      "Beauty and Service Booking Platform": "Beauty leService Booking Platform",
      "Student Insurance and Well-Being Support": "Student Insurance leWell-Being Support",
      "Tax and Payout Transparency": "Ukucaca kweTax lePayout",
      "Lane passport": "Ipasipoti yendlela",
      "Signing up as": "Ukubhalisa njenge",
      "Account controls": "Ukulawula iAkhawunti",
      "Shop experience": "Isipiliyoni seShop"
    },
    xh: {
      "VibeCart is your fun cross-border marketplace with verified sellers, fast checkout, and vibe-first shopping.":
        "IVibeCart yimarike ewela imida enabathengisi abaqinisekisiweyo, checkout ekhawulezayo, nokuthenga okulula.",
      "For Students and Young Buyers": "Kubafundi nabathengi abatsha",
      "For Families and Mature Buyers": "Kwiintsapho nabathengi abavuthiweyo",
      "For Sellers and Service Providers": "Kubathengisi nababoneleli ngeenkonzo",
      "Popular Categories": "Iindidi ezithandwayo",
      "Regional shop folders": "Iifolda zeevenkile zommandla",
      "Live Marketplace": "Live Marketplace",
      "Sponsored Brands and Ads": "Iibrendi ezixhasiweyo neAds",
      "What do you need?": "Ufuna ntoni?",
      "Your max budget (EUR)": "Uhlahlo-lwabiwo lwakho oluphezulu (EUR)",
      "Preferred category": "Udidi oluthandayo",
      "Order Tracking and Delivery Updates": "Ukulandelela ii-oda neDelivery Updates",
      "Beauty and Service Booking Platform": "Beauty neService Booking Platform",
      "Student Insurance and Well-Being Support": "Student Insurance neWell-Being Support",
      "Tax and Payout Transparency": "Ukucaca kweTax nePayout",
      "Lane passport": "Ipasipoti yendlela",
      "Signing up as": "Ukubhalisa njenge",
      "Account controls": "Ulawulo lweAkhawunti",
      "Shop experience": "Amava eShop"
    },
    zu: {
      "VibeCart is your fun cross-border marketplace with verified sellers, fast checkout, and vibe-first shopping.":
        "IVibeCart yimakethe yokuwela imingcele enabathengisi abaqinisekisiwe, checkout esheshayo, nokuthenga okulula.",
      "For Students and Young Buyers": "Kwabafundi nabathengi abasebasha",
      "For Families and Mature Buyers": "Kwemindeni nabathengi abavuthiwe",
      "For Sellers and Service Providers": "Kwabathengisi nabahlinzeki bezinsiza",
      "Popular Categories": "Izigaba ezidumile",
      "Regional shop folders": "Amafolda ezitolo zesifunda",
      "Live Marketplace": "Live Marketplace",
      "Sponsored Brands and Ads": "AmaBrand axhasiwe nama-Ads",
      "What do you need?": "Udinga ini?",
      "Your max budget (EUR)": "Ibhajethi yakho ephezulu (EUR)",
      "Preferred category": "Isigaba osithandayo",
      "Order Tracking and Delivery Updates": "Ukulandelela ama-oda neDelivery Updates",
      "Beauty and Service Booking Platform": "Beauty neService Booking Platform",
      "Student Insurance and Well-Being Support": "Student Insurance neWell-Being Support",
      "Tax and Payout Transparency": "Ukucaca kweTax nePayout",
      "Lane passport": "Ipasipoti yendlela",
      "Signing up as": "Ukubhalisa njenge",
      "Account controls": "Ukulawula iAkhawunti",
      "Shop experience": "Isipiliyoni seShop"
    }
  };

  function apply(lang) {
    const L = pick(lang);
    const isEnglish = L === "en";
    document.documentElement.setAttribute("lang", BCP47[L] || BCP47.en);
    document.documentElement.dir = L === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) {
        return;
      }
      const english = t("en", key);
      const resolved = t(lang, key);
      let next = resolved;
      // If this key still resolves to English for a non-English locale,
      // run lexical fallback so body copy does not remain fully English.
      if (!isEnglish && resolved === english) {
        const lexical = lexicalTranslate(english, lang);
        if (lexical && lexical !== english) {
          next = lexical;
        }
      }
      if (next != null && next !== "") {
        el.textContent = next;
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) {
        return;
      }
      const english = t("en", key);
      const resolved = t(lang, key);
      let next = resolved;
      if (!isEnglish && resolved === english) {
        const lexical = lexicalTranslate(english, lang);
        if (lexical && lexical !== english) {
          next = lexical;
        }
      }
      if (next != null && next !== "") {
        el.setAttribute("placeholder", next);
      }
    });

    // Deep fallback pass: rewrite plain text nodes even inside nested markup.
    // This fixes sections that visually stayed English due to mixed DOM structure.
    if (document.body) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node && node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = String(parent.tagName || "").toLowerCase();
            if (tag === "script" || tag === "style" || tag === "noscript") {
              return NodeFilter.FILTER_REJECT;
            }
            const raw = String(node.nodeValue || "").trim();
            if (!raw) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      const touched = [];
      let n = walker.nextNode();
      while (n) {
        touched.push(n);
        n = walker.nextNode();
      }
      touched.forEach((node) => {
        const raw = String(node.nodeValue || "");
        const trimmed = raw.trim();
        if (!trimmed) return;
        const forcePack = FORCE_NATIVE_LINES[L] || null;
        if (forcePack && forcePack[trimmed]) {
          node.nodeValue = raw.replace(trimmed, forcePack[trimmed]);
          return;
        }
        const key = EN_TEXT_TO_KEY[trimmed];
        if (key) {
          const val = t(lang, key);
          if (val && val !== trimmed) {
            node.nodeValue = raw.replace(trimmed, val);
            return;
          }
        }
        const lexical = lexicalTranslate(trimmed, lang);
        if (lexical && lexical !== trimmed) {
          node.nodeValue = raw.replace(trimmed, lexical);
        }
      });
    }

    // Placeholder fallback for untagged inputs that still use English copies.
    document.querySelectorAll("input[placeholder],textarea[placeholder]").forEach((el) => {
      if (el.hasAttribute("data-i18n-placeholder")) {
        return;
      }
      const raw = String(el.getAttribute("placeholder") || "").trim();
      if (!raw) {
        return;
      }
      const key = EN_TEXT_TO_KEY[raw];
      if (key) {
        const val = t(lang, key);
        if (val && val !== raw) {
          el.setAttribute("placeholder", val);
          return;
        }
      }
      const lexical = lexicalTranslate(raw, lang);
      if (lexical !== raw) {
        el.setAttribute("placeholder", lexical);
      }
    });
  }

  function inferLocaleFromEnvironment() {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
    const list = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];

    for (let i = 0; i < list.length; i += 1) {
      const p = pick(list[i]);
      if (p && p !== "en") {
        return p;
      }
    }

    if (/(africa\/kampala)/.test(tz)) {
      return "lg";
    }
    if (/(africa\/(lagos|abuja))/i.test(tz)) {
      return "pcm";
    }
    if (/(africa\/gaborone)/.test(tz)) {
      return "tn";
    }
    if (/(africa\/windhoek)/.test(tz)) {
      return "af";
    }
    if (/(africa\/(dar_es_salaam|nairobi|dodoma|zanzibar))/i.test(tz)) {
      return "sw";
    }
    if (/(africa\/harare|africa\/maputo|africa\/lusaka)/.test(tz)) {
      return "sn";
    }
    if (/(africa\/bulawayo)/.test(tz)) {
      return "nd";
    }
    if (/(africa\/johannesburg|pretoria|maseru|mbabane)/.test(tz)) {
      return "xh";
    }
    if (/(asia\/(seoul|busan))/.test(tz)) {
      return "ko";
    }
    if (/(asia\/(shanghai|chongqing|beijing|urumqi|harbin|hong_kong|macau|taipei|singapore))/.test(tz)) {
      return "zh";
    }
    if (/(asia\/(kolkata|calcutta|colombo|karachi|dhaka|kathmandu|thimphu))/.test(tz)) {
      return "hi";
    }
    return null;
  }

  function suggestHookFor(code) {
    const pack = STRINGS[pick(code)] || STRINGS.en;
    const h = pack["lang.suggestHook"];
    return h || SUGGEST_HOOK_FALLBACK;
  }

  // Patch late-added homepage labels with strict per-locale strings.
  const EXTRA_KEYS = {
    en: {
      "ui.youAreHereChip": "You are here",
      "categories.title": "Popular Categories",
      "shops.title": "Regional shop folders",
      "shops.bridgeLink": "Trade Bridge & Live Marketplace",
      "market.title": "Live Marketplace",
      "ads.title": "Sponsored Brands and Ads",
      "ai.need": "What do you need?",
      "ai.budget": "Your max budget (EUR)",
      "ai.category": "Preferred category",
      "tracking.title": "Order Tracking and Delivery Updates",
      "booking.title": "Beauty and Service Booking Platform",
      "insurance.title": "Student Insurance and Well-Being Support",
      "marketFit.p1h": "For Students and Young Buyers",
      "marketFit.p2h": "For Families and Mature Buyers",
      "marketFit.p3h": "For Sellers and Service Providers",
      "seller.step1h": "1. Upload",
      "seller.step1p": "Add photos and item details.",
      "seller.step2h": "2. Price",
      "seller.step2p": "Set your price, then VibeCart applies platform markup safely.",
      "seller.step3h": "3. Ship",
      "seller.step3p": "Choose courier options for buyer country routes.",
      "chat.title": "Buyer-Seller Communication Hub",
      "chat.lead": "Buyers and sellers can contact each other quickly for product questions and delivery updates."
    },
    sw: {
      "ui.youAreHereChip": "Uko hapa",
      "categories.title": "Kategoria Maarufu",
      "shops.title": "Folda za maduka ya kanda",
      "shops.bridgeLink": "Daraja la Biashara na Soko la Moja kwa Moja",
      "market.title": "Soko la Moja kwa Moja",
      "ads.title": "Bidhaa Zilizodhaminiwa na Matangazo",
      "ai.need": "Unahitaji nini?",
      "ai.budget": "Bajeti yako ya juu (EUR)",
      "ai.category": "Kategoria unayopendelea",
      "tracking.title": "Ufuatiliaji wa Oda na Taarifa za Uwasilishaji",
      "booking.title": "Jukwaa la Urembo na Uhifadhi wa Huduma",
      "insurance.title": "Bima ya Wanafunzi na Msaada wa Ustawi",
      "marketFit.p1h": "Kwa wanafunzi na wanunuzi wachanga",
      "marketFit.p2h": "Kwa familia na wanunuzi waliokomaa",
      "marketFit.p3h": "Kwa wauzaji na watoa huduma",
      "seller.step1h": "1. Pakia",
      "seller.step1p": "Ongeza picha na maelezo ya bidhaa.",
      "seller.step2h": "2. Weka bei",
      "seller.step2p": "Weka bei yako, kisha VibeCart inaweka markup salama.",
      "seller.step3h": "3. Tuma",
      "seller.step3p": "Chagua chaguzi za courier kwa njia za nchi ya mnunuzi.",
      "chat.title": "Kituo cha Mawasiliano ya Mnunuzi na Muuzaji",
      "chat.lead": "Wanunuzi na wauzaji wanaweza kuwasiliana haraka kwa maswali ya bidhaa na taarifa za uwasilishaji."
    },
    sn: {
      "ui.youAreHereChip": "Uri pano",
      "categories.title": "Mapoka Anonyanya Kuzivikanwa",
      "shops.title": "Mafolda ezvitoro zvematunhu",
      "shops.bridgeLink": "Trade Bridge neLive Marketplace",
      "market.title": "Live Marketplace",
      "ads.title": "Sponsored Brands neAds",
      "ai.need": "Uri kuda chii?",
      "ai.budget": "Budget yako yepamusoro (EUR)",
      "ai.category": "Category yaunoda",
      "tracking.title": "Order Tracking neDelivery Updates",
      "booking.title": "Beauty neService Booking Platform",
      "insurance.title": "Student Insurance neWell-Being Support",
      "marketFit.p1h": "Kune vadzidzi nevatengi vechidiki",
      "marketFit.p2h": "Kune mhuri nevatengi vakakura",
      "marketFit.p3h": "Kune vatengesi nevapi vemasevhisi",
      "seller.step1h": "1. Isa",
      "seller.step1p": "Isa mapikicha neruzivo rwechinhu.",
      "seller.step2h": "2. Isa mutengo",
      "seller.step2p": "Isa mutengo wako, wobva VibeCart yaisa markup yakachengeteka.",
      "seller.step3h": "3. Tumira",
      "seller.step3p": "Sarudza courier options dzenzira dzenyika yemutengi.",
      "chat.title": "Buyer-Seller Communication Hub",
      "chat.lead": "Vatengi nevatengesi vanogona kutaurirana nekukurumidza pamibvunzo yezvigadzirwa nekuendeswa."
    },
    nd: {
      "ui.youAreHereChip": "Ulapha",
      "categories.title": "Izigaba Ezithandwayo",
      "shops.title": "Amafolda ezitolo zendawo",
      "shops.bridgeLink": "Trade Bridge leLive Marketplace",
      "market.title": "Live Marketplace",
      "ads.title": "Amabrand axhasiweyo lama-Ads",
      "ai.need": "Udinga ini?",
      "ai.budget": "Ibhajethi yakho ephezulu (EUR)",
      "ai.category": "Isigaba osithandayo",
      "tracking.title": "Ukulandelela Oda leDelivery Updates",
      "booking.title": "Beauty leService Booking Platform",
      "insurance.title": "Student Insurance leWell-Being Support",
      "marketFit.p1h": "Kwabafundi labathengi abatsha",
      "marketFit.p2h": "Kwemuli labathengi abavuthiweyo",
      "marketFit.p3h": "Kwabathengisi labanikezeli bezinsiza",
      "seller.step1h": "1. Faka",
      "seller.step1p": "Faka izithombe lemininingwane yomkhiqizo.",
      "seller.step2h": "2. Beka intengo",
      "seller.step2p": "Beka intengo yakho, iVibeCart ibese ifaka markup evikelekileyo.",
      "seller.step3h": "3. Thumela",
      "seller.step3p": "Khetha izindlela ze-courier zomzila welizwe lomthengi.",
      "chat.title": "Buyer-Seller Communication Hub",
      "chat.lead": "Abathengi labathengisi bangakhuluma masinyane ngemibuzo yomkhiqizo lokulethwa."
    },
    xh: {
      "ui.youAreHereChip": "Ulapha",
      "categories.title": "Iindidi Ezithandwayo",
      "shops.title": "Iifolda zeevenkile zommandla",
      "shops.bridgeLink": "Trade Bridge neLive Marketplace",
      "market.title": "Live Marketplace",
      "ads.title": "Iibrendi Ezixhasiweyo neAds",
      "ai.need": "Ufuna ntoni?",
      "ai.budget": "Uhlahlo-lwabiwo lwakho oluphezulu (EUR)",
      "ai.category": "Udidi oluthandayo",
      "tracking.title": "Ukulandelela iiOda neDelivery Updates",
      "booking.title": "Beauty neService Booking Platform",
      "insurance.title": "Student Insurance neWell-Being Support",
      "marketFit.p1h": "Kubafundi nabathengi abatsha",
      "marketFit.p2h": "Kwiintsapho nabathengi abavuthiweyo",
      "marketFit.p3h": "Kubathengisi nababoneleli ngeenkonzo",
      "seller.step1h": "1. Faka",
      "seller.step1p": "Faka imifanekiso neenkcukacha zemveliso.",
      "seller.step2h": "2. Beka ixabiso",
      "seller.step2p": "Beka ixabiso lakho, iVibeCart ifake markup ekhuselekileyo.",
      "seller.step3h": "3. Thumela",
      "seller.step3p": "Khetha iindlela ze-courier kwindlela yelizwe lomthengi.",
      "chat.title": "Buyer-Seller Communication Hub",
      "chat.lead": "Abathengi nabathengisi banokunxibelelana ngokukhawuleza ngemibuzo yemveliso nokuhanjiswa."
    },
    zu: {
      "ui.youAreHereChip": "Ulapha",
      "categories.title": "Izigaba Ezidumile",
      "shops.title": "Amafolda ezitolo zesifunda",
      "shops.bridgeLink": "Trade Bridge neLive Marketplace",
      "market.title": "Live Marketplace",
      "ads.title": "AmaBrand Axhasiwe nama-Ads",
      "ai.need": "Udinga ini?",
      "ai.budget": "Ibhajethi yakho ephezulu (EUR)",
      "ai.category": "Isigaba osithandayo",
      "tracking.title": "Ukulandelela Ama-oda neDelivery Updates",
      "booking.title": "Beauty neService Booking Platform",
      "insurance.title": "Student Insurance neWell-Being Support",
      "marketFit.p1h": "Kwabafundi nabathengi abasebasha",
      "marketFit.p2h": "Kwemindeni nabathengi abavuthiwe",
      "marketFit.p3h": "Kwabathengisi nabahlinzeki bezinsiza",
      "seller.step1h": "1. Layisha",
      "seller.step1p": "Faka izithombe nemininingwane yomkhiqizo.",
      "seller.step2h": "2. Beka intengo",
      "seller.step2p": "Beka intengo yakho, iVibeCart bese ifaka markup ephephile.",
      "seller.step3h": "3. Thumela",
      "seller.step3p": "Khetha izindlela ze-courier zomzila welizwe lomthengi.",
      "chat.title": "Buyer-Seller Communication Hub",
      "chat.lead": "Abathengi nabathengisi bangaxhumana ngokushesha ngemibuzo yomkhiqizo nezibuyekezo zokulethwa."
    }
  };
  Object.keys(EXTRA_KEYS).forEach((code) => {
    if (!STRINGS[code]) {
      STRINGS[code] = {};
    }
    Object.assign(STRINGS[code], EXTRA_KEYS[code]);
  });

  // Force critical homepage labels to exist in all major locale packs.
  const FORCED_HOME_KEYS = {
    pl: {
      "categories.title": "Popularne kategorie",
      "shops.title": "Regionalne foldery sklepow",
      "market.title": "Rynek na zywo",
      "ads.title": "Marki sponsorowane i reklamy",
      "tracking.title": "Sledzenie zamowien i aktualizacje dostawy",
      "booking.title": "Platforma rezerwacji uslug beauty",
      "insurance.title": "Ubezpieczenie studentow i wsparcie dobrostanu",
      "chat.title": "Centrum komunikacji kupujacy-sprzedawca",
      "marketFit.p1h": "Dla studentow i mlodych kupujacych",
      "marketFit.p2h": "Dla rodzin i dojrzalych kupujacych",
      "marketFit.p3h": "Dla sprzedawcow i uslugodawcow"
    },
    fr: {
      "categories.title": "Categories populaires",
      "shops.title": "Dossiers de boutiques regionales",
      "market.title": "Marche en direct",
      "ads.title": "Marques sponsorisees et publicites",
      "tracking.title": "Suivi des commandes et mises a jour de livraison",
      "booking.title": "Plateforme de reservation beaute et services",
      "insurance.title": "Assurance et bien-etre etudiant",
      "chat.title": "Centre de communication acheteur-vendeur",
      "marketFit.p1h": "Pour les etudiants et jeunes acheteurs",
      "marketFit.p2h": "Pour les familles et acheteurs plus matures",
      "marketFit.p3h": "Pour les vendeurs et prestataires"
    },
    pt: {
      "categories.title": "Categorias populares",
      "shops.title": "Pastas de lojas regionais",
      "market.title": "Mercado ao vivo",
      "ads.title": "Marcas patrocinadas e anuncios",
      "tracking.title": "Rastreamento de pedidos e atualizacoes de entrega",
      "booking.title": "Plataforma de agendamento de beleza e servicos",
      "insurance.title": "Seguro estudantil e apoio ao bem-estar",
      "chat.title": "Hub de comunicacao comprador-vendedor",
      "marketFit.p1h": "Para estudantes e compradores jovens",
      "marketFit.p2h": "Para familias e compradores mais maduros",
      "marketFit.p3h": "Para vendedores e prestadores de servico"
    },
    ar: {
      "categories.title": "الفئات الشائعة",
      "shops.title": "مجلدات المتاجر الإقليمية",
      "market.title": "السوق المباشر",
      "ads.title": "العلامات التجارية المدعومة والإعلانات",
      "tracking.title": "تتبع الطلبات وتحديثات التوصيل",
      "booking.title": "منصة حجز خدمات الجمال",
      "insurance.title": "تأمين الطلاب ودعم الرفاه",
      "chat.title": "مركز تواصل المشتري والبائع",
      "marketFit.p1h": "للطلاب والمشترين الشباب",
      "marketFit.p2h": "للعائلات والمشترين الأكثر نضجًا",
      "marketFit.p3h": "للبائعين ومقدمي الخدمات"
    },
    zh: {
      "categories.title": "热门分类",
      "shops.title": "区域店铺文件夹",
      "market.title": "实时市场",
      "ads.title": "赞助品牌与广告",
      "tracking.title": "订单跟踪与配送更新",
      "booking.title": "美妆与服务预约平台",
      "insurance.title": "学生保险与健康支持",
      "chat.title": "买家卖家沟通中心",
      "marketFit.p1h": "面向学生和年轻买家",
      "marketFit.p2h": "面向家庭和成熟买家",
      "marketFit.p3h": "面向卖家和服务提供者"
    },
    ko: {
      "categories.title": "인기 카테고리",
      "shops.title": "지역 상점 폴더",
      "market.title": "라이브 마켓",
      "ads.title": "스폰서 브랜드 및 광고",
      "tracking.title": "주문 추적 및 배송 업데이트",
      "booking.title": "뷰티 및 서비스 예약 플랫폼",
      "insurance.title": "학생 보험 및 웰빙 지원",
      "chat.title": "구매자-판매자 커뮤니케이션 허브",
      "marketFit.p1h": "학생과 젊은 구매자를 위해",
      "marketFit.p2h": "가족과 성숙한 구매자를 위해",
      "marketFit.p3h": "판매자와 서비스 제공자를 위해"
    },
    hi: {
      "categories.title": "लोकप्रिय श्रेणियां",
      "shops.title": "क्षेत्रीय दुकान फोल्डर",
      "market.title": "लाइव मार्केट",
      "ads.title": "स्पॉन्सर्ड ब्रांड और विज्ञापन",
      "tracking.title": "ऑर्डर ट्रैकिंग और डिलीवरी अपडेट",
      "booking.title": "ब्यूटी और सर्विस बुकिंग प्लेटफॉर्म",
      "insurance.title": "छात्र बीमा और वेल-बीइंग सपोर्ट",
      "chat.title": "खरीदार-विक्रेता संचार हब",
      "marketFit.p1h": "छात्रों और युवा खरीदारों के लिए",
      "marketFit.p2h": "परिवारों और परिपक्व खरीदारों के लिए",
      "marketFit.p3h": "विक्रेताओं और सेवा प्रदाताओं के लिए"
    }
  };
  Object.keys(FORCED_HOME_KEYS).forEach((code) => {
    if (!STRINGS[code]) {
      STRINGS[code] = {};
    }
    Object.assign(STRINGS[code], FORCED_HOME_KEYS[code]);
  });

  // Fill remaining homepage labels for key African locales.
  const FINAL_HOME_FILL = {
    sn: {
      "hero.regionHeadline": "VibeCart musika wemiganhu une vatengesi vakasimbiswa, checkout inokurumidza, uye kutenga kuri nyore.",
      "categories.title": "Mapoka anonyanya kufarirwa",
      "shops.title": "Mafolda ezvitoro zvematunhu",
      "market.title": "Live Marketplace",
      "sellerHub.kicker": "Kune vatengesi nemabhizimisi",
      "sellerHub.title": "Tengesa mumatanho matatu ari nyore wobva washandisa maturusi ari pasi",
      "sellerHub.intro": "Pano pane kushambadzira, AI yekukura, uye ads.",
      "ads.title": "Sponsored Brands neAds",
      "ai.need": "Uri kuda chii?",
      "ai.budget": "Bhajeti yako yepamusoro (EUR)",
      "ai.category": "Category yaunoda",
      "tracking.title": "Kutevera maodha neDelivery Updates",
      "booking.title": "Beauty neService Booking Platform",
      "insurance.title": "Student Insurance neWell-Being Support",
      "tax.title": "Kujeka kweMutero neKubhadhara",
      "accountPassport.title": "Pasipoti yenzira",
      "accountPassport.signingUpAs": "Kusaina se",
      "settingsHub.accountH": "Kutonga kweAkaunti",
      "settingsHub.experienceH": "Chiitiko cheShop"
    },
    nd: {
      "hero.regionHeadline": "IVibeCart yimakethe yokuwela imingcele enabathengisi abaqinisekisiweyo, checkout esheshayo, lokuthenga okulula.",
      "categories.title": "Izigaba ezithandwayo",
      "shops.title": "Amafolda ezitolo zendawo",
      "market.title": "Live Marketplace",
      "sellerHub.kicker": "Kwabathengisi lamabhizimusi",
      "sellerHub.title": "Thengisa ngezinyathelo ezintathu ezilula bese usebenzisa amathuluzi angezansi",
      "sellerHub.intro": "Lapha uthola ukumaketha, AI yokukhulisa, lama-ads.",
      "ads.title": "AmaBrand axhasiweyo lama-Ads",
      "ai.need": "Udinga ini?",
      "ai.budget": "Ibhajethi yakho ephezulu (EUR)",
      "ai.category": "Isigaba osithandayo",
      "tracking.title": "Ukulandelela ama-oda leDelivery Updates",
      "booking.title": "Beauty leService Booking Platform",
      "insurance.title": "Student Insurance leWell-Being Support",
      "tax.title": "Ukucaca kweTax lePayout",
      "accountPassport.title": "Ipasipoti yendlela",
      "accountPassport.signingUpAs": "Ukubhalisa njenge",
      "settingsHub.accountH": "Ukulawula iAkhawunti",
      "settingsHub.experienceH": "Isipiliyoni seShop"
    },
    xh: {
      "hero.regionHeadline": "IVibeCart yimarike ewela imida enabathengisi abaqinisekisiweyo, checkout ekhawulezayo, nokuthenga okulula.",
      "categories.title": "Iindidi ezithandwayo",
      "shops.title": "Iifolda zeevenkile zommandla",
      "market.title": "Live Marketplace",
      "sellerHub.kicker": "Kubathengisi namashishini",
      "sellerHub.title": "Thengisa ngamanyathelo amathathu alula, emva koko usebenzise izixhobo ezingezantsi",
      "sellerHub.intro": "Apha ufumana intengiso, AI yokukhulisa, kunye ne-ads.",
      "ads.title": "Iibrendi ezixhasiweyo neAds",
      "ai.need": "Ufuna ntoni?",
      "ai.budget": "Uhlahlo-lwabiwo lwakho oluphezulu (EUR)",
      "ai.category": "Udidi oluthandayo",
      "tracking.title": "Ukulandelela ii-oda neDelivery Updates",
      "booking.title": "Beauty neService Booking Platform",
      "insurance.title": "Student Insurance neWell-Being Support",
      "tax.title": "Ukucaca kweTax nePayout",
      "accountPassport.title": "Ipasipoti yendlela",
      "accountPassport.signingUpAs": "Ukubhalisa njenge",
      "settingsHub.accountH": "Ulawulo lweAkhawunti",
      "settingsHub.experienceH": "Amava eShop"
    },
    zu: {
      "hero.regionHeadline": "IVibeCart yimakethe yokuwela imingcele enabathengisi abaqinisekisiwe, checkout esheshayo, nokuthenga okulula.",
      "categories.title": "Izigaba ezidumile",
      "shops.title": "Amafolda ezitolo zesifunda",
      "market.title": "Live Marketplace",
      "sellerHub.kicker": "Kwabathengisi namabhizinisi",
      "sellerHub.title": "Thengisa ngezinyathelo ezi-3 ezilula — bese usebenzisa amathuluzi angezansi",
      "sellerHub.intro": "Lapha uthola ukumaketha, i-AI yokukhulisa, nezikhangiso.",
      "ads.title": "AmaBrand axhasiwe nama-Ads",
      "ai.need": "Udinga ini?",
      "ai.budget": "Ibhajethi yakho ephezulu (EUR)",
      "ai.category": "Isigaba osithandayo",
      "tracking.title": "Ukulandelela ama-oda neDelivery Updates",
      "booking.title": "Beauty neService Booking Platform",
      "insurance.title": "Student Insurance neWell-Being Support",
      "tax.title": "Ukucaca kweTax nePayout",
      "accountPassport.title": "Ipasipoti yendlela",
      "accountPassport.signingUpAs": "Ukubhalisa njenge",
      "settingsHub.accountH": "Ukulawula iAkhawunti",
      "settingsHub.experienceH": "Isipiliyoni seShop"
    }
  };
  Object.keys(FINAL_HOME_FILL).forEach((code) => {
    if (!STRINGS[code]) STRINGS[code] = {};
    Object.assign(STRINGS[code], FINAL_HOME_FILL[code]);
  });

  window.VibeCartI18n = {
    STRINGS,
    pick,
    t,
    apply,
    inferLocaleFromEnvironment,
    suggestHookFor,
    getStored() {
      try {
        return localStorage.getItem(STORAGE_KEY) || "";
      } catch {
        return "";
      }
    },
    setStored(lang) {
      try {
        const raw = String(lang || "en").trim().toLowerCase();
        localStorage.setItem(STORAGE_KEY, raw);
      } catch {
        /* ignore */
      }
      apply(lang);
    }
  };
})();
