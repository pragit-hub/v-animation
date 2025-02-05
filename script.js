window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));

var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;
    
    var mobile = window.isDevice;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');

    // Scale for high-DPI screens
    var scale = window.devicePixelRatio || 1;
    canvas.width = innerWidth * scale;
    canvas.height = innerHeight * scale;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.scale(scale, scale);

    var width = canvas.width / scale;
    var height = canvas.height / scale;
    var rand = Math.random;

    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, width, height);

    var heartPosition = function (rad) {
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener('resize', function () {
        init(); // Reinitialize on resize for sharpness
    });

    var traceCount = mobile ? 30 : 60;
    var size1 = mobile ? 100 : 210;
    var size2 = mobile ? 6 : 13;
    
    var pointsOrigin = [];
    for (var i = 0; i < Math.PI * 2; i += 0.1) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), size1, size2, 0, 0));
    }
    
    var heartPointsCount = pointsOrigin.length;
    var targetPoints = [];

    var pulse = function (kx, ky) {
        for (var i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [
                kx * pointsOrigin[i][0] + width / 2,
                ky * pointsOrigin[i][1] + height / 2
            ];
        }
    };

    var particles = [];
    for (var i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        particles[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: "hsl(" + ~~(rand() * 20 + 350) + ", 100%, " + ~~(rand() * 30 + 50) + "%)",
            trace: new Array(traceCount).fill({x, y})
        };
    }

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var loop = function () {
        var n = -Math.cos(time);
        pulse((1 + n) * 0.5, (1 + n) * 0.5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;

        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, width, height);

        for (var i = particles.length; i--;) {
            var p = particles[i];
            var q = targetPoints[p.q];
            var dx = p.trace[0].x - q[0];
            var dy = p.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);

            if (length < 10) {
                if (0.95 < rand()) {
                    p.q = ~~(rand() * heartPointsCount);
                } else {
                    if (0.99 < rand()) {
                        p.D *= -1;
                    }
                    p.q += p.D;
                    p.q %= heartPointsCount;
                    if (p.q < 0) {
                        p.q += heartPointsCount;
                    }
                }
            }

            p.vx += -dx / length * p.speed;
            p.vy += -dy / length * p.speed;
            p.trace[0].x += p.vx;
            p.trace[0].y += p.vy;
            p.vx *= p.force;
            p.vy *= p.force;

            for (var k = 0; k < p.trace.length - 1;) {
                var T = p.trace[k];
                var N = p.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }

            ctx.fillStyle = p.f;
            for (k = 0; k < p.trace.length; k++) {
                ctx.fillRect(p.trace[k].x, p.trace[k].y, 2, 2);
            }
        }
        window.requestAnimationFrame(loop);
    };
    loop();
};

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init, false);

