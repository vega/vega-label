export function ArrayMap(_width, _height, _binWidth, _binHeight, minTextWidth, minTextHeight) {
  this.binWidthSize = ~~_binWidth;
  this.binHeightSize = ~~_binHeight;
  this.minTextWidth = minTextWidth;
  this.minTextHeight = minTextHeight;
  this._width = _width;
  this.height = _height;
  this.width = ~~((_width + this.binWidthSize - 1) / this.binWidthSize);
  this.height = ~~((_height + this.binHeightSize - 1) / this.binHeightSize);
  this.array = new Array(this.width * this.height);

  this.getPosition = function (x, y) {
    x = x >= this.width ? this.width - 1 : (x < 0 ? 0 : x);
    y = y >= this.height ? this.height - 1 : (y < 0 ? 0 : y);
    return (x * this.height) + y;
  };

  this.addBinned = function (x, y, val) {
    var position = this.getPosition(x, y);
    if (!this.array[position])
      this.array[position] = [];
    this.array[position].push(val);
  };

  this.add = function (x, y) {
    this.addBinned(this.binWidth(x), this.binHeight(y), [x, y]);
  };

  this.sparseAdd = function (x, y, padding) {
    var x1 = Math.max(x - padding, 0);
    var x2 = Math.min(x + padding, this._width);
    var y1 = Math.max(y - padding, 0);
    var y2 = Math.min(y + padding, this._height);
    var bound = {
      x: x1,
      y: y1,
      x2: x2,
      y2: y2
    };
    if (!this.checkCollision(bound, this.getSearchBound(bound))) {
      this.add(x, y);
    }
  }

  this.addRect = function (x1, y1, x2, y2) {
    var y;
    for (; x1 < x2; x1 += this.minTextWidth) {
      for (y = y1; y < y2; y += this.minTextHeight) {
        this.add(x1, y);
      }
      this.add(x1, y2);
    }

    for (; y1 < y2; y1 += this.minTextHeight) {
      this.add(x2, y1);
    }
    this.add(x2, y2);
  }

  this.addWithData = function (x, y, data) {
    this.addBinned(this.binWidth(x), this.binHeight(y), [x, y, data]);
  };

  this.getBinned = function (x, y) {
    return this.array[this.getPosition(x, y)];
  };

  this.get = function (x, y) {
    return this.getBinned(this.binWidth(x), this.binHeight(y));
  };

  this.checkCollision = function(b, searchBound) {
    var x, y, p, bucket;

    for (x = searchBound.startX; x <= searchBound.endX; x++) {
      for (y = searchBound.startY; y <= searchBound.endY; y++) {
        bucket = this.getBinned(x, y);
        if (bucket) {
          for (p = 0; p < bucket.length; p++) {
            if (isIn(b, bucket[p])) return true;
          }
        }
      }
    }
    
    return false;
  }

  this.outOfBound = function(b) {
    return b.x < 0 || b.y < 0 || b.y2 >= this._height || b.x2 >= this._width;
  }

  this.getSearchBound = function(bound) {
    return {
      startX: this.binWidth(bound.x),
      startY: this.binHeight(bound.y),
      endX: this.binWidth(bound.x2),
      endY: this.binHeight(bound.y2),
    };
  }

  this.binWidth = function (coordinate) {
    return Math.floor(coordinate / this.binWidthSize);
  };

  this.binHeight = function (coordinate) {
    return Math.floor(coordinate / this.binHeightSize);
  };

  this.write = function(id, width, height) {
    var canvas = document.getElementById(id);
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    var ctx = canvas.getContext("2d");
    for (var i = 0; i < this.array.length; i++) {
      if (this.array[i]) {
        for (var j = 0; j < this.array[i].length; j++) {
          ctx.fillStyle = this.array[i][j].length == 3 ? this.array[i][j][2] : "black";
          ctx.fillRect(this.array[i][j][0], this.array[i][j][1], 1, 1);
        }
      }
    }
  }
}


function isIn(bound, point) {
  return (bound.x < point[0] && point[0] < bound.x2) &&
         (bound.y < point[1] && point[1] < bound.y2);
}