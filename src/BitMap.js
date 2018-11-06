export var DIV = 0x5;
export var MOD = 0x1f;
export var SIZE = 0x20;
export var right0 = new Uint32Array(SIZE + 1);
export var right1 = new Uint32Array(SIZE + 1);

right1[0] = 0x0;
right0[0] = ~right1[0];
for (var i = 1; i <= SIZE; i++) {
  right1[i] = (right1[i - 1] << 0x1) | 0x1;
  right0[i] = ~right1[i];
}

export default function BitMap(_width, _height, padding) {
  var pixelSize = Math.sqrt((_width * _height) / 1000000.0);
  pixelSize = pixelSize >= 1 ? pixelSize : 1;

  this.padding = padding;

  this.width = ~~((_width + 2 * padding + pixelSize) / pixelSize);
  this.height = ~~((_height + 2 * padding + pixelSize) / pixelSize);

  this.array = new Uint32Array(~~((this.width * this.height + SIZE) / SIZE));

  this.pixelSize = function() {
    return pixelSize;
  };

  this.bin = function(coordinate) {
    return ~~((coordinate + padding) / pixelSize);
  };
}

BitMap.prototype.applyMark = function(index, mask) {
  this.array[index] |= mask;
};

BitMap.prototype.applyUnmark = function(index, mask) {
  this.array[index] &= mask;
};

BitMap.prototype.markBinned = function(x, y) {
  var mapIndex = y * this.width + x;
  this.applyMark(mapIndex >>> DIV, 1 << (mapIndex & MOD));
};

BitMap.prototype.mark = function(x, y) {
  this.markBinned(this.bin(x), this.bin(y));
};

BitMap.prototype.unmarkBinned = function(x, y) {
  var mapIndex = y * this.width + x;
  this.applyUnmark(mapIndex >>> DIV, ~(1 << (mapIndex & MOD)));
};

BitMap.prototype.unmark = function(x, y) {
  this.unmarkBinned(this.bin(x), this.bin(y));
};

BitMap.prototype.getBinned = function(x, y) {
  var mapIndex = y * this.width + x;
  return this.array[mapIndex >>> DIV] & (1 << (mapIndex & MOD));
};

BitMap.prototype.get = function(x, y) {
  return this.getBinned(this.bin(x), this.bin(y));
};

BitMap.prototype.markInBoundBinned = function(x, y, x2, y2) {
  var start, end, indexStart, indexEnd;
  for (; y <= y2; y++) {
    start = y * this.width + x;
    end = y * this.width + x2;
    indexStart = start >>> DIV;
    indexEnd = end >>> DIV;
    if (indexStart === indexEnd) {
      this.applyMark(indexStart, right0[start & MOD] & right1[(end & MOD) + 1]);
    } else {
      this.applyMark(indexStart, right0[start & MOD]);
      this.applyMark(indexEnd, right1[(end & MOD) + 1]);

      for (var i = indexStart + 1; i < indexEnd; i++) {
        this.applyMark(i, 0xffffffff);
      }
    }
  }
};

BitMap.prototype.markInBound = function(x, y, x2, y2) {
  return this.markInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
};

BitMap.prototype.unmarkInBoundBinned = function(x, y, x2, y2) {
  var start, end, indexStart, indexEnd;
  for (; y <= y2; y++) {
    start = y * this.width + x;
    end = y * this.width + x2;
    indexStart = start >>> DIV;
    indexEnd = end >>> DIV;
    if (indexStart === indexEnd) {
      this.applyUnmark(indexStart, right1[start & MOD] | right0[(end & MOD) + 1]);
    } else {
      this.applyUnmark(indexStart, right1[start & MOD]);
      this.applyUnmark(indexEnd, right0[(end & MOD) + 1]);

      for (var i = indexStart + 1; i < indexEnd; i++) {
        this.applyUnmark(i, 0x0);
      }
    }
  }
};

BitMap.prototype.unmarkInBound = function(x, y, x2, y2) {
  return this.unmarkInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
};

BitMap.prototype.getInBoundBinned = function(x, y, x2, y2) {
  var start, end, indexStart, indexEnd;
  for (; y <= y2; y++) {
    start = y * this.width + x;
    end = y * this.width + x2;
    indexStart = start >>> DIV;
    indexEnd = end >>> DIV;
    if (indexStart === indexEnd) {
      if (this.array[indexStart] & right0[start & MOD] & right1[(end & MOD) + 1]) return true;
    } else {
      if (this.array[indexStart] & right0[start & MOD]) return true;
      if (this.array[indexEnd] & right1[(end & MOD) + 1]) return true;

      for (var i = indexStart + 1; i < indexEnd; i++) {
        if (this.array[i]) return true;
      }
    }
  }
  return false;
};

BitMap.prototype.getInBound = function(x, y, x2, y2) {
  return this.getInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
};

BitMap.prototype.searchOutOfBound = function(x, y, x2, y2) {
  return x < 0 || y < 0 || y2 >= this.height || x2 >= this.width;
};

BitMap.prototype.print = function(id) {
  if (!arguments.length) id = 'bitmap';
  var x, y;
  var canvas = document.getElementById(id);
  if (!canvas) return;
  canvas.setAttribute('width', this.width);
  canvas.setAttribute('height', this.height);
  var ctx = canvas.getContext('2d');
  for (y = 0; y < this.height; y++) {
    for (x = 0; x < this.width; x++) {
      if (this.getBinned(x, y)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
};

BitMap.prototype.printContext = function(ctx) {
  var x, y;
  for (y = 0; y < this.height; y++) {
    for (x = 0; x < this.width; x++) {
      if (this.getBinned(x, y)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
};
