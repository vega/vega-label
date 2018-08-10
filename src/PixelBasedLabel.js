/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import BitMap from './BitMap';
import MultiBitMap from './MultiBitMap';
import { Marks } from 'vega-scenegraph';
import { canvas } from 'vega-canvas';

var SIZE_FACTOR = 0.707106781186548;

var ALIGN = ['right', 'center', 'left'];
var BASELINE = ['bottom', 'middle', 'top'];

export default function placeLabels(data, anchors, marktype, marks, offsets, allowOutside) {
  var context = canvas().getContext("2d"),
      width, height,
      n = data.length,
      d, i, bitMap;
  console.time("pixel-based");

  if (!n) return data;

  width = data[0].datum.mark.group.width;
  height = data[0].datum.mark.group.height;
  bitMap = getMarkBitMap(data, width, height, marktype, marks, anchors, offsets);

  for (i = 0; i < n; i++) {
    d = data[i];

    if (d.markBound[0] < 0 || d.markBound[3] < 0 || d.markBound[2] > width || d.markBound[5] > height) {
      d.opacity = 0;
      continue;
    }

    if (placeLabel(d, bitMap, anchors, offsets, allowOutside, context)) {
      // placeLabel(d.searchBound, bitMap);
      d.opacity = d.originalOpacity;
    } else {
      d.opacity = 0;
    }
  }

  // bitMap.print('bit-map');
  console.timeEnd("pixel-based");
  return data;
}

function placeLabel(datum, bitMap, anchors, offsets, allowOutside, context) {
  var i, n = offsets.length,
      dx, dy,
      textWidth = datum.textWidth,
      textHeight = datum.textHeight,
      markBound = datum.markBound,
      text = datum.text, font = datum.font,
      w = bitMap.width, h = bitMap.height,
      isMiddle, sizeFactor, isIn;
  
  var x, sx,
      x1, xc, x2,
      y1, yc, y2,
      sbx1, sbx2,
      sby1, sby2;

  for (i = 0; i < n; i++) {
    dx = (anchors[i] & 0x3) - 1;
    dy = ((anchors[i] >>> 0x2) & 0x3) - 1;

    isMiddle = (dx === 0 && dy === 0);
    sizeFactor = (dx && dy) ? SIZE_FACTOR : 1;
    isIn = offsets[i] < 0 ? -1 : 1;

    yc = markBound[4 + dy] + (isIn * textHeight * dy / 2.0) + (offsets[i] * dy * sizeFactor);
    y1 = yc - (textHeight / 2.0);
    y2 = yc + (textHeight / 2.0);

    sby1 = bitMap.bin(y1);
    sby2 = bitMap.bin(y2);

    x = markBound[1 + dx] + (offsets[i] * dx * sizeFactor);
    sx = bitMap.bin(x);

    if (allowOutside) {
      sx = sx < 0 ? 0 : sx > w - 1 ? w - 1 : sx;
      sby1 = sby1 < 0 ? 0 : sby1 > h - 1 ? h - 1 : sby1;
      sby2 = sby2 < 0 ? 0 : sby2 > h - 1 ? h - 1 : sby2;
    }

    if (!textWidth) {
      if (bitMap.searchOutOfBound(sx, sby1, sx, sby2)) continue;
      if ((isMiddle || offsets[i] < 0) ? 
        (
          bitMap.getInBoundMultiBinned(sx, sby1, sx, sby2) ||
          !isInMarkBound(x, y1, x, y2, markBound)
        ) :
        (
          checkCollision(sx, sby1, sx, sby2, bitMap)
        )
      ) {
        continue;
      } else {
        textWidth = labelWidth(text, textHeight, font, context)
      }
    }

    xc = x + (isIn * textWidth * dx / 2.0);
    x1 = xc - (textWidth / 2.0);
    x2 = xc + (textWidth / 2.0);

    sbx1 = bitMap.bin(x1);
    sbx2 = bitMap.bin(x2);

    if (allowOutside) {
      sbx1 = sbx1 < 0 ? 0 : sbx1 > w - 1 ? w - 1 : sbx1;
      sbx2 = sbx2 < 0 ? 0 : sbx2 > w - 1 ? w - 1 : sbx2;
    }
    
    if (bitMap.searchOutOfBound(sbx1, sby1, sbx2, sby2)) continue;
    
    if (
      (isMiddle || offsets[i] < 0) ?
        (
          !bitMap.getInBoundMultiBinned(sbx1, sby1, sbx2, sby2) &&
          isInMarkBound(x1, y1, x2, y2, markBound)
        ) :
        (
          !checkCollision(sbx1, sby1, sbx2, sby2, bitMap)
        )
    ) {
      datum.x = !dx ? xc : (dx * isIn < 0 ? x2 : x1);
      datum.y = !dy ? yc : (dy * isIn < 0 ? y2 : y1);

      datum.align = ALIGN[(dx * isIn) + 1];
      datum.baseline = BASELINE[(dy * isIn) + 1];

      bitMap.markInBoundBinned(sbx1, sby1, sbx2, sby2);
      return true;
    }
  }
  return false;
}

