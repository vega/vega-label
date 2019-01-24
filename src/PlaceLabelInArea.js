/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { canvas } from 'vega-canvas';
import { labelWidth } from './Common';
import { printBitMap } from './BitMap';
import { checkCollision } from './PlaceLabel';

const X_DIR = [-1, -1, 1, 1];
const Y_DIR = [-1, 1, -1, 1];

export default function(d, bitmaps, width, height, avoidBaseMark) {
  const context = canvas().getContext('2d'),
    bm0 = bitmaps[0],
    bm1 = bitmaps[1],
    bm2 = bitmaps[2],
    items = d.datum.datum.items[0].items,
    n = items.length,
    textHeight = d.textHeight,
    textWidth = labelWidth(context, d.text, textHeight, d.font),
    scalePixel = bm0.scalePixel,
    pixelRatio = bm1.pixelRatio(),
    list = new Stack();
  let maxSize = avoidBaseMark ? textHeight : 0,
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
      if (!bm0.getScaled(_x, _y) && !bm1.getScaled(_x, _y) && !bm2.getScaled(_x, _y)) {
        bm2.markScaled(_x, _y);
        for (let j = 0; j < 4; j++) {
          nextX = _x + X_DIR[j];
          nextY = _y + Y_DIR[j];
          if (!bm2.searchOutOfBound(nextX, nextY, nextX, nextY)) list.push(nextX, nextY);
        }

        x = _x * pixelRatio - bm0.padding;
        y = _y * pixelRatio - bm0.padding;
        lo = maxSize;
        hi = height; // Todo: make this bound smaller;
        if (
          !checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) &&
          !collide(x, y, textHeight, textWidth, lo, bm0, bm1)
        ) {
          while (hi - lo >= 1) {
            mid = (lo + hi) / 2;
            if (collide(x, y, textHeight, textWidth, mid, bm0, bm1)) hi = mid;
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
    if (!labelPlaced && !avoidBaseMark) {
      areaWidth = Math.abs(x2 - x1 + y2 - y1);
      x = (x1 + x2) / 2.0;
      y = (y1 + y2) / 2.0;
      if (
        areaWidth >= maxAreaWidth &&
        !checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) &&
        !collide(x, y, textHeight, textWidth, textHeight, bm0, null)
      ) {
        maxAreaWidth = areaWidth;
        d.x = x;
        d.y = y;
        labelPlaced2 = true;
      }
    }
  }

  printBitMap(bm1, 'bit-map-before');

  if (labelPlaced || labelPlaced2) {
    x1 = scalePixel(d.x - textWidth / 2.0);
    y1 = scalePixel(d.y - textHeight / 2.0);
    x2 = scalePixel(d.x + textWidth / 2.0);
    y2 = scalePixel(d.y + textHeight / 2.0);
    bm0.markInRangeScaled(x1, y1, x2, y2);
    d.align = 'center';
    d.baseline = 'middle';
    return true;
  }

  d.align = 'left';
  d.baseline = 'top';
  return false;
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

function Stack() {
  let size = 100;
  let xStack = new Int32Array(size);
  let yStack = new Int32Array(size);
  let idx = 0;

  function resize() {
    const newXStack = new Int32Array(size * 2),
      newYStack = new Int32Array(size * 2);

    for (let i = 0; i < idx; i++) {
      newXStack[i] = xStack[i];
      newYStack[i] = yStack[i];
    }
    xStack = newXStack;
    yStack = newYStack;
    size *= 2;
  }

  this.push = function(x, y) {
    if (idx === size - 1) resize();
    xStack[idx] = x;
    yStack[idx] = y;
    idx++;
  };

  this.pop = function() {
    if (idx > 0) {
      idx--;
      return [xStack[idx], yStack[idx]];
    } else return null;
  };

  this.peak = () => (idx > 0 ? [xStack[idx - 1], yStack[idx - 1]] : null);

  this.isEmpty = () => idx <= 0;
}
