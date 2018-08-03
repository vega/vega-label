/*eslint no-unused-vars: "warn"*/
import { default as BitMap, SIZE, MOD, DIV, right0, right1 } from './BitMap';

export default function MultiBitMap(_width, _height) {
  BitMap.call(this, _width, _height);
  this.arrayMulti = new Uint32Array(~~(((this.width * this.height) + SIZE) / SIZE));

  this.applyMark = function (index, mask) {
    this.arrayMulti[index] |= mask & this.array[index];
    this.array[index] |= mask;
  }

  this.applyUnmark = function (index, mask) {
    this.array[index] &= mask | this.arrayMulti[index];
    this.arrayMulti[index] &= mask;
  }

  this.getInBoundMultiBinned = function (x, y, x2, y2) {
    var start, end,
        indexStart, indexEnd;
    for (; y <= y2; y++) {
      start = (y * this.width) + x;
      end = (y * this.width) + x2;
      indexStart = start >>> DIV;
      indexEnd = end >>> DIV;
      if (indexStart === indexEnd) {
        if (this.arrayMulti[indexStart] & right0[start & MOD] & right1[(end & MOD) + 1]) return true;
      } else {
        if (this.arrayMulti[indexStart] & right0[start & MOD]) return true;
        if (this.arrayMulti[indexEnd] & right1[(end & MOD) + 1]) return true;

        for (var i = indexStart + 1; i < indexEnd; i++) {
          if (this.arrayMulti[i]) return true;
        }
      }
    }
    return false;
  }

  this.print = function (id) {
    if (!arguments.length) id = 'bitmap';
    var x, y;
    var canvas = document.getElementById(id);
    if (!canvas) return;
    canvas.setAttribute("width", this.width);
    canvas.setAttribute("height", this.height);
    var ctx = canvas.getContext("2d");
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        if (this.getBinned(x, y)) {
          ctx.fillStyle = "rgba(100, 100, 100, 1)";
          ctx.fillRect( x, y, 1, 1 );
        }
        if (this.getInBoundMultiBinned(x, y, x, y)) {
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.fillRect( x, y, 1, 1 );
        }
      }
    }
  }
}

MultiBitMap.prototype = Object.create(BitMap.prototype);