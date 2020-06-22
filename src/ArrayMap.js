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
    if (!this.array[this.getPosition(x, y)])
      this.array[this.getPosition(x, y)] = [];
    this.array[this.getPosition(x, y)].push(val);
  };

  this.add = function (x, y) {
    this.addBinned(this.binWidth(x), this.binHeight(y), [x, y]);
  };

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
