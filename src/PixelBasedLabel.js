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
  offsets,
  marktype,
  avoidMarks,
  allowOutside,
  size,
  avoidBaseMark,
  lineAnchor
) {
  console.time('pixel-based');
  var n = data.length;
  if (!n) return data;

  var width = size[0],
    height = size[1];

  var labelInside = marktype === 'group';
  for (var i = 0; i < anchors.length && !labelInside; i++) {
    labelInside = anchors[i] === 0x5 || offsets[i] < 0;
  }

  console.time('set-bitmap');
  var layer1 = new BitMap(width, height),
    layer2 = labelInside ? new BitMap(width, height) : undefined;
  markBitMap(data, layer1, layer2, width, height, marktype, avoidBaseMark, avoidMarks, labelInside);
  console.timeEnd('set-bitmap');

  var context = canvas().getContext('2d');
  var d, markBound;

  console.time('layout');
  if (marktype === 'group') {
    var group, items, endItem, m;
    var placeLabelInArea = avoidBaseMark ? placeLabelInAreaAvoidMark : placeLabelInAreaIgnoreMark;
    for (i = 0; i < n; i++) {
      d = data[i];
      group = d.datum.datum.items[0];
      items = group.items;
      m = items.length;
      if (!m) continue;

      if (group.marktype === 'area') {
        d.align = 'center';
        d.baseline = 'middle';
        if (placeLabelInArea(d, items, layer2, context, height)) d.opacity = d.originalOpacity;
      } else if (group.marktype === 'line') {
        endItem = items[lineAnchor === 'begin' ? m - 1 : 0];
        d.markBound = [endItem.x, endItem.x, endItem.x, endItem.y, endItem.y, endItem.y];
        if (placeLabel(d, layer1, layer2, anchors, offsets, allowOutside, context))
          d.opacity = d.originalOpacity;
      }
    }
  } else {
    for (i = 0; i < n; i++) {
      d = data[i];
      markBound = d.markBound;
      if (markBound[0] < 0 || markBound[3] < 0 || markBound[2] > width || markBound[5] > height)
        continue;
      if (placeLabel(d, layer1, layer2, anchors, offsets, allowOutside, context))
        d.opacity = d.originalOpacity;
    }
  }
  console.timeEnd('layout');
  // layer1.print('bit-map-1');
  // if (layer2) layer2.print('bit-map-2');
  console.timeEnd('pixel-based');
  return data;
}

function markBitMap(data, l1, l2, w, h, marktype, avoidBaseMark, avoidMarks, labelInside) {
  var n = data.length;
  if (!n) return null;

  if (marktype && avoidBaseMark) {
    var items = new Array(n);
    for (var i = 0; i < n; i++) {
      items[i] = data[i].datum.datum;
    }
    avoidMarks.push(items);
  }

  if (avoidMarks.length) {
    var context = writeToCanvas(avoidMarks, w, h, labelInside);
    writeToBitMaps(context, l1, l2, w, h, labelInside);
  } else if (avoidBaseMark) {
    for (i = 0; i < n; i++) {
      var d = data[i];
      l1.mark(d.markBound[0], d.markBound[3]);
    }
  }
}

function placeLabelInAreaIgnoreMark(datum, items, bitMap, context, _height) {
  var x1, x2, y1, y2, x, y;
  var n = items.length,
    textHeight = datum.textHeight,
    textWidth = labelWidth(datum.text, textHeight, datum.font, context);

  var bin = bitMap.bin,
    sortedItems = sortAreaItems(items);
  var item, _x1, _x2, _y1, _y2;

  for (var i = 0; i < n; i++) {
    item = sortedItems[i].item;
    x1 = item.x;
    y1 = item.y;
    x2 = item.x2 !== undefined ? item.x2 : x1;
    y2 = item.y2 !== undefined ? item.y2 : y1;

    x = (x1 + x2) / 2.0;
    y = (y1 + y2) / 2.0;

    _x1 = bin(x - textWidth / 2.0);
    _x2 = bin(x + textWidth / 2.0);
    _y1 = bin(y - textHeight / 2.0);
    _y2 = bin(y + textHeight / 2.0);

    if (
      !bitMap.searchOutOfBound(_x1, _y1, _x2, _y2) &&
      !checkCollision(_x1, _y1, _x2, _y2, bitMap)
    ) {
      datum.x = x;
      datum.y = y;
      bitMap.markInBoundBinned(_x1, _y1, _x2, _y2);
      return true;
    }
  }
  return false;
}