function isInMarkBound(x1, y1, x2, y2, mb) {
  return mb[0] <= x1 && x2 <= mb[2] &&
         mb[3] <= y1 && y2 <= mb[5];
}

function checkCollision(x1, y1, x2, y2, bitMap) {
  return bitMap.getInBoundBinned(x1, y1, x2, y2);
}

function getMarkBitMap(data, width, height, marktype, marks, anchors, offsets) {
  var n = data.length, m = marks.length;

  if (!n) return null;
  var i, hasInner = false;

  for (i = 0; i < anchors.length; i++) {
    if (anchors[i] === 0x5) {
      hasInner = true;
      break;
    }
  }

  for (i = 0; i < offsets.length && !hasInner; i++) {
    if (offsets[i] < 0) {
      hasInner = true;
    }
  }

  var canvas, context,
      writeOnCanvas = m || (marktype && marktype !== 'line'),
      items, bitMap = hasInner ? new MultiBitMap(width, height) : new BitMap(width, height);

  if (writeOnCanvas) {
    canvas = document.getElementById('canvas-render');
    // canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
  }

  if (marktype && marktype !== 'line') {
    items = new Array(n);
    if (hasInner) {
      for (i = 0; i < n; i++) {
        items[i] = prepareMarkItem(data[i].datum.datum);
      }
    } else {
      for (i = 0; i < n; i++) {
        items[i] = data[i].datum.datum;
      }
    }
    Marks[items[0].mark.marktype].draw(context, {items: items}, null);
  }

  if (m) {
    var originalItems;

    for (i = 0; i < m; i++) {
      originalItems = marks[i];
      var itemsLen = originalItems.length;
      if (!itemsLen) continue;

      if (originalItems[0].mark.marktype !== 'group') {
        drawMark(context, originalItems, hasInner);
      } else {
        var j;
        for (j = 0; j < itemsLen; j++) {
          drawGroup(context, originalItems[j].items, hasInner);
        }
      }
    }
  }

  if (writeOnCanvas) {
    var imageData = context.getImageData(0, 0, width, height),
        canvasBuffer = new Uint32Array(imageData.data.buffer),
        alpha, x, y;
  
    for (y = 0; y < height; y++) { // make it faster by not checking every pixel.
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[(y * width) + x] & 0xff000000;
        if (alpha) {
          bitMap.mark(x, y);
          if (hasInner && alpha !== 0x10000000) {
            bitMap.mark(x, y);
          }
        }
      }
    }
  } else {
    var d;
    for (i = 0; i < n; i++) {
      d = data[i]
      bitMap.mark(d.markBound[0], d.markBound[3]);
    }
  }

  // bitMap.print('bit-map-before');

  return bitMap;
}

function drawMark(context, originalItems, hasInner) {
  var items, i, n = originalItems.length;
  if (hasInner) {
    items = new Array(n);
    for (i = 0; i < n; i++) {
      items[i] = prepareMarkItem(originalItems[i]);
    }
  } else {
    items = originalItems;
  }

  Marks[items[0].mark.marktype].draw(context, {items: items}, null);
}

function drawGroup(context, group, hasInner) {
  var n = group.length, i, g;
  for (i = 0; i < n; i++) {
    g = group[i];
    if (g.marktype !== 'group') {
      drawMark(context, g.items, hasInner);
    } else {
      var j;
      for (j = 0; j < g.items.length; j++) {
        drawGroup(context, g.items[j].items, hasInner); // nested group might not work.
      }
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
    item.fillOpacity = 0.0625;
    item.stroke = '#000';
    item.strokeOpacity = 1;
  }
  return item;
}

function labelWidth(text, fontSize, font, context) {
  context.font = fontSize + "px " + font; // add other font properties
  return context.measureText(text).width;
}