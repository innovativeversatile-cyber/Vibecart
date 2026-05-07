"use strict";

(function () {
  var grid = document.getElementById("bestBargainsGrid");
  if (!grid) return;

  var DEALS = [
    {
      shop: "Amazon",
      blurb: "Lightning deals &amp; category coupons — pick your country.",
      off: "Daily deals often −15% to −50%",
      img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.amazon.com/deals"
    },
    {
      shop: "eBay",
      blurb: "Auctions &amp; Buy It Now — watch seller ratings.",
      off: "Auction wins &amp; coupon events vary",
      img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.ebay.com/deals"
    },
    {
      shop: "Takealot",
      blurb: "South Africa — daily deals on tech &amp; home.",
      off: "Frequent flash −10% to −40%",
      img: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.takealot.com"
    },
    {
      shop: "Jumia",
      blurb: "Africa e-commerce — country storefronts on site.",
      off: "Seasonal promos by market",
      img: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.jumia.com.ng"
    },
    {
      shop: "Argos",
      blurb: "UK catalogue retailer — frequent multi-buy tech.",
      off: "Typical event −10% to −35%",
      img: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.argos.co.uk"
    },
    {
      shop: "Newegg",
      blurb: "PC parts &amp; tech — shell shocker &amp; combo pricing.",
      off: "Daily promos often −10% to −40%",
      img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.newegg.com"
    }
  ];

  grid.innerHTML = DEALS.map(function (d) {
    return (
      "<article class=\"vc-deal-card\">" +
      "<a class=\"vc-deal-card__link\" href=\"" +
      d.href +
      "\" target=\"_blank\" rel=\"noopener noreferrer\">" +
      "<span class=\"vc-deal-card__media\"><img src=\"" +
      d.img +
      "\" alt=\"\" width=\"800\" height=\"500\" loading=\"lazy\" decoding=\"async\" /></span>" +
      "<span class=\"vc-deal-card__body\">" +
      "<span class=\"vc-deal-card__badge\">" +
      d.off +
      "</span>" +
      "<span class=\"vc-deal-card__shop\">" +
      d.shop +
      "</span>" +
      "<span class=\"vc-deal-card__blurb\">" +
      d.blurb +
      "</span>" +
      "<span class=\"vc-deal-card__cta\">Shop " +
      d.shop +
      " →</span>" +
      "</span>" +
      "</a>" +
      "</article>"
    );
  }).join("");
})();
