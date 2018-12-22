/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { labelWidth } from './Common';
import { checkCollision } from './PlaceLabel';

var X_DIR = [-1, -1, 1, 1];
var Y_DIR = [-1, 1, -1, 1];

export default function(d, bm1, bm2, bm3, width, height, avoidBaseMark) {
  var x1, x2, y1, y2, x, y, _x, _y, lo, hi, mid, areaWidth, coordinate, nextX, nextY;
  var pixelSize = bm2.pixelSize(),
    items = d.datum.datum.items[0].items,
    n = items.length,
    textHeight = d.textHeight,
    textWidth = labelWidth(d.text, textHeight, d.font),
    maxSize = avoidBaseMark ? textHeight : 0,
    labelPlaced = false,
    labelPlaced2 = false,
    scalePixel = bm1.scalePixel,
    list = new Stack(),
    // list = new Queue(),
    maxAreaWidth = 0;

  for (var i = 0; i < n; i++) {
    x1 = items[i].x;
    y1 = items[i].y;
    x2 = items[i].x2 !== undefined ? items[i].x2 : x1;
    y2 = items[i].y2 !== undefined ? items[i].y2 : y1;
    list.push(scalePixel((x1 + x2) / 2.0), scalePixel((y1 + y2) / 2.0));
    while (!list.isEmpty()) {
      coordinate = list.pop();
      _x = coordinate[0];
      _y = coordinate[1];
      if (!bm1.getBinned(_x, _y) && !bm2.getBinned(_x, _y) && !bm3.getBinned(_x, _y)) {
        bm3.markBinned(_x, _y);
        for (var j = 0; j < 4; j++) {
          nextX = _x + X_DIR[j];
          nextY = _y + Y_DIR[j];
          if (!bm3.searchOutOfBound(nextX, nextY, nextX, nextY)) list.push(nextX, nextY);
        }

        x = _x * pixelSize - bm1.padding;
        y = _y * pixelSize - bm1.padding;
        lo = maxSize;
        hi = height; // Todo: make this bound smaller;
        if (
          !checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) &&
          !collide(x, y, textHeight, textWidth, lo, bm1, bm2)
        ) {
          while (hi - lo >= 1) {
            mid = (lo + hi) / 2;
            if (collide(x, y, textHeight, textWidth, mid, bm1, bm2)) hi = mid;
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
        !collide(x, y, textHeight, textWidth, textHeight, bm1, null)
      ) {
        maxAreaWidth = areaWidth;
        d.x = x;
        d.y = y;
        labelPlaced2 = true;
      }
    }
  }

  // bm3.print('bit-map-before');

  if (labelPlaced || labelPlaced2) {
    x1 = scalePixel(d.x - textWidth / 2.0);
    y1 = scalePixel(d.y - textHeight / 2.0);
    x2 = scalePixel(d.x + textWidth / 2.0);
    y2 = scalePixel(d.y + textHeight / 2.0);
    bm1.markInBoundBinned(x1, y1, x2, y2);
    d.align = 'center';
    d.baseline = 'middle';
    return true;
  }

  d.align = 'left';
  d.baseline = 'top';
  return false;
}

function checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) {
  var x1 = x - textWidth / 2.0,
    x2 = x + textWidth / 2.0,
    y1 = y - textHeight / 2.0,
    y2 = y + textHeight / 2.0;
  return x1 < 0 || y1 < 0 || x2 > width || y2 > height;
}

function collide(x, y, textHeight, textWidth, h, bm1, bm2) {
  var w = (textWidth * h) / (textHeight * 2.0);
  h = h / 2.0;
  var bin = bm1.bin,
    _x1 = bin(x - w),
    _x2 = bin(x + w),
    _y1 = bin(y - h),
    _y2 = bin(y + h);
  return (
    bm1.searchOutOfBound(_x1, _y1, _x2, _y2) ||
    checkCollision(_x1, _y1, _x2, _y2, bm1) ||
    (bm2 ? checkCollision(_x1, _y1, _x2, _y2, bm2) : false)
  );
}

