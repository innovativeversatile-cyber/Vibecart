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
      "nav.sellerBoost": "Seller Boost",
      "nav.sell": "Start Selling",
      "lang.label": "Language",
      "hero.badge": "Africa-Europe-Asia Trade Bridge",
      "hero.title": "Discover bold finds. Buy fast. Sell globally.",
      "ai.title": "AI Shopping Assistant",
      "ai.lead": "Need help choosing? Tell the assistant your budget, category, and what you need. It ranks live listings on this page — not a remote model.",
      "ai.suggest": "Get AI suggestions",
      "orbit.title": "Signal deck: dual AI + policy rails",
      "orbit.lead":
        "Pick a tone for on-page tips. Heavy lifting still runs through your APIs, humans, and policy — nothing here auto-installs software or bypasses review.",
      "orbit.personaFun": "Fun AI (Aura)",
      "orbit.personaEff": "Efficient AI (Ops)",
      "orbit.personaHint": "Persona changes suggestion wording only. Checkout, legality, and payouts stay in your normal flows.",
      "orbit.legalTitle": "Law-safe copilot (rules, not magic)",
      "orbit.legalBody":
        "Automated checks use jurisdiction tables, category bans, and risk prompts. Unclear cases go to manual review. This is compliance assistance — not legal advice and not autonomous enforcement.",
      "orbit.radarTitle": "Market radar (signals)",
      "orbit.radarLead": "Heuristic hints from your region and language choice — use them in your growth plan; they do not deploy code or open stores for you.",
      "ai.resultEffPrefix": "Ranked matches",
      "ai.resultFunPrefix": "Vibe-ranked picks",
      "ai.noMatch": "No strong match on this page. Try a higher budget or Any category.",
      "lang.aiOfferCaption": "From your browser languages & time zone (on-device heuristics, not GPS).",
      "lang.aiOfferSwitch": "Switch language",
      "lang.aiOfferDismiss": "No thanks"
    },
    pl: {
      "nav.categories": "Kategorie",
      "nav.shops": "Sklepy regionalne",
      "nav.hot": "Hity",
      "nav.rewards": "Nagrody",
      "nav.insurance": "Ubezpieczenie",
      "nav.security": "Bezpieczeństwo",
      "nav.settings": "Ustawienia",
      "nav.sellerBoost": "Boost sprzedawcy",
      "nav.sell": "Zacznij sprzedawać",
      "lang.label": "Język",
      "hero.badge": "Most handlowy Afryka–Europa–Azja",
      "hero.title": "Odkrywaj, kupuj szybko, sprzedawaj globalnie.",
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

    if (/(africa\/harare|africa\/maputo|africa\/lusaka|gaborone)/.test(tz)) {
      return "sn";
    }
    if (/(africa\/bulawayo)/.test(tz)) {
      return "nd";
    }
    if (/(africa\/johannesburg|pretoria|windhoek|gaborone|maseru|mbabane)/.test(tz)) {
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
