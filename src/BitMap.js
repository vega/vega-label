var right0 = new Uint32Array(33);
var right1 = new Uint32Array(33);

right1[0] = 0x0;
right0[0] = ~right1[0];
for (var i = 1; i <= 32; i++) {
  right1[i] = (right1[i - 1] << 0x1) | 0x1;
  right0[i] = ~right1[i];
}

var DIV = 0x5;
var MOD = 0x1f;
var SIZE = 0x20


export function BitMap(_width, _height, _minTextHeight) {
  // this.pixelSize = ~~(Math.min(_width, _height) / 1000.0);
  // this.pixelSize = this.pixelSize >= 1 ? this.pixelSize : 1;
  this.pixelSize = 1;
  // this.width = ~~((_width + this.pixelSize) / this.pixelSize);
  // this.height = ~~((_height + this.pixelSize) / this.pixelSize);
  this.width = _width;
  this.height = _height;
  this.vSkip = _minTextHeight > 1 ? _minTextHeight : 1;
  this.array = new Uint32Array(~~(((this.width * this.height) + SIZE) / SIZE));

  this.markScaled = function (x, y) {
    var position = (y * this.width) + x;
    this.array[position >>> DIV] |= 1 << (position & MOD);
  };

  this.mark = function (x, y) {
    this.markScaled(this.bin(x), this.bin(y));
  };

  this.unmarkScaled = function(x, y) {
      var position = (y * this.width) + x;
      this.array[position >>> DIV] &= ~(1 << (position & MOD));
  }

  this.unmark = function(x, y) {
      this.unmarkScaled(this.bin(x), this.bin(y));
  }

  this.getScaled = function (x, y) {
    var position = (y * this.width) + x;
    return this.array[position >>> DIV] & (1 << (position & MOD));
  };

  this.get = function (x, y) {
    return this.getScaled(this.bin(x), this.bin(y));
  };

  this.getAllScaled = function (sx, sy, ex, ey) {
    var from, to,
        dFrom, dTo;
    for (; sy <= ey; sy++) {
      from = (sy * this.width) + sx;
      to = (sy * this.width) + ex;
      dFrom = from >>> DIV;
      dTo = to >>> DIV;
      if (dFrom === dTo) {
        if (this.array[dFrom] & right0[from & MOD] & right1[(to & MOD) + 1]) return true;
      } else {
        if (this.array[dFrom] & right0[from & MOD]) return true;
        if (this.array[dTo] & right1[(to & MOD) + 1]) return true;

        for (var i = dFrom + 1; i < dTo; i++) {
          if (this.array[i]) return true;
        }
      }
    }
    return false;
  }

  this.getAll = function (sx, sy, ex, ey) {
    return this.getRangeScaled(this.bin(sx), this.bin(sy), this.bin(ex), this.bin(ey));
  }

  this.setAllScaled = function (sx, sy, ex, ey) {
    var from, to,
        dFrom, dTo;
    for (; sy < ey; sy += this.vSkip) {
      from = (sy * this.width) + sx;
      to = (sy * this.width) + ex;
      dFrom = from >>> DIV;
      dTo = to >>> DIV;
      if (dFrom === dTo) {
        this.array[dFrom] |= right0[from & MOD] & right1[(to & MOD) + 1];
      } else {
        this.array[dFrom] |= right0[from & MOD];
        this.array[dTo] |= right1[(to & MOD) + 1];

        for (var i = dFrom + 1; i < dTo; i++) {
          this.array[i] = ~0x0;
        }
      }
    }
    from = (ey * this.width) + sx;
    to = (ey * this.width) + ex;
    dFrom = from >>> DIV;
    dTo = to >>> DIV;
    if (dFrom === dTo) {
      this.array[dFrom] |= right0[from & MOD] & right1[(to & MOD) + 1];
    } else {
      this.array[dFrom] |= right0[from & MOD];
      this.array[dTo] |= right1[(to & MOD) + 1];

      for (i = dFrom + 1; i < dTo; i++) {
        this.array[i] = ~0x0;
      }
    }
  }

  this.setRange = function (from, to) {
    var dFrom = from >>> DIV,
        dTo = to >>> DIV,
        i;
    if (dFrom === dTo) {
      this.array[dFrom] |= right0[from & MOD] & right1[(to & MOD) + 1];
    } else {
      this.array[dFrom] |= right0[from & MOD];
      this.array[dTo] |= right1[(to & MOD) + 1];

      for (i = dFrom + 1; i < dTo; i++) {
        this.array[i] = ~0x0;
      }
    }
  };

  this.bin = function (coordinate) {
    return ~~(coordinate / this.pixelSize);
    // return coordinate;
  };

  this.write = function(id, width, height) {
    var canvas = document.getElementById(id);
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    var ctx = canvas.getContext("2d");
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (this.get(x, y)) {
          ctx.fillStyle =  "black";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
}
