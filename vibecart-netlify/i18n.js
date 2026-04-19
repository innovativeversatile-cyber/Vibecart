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
      "settingsHub.skipReceipt":
        "Skip receipt rehearsal before one-click checkout (pro — off by default)",
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
      "accountPassport.loginLead": "Use the email and password from when you created your passport.",
      "accountPassport.submitLogin": "Sign in",
      "accountPassport.pwShort": "Add characters — minimum 8.",
      "accountPassport.pwFair": "Okay — add a symbol or digit for strength.",
      "accountPassport.pwStrong": "Strong enough for this lane.",
      "accountPassport.welcome": "Welcome, {name}",
      "accountPassport.meta": "{email} · {role} · {country}",
      "accountPassport.roleBuyerLabel": "Buyer",
      "accountPassport.roleSellerLabel": "Seller",
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
      "receipt.title": "Receipt rehearsal",
      "receipt.lead":
        "Plain language summary — not a tax invoice. Confirm before we place the order.",
      "receipt.item": "Item",
      "receipt.price": "Listed price",
      "receipt.lane": "Active lane",
      "receipt.buyer": "Buyer routing",
      "receipt.ship": "Shipping method",
      "receipt.returns": "Returns & disputes",
      "receipt.returnsBody":
        "Platform + seller policies apply; cross-border windows vary by category.",
      "receipt.cancel": "Back",
      "receipt.confirm": "Place order",
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

  const SUGGEST_HOOK_FALLBACK = "Switch key labels to a closer language?";

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
    const pack = STRINGS[L] || STRINGS.en;
    if (pack[key] != null) {
      return pack[key];
    }
    return STRINGS.en[key] != null ? STRINGS.en[key] : "";
  }

  function apply(lang) {
    const L = pick(lang);
    document.documentElement.setAttribute("lang", BCP47[L] || BCP47.en);
    document.documentElement.dir = L === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) {
        return;
      }
      const val = t(lang, key);
      if (val != null && val !== "") {
        el.textContent = val;
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
