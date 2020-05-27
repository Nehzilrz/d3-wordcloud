(function(){
    if (typeof define == "function" && define.amd) define(["d3"], cloud);
    else cloud(this.d3);

    function cloud(d3) {
        d3.wordcloud = function cloud() {
            var size = [256, 256],
                text = cloudText,
                font = cloudFont,
                fontSize = cloudFontSize,
                fontStyle = cloudFontNormal,
                fontWeight = cloudFontNormal,
                padding = cloudPadding,
                keepBottom = cloudKeepBottom,
                words = [],
                centroid = [0, 0],
                timeInterval = Infinity,
                event = d3.dispatch("word", "end"),
                timer = null,
                polygon = [],
                d = 0.3,
                cloud = {};

            cloud.start = function() {
                var n = words.length,
                    i = -1,
                    data = words.map(function(d, i) {
                        d.text = text.call(this, d, i);
                        d.font = font.call(this, d, i);
                        d.style = fontStyle.call(this, d, i);
                        d.weight = fontWeight.call(this, d, i);
                        d.size = fontSize.call(this, d, i);
                        d.padding = padding.call(this, d, i);
                        d.keepBottom = keepBottom.call(this, d, i);
                        d.width0 = getWidth(d, 10) / 10
                        return d;
                    }).sort(function(a, b) { return b.size - a.size; });
                    
                var edge = [];
                for (var i = 0; i < polygon.length; ++i) {
                    var j = i == polygon.length - 1 ? 0 : i + 1;
                    edge.push(Line(polygon[i], polygon[j]));
                    centroid[0] += polygon[i][0]
                    centroid[1] += polygon[i][1]
                }
                centroid[0] /=  polygon.length
                centroid[1] /=  polygon.length

                var eps = 1e-8, index = [[], []], range = [[], []];
                var rect = [];

                range[0] = [Math.min(...polygon.map(d => d[0])), Math.max(...polygon.map(d => d[0]))]
                range[1] = [Math.min(...polygon.map(d => d[1])), Math.max(...polygon.map(d => d[1]))]
                range[0][0] = Math.floor(range[0][0]);
                range[0][1] = Math.ceil(range[0][1]);
                range[1][0] = Math.floor(range[1][0]);
                range[1][1] = Math.ceil(range[1][1]);

                edge.forEach(function(e){ createIndex(e); });

                data[0].x = centroid[0];
                data[0].y = centroid[1];
                var H = getH(centroid);
                var h = data[0].size;
                h = (d + 1) * (h / (2 * H[0])) / (d * h / (2 * H[0]) + 1) * H[0] +
                (d + 1) * (h / (2 * H[1])) / (d * h / (2 * H[1]) + 1) * H[1];
                var Ht = H[0], Hb = H[1];
                var w = data[0].width0 * h

                addRect([centroid[0] - w / 2, centroid[1] - h / 2], [centroid[0] + w / 2, centroid[1] + h / 2]);
                data[0].x -= w / 2;
                data[0].y -= h / 4;
                data[0].w = w;

                n = data.length;
                i = 0;
                data[0].size = h;

                if (timer) clearInterval(timer);
                timer = setInterval(step, 0);
                step();

                return cloud;

                function Line(x, y) {
                    return {
                        line : [x, y],
                        func : lineFunctor(x, y)
                    };
                }

                function createIndex(e) {
                    var x = e.line[0], y = e.line[1];
                    for (var d = 0; d < 2; ++d) {
                        var lo = Math.min(x[d], y[d]);
                        var hi = Math.max(x[d], y[d]);
                        lo = Math.floor(lo - eps) - range[d][0];
                        hi = Math.floor(hi + eps) + 1 - range[d][0];
                        for (var i = lo; i <= hi; ++i) {
                            if (index[d][i] == null)
                                index[d][i] = [];
                            index[d][i].push(e);
                        }
                    }
                }

                function addRect(x, y) {
                    rect.push([x, y]);
                    edge.push(Line(x, [y[0], x[1]]));
                    edge.push(Line(x, [x[0], y[1]]));
                    edge.push(Line([y[0], x[1]], y));
                    edge.push(Line([x[0], y[1]], y));
                    for (var i = edge.length - 4; i < edge.length; ++i) {
                        createIndex(edge[i]);
                    }
                }

                function check(x, y) {
                    for (var j = 0; j < rect.length; ++j) {
                        if ((rect[j][0][0] - eps < x[0] && x[0] < rect[j][1][0] + eps) ||
                            (rect[j][0][0] - eps < y[0] && y[0] < rect[j][1][0] + eps) ||
                            (x[0] - eps <= rect[j][0][0] && rect[j][1][0] <= y[0] + eps))
                            if ((rect[j][0][1] - eps < x[1] && x[1] < rect[j][1][1] + eps) ||
                                (rect[j][0][1] - eps < y[1] && y[1] < rect[j][1][1] + eps) ||
                                (x[1] - eps <= rect[j][0][1] && rect[j][1][1] <= y[1] + eps)) {
                                return false;
                            }
                    }
                    return true;
                }

                function intersects(d, p) {
                    var a = [];
                    p = Math.floor(p + eps);
                    try {
                        index[1 - d][p - range[1 - d][0]].forEach(function(e){
                            if (e.line[0][1-d] <= e.line[1][1-d]) {
                                if (!(e.line[0][1-d] - eps <= p && p <= e.line[1][1-d] + eps)) return;
                            }
                            else {
                                if (!(e.line[1][1-d] - eps <= p && p <= e.line[0][1-d] + eps)) return;
                            }
                            var t = d == 0 ? e.func.x(p) : e.func.y(p);
                            if (typeof t == "number") {
                                a.push(t);
                            } else if (t != null) {
                                t.forEach(function(t0){
                                    a.push(t0);
                                });
                            }
                        });
                    } catch (err) {
                        return [];
                    }

                    return a.sort(function(x, y){ return x - y; });
                }

                function getH(p) {
                    var lo = -1e10, hi = 1e10;
                    intersects(1, p[0]).forEach(function(t){
                        if (t < p[1] && t > lo) lo = t;
                        else if (t >= p[1] && t < hi) hi = t;
                    });
                    if (p + eps < centroid[1]) {
                        if (hi > centroid[1]) hi = centroid[1];
                    }
                    else if (p > centroid[1] + eps) {
                        if (lo < centroid[1]) lo = centroid[1];
                    }
                    return [Math.abs(p[1] - lo), Math.abs(hi - p[1])];
                }

                function getW(p) {
                    var lo = -1e10, hi = 1e10;
                    intersects(0, p[1]).forEach(function(t){
                        if (t < p[0] && t > lo) lo = t;
                        else if (t >= p[0] && t < hi) hi = t;
                    });
                    if (lo == -1e10 || hi == 1e10) return null;
                    return [Math.abs(p[0] - lo), Math.abs(hi - p[0])];
                }

                function step() {
                    var start = Date.now();
                    while (Date.now() - start < timeInterval && ++i < n && timer) {
                        var x, y, w, h, h0;
                        h0 = data[i].size;
                        var flag = 0;
                        for (var delta = 0; centroid[1] - delta >= range[1][0] || centroid[1] + delta <= range[1][1]; delta += 2) {
                            for (var k = 0, l = centroid[1] - delta; k < 2; ++k, l += delta * 2) {
                                if (data[i].keepBottom && l < centroid[1]) continue
                                if (l < range[1][0] || l > range[1][1] || (delta == 0 && k == 0)) continue;
                                var val = intersects(0, l);
                                for (var j = 0; j < val.length; j += 2) if (val[j + 1] != null) {
                                    var mid;
                                    if (val[j] < centroid[0] && centroid[0] < val[j + 1]) {
                                        mid = centroid[0];
                                    }
                                    else {
                                        mid = (val[j] + val[j + 1]) / 2;
                                    }
                                    var H = getH([mid, l]), W = getW([mid, l]);
                                    if (H == null || W == null) continue;
                                    if (delta == 0) {
                                        h = (d + 1) * (h0 / (2 * H[0])) / (d * h0 / (2 * H[0]) + 1) * H[0] +
                                            (d + 1) * (h0 / (2 * H[1])) / (d * h0 / (2 * H[1]) + 1) * H[1];
                                    }
                                    else if (k == 0) {
                                        h = (d + 1) * ((H[1] + h0 / 2) / Ht) / (d * (H[1] + h0 / 2) / Ht + 1) * Ht -
                                        (d + 1) * ((H[1] - h0 / 2) / Ht) / (d * (H[1] - h0 / 2) / Ht + 1) * Ht;
                                    }
                                    else if (k == 1) {
                                        h = (d + 1) * ((H[0] + h0 / 2) / Hb) / (d * (H[0] + h0 / 2) / Hb + 1) * Hb -
                                        (d + 1) * ((H[0] - h0 / 2) / Hb) / (d * (H[0] - h0 / 2) / Hb + 1) * Hb;
                                    }
                                    w = data[i].width0 * h;

                                    if (H[0] < h / 2 || H[1] < h / 2) continue;
                                    if (W[0] + W[1] < w) continue;
                                    if (W[0] < w / 2 || W[1] < w / 2) mid = (val[n] + val[n + 1]) / 2;
                                    var W0 = getW([mid, l - h / 2]), W1 = getW([mid, l + h / 2]);
                                    if (W0 == null || W1 == null) continue;
                                    if (W0[0] < w / 2 || W0[1] < w / 2 || W1[0] < w / 2 || W1[1] < w / 2) continue;
                                    var H0 = getH([mid - w / 2, l]), H1 = getH([mid + w / 2, l]);
                                    if (H0 == null || H1 == null) continue;
                                    if (H0[0] < h / 2 || H0[1] < h / 2 || H1[0] < h / 2 || H1[1] < h / 2) continue;
                                    if (!check([mid - w / 2, l - h / 2], [mid + w / 2, l + h / 2])) continue;

                                    var d0;
                                    if (mid < centroid[0]) {
                                        d0 = Math.min(centroid[0] - mid, Math.min(W[1], W0[1], W1[1]) - w / 2);
                                    } else {
                                        d0 = -Math.min(mid - centroid[0], Math.min(W[0], W1[0], W0[0]) - w / 2);
                                    }
                                    mid += d0;

                                    if (flag == 1 && Math.abs(centroid[0] - data[i].x) > Math.abs(centroid[0] - mid)) {
                                        data[i].x = mid - w / 2;
                                        data[i].y = l - h / 2;
                                        data[i].size = h;
                                        data[i].w = w;
                                    }
                                    else if (flag == 0) {
                                        data[i].x = mid - w / 2;
                                        data[i].y = l - h / 2;
                                        data[i].size = h;
                                        data[i].w = w;
                                        flag = 1;
                                    }
                                }
                            }
                            if (flag) break;
                        }
                        x = data[i].x; y = data[i].y; w = data[i].w; h = data[i].size;
                        addRect([x, y], [x + w, y + h]);
                    }
                    //console.log('totalTime', totalTime)
                    if (i >= n) {
                        cloud.stop();
                        event.call('end', cloud, data);
                    }
                }
            };

            cloud.stop = function() {
                if (timer) {
                    clearInterval(timer);
                    timer = null;
                }
                return cloud;
            };

            cloud.timeInterval = function(_) {
                return arguments.length ? (timeInterval = _ == null ? Infinity : _, cloud) : timeInterval;
            };

            cloud.words = function(_) {
                return arguments.length ? (words = _, cloud) : words;
            };

            cloud.size = function(_) {
                if (arguments.length) {
                    size = [+_[0], +_[1]]
                    polygon = [[0, 0], [size[0], 0], [size[0], size[1]], [0, size[1]]]
                    return cloud
                } else {
                    return size
                }
            };

            cloud.font = function(_) {
                return arguments.length ? (font = () => _, cloud) : font;
            };

            cloud.d = function(_) {
                return arguments.length ? (d = _, cloud) : d;
            };

            cloud.fontStyle = function(_) {
                return arguments.length ? (fontStyle = _, cloud) : fontStyle;
            };

            cloud.fontWeight = function(_) {
                return arguments.length ? (fontWeight = _, cloud) : fontWeight;
            };

            cloud.polygon = function(_) {
                return arguments.length ? (polygon = _, cloud) : polygon;
            };

            cloud.text = function(_) {
                return arguments.length ? (text = _, cloud) : text;
            };

            cloud.keepBottom = function(_) {
                return arguments.length ? (keepBottom = _, cloud) : keepBottom;
            };

            cloud.fontSize = function(_) {
                return arguments.length ? (fontSize = _, cloud) : fontSize;
            };

            cloud.padding = function(_) {
                return arguments.length ? (padding = _, cloud) : padding;
            };

            return rebind(cloud, event, "on");
        };

        function rebind(target, source) {
            var i = 1,
                n = arguments.length,
                method;
            while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
            return target;
        };

        function d3_rebind(target, source, method) {
          return function() {
            var value = method.apply(source, arguments);
            return value === source ? target : value;
          };
        }
        
        function d3_functor(v) {
          return typeof v === "function" ? v : function() { return v; };
        }
        
        function lineFunctor(p, q) {
            function functor(p, q) {
                if (p[0] == q[0]) return function(x) {
                    if (Math.abs(x - p[0]) <= 1)
                        return [p[0], q[0]];
                    else return null;
                };
                var k = (p[1] - q[1]) / (p[0] - q[0]);
                var b = p[1] - k * p[0];
                return function(x){
                    return k * x + b;
                }
            }
            return {
                x : functor(p.reverse(), q.reverse()),
                y : functor(p.reverse(), q.reverse())
            }
        }

        function cloudText(d) {
            return d.text;
        }

        function cloudFont() {
            return "Impact";
        }

        function cloudFontNormal() {
            return "normal";
        }

        function cloudFontSize(d) {
            return Math.sqrt(d.value);
        }

        function cloudKeepBottom(d) {
            return false
        }

        function cloudPadding() {
            return 1;
        }

        function getWidth(d, h) {
            c.save();
            c.font = d.style + " " + d.weight + " " + (h ) + "px " + d.font;
            var w = c.measureText(d.text).width * ratio;
            c.restore();
            return w;
        }

        var cw = 1 << 11 >> 5,
            ch = 1 << 11,
            canvas;

        if (typeof document !== "undefined") {
            canvas = document.createElement("canvas");
            canvas.width = 1;
            canvas.height = 1;
            ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
            canvas.width = (cw << 5) / ratio;
            canvas.height = ch / ratio;
        } else {
            canvas = new Canvas(cw << 5, ch);
        }

        var c = canvas.getContext("2d");
        c.fillStyle = c.strokeStyle = "red";
        c.textAlign = "center";
    }
})();
