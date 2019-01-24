/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { canvas } from 'vega-canvas';
import { labelWidth, checkCollision } from './Common';

const X_DIR = [-1, -1, 1, 1];
const Y_DIR = [-1, 1, -1, 1];

export default class PlaceLabelInArea {
  constructor(bitmaps, size, avoidBaseMark) {
    this.bm0 = bitmaps[0];
    this.bm1 = bitmaps[1];
    this.bm2 = bitmaps[2];
    this.width = size[0];
    this.height = size[1];
    this.avoidBaseMark = avoidBaseMark;
  }

  place(d) {
    const context = canvas().getContext('2d'),
      items = d.datum.datum.items[0].items,
      n = items.length,
      textHeight = d.textHeight,
      textWidth = labelWidth(context, d.text, textHeight, d.font),
      scalePixel = this.bm0.scalePixel,
      pixelRatio = this.bm1.pixelRatio(),
      list = new Stack();
    let maxSize = this.avoidBaseMark ? textHeight : 0,
      labelPlaced = false,
      labelPlaced2 = false,
      maxAreaWidth = 0;
    let x1, x2, y1, y2, x, y, _x, _y, lo, hi, mid, areaWidth, coordinate, nextX, nextY;

    for (let i = 0; i < n; i++) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 !== undefined ? items[i].x2 : x1;
      y2 = items[i].y2 !== undefined ? items[i].y2 : y1;
      list.push(scalePixel((x1 + x2) / 2.0), scalePixel((y1 + y2) / 2.0));
      while (!list.isEmpty()) {
        coordinate = list.pop();
        _x = coordinate[0];
        _y = coordinate[1];
        if (!this.bm0.getScaled(_x, _y) && !this.bm1.getScaled(_x, _y) && !this.bm2.getScaled(_x, _y)) {
          this.bm2.markScaled(_x, _y);
          for (let j = 0; j < 4; j++) {
            nextX = _x + X_DIR[j];
            nextY = _y + Y_DIR[j];
            if (!this.bm2.searchOutOfBound(nextX, nextY, nextX, nextY)) list.push(nextX, nextY);
          }

          x = _x * pixelRatio - this.bm0.padding;
          y = _y * pixelRatio - this.bm0.padding;
          lo = maxSize;
          hi = this.height; // Todo: make this bound smaller;
          if (
            !checkLabelOutOfBound(x, y, textWidth, textHeight, this.width, this.height) &&
            !collide(x, y, textHeight, textWidth, lo, this.bm0, this.bm1)
          ) {
            while (hi - lo >= 1) {
              mid = (lo + hi) / 2;
              if (collide(x, y, textHeight, textWidth, mid, this.bm0, this.bm1)) hi = mid;
              else lo = mid;
            }
            if (lo > maxSize) {
              d.x = x;
              d.y = y;
              maxSize = lo;
              labelPlaced = true;
            }
          }
        }
      }
      if (!labelPlaced && !this.avoidBaseMark) {
        areaWidth = Math.abs(x2 - x1 + y2 - y1);
        x = (x1 + x2) / 2.0;
        y = (y1 + y2) / 2.0;
        if (
          areaWidth >= maxAreaWidth &&
          !checkLabelOutOfBound(x, y, textWidth, textHeight, this.width, this.height) &&
          !collide(x, y, textHeight, textWidth, textHeight, this.bm0, null)
        ) {
          maxAreaWidth = areaWidth;
          d.x = x;
          d.y = y;
          labelPlaced2 = true;
        }
      }
    }

    if (labelPlaced || labelPlaced2) {
      x1 = scalePixel(d.x - textWidth / 2.0);
      y1 = scalePixel(d.y - textHeight / 2.0);
      x2 = scalePixel(d.x + textWidth / 2.0);
      y2 = scalePixel(d.y + textHeight / 2.0);
      this.bm0.markInRangeScaled(x1, y1, x2, y2);
      d.align = 'center';
      d.baseline = 'middle';
      return true;
    }

    d.align = 'left';
    d.baseline = 'top';
    return false;
  }
}

function checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) {
  const x1 = x - textWidth / 2.0,
    x2 = x + textWidth / 2.0,
    y1 = y - textHeight / 2.0,
    y2 = y + textHeight / 2.0;
  return x1 < 0 || y1 < 0 || x2 > width || y2 > height;
}

function collide(x, y, textHeight, textWidth, h, bm0, bm1) {
  const w = (textWidth * h) / (textHeight * 2.0);
  h = h / 2.0;
  const scalePixel = bm0.scalePixel,
    _x1 = scalePixel(x - w),
    _x2 = scalePixel(x + w),
    _y1 = scalePixel(y - h),
    _y2 = scalePixel(y + h);
  return (
    bm0.searchOutOfBound(_x1, _y1, _x2, _y2) ||
    checkCollision(_x1, _y1, _x2, _y2, bm0) ||
    (bm1 ? checkCollision(_x1, _y1, _x2, _y2, bm1) : false)
  );
}

class Stack {
  constructor() {
    this.size = 100;
    this.xStack = new Int32Array(this.size);
    this.yStack = new Int32Array(this.size);
    this.idx = 0;
  }

  push(x, y) {
    if (this.idx === this.size - 1) resize(this);
    this.xStack[this.idx] = x;
    this.yStack[this.idx] = y;
    this.idx++;
  }

  pop() {
    if (this.idx > 0) {
      this.idx--;
      return [this.xStack[this.idx], this.yStack[this.idx]];
    } else return null;
  }

  peak() {
    return this.idx > 0 ? [this.xStack[this.idx - 1], this.yStack[this.idx - 1]] : null;
  }

  isEmpty() {
    return this.idx <= 0;
  }
}

function resize(obj) {
  const newXStack = new Int32Array(obj.size * 2),
    newYStack = new Int32Array(obj.size * 2);

  for (let i = 0; i < obj.idx; i++) {
    newXStack[i] = obj.xStack[i];
    newYStack[i] = obj.yStack[i];
  }
  obj.xStack = newXStack;
  obj.yStack = newYStack;
  obj.size *= 2;
}