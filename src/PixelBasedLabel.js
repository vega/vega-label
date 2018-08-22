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
  size,
  avoidBaseMark,
  primaryMarkInGroup,
  padding
) {
  console.time('pixel-based');
  var n = data.length;
  if (!n) return data;

  var width = size[0],
    height = size[1];

  var labelInside = false;
  for (var i = 0; i < anchors.length && !labelInside; i++) {
    labelInside = anchors[i] === 0x5 || offsets[i] < 0;
  }

  console.time('set-bitmap');
  var bitMaps, layer1, layer2;
  bitMaps = initializeBitMap(
    data,
    width,
    height,
    marktype,
    avoidBaseMark,
    avoidMarks,
    labelInside,
    padding
  );
  layer1 = bitMaps[0];
  layer2 = bitMaps[1];
  console.timeEnd('set-bitmap');

  var context = canvas().getContext('2d');
  var d, mb;
  var isGroupArea = marktype === 'group' && data[0].datum.datum.items[primaryMarkInGroup].marktype;

  console.time('layout');
  if (isGroupArea === 'area') {
    var items;
    // placeLabelInArea = placeLabelInAreaFactory(avoidBaseMark, layer1, layer2, context);
    for (i = 0; i < n; i++) {
      d = data[i];
      d.align = 'center';
      d.baseline = 'middle';
      items = d.datum.datum.items[0].items;
      if (placeLabelInArea(d, items, height, avoidBaseMark, layer1, layer2, context))
        d.opacity = d.originalOpacity;
    }
  } else {
    for (i = 0; i < n; i++) {
      d = data[i];
      mb = d.markBound;
      if (mb[2] < 0 || mb[5] < 0 || mb[0] > width || mb[3] > height) continue;
      if (placeLabel(d, layer1, layer2, anchors, offsets, context)) d.opacity = d.originalOpacity;
    }
  }

  console.timeEnd('layout');
  layer1.print('bit-map-1');
  if (layer2) layer2.print('bit-map-2');
  console.timeEnd('pixel-based');
  return data;
}

function initializeBitMap(
  data,
  width,
  height,
  marktype,
  avoidBaseMark,
  avoidMarks,
  labelInside,
  padding
) {
  var n = data.length;
  if (!n) return null;

  var isGroupArea = marktype === 'group' && data[0].datum.datum.items[0].marktype === 'area';
  if (marktype && (avoidBaseMark || isGroupArea)) {
    var items = new Array(n);
    for (var i = 0; i < n; i++) {
      items[i] = data[i].datum.datum;
    }
    avoidMarks.push(items);
  }

  if (avoidMarks.length) {
    var context = writeToCanvas(avoidMarks, width, height, labelInside || isGroupArea);
    return writeToBitMaps(context, width, height, labelInside, isGroupArea, padding);
  } else {
    var bitMap = new BitMap(width, height, padding);
    if (avoidBaseMark) {
      for (i = 0; i < n; i++) {
        var d = data[i];
        bitMap.mark(d.markBound[0], d.markBound[3]);
      }
    }
    return [bitMap, undefined];
  }
}

function placeLabelInArea(datum, items, height, avoidBaseMark, layer1, layer2, context) {
  var x1, x2, y1, y2, x, y;
  var pixelSize = layer2.pixelSize();
  var n = items.length,
    textHeight = datum.textHeight,
    textWidth = labelWidth(datum.text, textHeight, datum.font, context),
    maxSize = textHeight,
    maxSize2 = 0,
    maxSize3 = 0,
    labelPlaced = false;

  var lo, hi, mid, tmp;
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
            if (collisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, layer2)) hi = mid;
            else lo = mid;
          }
          if (
            lo > maxSize2 &&
            !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, layer1)
          ) {
            datum.x = x;
            datum.y = y;
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
          !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, layer1)
        ) {
          maxSize3 = size;
          datum.x = x;
          datum.y = y;
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
        if (!collisionFromPositionAndHeight(textWidth, textHeight, x, y, lo, layer2)) {
          lo = maxSize;
          hi = height;
          while (hi - lo > 1) {
            mid = (lo + hi) / 2.0;
            if (collisionFromPositionAndHeight(textWidth, textHeight, x, y, mid, layer2)) hi = mid;
            else lo = mid;
          }
          if (
            lo > maxSize &&
            !collisionFromPositionAndHeight(textWidth, textHeight, x, y, textHeight, layer2)
          ) {
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
  if (labelPlaced || maxSize2 || maxSize3) {
    var bin = layer1.bin;
    x1 = bin(datum.x - textWidth / 2.0);
    y1 = bin(datum.y - textHeight / 2.0);
    x2 = bin(datum.x + textWidth / 2.0);
    y2 = bin(datum.y + textHeight / 2.0);
    layer1.markInBoundBinned(x1, y1, x2, y2);
    return true;
  }
  return false;
}

function placeLabel(datum, layer1, layer2, anchors, offsets, context) {
  var n = offsets.length,
    textWidth = datum.textWidth,
    textHeight = datum.textHeight,
    markBound = datum.markBound,
    text = datum.text,
    font = datum.font;
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

function writeToBitMaps(context, width, height, labelInside, isGroupArea, padding) {
  var layer1 = new BitMap(width, height, padding),
    layer2 = labelInside || isGroupArea ? new BitMap(width, height, padding) : undefined,
    imageData = context.getImageData(0, 0, width, height),
    canvasBuffer = new Uint32Array(imageData.data.buffer);
  var x, y, alpha;

  if (isGroupArea) {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        if (alpha && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.mark(x, y);
      }
    }
  } else {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        if (alpha) {
          layer1.mark(x, y);
          if (labelInside && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.mark(x, y);
        }
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
  var n = groups.length,
    marks;
  for (var i = 0; i < n; i++) {
    marks = groups[i].items;
    for (var j = 0; j < marks.length; j++) {
      var g = marks[j];
      if (g.marktype !== 'group') drawMark(context, g.items, labelInside);
      else drawGroup(context, g.items, labelInside); // nested group might not work.
    }
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
