/**
 * Scattered Photo Wall with Fade Carousel
 * - photo4.jpeg (img8) as full-screen background
 * - All photo cards fade in (3s) → stay (5~15s random) → fade out → swap to random image → repeat
 * - No duplicate images shown simultaneously (global active-image tracking)
 */

(function () {
    'use strict';

    var ALL_IMAGES = [
        'images/img1.jpg',
        'images/img2.jpg',
        'images/img3.jpg',
        'images/img4.jpg',
        'images/img5.jpg',
        'images/img6.jpg',
        'images/img7.jpg',
        'images/img8.jpg',
        'images/img9.jpg',
        'images/img10.jpeg',
        'images/img11.jpeg',
        'images/img12.jpeg',
        'images/img13.jpeg',
        'images/img14.jpeg',
        'images/img15.jpg',
        'images/img16.jpg',
        'images/img17.jpg',
        'images/img18.jpg',
        'images/img19.jpg',
        'images/img20.jpg',
        'images/img21.jpg',
        'images/img22.jpeg',
        'images/img23.jpeg',
        'images/img24.jpg',
        'images/img25.jpeg',
        'images/img26.jpeg',
        'images/img27.jpeg',
        'images/img28.jpeg',
        'images/img29.jpeg',
        'images/img30.jpeg',
        'images/img31.jpeg',
        'images/img32.jpeg',
        'images/img33.png',
        'images/img34.jpg',
        'images/img35.jpg'
    ];

    var FADE_MS = 3000;   // 3s fade in / out
    var BG_INTERVAL = 10000; // 10s background rotation

    // ---- Global active-image registry ----
    // Tracks every image currently visible on screen so we never show duplicates.
    var activeImages = new Set();

    /**
     * Pick a random image from pool, excluding:
     *   1. All currently active images (shown by other cards)
     *   2. The card's own current image (passed as ownSrc)
     * Falls back to just excluding ownSrc if all others are active.
     */
    function pickUnique(ownSrc) {
        var available = ALL_IMAGES.filter(function (s) {
            return s !== ownSrc && !activeImages.has(s);
        });
        // Edge case: all images are active (shouldn't happen with 11 imgs / 8 cards)
        if (available.length === 0) {
            available = ALL_IMAGES.filter(function (s) { return s !== ownSrc; });
        }
        return available[Math.floor(Math.random() * available.length)];
    }

    // ---- Helpers ----

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function preload(src, done) {
        var tmp = new Image();
        tmp.onload = done;
        tmp.onerror = done;
        tmp.src = src;
    }

    /**
     * Fade-in → stay → fade-out → swap → repeat.
     * Uses global activeImages to prevent duplicates.
     */
    function startRotation(card, imgEl, currentSrc) {
        function cycle() {
            var stay = rand(5000, 15000); // 5~15s random per cycle

            // After fade-in + stay, fade out
            setTimeout(function () {
                card.classList.remove('visible');

                // After fade-out completes, swap image and fade in
                setTimeout(function () {
                    // Remove old image from active pool before picking new one
                    activeImages.delete(currentSrc);

                    var newSrc = pickUnique(currentSrc);
                    // Reserve new image IMMEDIATELY (before async preload)
                    // so no other card can grab the same one during the gap
                    activeImages.add(newSrc);

                    preload(newSrc, function () {
                        imgEl.src = newSrc;
                        currentSrc = newSrc;

                        // Trigger fade-in on next frame
                        requestAnimationFrame(function () {
                            card.classList.add('visible');
                            // Schedule next cycle
                            setTimeout(cycle, FADE_MS + rand(5000, 15000));
                        });
                    });
                }, FADE_MS);
            }, FADE_MS + stay);
        }

        cycle();
    }

    // ---- Background crossfade rotation ----
    // Uses stacked <img> elements: each new image is appended, faded in,
    // then the old one is removed. No background-image swapping = no flash.

    function initBackground() {
        var container = document.getElementById('bg-container');
        var currentBg = null;
        var currentImg = null;

        // Pick initial background
        currentBg = ALL_IMAGES[Math.floor(Math.random() * ALL_IMAGES.length)];
        currentImg = new Image();
        currentImg.src = currentBg;
        currentImg.classList.add('active');
        container.appendChild(currentImg);

        function rotateBg() {
            // Pick a random image, excluding current background
            var pool = ALL_IMAGES.filter(function (s) { return s !== currentBg; });
            var newBg = pool[Math.floor(Math.random() * pool.length)];

            // Create new <img> element (opacity 0 by default from CSS)
            var newImg = new Image();

            // IMPORTANT: attach handlers BEFORE setting src.
            // If the image is already cached (photo cards load the same images),
            // Chromium fires load synchronously on src assignment — handlers
            // set afterwards would miss the event entirely.
            newImg.onload = function () {
                // Capture old image reference BEFORE updating currentImg.
                // Otherwise the setTimeout closure below would reference the
                // already-updated currentImg (the new image) and fade out
                // the wrong layer — causing the background to "revert".
                var oldImg = currentImg;

                // Image is fully decoded & ready — append to DOM
                container.appendChild(newImg);

                // Next frame: fade in the new image
                requestAnimationFrame(function () {
                    newImg.classList.add('active');
                });

                // After crossfade completes, fade out & remove OLD image
                setTimeout(function () {
                    if (oldImg && oldImg.parentNode) {
                        oldImg.classList.remove('active');
                        // Remove from DOM after fade-out finishes
                        setTimeout(function () {
                            if (oldImg.parentNode) {
                                oldImg.parentNode.removeChild(oldImg);
                            }
                        }, 3000);
                    }
                }, 3000);

                // Update references
                currentImg = newImg;
                currentBg = newBg;

                // Schedule next rotation
                setTimeout(rotateBg, BG_INTERVAL);
            };

            // Fallback: if image fails to load, try again next cycle
            newImg.onerror = function () {
                setTimeout(rotateBg, BG_INTERVAL);
            };

            // Now set src (triggers load — handlers are already in place)
            newImg.src = newBg;
        }

        setTimeout(rotateBg, BG_INTERVAL);
    }

    // ---- Build the wall ----

    function buildWall() {
        var wall = document.getElementById('photo-wall');
        wall.innerHTML = '';

        // Reset active pool
        activeImages.clear();

        var W = window.innerWidth;
        var H = window.innerHeight;
        var cx = W / 2;
        var cy = H / 2;

        // == Main image at center (bottom layer) ==
        var mainSrc = pickUnique(null);
        activeImages.add(mainSrc);

        var mainWrapper = document.createElement('div');
        mainWrapper.className = 'photo-wrapper';
        mainWrapper.style.left = cx + 'px';
        mainWrapper.style.top = cy + 'px';
        mainWrapper.style.setProperty('--z', 1);

        var mainCard = document.createElement('div');
        mainCard.className = 'photo-card main-card';

        var mainImg = document.createElement('img');
        mainImg.src = mainSrc;
        mainImg.alt = '';
        mainImg.onerror = function () { mainCard.style.display = 'none'; };

        mainCard.appendChild(mainImg);
        mainWrapper.appendChild(mainCard);
        wall.appendChild(mainWrapper);

        setTimeout(function () {
            mainCard.classList.add('visible');
            startRotation(mainCard, mainImg, mainSrc);
        }, 100);

        // == Scattered images around center ==
        var zoneW = 750;
        var zoneH = 480;

        var cols = W >= 2560 ? 5 : 4;
        var rows = 3;
        var cellW = W / cols;
        var cellH = H / rows;

        // Build cells, sort outermost first
        var cells = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var bcx = c * cellW + cellW / 2;
                var bcy = r * cellH + cellH / 2;
                var dist = Math.sqrt((bcx - cx) * (bcx - cx) + (bcy - cy) * (bcy - cy));
                cells.push({ col: c, row: r, dist: dist });
            }
        }
        cells.sort(function (a, b) { return b.dist - a.dist; });

        var NUM_SCATTERED = 7;

        for (var i = 0; i < NUM_SCATTERED; i++) {
            (function (idx) {
                var src = pickUnique(null);
                activeImages.add(src);

                var wrapper = document.createElement('div');
                wrapper.className = 'photo-wrapper';

                var card = document.createElement('div');
                card.className = 'photo-card';

                var img = document.createElement('img');
                img.src = src;
                img.alt = '';

                var positioned = false;
                img.onload = function () {
                    if (positioned) return; // ignore subsequent loads from rotation
                    positioned = true;

                    var cell = cells[idx % cells.length];
                    var baseX = cell.col * cellW + cellW / 2;
                    var baseY = cell.row * cellH + cellH / 2;
                    var x = baseX + rand(-cellW * 0.3, cellW * 0.3);
                    var y = baseY + rand(-cellH * 0.25, cellH * 0.25);

                    // Push away from center exclusion zone
                    var dx = x - cx;
                    var dy = y - cy;
                    if (Math.abs(dx) < zoneW && Math.abs(dy) < zoneH) {
                        var angle = Math.atan2(dy || rand(-1, 1), dx || rand(-1, 1));
                        x = cx + Math.cos(angle) * (zoneW + rand(0, 80));
                        y = cy + Math.sin(angle) * (zoneH + rand(0, 60));
                    }

                    // Clamp to viewport margins
                    var marginX = 170;
                    var marginY = 160;
                    x = Math.max(marginX, Math.min(W - marginX, x));
                    y = Math.max(marginY, Math.min(H - marginY, y));

                    var rotation = rand(-10, 10);
                    var z = Math.floor(rand(5, 16));
                    var floatDur = rand(4, 7);
                    var floatDelay = rand(0, 3);
                    var kbDelay = rand(0, 8);
                    var appearDelay = 300 + idx * 120;

                    wrapper.style.left = x + 'px';
                    wrapper.style.top = y + 'px';
                    wrapper.style.setProperty('--z', z);

                    card.style.setProperty('--rot', rotation + 'deg');
                    card.style.setProperty('--float-dur', floatDur + 's');
                    card.style.setProperty('--float-delay', floatDelay + 's');
                    card.style.setProperty('--kb-delay', kbDelay + 's');

                    setTimeout(function () {
                        card.classList.add('visible');
                        startRotation(card, img, src);
                    }, appearDelay);
                };

                img.onerror = function () { card.style.display = 'none'; };

                card.appendChild(img);
                wrapper.appendChild(card);
                wall.appendChild(wrapper);
            })(i);
        }
    }

    // Debounced resize
    var resizeTimer = null;
    window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildWall, 300);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            buildWall();
            initBackground();
        });
    } else {
        buildWall();
        initBackground();
    }
})();