function placeLabelInAreaAvoidMark(datum, items, bitMap, context, height) {
  var x1, x2, y1, y2, x, y, tmp;
  var n = items.length,
    textHeight = datum.textHeight,
    textWidth = labelWidth(datum.text, textHeight, datum.font, context);

  var lo, hi, mid;
  var maxSize = textHeight,
    labelPlaced = false,
    pixelSize = bitMap.pixelSize();
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
        if (!collisionFromPositionAndHeight(textWidth, textHeight, x, y, lo, bitMap)) {
          while (hi - lo > 1) {
            mid = (lo + hi) / 2.0;
            if (collisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, bitMap)) hi = mid;
            else lo = mid;
          }
          if (lo > maxSize) {
            // If we support dynamic font size
            // datum.fontSize = lo;
            datum.x = x;
            datum.y = y;
            maxSize = lo;
            labelPlaced = true;
          }
        }
      }
    }
  }
  return labelPlaced;
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
  var dx, dy, isInside, sizeFactor, insideFactor;
  var x, x1, xc, x2, y1, yc, y2;
  var _x1, _x2, _y1, _y2;
  var bin = layer1.bin;

  for (var i = 0; i < n; i++) {
    dx = (anchors[i] & 0x3) - 1;
    dy = ((anchors[i] >>> 0x2) & 0x3) - 1;

    isInside = (dx === 0 && dy === 0) || offsets[i] < 0;
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
      if (isLabelPlacable(_x1, _x1, _y1, _y2, layer1, layer2, x, x, y1, y2, markBound, isInside))
        continue;
      else textWidth = labelWidth(text, textHeight, font, context);
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

    if (!isLabelPlacable(_x1, _x2, _y1, _y2, layer1, layer2, x1, x2, y1, y2, markBound, isInside)) {
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

function sortAreaItems(items) {
  var n = items.length,
    sortedItems = new Array();
  var sort, item;
  for (var i = 0; i < n; i++) {
    item = items[i];
    sort = item.x2 !== undefined ? item.x - item.x2 : item.y - item.y2;
    sort = sort < 0 ? -sort : sort;
    sortedItems[i] = { item: items[i], sort: sort };
  }

  sortedItems.sort(function(a, b) {
    return b.sort - a.sort;
  });

  return sortedItems;
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

function isInMarkBound(x1, y1, x2, y2, markBound) {
  return markBound[0] <= x1 && x2 <= markBound[2] && markBound[3] <= y1 && y2 <= markBound[5];
}

function isLabelPlacable(_x1, _x2, _y1, _y2, layer1, layer2, x1, x2, y1, y2, markBound, isInside) {
  return (
    layer1.searchOutOfBound(_x1, _y1, _x2, _y2) ||
    (isInside
      ? checkCollision(_x1, _y1, _x2, _y2, layer2) || !isInMarkBound(x1, y1, x2, y2, markBound)
      : checkCollision(_x1, _y1, _x2, _y2, layer1))
  );
}

function checkCollision(x1, y1, x2, y2, bitMap) {
  return (
    bitMap.getInBoundBinned(x1, y1, x2, y1) ||
    bitMap.getInBoundBinned(x1, y2, x2, y2) ||
    bitMap.getInBoundBinned(x1, y1 + 1, x2, y2 - 1)
  );
}

function writeToCanvas(avoidMarks, width, height, labelInside) {
  var m = avoidMarks.length,
    // c = document.getElementById('canvas-render'),
    c = document.createElement('canvas'),
    context = c.getContext('2d');
  var originalItems, itemsLen;
  c.setAttribute('width', width);
  c.setAttribute('height', height);

  for (var i = 0; i < m; i++) {
    originalItems = avoidMarks[i];
    itemsLen = originalItems.length;
    if (!itemsLen) continue;

    if (originalItems[0].mark.marktype !== 'group') drawMark(context, originalItems, labelInside);
    else drawGroup(context, originalItems, labelInside);
  }

  return context;
}

function writeToBitMaps(context, layer1, layer2, width, height, labelInside) {
  var imageData = context.getImageData(0, 0, width, height),
    canvasBuffer = new Uint32Array(imageData.data.buffer);

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
      if (alpha) {
        layer1.mark(x, y);
        if (labelInside && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.mark(x, y);
      }
    }
  }
  return [layer1, layer2];
}

function drawMark(context, originalItems, labelInside) {
  var n = originalItems.length;
  if (labelInside) {
    var items = new Array(n);
    for (var i = 0; i < n; i++) {
      items[i] = prepareMarkItem(originalItems[i]);
    }
  } else items = originalItems;

  Marks[items[0].mark.marktype].draw(context, { items: items }, null);
}

function drawGroup(context, groups, labelInside) {
  var n = groups.length;
  for (var i = 0; i < n; i++) {
    var g = groups[i].items[0];
    if (g.marktype !== 'group') drawMark(context, g.items, labelInside);
    else drawGroup(context, g.items, labelInside); // nested group might not work.
  }
}

function prepareMarkItem(originalItem) {
  var item = {};
  for (var key in originalItem) {
    item[key] = originalItem[key];
  }
  if (item.stroke) item.strokeOpacity = 1;

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
