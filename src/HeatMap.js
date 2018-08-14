export default function HeatMap(_width, _height) {
  this.pixelSize = Math.ceil(Math.min(_width, _height) / 1000.0);
  this.width = ~~((_width + this.pixelSize - 1) / this.pixelSize);
  this.height = ~~((_height + this.pixelSize - 1) / this.pixelSize);
  this.array = new Int32Array(this.width * this.height);

  this.getPosition = function(x, y) {
    x = x >= this.width ? this.width - 1 : x < 0 ? 0 : x;
    y = y >= this.height ? this.height - 1 : y < 0 ? 0 : y;
    return x * this.height + y;
  };

  this.addBinned = function(x, y, val) {
    this.array[this.getPosition(x, y)] += val;
  };

  this.add = function(x, y, val) {
    this.addBinned(this.bin(x), this.bin(y), val);
  };

  this.getBinned = function(x, y) {
    return this.array[this.getPosition(x, y)];
  };

  this.get = function(x, y) {
    return this.getBinned(this.bin(x), this.bin(y));
  };

  this.bin = function(coordinate) {
    return ~~(coordinate / this.pixelSize);
  };
}
