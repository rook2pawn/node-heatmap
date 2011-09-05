var convert = require('color-convert');

if (process.argv) {
    var Canvas = (require)('canvas');
}

function createCanvas (width, height) {
    if (typeof Canvas !== 'undefined') {
        return new Canvas(width, height);
    }
    else {
        var canvas = document.createElement('canvas');
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        return canvas;
    }
}

var exports = module.exports = function (canvas) {
    var opts = {};
    
    if (typeof canvas !== 'object') {
        canvas = createCanvas(arguments[0], arguments[1]);
        opts = arguments[2] || {};
    }
    else if (!canvas) {
        canvas = createCanvas(500, 500);
    }
    else if (Object.getPrototypeOf(canvas) === Object.prototype) {
        opts = canvas;
        if (opts.canvas) {
            canvas = opts.canvas;
        }
        else if (opts.width && opts.height) {
            canvas = createCanvas(opts.width, opts.height);
        }
    }
    return new Heat(canvas, opts)
};

exports.Heat = Heat;

function Heat (canvas, opts) {
    if (!opts) opts = {};
    
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.alphaCanvas = createCanvas(this.width, this.height);
    this.radius = opts.radius || 20;
    this.threshold = opts.threshold || 0;
    this.scalar = { x : 1, y : 1 };
}

Heat.prototype.scale = function (x, y) {
    if (y === undefined) y = x;
    
    this.scalar.x = x;
    this.scalar.y = y;
    
    this.canvas.width = this.width * x;
    this.canvas.height = this.height * y;
    
    this.canvas.getContext('2d').scale(x, y);
    
    return this;
};

Heat.prototype.addPoint = function (x, y, params) {
    var ctx = this.alphaCanvas.getContext('2d');
    if (typeof params === 'number') {
        params = { radius : params };
    }
    if (!params) params = {};
    var radius = params.radius || this.radius;
    
    var g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    var a = params.weight || (1 / 10);
    
    g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    
    return this;
};

Heat.prototype.draw = function () {
    var width = this.canvas.width;
    var height = this.canvas.height;
    var ctx = this.alphaCanvas.getContext('2d');
    
    var values = ctx.getImageData(0, 0, this.width, this.height);
    var heat = ctx.createImageData(width, height);
    
    for (var hy = 0; hy < height; hy+=2) {
        var vy = Math.floor(hy / this.scalar.y);
        
        for (var hx = 0; hx < width; hx+=2) {
            var vx = Math.floor(hx / this.scalar.x);
            var vi = 4 * (vy * this.width + vx);
            var hi = 4 * (hy * width + hx);
            
            var v = values.data[vi + 3];
            if (v > this.threshold) {
                var theta = (1 - v / 255) * 270;
                var rgb = convert.hsl2rgb(theta, 100, 50);
                var r= rgb[0];
                var g= rgb[1]; 
                var b = rgb[2];
                var a = v;
                    
                heat.data[hi] = heat.data[hi+4] = heat.data[hi+con] = heat.data[hi+con+4] = r;
                heat.data[hi+1] = heat.data[hi+5] = heat.data[hi+con+1] = heat.data[hi+con+5] = g;
                heat.data[hi+2] = heat.data[hi+6] = heat.data[hi+con+2] = heat.data[hi+con+6] = b;
                heat.data[hi+3] = heat.data[hi+7] = heat.data[hi+con+3] = heat.data[hi+con+7] = v;
            }
        }
    }
    
    this.canvas.getContext('2d').putImageData(heat, 0, 0);
    
    return this;
};
