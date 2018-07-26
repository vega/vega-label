/*eslint no-unused-vars: "warn"*/
import {BitMap} from './BitMap';
var DIV = 0x5;
var MOD = 0x1f;
var SIZE = 0x20;

export function MultiBitMap(_width, _height) {
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
}

MultiBitMap.prototype = Object.create(BitMap.prototype);