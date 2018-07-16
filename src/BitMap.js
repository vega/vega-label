export function BitMap(_width, _height) {
  this.pixelSize = ~~(Math.min(_width, _height) / 1000.0);
  this.pixelSize = this.pixelSize ? this.pixelSize : 1;
  this.width = ~~((_width + this.pixelSize - 1) / this.pixelSize);
  this.height = ~~((_height + this.pixelSize - 1) / this.pixelSize);
  this.array = new Int8Array(~~(((this.width * this.height) + 8) / 8));

  this.markBinned = function (x, y) {
    var position = (x * this.height) + y;
    this.array[~~(position / 8)] |= 1<<(position & 0x7);
  };

  this.mark = function (x, y) {
    this.markBinned(this.bin(x), this.bin(y));
  };

  this.unmarkBinned = function(x, y) {
      var position = (x * this.height) + y;
      this.array[~~(position / 8)] &= ~(1<<(position & 0x7));
  }

  this.unmark = function(x, y) {
      this.unmarkBinned(this.bin(x), this.bin(y));
  }

  this.getBinned = function (x, y) {
    var position = (x * this.height) + y;
    return this.array[~~(position / 8)] & 1<<(position & 0x7);
  };

  this.get = function (x, y) {
    return this.getBinned(this.bin(x), this.bin(y));
  };

  this.bin = function (coordinate) {
    return ~~(coordinate / this.pixelSize);
  };
}
