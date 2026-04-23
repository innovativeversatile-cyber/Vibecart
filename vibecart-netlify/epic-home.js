(function () {
  function initEpic() {
    var track = document.getElementById("vcEpicTrack");
    var dots = document.getElementById("vcEpicDots");
    if (!track || !dots) {
      return;
    }
    var cards = Array.prototype.slice.call(track.querySelectorAll(".vc-epic-card"));
    if (!cards.length) {
      return;
    }
    var active = 0;
    var timer = null;

    function renderDots() {
      dots.innerHTML = "";
      cards.forEach(function (_, idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "vc-epic-dot" + (idx === active ? " is-active" : "");
        btn.setAttribute("aria-label", "Epic scene " + (idx + 1));
        btn.addEventListener("click", function () {
          go(idx, true);
        });
        dots.appendChild(btn);
      });
    }

    function go(next, manual) {
      active = (next + cards.length) % cards.length;
      cards.forEach(function (card, idx) {
        card.classList.toggle("is-active", idx === active);
      });
      renderDots();
      if (manual) {
        restartTimer();
      }
    }

    function restartTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        go(active + 1, false);
      }, 4200);
    }

    var startX = 0;
    var deltaX = 0;
    track.addEventListener("touchstart", function (event) {
      startX = Number(event.touches && event.touches[0] ? event.touches[0].clientX : 0);
      deltaX = 0;
    }, { passive: true });
    track.addEventListener("touchmove", function (event) {
      var nowX = Number(event.touches && event.touches[0] ? event.touches[0].clientX : startX);
      deltaX = nowX - startX;
    }, { passive: true });
    track.addEventListener("touchend", function () {
      if (Math.abs(deltaX) > 34) {
        go(active + (deltaX < 0 ? 1 : -1), true);
      }
    });

    go(0, false);
    restartTimer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEpic, { once: true });
  } else {
    initEpic();
  }
})();
