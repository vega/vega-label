var DIV = 0x5;
var MOD = 0x1f;
export var SIZE = 0x20;
var right0 = new Uint32Array(SIZE + 1);
var right1 = new Uint32Array(SIZE + 1);

right1[0] = 0x0;
right0[0] = ~right1[0];
for (var i = 1; i <= SIZE; i++) {
  right1[i] = (right1[i - 1] << 0x1) | 0x1;
  right0[i] = ~right1[i];
}

export function BitMap(_width, _height) {
  var pixelSize = Math.sqrt(_width * _height / 1000000.0);
  pixelSize = pixelSize >= 1 ? pixelSize : 1;

  this.width = ~~((_width + pixelSize) / pixelSize);
  this.height = ~~((_height + pixelSize) / pixelSize);

  this.array = new Uint32Array(~~(((this.width * this.height) + SIZE) / SIZE));

  this.applyMark = function (index, mask) {
    this.array[index] |= mask;
  }

  this.applyUnmark = function (index, mask) {
    this.array[index] &= mask;
  }

  this.markBinned = function (x, y) {
    var mapIndex = (y * this.width) + x;
    this.applyMark(mapIndex >>> DIV, 1 << (mapIndex & MOD));
  };

  this.mark = function (x, y) {
    this.markBinned(this.bin(x), this.bin(y));
  };

  this.unmarkBinned = function(x, y) {
    var mapIndex = (y * this.width) + x;
    this.applyUnmark(mapIndex >>> DIV, ~(1 << (mapIndex & MOD)));
  };

  this.unmark = function(x, y) {
    this.unmarkBinned(this.bin(x), this.bin(y));
  };

  this.getBinned = function (x, y) {
    var mapIndex = (y * this.width) + x;
    return this.array[mapIndex >>> DIV] & (1 << (mapIndex & MOD));
  };

  this.get = function (x, y) {
    return this.getBinned(this.bin(x), this.bin(y));
  };

  this.markInBoundBinned = function (x, y, x2, y2) {
    var start, end,
        indexStart, indexEnd;
    for (; y <= y2; y++) {
      start = (y * this.width) + x;
      end = (y * this.width) + x2;
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

  this.markInBound = function (x, y, x2, y2) {
    return this.markInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
  };

  this.unmarkInBoundBinned = function (x, y, x2, y2) {
    var start, end,
        indexStart, indexEnd;
    for (; y <= y2; y++) {
      start = (y * this.width) + x;
      end = (y * this.width) + x2;
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

  this.unmarkInBound = function (x, y, x2, y2) {
    return this.unmarkInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
  };

  this.getInBoundBinned = function (x, y, x2, y2) {
    var start, end,
        indexStart, indexEnd;
    for (; y <= y2; y++) {
      start = (y * this.width) + x;
      end = (y * this.width) + x2;
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
  }

  this.getInBound = function (x, y, x2, y2) {
    return this.getInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
  }

  this.bin = function (coordinate) {
    return ~~(coordinate / pixelSize);
  };

  this.searchOutOfBound = function (bound) {
    return bound.x < 0 || bound.y < 0 || bound.y2 >= this.height || bound.x2 >= this.width;
  };

  this.print = function () {
    var x, y, string;
    for (y = 0; y < this.height; y++) {
      string = '';
      for (x = 0; x < this.width; x++) {
        string = string + (this.getBinned(x, y) === 0 ? '.' : 'x');
      }
      document.write('<p>' + string + '</p>');
    }
    //document.write('<p>' + string + '</p>');

  }
}
