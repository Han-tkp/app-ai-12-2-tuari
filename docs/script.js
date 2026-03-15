/* ============================================
   DropDetect AI — Download Page Script
   ============================================ */

(function () {
  "use strict";

  // ---- Configuration ----
  // Replace OWNER/REPO with your actual GitHub repository path
  var GITHUB_REPO = "OWNER/REPO";
  var GITHUB_API =
    "https://api.github.com/repos/" + GITHUB_REPO + "/releases/latest";
  var GITHUB_RELEASES =
    "https://github.com/" + GITHUB_REPO + "/releases/latest";

  // ---- OS Detection ----
  function detectOS() {
    var ua = navigator.userAgent.toLowerCase();
    var platform = (navigator.platform || "").toLowerCase();

    if (ua.indexOf("win") !== -1 || platform.indexOf("win") !== -1) {
      return "windows";
    }
    if (ua.indexOf("linux") !== -1 || platform.indexOf("linux") !== -1) {
      return "linux";
    }
    if (
      ua.indexOf("mac") !== -1 ||
      platform.indexOf("mac") !== -1 ||
      ua.indexOf("iphone") !== -1 ||
      ua.indexOf("ipad") !== -1
    ) {
      return "macos";
    }
    return "unknown";
  }

  function highlightOS(os) {
    var heroBtn = document.getElementById("hero-download-btn");
    var heroLabel = document.getElementById("hero-download-label");
    var heroSub = document.getElementById("hero-download-sub");
    var heroIcon = document.getElementById("hero-os-icon");

    // Highlight the matching download card
    var cards = {
      windows: document.getElementById("download-windows"),
      linux: document.getElementById("download-linux"),
      macos: document.getElementById("download-macos"),
    };

    Object.keys(cards).forEach(function (key) {
      if (cards[key]) {
        cards[key].classList.toggle("download-card-active", key === os);
      }
    });

    // Update hero download button
    if (os === "windows") {
      heroLabel.textContent = "Download for Windows";
      heroSub.textContent = ".exe installer";
      heroIcon.textContent = "";
      heroBtn.setAttribute("data-target", "download-exe");
    } else if (os === "linux") {
      heroLabel.textContent = "Download for Linux";
      heroSub.textContent = ".deb package";
      heroIcon.textContent = "";
      heroBtn.setAttribute("data-target", "download-deb");
    } else if (os === "macos") {
      heroLabel.textContent = "Not available for macOS";
      heroSub.textContent = "See supported platforms below";
      heroIcon.textContent = "";
      heroBtn.removeAttribute("data-target");
    } else {
      heroLabel.textContent = "Download";
      heroSub.textContent = "Choose your platform below";
      heroIcon.textContent = "";
      heroBtn.removeAttribute("data-target");
    }

    // Make hero button click trigger the correct download
    heroBtn.addEventListener("click", function (e) {
      var targetId = heroBtn.getAttribute("data-target");
      if (targetId) {
        var targetBtn = document.getElementById(targetId);
        if (targetBtn && targetBtn.href && targetBtn.href !== "#") {
          e.preventDefault();
          window.location.href = targetBtn.href;
          return;
        }
      }
      // Otherwise, scroll to download section (default href="#download")
    });
  }

  // ---- Format file size ----
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // ---- Fetch GitHub Release ----
  function fetchRelease() {
    fetch(GITHUB_API)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("GitHub API returned " + response.status);
        }
        return response.json();
      })
      .then(function (release) {
        var assets = release.assets || [];
        var mapping = {
          exe: { btnId: "download-exe", sizeId: "size-exe", pattern: /\.exe$/i },
          msi: { btnId: "download-msi", sizeId: "size-msi", pattern: /\.msi$/i },
          deb: { btnId: "download-deb", sizeId: "size-deb", pattern: /\.deb$/i },
          appimage: {
            btnId: "download-appimage",
            sizeId: "size-appimage",
            pattern: /\.appimage$/i,
          },
        };

        assets.forEach(function (asset) {
          var name = asset.name || "";
          Object.keys(mapping).forEach(function (key) {
            var m = mapping[key];
            if (m.pattern.test(name)) {
              var btn = document.getElementById(m.btnId);
              var sizeEl = document.getElementById(m.sizeId);
              if (btn) {
                btn.href = asset.browser_download_url;
              }
              if (sizeEl) {
                sizeEl.textContent = formatSize(asset.size);
              }
            }
          });
        });

        // Update version badge if release has a tag
        if (release.tag_name) {
          var badge = document.querySelector(".version-badge");
          if (badge) {
            badge.textContent = release.tag_name;
          }
        }
      })
      .catch(function () {
        // Show fallback link on error
        var fallback = document.getElementById("download-fallback");
        if (fallback) {
          fallback.style.display = "block";
        }

        // Set all download buttons to point to GitHub releases page
        var downloadBtns = [
          "download-exe",
          "download-msi",
          "download-deb",
          "download-appimage",
        ];
        downloadBtns.forEach(function (id) {
          var btn = document.getElementById(id);
          if (btn) {
            btn.href = GITHUB_RELEASES;
          }
        });
      });
  }

  // ---- Smooth Scroll for Anchor Links ----
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        var targetId = this.getAttribute("href");
        if (targetId === "#") return;

        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // ---- Fade-in on Scroll (IntersectionObserver) ----
  function initFadeIn() {
    if (!("IntersectionObserver" in window)) {
      // Fallback: show everything immediately
      document.querySelectorAll(".fade-in").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    document.querySelectorAll(".fade-in").forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- Initialize ----
  function init() {
    var os = detectOS();
    highlightOS(os);
    fetchRelease();
    initSmoothScroll();
    initFadeIn();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
