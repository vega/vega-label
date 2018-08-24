/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { labelWidth } from './Common';
import { checkCollision } from './PlaceLabel';

export default function(d, bm1, bm2, height, avoidBaseMark) {
  var x1, x2, y1, y2, x, y, lo, hi, mid, tmp;
  var pixelSize = bm2.pixelSize(),
    items = d.datum.datum.items[0].items,
    n = items.length,
    textHeight = d.textHeight,
    textWidth = labelWidth(d.text, textHeight, d.font),
    maxSize = textHeight,
    maxSize2 = 0,
    maxSize3 = 0,
    labelPlaced = false;

  for (var i = 0; i < n; i++) {
    x1 = items[i].x;
    y1 = items[i].y;
    x2 = items[i].x2 !== undefined ? items[i].x2 : x1;
    y2 = items[i].y2 !== undefined ? items[i].y2 : y1;

    // x = (x1 + x2) / 2.0;
    // y = (y1 + y2) / 2.0;
    if (x1 > x2) {
      tmp = x1;
      x1 = x2;
      x2 = tmp;
    }
    if (y1 > y2) {
      tmp = y1;
      y1 = y2;
      y2 = tmp;
    }

    if (!avoidBaseMark && !labelPlaced) {
      for (x = x1; x <= x2; x += pixelSize) {
        for (y = y1; y <= y2; y += pixelSize) {
          lo = maxSize2;
          hi = textHeight + 1;
          while (hi - lo > 1) {
            mid = (lo + hi) / 2.0;
            if (collisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, bm2)) hi = mid;
            else lo = mid;
          }
          if (
            lo > maxSize2 &&
            !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, bm1)
          ) {
            d.x = x;
            d.y = y;
            maxSize2 = lo;
          }
        }
      }
      if (maxSize2 === 0) {
        var size = x2 - x1 + y2 - y1;
        x = (x1 + x2) / 2.0;
        y = (y1 + y2) / 2.0;
        if (
          maxSize3 < size &&
          !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, bm1)
        ) {
          maxSize3 = size;
          d.x = x;
          d.y = y;
        }
      }
    }

    if (x1 === x2) {
      x1 -= ((textWidth * maxSize) / textHeight) * 0.5;
      x2 += ((textWidth * maxSize) / textHeight) * 0.5;
    }
    if (y1 === y2) {
      y1 -= maxSize * 0.5;
      y2 += maxSize * 0.5;
    }

    for (x = x1; x <= x2; x += pixelSize) {
      for (y = y1; y <= y2; y += pixelSize) {
        lo = maxSize;
        if (!collisionFromPositionAndHeight(textWidth, textHeight, x, y, lo, bm2)) {
          hi = height;
          while (hi - lo > 1) {
            mid = (lo + hi) / 2.0;
            if (collisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, bm2)) hi = mid;
            else lo = mid;
          }
          if (
            lo > maxSize &&
            !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, bm2)
          ) {
            // If we support dynamic font size
            // datum.fontSize = lo;
            d.x = x;
            d.y = y;
            maxSize = lo;
            labelPlaced = true;
          }
        }
      }
    }
  }

  if (labelPlaced || maxSize2 || maxSize3) {
    var bin = bm1.bin;
    x1 = bin(d.x - textWidth / 2.0);
    y1 = bin(d.y - textHeight / 2.0);
    x2 = bin(d.x + textWidth / 2.0);
    y2 = bin(d.y + textHeight / 2.0);
    bm1.markInBoundBinned(x1, y1, x2, y2);
    d.align = 'center';
    d.baseline = 'middle';
    return true;
  } else return false;
}

function collisionFromPositionAndHeight(textWidth, textHeight, x, y, h, bitMap) {
  var w = (h * textWidth) / textHeight,
    bin = bitMap.bin,
    x1 = bin(x - w / 2.0),
    y1 = bin(y - h / 2.0),
    x2 = bin(x + w / 2.0),
    y2 = bin(y + h / 2.0);
  return bitMap.searchOutOfBound(x1, y1, x2, y2) || checkCollision(x1, y1, x2, y2, bitMap);
}
