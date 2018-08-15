/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import BitMap from './BitMap';
import { Marks } from 'vega-scenegraph';
import { canvas } from 'vega-canvas';

var SIZE_FACTOR = 0.707106781186548;
var ALIGN = ['right', 'center', 'left'];
var BASELINE = ['bottom', 'middle', 'top'];
var ALPHA_MASK = 0xff000000;
var INSIDE_OPACITY_IN_ALPHA = 0x10000000; // opacity at 0.0625 in alpha
var INSIDE_OPACITY = 0.0625;

export default function placeLabels(
  data,
  anchors,
  marktype,
  avoidMarks,
  offsets,
  allowOutside,
  size
) {
  console.time('pixel-based');
  var n = data.length;
  if (!n) return data;

  var width = size[0],
    height = size[1];

  console.time('set-bitmap');
  var bitMaps = getMarkBitMap(data, width, height, marktype, avoidMarks, anchors, offsets),
    layer1 = bitMaps[0],
    layer2 = bitMaps[1];
  console.timeEnd('set-bitmap');

  var context = canvas().getContext('2d');
  var d, i, markBound;

  console.time('layout');
  if (marktype === 'group') {
    var group, items, lastItem, m, j;
    for (i = 0; i < n; i++) {
      d = data[i];
      group = d.datum.datum.items[0];
      items = group.items;

      if (group.marktype === 'area') {
        if (placeLabelInArea(d, items, layer2, height, context)) {
          d.opacity = d.originalOpacity;
        }
      } else if (group.marktype === 'line') {
        m = items.length;
        if (!m) continue;

        lastItem = items[0];
        for (j = 1; j < m; j++) {
          lastItem = items[j].x > lastItem.x ? items[j] : lastItem;
        }

        d.markBound = [lastItem.x, lastItem.x, lastItem.x, lastItem.y, lastItem.y, lastItem.y];
        if (placeLabel(d, layer1, layer2, anchors, offsets, allowOutside, context)) {
          d.opacity = d.originalOpacity;
        }
      } else {
        console.log('Vega-Label right now only supports line and area in group mark');
      }
    }
  } else {
    for (i = 0; i < n; i++) {
      d = data[i];
      markBound = d.markBound;

      if (markBound[0] < 0 || markBound[3] < 0 || markBound[2] > width || markBound[5] > height)
        continue;

      if (placeLabel(d, layer1, layer2, anchors, offsets, allowOutside, context)) {
        d.opacity = d.originalOpacity;
      }
    }
  }
  console.timeEnd('layout');
  // layer1.print('bit-map-1');
  // if (layer2) layer2.print('bit-map-2');
  console.timeEnd('pixel-based');
  return data;
}

function placeLabelInArea(datum, items, bitMap, height, context) {
  var x1, x2, y1, y2, x, y;
  var lo, hi, mid, tmp;
  var textHeight = datum.textHeight,
    textWidth = labelWidth(datum.text, textHeight, datum.font, context),
    maxSize = textHeight,
    labelPlaced = false,
    pixelSize = bitMap.pixelSize(),
    n = items.length;
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
        hi = height;
        if (!checkCollisionFromPositionAndHeight(textWidth, textHeight, x, y, lo, bitMap)) {
          while (hi - lo > 1) {
            mid = (lo + hi) / 2.0;
            if (checkCollisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, bitMap)) {
              hi = mid;
            } else {
              lo = mid;
            }
          }
          if (lo > maxSize) {
            datum.x = x;
            datum.y = y;
            maxSize = lo;
            labelPlaced = true;
          }
        }
      }
    }
  }
  datum.align = 'center';
  datum.baseline = 'middle';
  return labelPlaced;
}

function checkCollisionFromPositionAndHeight(textWidth, textHeight, x, y, h, bitMap) {
  var w = (h * textWidth) / textHeight,
    bin = bitMap.bin,
    x1 = bin(x - w / 2.0),
    y1 = bin(y - h / 2.0),
    x2 = bin(x + w / 2.0),
    y2 = bin(y + h / 2.0);

  if (bitMap.searchOutOfBound(x1, y1, x2, y2)) return true;

  return checkCollision(x1, y1, x2, y2, bitMap);
}

