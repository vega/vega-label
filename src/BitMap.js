export const DIV = 0x5;
export const MOD = 0x1f;
export const SIZE = 0x20;
export const right0 = new Uint32Array(SIZE + 1);
export const right1 = new Uint32Array(SIZE + 1);

right1[0] = 0x0;
right0[0] = ~right1[0];
for (let i = 1; i <= SIZE; i++) {
  right1[i] = (right1[i - 1] << 0x1) | 0x1;
  right0[i] = ~right1[i];
}

export default class BitMap {
  constructor(width, height, padding) {
    let pixelSize = Math.sqrt((width * height) / 1000000.0);
    pixelSize = pixelSize >= 1 ? pixelSize : 1;

    this.padding = padding;

    this.width = ~~((width + 2 * padding + pixelSize) / pixelSize);
    this.height = ~~((height + 2 * padding + pixelSize) / pixelSize);

    this.array = new Uint32Array(~~((this.width * this.height + SIZE) / SIZE));

    /**
     * Get pixel size per pixel size of this bitmap
     * @returns pixel size per pixel size of thie bit map
     */
    this.pixelSize = function() {
      return pixelSize;
    };

    /**
     * Scale real pixel in the chart into bitmap pixel
     * @param realPixel the real pixel to be scaled down
     * @returns scaled pixel
     */
    this.bin = function(realPixel) {
      return ~~((realPixel + padding) / pixelSize);
    };
  }

  applyMark(index, mask) {
    this.array[index] |= mask;
  }

  applyUnmark(index, mask) {
    this.array[index] &= mask;
  }

  markBinned(x, y) {
    const mapIndex = y * this.width + x;
    this.applyMark(mapIndex >>> DIV, 1 << (mapIndex & MOD));
  }

  mark(x, y) {
    this.markBinned(this.bin(x), this.bin(y));
  }

  unmarkBinned(x, y) {
    const mapIndex = y * this.width + x;
    this.applyUnmark(mapIndex >>> DIV, ~(1 << (mapIndex & MOD)));
  }

  unmark(x, y) {
    this.unmarkBinned(this.bin(x), this.bin(y));
  }

  getBinned(x, y) {
    const mapIndex = y * this.width + x;
    return this.array[mapIndex >>> DIV] & (1 << (mapIndex & MOD));
  }

  get(x, y) {
    return this.getBinned(this.bin(x), this.bin(y));
  }

  markInBoundBinned(x, y, x2, y2) {
    let start, end, indexStart, indexEnd;
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

        for (let i = indexStart + 1; i < indexEnd; i++) {
          this.applyMark(i, 0xffffffff);
        }
      }
    }
  }

  markInBound(x, y, x2, y2) {
    return this.markInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
  }

  unmarkInBoundBinned(x, y, x2, y2) {
    let start, end, indexStart, indexEnd;
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

        for (let i = indexStart + 1; i < indexEnd; i++) {
          this.applyUnmark(i, 0x0);
        }
      }
    }
  }

  unmarkInBound(x, y, x2, y2) {
    return this.unmarkInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
  }

  getInBoundBinned(x, y, x2, y2) {
    let start, end, indexStart, indexEnd;
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

        for (let i = indexStart + 1; i < indexEnd; i++) {
          if (this.array[i]) return true;
        }
      }
    }
    return false;
  }

  getInBound(x, y, x2, y2) {
    return this.getInBoundBinned(this.bin(x), this.bin(y), this.bin(x2), this.bin(y2));
  }

  searchOutOfBound(x, y, x2, y2) {
    return x < 0 || y < 0 || y2 >= this.height || x2 >= this.width;
  }

  print(id) {
    if (!arguments.length) id = 'bitmap';
    let x, y;
    const canvas = document.getElementById(id);
    if (!canvas) return;
    canvas.setAttribute('width', this.width);
    canvas.setAttribute('height', this.height);
    const ctx = canvas.getContext('2d');
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        if (this.getBinned(x, y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  printContext(ctx) {
    let x, y;
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        if (this.getBinned(x, y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
}
