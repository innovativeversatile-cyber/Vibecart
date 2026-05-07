"use strict";

(function () {
  var grid = document.getElementById("electronicsDealsGrid");
  if (!grid) return;

  var DEALS = [
    {
      shop: "Amazon Electronics",
      blurb: "Deals hub for tech — pick your country storefront on site.",
      off: "Lightning &amp; seasonal promos common",
      img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.amazon.com/deals/electronics"
    },
    {
      shop: "Newegg",
      blurb: "PC parts, components, and accessories — shell shocker rhythm.",
      off: "Daily tech promos often −10% to −40%",
      img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.newegg.com"
    },
    {
      shop: "Best Buy",
      blurb: "US big-box tech — open-box and event pricing by region.",
      off: "Member &amp; holiday windows vary",
      img: "https://images.unsplash.com/photo-1550009158-9dcbf351fa68?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.bestbuy.com"
    },
    {
      shop: "Currys",
      blurb: "UK &amp; Ireland tech retailer — multi-buy and clearance rows.",
      off: "Typical event −10% to −35%",
      img: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.currys.co.uk"
    },
    {
      shop: "MediaMarkt",
      blurb: "EU consumer electronics — country sites from the homepage.",
      off: "Seasonal promos by market",
      img: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.mediamarkt.de"
    },
    {
      shop: "Samsung",
      blurb: "Official store — trade-in and bundle offers on phones &amp; screens.",
      off: "Bundles &amp; trade-in vary by region",
      img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.samsung.com"
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
      "<span class=\"vc-deal-card__cta\">Open " +
      d.shop.replace(/&amp;/g, "&") +
      " →</span>" +
      "</span>" +
      "</a>" +
      "</article>"
    );
  }).join("");
})();
