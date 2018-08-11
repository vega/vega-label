/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import BitMap from './BitMap';
// import MultiBitMap from './MultiBitMap';
import { Marks } from 'vega-scenegraph';
import { canvas } from 'vega-canvas';

var SIZE_FACTOR = 0.707106781186548;
var ALIGN = ['right', 'center', 'left'];
var BASELINE = ['bottom', 'middle', 'top'];

export default function placeLabels(data, anchors, marktype, marks, offsets, allowOutside) {
  var context = canvas().getContext("2d"),
      width, height,
      n = data.length,
      d, i, bitMaps, layer1, layer2,
      markBound;
  console.time("pixel-based");

  if (!n) return data;

  width = data[0].datum.mark.group.width;
  height = data[0].datum.mark.group.height;
  console.time("set-bitmap");
  bitMaps = getMarkBitMap(data, width, height, marktype, marks, anchors, offsets);
  layer1 = bitMaps[0];
  layer2 = bitMaps[1]
  console.timeEnd("set-bitmap");

  console.time("layout");
  for (i = 0; i < n; i++) {
    d = data[i];
    markBound = d.markBound;

    if (markBound[0] < 0 || markBound[3] < 0 || markBound[2] > width || markBound[5] > height) {
      continue;
    }

    if (placeLabel(d, layer1, layer2, anchors, offsets, allowOutside, context)) {
      d.opacity = d.originalOpacity;
    }
  }
  console.timeEnd("layout");

  // bitMap.print('bit-map');
  console.timeEnd("pixel-based");
  return data;
}

function placeLabel(datum, layer1, layer2, anchors, offsets, allowOutside, context) {
  var i, n = offsets.length,
      dx, dy,
      textWidth = datum.textWidth,
      textHeight = datum.textHeight,
      markBound = datum.markBound,
      text = datum.text, font = datum.font,
      w = layer1.width, h = layer1.height,
      isMiddle, sizeFactor, isIn;
  
  var x, searchX,
      x1, xc, x2,
      y1, yc, y2,
      searchBoundX1, searchBoundX2,
      searchBoundY1, searchBoundY2;

  for (i = 0; i < n; i++) {
    dx = (anchors[i] & 0x3) - 1;
    dy = ((anchors[i] >>> 0x2) & 0x3) - 1;

    isMiddle = (dx === 0 && dy === 0);
    sizeFactor = (dx && dy) ? SIZE_FACTOR : 1;
    isIn = offsets[i] < 0 ? -1 : 1;

    yc = markBound[4 + dy] + (isIn * textHeight * dy / 2.0) + (offsets[i] * dy * sizeFactor);
    y1 = yc - (textHeight / 2.0);
    y2 = yc + (textHeight / 2.0);

    searchBoundY1 = layer1.bin(y1);
    searchBoundY2 = layer1.bin(y2);

    x = markBound[1 + dx] + (offsets[i] * dx * sizeFactor);
    searchX = layer1.bin(x);

    if (allowOutside) {
      searchX = searchX < 0 ? 0 : searchX > w - 1 ? w - 1 : searchX;
      searchBoundY1 = searchBoundY1 < 0 ? 0 : searchBoundY1 > h - 1 ? h - 1 : searchBoundY1;
      searchBoundY2 = searchBoundY2 < 0 ? 0 : searchBoundY2 > h - 1 ? h - 1 : searchBoundY2;
    }

    if (!textWidth) {
      if (layer1.searchOutOfBound(searchX, searchBoundY1, searchX, searchBoundY2)) continue;
      var end = searchX + (searchBoundY2 - searchBoundY1) * (~~(text.length / 3));
      if ((isMiddle || offsets[i] < 0) ? 
        ( checkCollision(searchX, searchBoundY1, end, searchBoundY2, layer2) || !isInMarkBound(x, y1, x, y2, markBound) ) :
          checkCollision(searchX, searchBoundY1, end, searchBoundY2, layer1) ) {
        continue;
      } else {
        textWidth = labelWidth(text, textHeight, font, context)
      }
    }

    xc = x + (isIn * textWidth * dx / 2.0);
    x1 = xc - (textWidth / 2.0);
    x2 = xc + (textWidth / 2.0);

    searchBoundX1 = layer1.bin(x1);
    searchBoundX2 = layer1.bin(x2);

    if (allowOutside) {
      searchBoundX1 = searchBoundX1 < 0 ? 0 : searchBoundX1 > w - 1 ? w - 1 : searchBoundX1;
      searchBoundX2 = searchBoundX2 < 0 ? 0 : searchBoundX2 > w - 1 ? w - 1 : searchBoundX2;
    }
    
    if (layer1.searchOutOfBound(searchBoundX1, searchBoundY1, searchBoundX2, searchBoundY2)) continue;
    
    if ((isMiddle || offsets[i] < 0) ?
      ( !checkCollision(searchBoundX1, searchBoundY1, searchBoundX2, searchBoundY2, layer2) && isInMarkBound(x1, y1, x2, y2, markBound) ) :
        !checkCollision(searchBoundX1, searchBoundY1, searchBoundX2, searchBoundY2, layer1) ) {
      datum.x = !dx ? xc : (dx * isIn < 0 ? x2 : x1);
      datum.y = !dy ? yc : (dy * isIn < 0 ? y2 : y1);

      datum.align = ALIGN[(dx * isIn) + 1];
      datum.baseline = BASELINE[(dy * isIn) + 1];

      layer1.markInBoundBinned(searchBoundX1, searchBoundY1, searchBoundX2, searchBoundY2);
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
  if (bitMap.getInBoundBinned(x1, y1, x2, y1) || bitMap.getInBoundBinned(x1, y2, x2, y2)) return true;
  return bitMap.getInBoundBinned(x1, y1 + 1, x2, y2 - 1);
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

  for (i = 0; i < offsets.length; i++) {
    if (offsets[i] < 0) {
      hasInner = true;
      break;
    }
  }

  var c, context, items,
      writeOnCanvas = m || (marktype && marktype !== 'line'),
      layer1 = new BitMap(width, height),
      layer2 = hasInner ? new BitMap(width, height) : null;

  if (writeOnCanvas) {
    // c = document.getElementById('canvas-render');
    c = document.createElement('canvas');
    context = c.getContext('2d');
    c.setAttribute("width", width);
    c.setAttribute("height", height);
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
          layer1.mark(x, y);
          if (hasInner && alpha !== 0x10000000) { // opacity !== 0.0625
            layer2.mark(x, y);
          }
        }
      }
    }
  } else {
    var d;
    for (i = 0; i < n; i++) {
      d = data[i]
      layer1.mark(d.markBound[0], d.markBound[3]);
    }
  }

  // bitMap.print('bit-map-before');

  return [layer1, layer2];
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