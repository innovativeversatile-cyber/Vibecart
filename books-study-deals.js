"use strict";

(function () {
  var grid = document.getElementById("booksStudyDealsGrid");
  if (!grid) return;

  var DEALS = [
    {
      shop: "AbeBooks",
      blurb: "Used, rare, and textbooks — independent sellers worldwide.",
      off: "Deals vary by seller &amp; condition",
      img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.abebooks.com"
    },
    {
      shop: "ThriftBooks",
      blurb: "Second-hand reads — free shipping thresholds by region.",
      off: "Everyday value &amp; reward credits",
      img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://www.thriftbooks.com"
    },
    {
      shop: "Wordery",
      blurb: "Global bookshop — free delivery offers on many titles.",
      off: "Frequent multi-buy promos",
      img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://wordery.com"
    },
    {
      shop: "Blackwell's",
      blurb: "UK academic &amp; trade — strong textbook seasonality.",
      off: "Student &amp; bundle windows",
      img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://blackwells.co.uk"
    },
    {
      shop: "Bookshop.org",
      blurb: "Supports indie shops — browse by region on site.",
      off: "Ethical routing; promos per store",
      img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://bookshop.org"
    },
    {
      shop: "Open Library",
      blurb: "Borrow &amp; read digitally — great for study previews (free).",
      off: "Free access; account for loans",
      img: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&h=500&q=78",
      href: "https://openlibrary.org"
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
