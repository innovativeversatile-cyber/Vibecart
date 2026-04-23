(function () {
  function initWorldShock() {
    var reel = document.getElementById("vcShockReel");
    var dotsWrap = document.getElementById("vcShockDots");
    var progressBar = document.getElementById("vcShockProgressBar");
    if (!reel || !dotsWrap || !progressBar) {
      return;
    }
    var scenes = Array.prototype.slice.call(reel.querySelectorAll(".vc-shock-scene"));
    if (!scenes.length) {
      return;
    }
    var active = 0;
    var timer = null;

    function drawDots() {
      dotsWrap.innerHTML = "";
      scenes.forEach(function (_, idx) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "vc-shock-dot" + (idx === active ? " is-active" : "");
        dot.setAttribute("aria-label", "Shock scene " + (idx + 1));
        dot.addEventListener("click", function () {
          go(idx, true);
        });
        dotsWrap.appendChild(dot);
      });
    }

    function setProgress() {
      var pct = ((active + 1) / scenes.length) * 100;
      progressBar.style.width = pct.toFixed(2) + "%";
    }

    function vibrateTap() {
      try {
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      } catch {
        /* ignore */
      }
    }

    function go(next, manual) {
      active = (next + scenes.length) % scenes.length;
      scenes.forEach(function (scene, idx) {
        scene.classList.toggle("is-active", idx === active);
      });
      drawDots();
      setProgress();
      if (manual) {
        vibrateTap();
        restartTimer();
      }
    }

    function restartTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        go(active + 1, false);
      }, 4600);
    }

    var startX = 0;
    var deltaX = 0;
    reel.addEventListener("touchstart", function (event) {
      startX = Number(event.touches && event.touches[0] ? event.touches[0].clientX : 0);
      deltaX = 0;
    }, { passive: true });
    reel.addEventListener("touchmove", function (event) {
      var currentX = Number(event.touches && event.touches[0] ? event.touches[0].clientX : startX);
      deltaX = currentX - startX;
    }, { passive: true });
    reel.addEventListener("touchend", function () {
      if (Math.abs(deltaX) > 40) {
        go(active + (deltaX < 0 ? 1 : -1), true);
      }
    });

    go(0, false);
    restartTimer();
  }

  function initFashionTrendsTile() {
    var tile = document.getElementById("vcFashionTrendsTile");
    var img = document.getElementById("vcFashionTrendsImage");
    if (!tile || !img) {
      return;
    }
    var slides = [
      { src: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=640&h=400&q=75" },
      { src: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=640&h=400&q=75" },
      { src: "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=640&h=400&q=75" },
      { src: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=640&h=400&q=75" }
    ];
    var idx = 0;
    function paint(next) {
      idx = (next + slides.length) % slides.length;
      img.src = slides[idx].src;
    }
    paint(0);
    window.setInterval(function () {
      paint(idx + 1);
    }, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initWorldShock();
      initFashionTrendsTile();
    }, { once: true });
  } else {
    initWorldShock();
    initFashionTrendsTile();
  }
})();
