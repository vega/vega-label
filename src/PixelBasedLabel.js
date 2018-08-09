/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
// import BitMap from './BitMap';
import MultiBitMap from './MultiBitMap';
import { Marks } from 'vega-scenegraph';
import BitMap from './BitMap';

var SIZE_FACTOR = 0.707106781186548;

export default function placeLabels(data, size, anchors, marktype, marks, offsets) {
  var width = 0, height = 0,
      // bitMaps = {},
      n = data.length,
      d, i, bitMap;

  if (size) {
    width = size[0];
    height = size[1];
  } else {
    for (i = 0; i < n; i++) {
      d = data[i];
      width = Math.max(width, d.x + d.textWidth);
      height = Math.max(height, d.y + d.textHeight);
    }
  }
  bitMap = getMarkBitMap(data, width, height, marktype, marks, anchors, offsets);

  for (i = 0; i < n; i++) {
    d = data[i];
    findAvailablePosition(d, bitMap, anchors, offsets);

    if (d.labelPlaced) {
      placeLabel(d.searchBound, bitMap);
      d.fill = d.originalFillAndStroke.fill;
      d.stroke = d.originalFillAndStroke.stroke;
    } else {
      d.fill = undefined;
      d.stroke = undefined;
    }
  }

  // bitMap.print('bit-map');
  return data;
}

function findAvailablePosition(datum, bitMap, anchors, offsets) {
  var i, j, searchBound,
      n = offsets.length,
      m = anchors.length,
      dx, dy;

  datum.labelPlaced = false;
  for (i = 0; i < n && !datum.labelPlaced; i++) {
    for (j = 0; j < m && !datum.labelPlaced; j++) {
      dx = (anchors[j] & 0x3) - 1;
      dy = ((anchors[j] >>> 0x2) & 0x3) - 1;

      if (dx === 0 && dy === 0 && i !== 0) continue;
  
      datum.bound = getBound(datum, dx, dy, offsets[i]);
      searchBound = getSearchBound(datum.bound, bitMap);
      
      if (bitMap.searchOutOfBound(searchBound)) continue;
      
      datum.searchBound = searchBound;
      if (
        ((dx === 0 && dy === 0) || offsets[i] < 0) ?
          (
            !bitMap.getInBoundMultiBinned(searchBound.x, searchBound.y, searchBound.x2, searchBound.y2) &&
            isIn(datum.bound, datum.markBound)
          ) :
          (
            !checkCollision(searchBound, bitMap)
          )
      ) {
        datum.labelPlaced = true;
        datum.anchors.x = datum.bound[!dx ? 1 : (dx ^ offsets[i] >= 0 ? 2 : 0)];
        datum.anchors.y = datum.bound[!dy ? 4 : (dy ^ offsets[i] >= 0 ? 5 : 3)];

        datum.x = datum.bound[1];
        datum.y = datum.bound[4];
      }
    }
  }
}

function isIn(b, mb) {
  return mb[0] <= b[0] && b[2] <= mb[2] &&
         mb[3] <= b[3] && b[5] <= mb[5];
}

function getBound(datum, dx, dy, offset) {
  var mb = datum.markBound,
      w = datum.textWidth,
      h = datum.textHeight,
      sizeFactor = (dx && dy) ? SIZE_FACTOR : 1,
      isIn = offset < 0 ? -1 : 1,
      y = mb[4 + dy] + (isIn * h * dy / 2.0) + (offset * dy * sizeFactor),
      x = mb[1 + dx] + (isIn * w * dx / 2.0) + (offset * dx * sizeFactor);
  return [
    x - (w / 2.0),
    x,
    x + (w / 2.0),
    y - (h / 2.0),
    y,
    y + (h / 2.0)
  ];
}

function getSearchBound(bound, bm) {
  var _x = bm.bin(bound[0]),
      _y = bm.bin(bound[3]),
      _x2 = bm.bin(bound[2]),
      _y2 = bm.bin(bound[5]),
      w = bm.width, h = bm.height;
  // _x = _x < 0 ? 0 : _x > w - 1 ? w - 1 : _x;
  // _y = _y < 0 ? 0 : _y > h - 1 ? h - 1 : _y;
  // _x2 = _x2 < 0 ? 0 : _x2 > w - 1 ? w - 1 : _x2;
  // _y2 = _y2 < 0 ? 0 : _y2 > h - 1 ? h - 1 : _y2;
  return {
    x: _x,
    y: _y,
    x2: _x2,
    y2: _y2,
  };
}

function placeLabel(b, bitMap) {
  bitMap.markInBoundBinned(b.x, b.y, b.x2, b.y2);
}

function checkCollision(b, bitMap) {
  return bitMap.getInBoundBinned(b.x, b.y, b.x2, b.y2);
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