function placeLabel(datum, layer1, layer2, anchors, offsets, allowOutside, context) {
  var n = offsets.length,
    textWidth = datum.textWidth,
    textHeight = datum.textHeight,
    markBound = datum.markBound,
    text = datum.text,
    font = datum.font,
    w = layer1.width,
    h = layer1.height;
  var dx, dy, isMiddle, sizeFactor, insideFactor;
  var x, x1, xc, x2, y1, yc, y2;
  var _x1, _x2, _y1, _y2;
  var bin = layer1.bin;

  for (var i = 0; i < n; i++) {
    dx = (anchors[i] & 0x3) - 1;
    dy = ((anchors[i] >>> 0x2) & 0x3) - 1;

    isMiddle = dx === 0 && dy === 0;
    sizeFactor = dx && dy ? SIZE_FACTOR : 1;
    insideFactor = offsets[i] < 0 ? -1 : 1;

    yc = markBound[4 + dy] + (insideFactor * textHeight * dy) / 2.0 + offsets[i] * dy * sizeFactor;
    y1 = yc - textHeight / 2.0;
    y2 = yc + textHeight / 2.0;

    _y1 = bin(y1);
    _y2 = bin(y2);

    x = markBound[1 + dx] + offsets[i] * dx * sizeFactor;
    _x1 = bin(x);

    if (allowOutside) {
      _x1 = _x1 < 0 ? 0 : _x1 > w - 1 ? w - 1 : _x1;
      _y1 = _y1 < 0 ? 0 : _y1 > h - 1 ? h - 1 : _y1;
      _y2 = _y2 < 0 ? 0 : _y2 > h - 1 ? h - 1 : _y2;
    }

    if (!textWidth) {
      // var end = _x1 + (_y2 - _y1) * (~~(text.length / 3));
      if (layer1.searchOutOfBound(_x1, _y1, _x1, _y2)) continue;
      if (
        isMiddle || offsets[i] < 0
          ? checkCollision(_x1, _y1, _x1, _y2, layer2) || !isInMarkBound(x, y1, x, y2, markBound)
          : checkCollision(_x1, _y1, _x1, _y2, layer1)
      ) {
        continue;
      } else {
        textWidth = labelWidth(text, textHeight, font, context);
      }
    }

    xc = x + (insideFactor * textWidth * dx) / 2.0;
    x1 = xc - textWidth / 2.0;
    x2 = xc + textWidth / 2.0;

    _x1 = bin(x1);
    _x2 = bin(x2);

    if (allowOutside) {
      _x1 = _x1 < 0 ? 0 : _x1 > w - 1 ? w - 1 : _x1;
      _x2 = _x2 < 0 ? 0 : _x2 > w - 1 ? w - 1 : _x2;
    }

    if (layer1.searchOutOfBound(_x1, _y1, _x2, _y2)) continue;

    if (
      isMiddle || offsets[i] < 0
        ? !checkCollision(_x1, _y1, _x2, _y2, layer2) && isInMarkBound(x1, y1, x2, y2, markBound)
        : !checkCollision(_x1, _y1, _x2, _y2, layer1)
    ) {
      datum.x = !dx ? xc : dx * insideFactor < 0 ? x2 : x1;
      datum.y = !dy ? yc : dy * insideFactor < 0 ? y2 : y1;

      datum.align = ALIGN[dx * insideFactor + 1];
      datum.baseline = BASELINE[dy * insideFactor + 1];

      layer1.markInBoundBinned(_x1, _y1, _x2, _y2);
      return true;
    }
  }
  return false;
}

function isInMarkBound(x1, y1, x2, y2, markBound) {
  return markBound[0] <= x1 && x2 <= markBound[2] && markBound[3] <= y1 && y2 <= markBound[5];
}

function checkCollision(x1, y1, x2, y2, bitMap) {
  if (bitMap.getInBoundBinned(x1, y1, x2, y1) || bitMap.getInBoundBinned(x1, y2, x2, y2))
    return true;
  return bitMap.getInBoundBinned(x1, y1 + 1, x2, y2 - 1);
}

function getMarkBitMap(data, width, height, marktype, avoidMarks, anchors, offsets) {
  var n = data.length,
    hasInner = false;

  if (!n) return null;

  for (var i = 0; i < anchors.length; i++) {
    if (anchors[i] === 0x5 || offsets[i] < 0) {
      hasInner = true;
      break;
    }
  }

  if (marktype === 'group') hasInner = true;

  if (marktype) {
    originalItems = new Array(n);
    for (i = 0; i < n; i++) {
      originalItems[i] = data[i].datum.datum;
    }
    avoidMarks.push(originalItems);
  }

  var m = avoidMarks.length,
    layer1 = new BitMap(width, height),
    layer2 = hasInner ? new BitMap(width, height) : undefined;

  if (m) {
    var c, context, originalItems, itemsLen;
    c = document.getElementById('canvas-render');
    // c = document.createElement('canvas');
    context = c.getContext('2d');
    c.setAttribute('width', width);
    c.setAttribute('height', height);

    for (i = 0; i < m; i++) {
      originalItems = avoidMarks[i];
      itemsLen = originalItems.length;
      if (!itemsLen) continue;

      if (originalItems[0].mark.marktype !== 'group') {
        drawMark(context, originalItems, hasInner);
      } else {
        drawGroup(context, originalItems, hasInner);
      }
    }

    var imageData = context.getImageData(0, 0, width, height),
      canvasBuffer = new Uint32Array(imageData.data.buffer);
    var alpha, x, y;

    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        if (alpha) {
          layer1.mark(x, y);
          if (hasInner && alpha !== INSIDE_OPACITY_IN_ALPHA) {
            layer2.mark(x, y);
          }
        }
      }
    }
  } else {
    var d;
    for (i = 0; i < n; i++) {
      d = data[i];
      layer1.mark(d.markBound[0], d.markBound[3]);
    }
  }

  // bitMap.print('bit-map-before');

  return [layer1, layer2];
}

function drawMark(context, originalItems, hasInner) {
  var items,
    n = originalItems.length;
  if (hasInner) {
    items = new Array(n);
    for (var i = 0; i < n; i++) {
      items[i] = prepareMarkItem(originalItems[i]);
    }
  } else {
    items = originalItems;
  }

  Marks[items[0].mark.marktype].draw(context, { items: items }, null);
}

function drawGroup(context, groups, hasInner) {
  var n = groups.length,
    g;
  for (var i = 0; i < n; i++) {
    g = groups[i].items[0];
    if (g.marktype !== 'group') {
      drawMark(context, g.items, hasInner);
    } else {
      drawGroup(context, g.items, hasInner); // nested group might not work.
    }
  }
}

function prepareMarkItem(originalItem) {
  var item = {};
  for (var key in originalItem) {
    item[key] = originalItem[key];
  }
  if (item.stroke) {
    item.strokeOpacity = 1;
  }
  if (item.fill) {
    item.fillOpacity = INSIDE_OPACITY;
    item.stroke = '#000';
    item.strokeOpacity = 1;
  }
  return item;
}

function labelWidth(text, fontSize, font, context) {
  context.font = fontSize + 'px ' + font; // TODO: add other font properties
  return context.measureText(text).width;
}
