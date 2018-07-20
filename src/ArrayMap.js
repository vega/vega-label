export function ArrayMap(_width, _height, _binWidth, _binHeight) {
  this.binWidthSize = ~~_binWidth;
  this.binHeightSize = ~~_binHeight;
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
}
