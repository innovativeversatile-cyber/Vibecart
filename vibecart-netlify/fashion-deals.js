"use strict";

(function () {
  var grid = document.getElementById("fashionDealsGrid");
  if (!grid) return;

  var DEALS = [
    {
      shop: "Zalando",
      blurb: "EU marketplace — seasonal sales and outlet rows.",
      off: "Often −20% to −60% in seasonal promos",
      img: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.zalando.com"
    },
    {
      shop: "ASOS",
      blurb: "Global youth fashion — frequent multi-buy offers.",
      off: "Typical −15% to −40% during event windows",
      img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.asos.com"
    },
    {
      shop: "Primark",
      blurb: "High-street value — check your region on site.",
      off: "Everyday low prices; regional promos vary",
      img: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.primark.com"
    },
    {
      shop: "Nike store",
      blurb: "Official drops — members often see early access.",
      off: "Member & seasonal reductions commonly −25%",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.nike.com"
    },
    {
      shop: "H&amp;M",
      blurb: "Basics and trend — recurring family of sales.",
      off: "Frequent −10% to −50% in clearance",
      img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.hm.com"
    },
    {
      shop: "Zara",
      blurb: "Seasonal edits — mid-season reductions by region.",
      off: "Typical mid-season −20% to −40%",
      img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.zara.com"
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