function Stack() {
  var size = 100;
  var xStack = new Int32Array(size);
  var yStack = new Int32Array(size);
  var idx = 0;

  function resize() {
    var newXStack = new Int32Array(size * 2),
      newYStack = new Int32Array(size * 2);

    for (var i = 0; i < idx; i++) {
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

function Queue() {
  var size = 1000;
  var xQueue = new Int32Array(size);
  var yQueue = new Int32Array(size);
  var start = 0;
  var end = 0;

  function resize() {
    var newXQueue = new Int32Array(size * 2),
      newYQueue = new Int32Array(size * 2);

    if (start <= end) {
      for (var i = 0; i + start < end; i++) {
        newXQueue[i] = xQueue[i + start];
        newYQueue[i] = yQueue[i + start];
      }
      end -= start;
    } else {
      for (i = 0; i + start < size; i++) {
        newXQueue[i] = xQueue[i + start];
        newYQueue[i] = yQueue[i + start];
      }
      for (i = 0; i < end; i++) {
        newXQueue[i + size - start] = xQueue[i];
        newYQueue[i + size - start] = yQueue[i];
      }
      end += size - start;
    }
    start = 0;
    size *= 2;
    xQueue = newXQueue;
    yQueue = newYQueue;
  }

  this.push = function(x, y) {
    if (end === start - 1) resize();
    xQueue[end] = x;
    yQueue[end] = y;
    end = (end + 1) % size;
  };

  this.pop = function() {
    if (start !== end) {
      var idx = start;
      start++;
      start %= size;
      return [xQueue[idx], yQueue[idx]];
    } else null;
  };

  this.peak = () => (start !== end ? [xQueue[start], yQueue[start]] : null);

  this.isEmpty = () => start !== end;
}

// export default function(d, bm1, bm2, bm3, width, height, avoidBaseMark) {
//   var x1, x2, y1, y2, x, y, lo, hi, mid, tmp;
//   var pixelSize = bm2.pixelSize(),
//     items = d.datum.datum.items[0].items,
//     n = items.length,
//     textHeight = d.textHeight,
//     textWidth = labelWidth(d.text, textHeight, d.font),
//     maxSize = textHeight,
//     maxSize2 = 0,
//     maxSize3 = 0,
//     labelPlaced = false;

//   for (var i = 0; i < n; i++) {
//     x1 = items[i].x;
//     y1 = items[i].y;
//     x2 = items[i].x2 !== undefined ? items[i].x2 : x1;
//     y2 = items[i].y2 !== undefined ? items[i].y2 : y1;

//     // x = (x1 + x2) / 2.0;
//     // y = (y1 + y2) / 2.0;
//     if (x1 > x2) {
//       tmp = x1;
//       x1 = x2;
//       x2 = tmp;
//     }
//     if (y1 > y2) {
//       tmp = y1;
//       y1 = y2;
//       y2 = tmp;
//     }

//     if (!avoidBaseMark && !labelPlaced) {
//       for (x = x1; x <= x2; x += pixelSize) {
//         for (y = y1; y <= y2; y += pixelSize) {
//           lo = maxSize2;
//           hi = textHeight + 1;
//           while (hi - lo > 1) {
//             mid = (lo + hi) / 2.0;
//             if (collisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, bm2)) hi = mid;
//             else lo = mid;
//           }
//           if (
//             lo > maxSize2 &&
//             !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, bm1)
//           ) {
//             d.x = x;
//             d.y = y;
//             maxSize2 = lo;
//           }
//         }
//       }
//       if (maxSize2 === 0) {
//         var size = x2 - x1 + y2 - y1;
//         x = (x1 + x2) / 2.0;
//         y = (y1 + y2) / 2.0;
//         if (
//           maxSize3 < size &&
//           !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, bm1)
//         ) {
//           maxSize3 = size;
//           d.x = x;
//           d.y = y;
//         }
//       }
//     }

//     if (x1 === x2) {
//       x1 -= ((textWidth * maxSize) / textHeight) * 0.5;
//       x2 += ((textWidth * maxSize) / textHeight) * 0.5;
//     }
//     if (y1 === y2) {
//       y1 -= maxSize * 0.5;
//       y2 += maxSize * 0.5;
//     }

//     for (x = x1; x <= x2; x += pixelSize) {
//       for (y = y1; y <= y2; y += pixelSize) {
//         lo = maxSize;
//         if (!collisionFromPositionAndHeight(textWidth, textHeight, x, y, lo, bm2)) {
//           hi = height;
//           while (hi - lo > 1) {
//             mid = (lo + hi) / 2.0;
//             if (collisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, bm2)) hi = mid;
//             else lo = mid;
//           }
//           if (
//             lo > maxSize &&
//             !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, bm2)
//           ) {
//             // If we support dynamic font size
//             // datum.fontSize = lo;
//             d.x = x;
//             d.y = y;
//             maxSize = lo;
//             labelPlaced = true;
//           }
//         }
//       }
//     }
//   }

//   if (labelPlaced || maxSize2 || maxSize3) {
//     var bin = bm1.bin;
//     x1 = bin(d.x - textWidth / 2.0);
//     y1 = bin(d.y - textHeight / 2.0);
//     x2 = bin(d.x + textWidth / 2.0);
//     y2 = bin(d.y + textHeight / 2.0);
//     bm1.markInBoundBinned(x1, y1, x2, y2);
//     d.align = 'center';
//     d.baseline = 'middle';
//     return true;
//   }
//   d.align = 'left';
//   d.baseline = 'top';
//   return false;
// }

// function collisionFromPositionAndHeight(textWidth, textHeight, x, y, h, bitMap) {
//   var w = (h * textWidth) / textHeight,
//     bin = bitMap.bin,
//     x1 = bin(x - w / 2.0),
//     y1 = bin(y - h / 2.0),
//     x2 = bin(x + w / 2.0),
//     y2 = bin(y + h / 2.0);
//   return bitMap.searchOutOfBound(x1, y1, x2, y2) || checkCollision(x1, y1, x2, y2, bitMap);
// }
