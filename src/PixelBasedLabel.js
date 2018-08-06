/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import BitMap from './BitMap';
import MultiBitMap from './MultiBitMap';
import { Marks } from 'vega-scenegraph';

export default function placeLabels(data, size, anchors, marktype, marks, offsets) {
  var width = 0, height = 0,
      bitMaps = {},
      n = data.length,
      d, i;

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
  bitMaps.mark = getMarkBitMap(data, width, height, marktype, marks, anchors);
  bitMaps.label = new BitMap(width, height);

  for (i = 0; i < n; i++) {
    d = data[i];
    findAvailablePosition(d, bitMaps, anchors, offsets);

    if (d.labelPlaced) {
      placeLabel(d.searchBound, bitMaps.label);
    } else {
      d.fill = 'none';
      d.stroke = 'none';
    }
    d.x = d.bound.xc;
    d.y = d.bound.yc;
  }

  // bitMaps.mark.print('markBitMap');
  // bitMaps.label.print('labelBitMap');

  // var canvas = document.getElementById('all-bitmaps');
  // canvas.setAttribute("width", bitMaps.mark.bin(width));
  // canvas.setAttribute("height", bitMaps.mark.bin(height));
  // var ctx = canvas.getContext("2d");

  // bitMaps.mark.printContext(ctx);
  // bitMaps.label.printContext(ctx);

  return data;
}

function findAvailablePosition(datum, bitMaps, anchors, offsets) {
  var i, j, searchBound,
      n = offsets.length,
      m = anchors.length,
      dx, dy, inner;

  datum.labelPlaced = false;
  for (i = 0; i < n && !datum.labelPlaced; i++) {
    for (j = 0; j < m && !datum.labelPlaced; j++) {
      dx = (anchors[j] & 0x3) - 1;
      dy = ((anchors[j] >>> 0x2) & 0x3) - 1;
      inner = anchors[j] >>> 0x4;
  
      datum.bound = datum.boundFun(dx, dy, inner, offsets[i]);
      searchBound = getSearchBound(datum.bound, bitMaps.mark);
      
      if (bitMaps.mark.searchOutOfBound(searchBound)) continue;
      
      datum.searchBound = searchBound;
      if (
        ((dx === 0 && dy === 0) || inner) ?
          (
            // !checkCollision(searchBound, bitMaps.mark) && // any label cannot be inside other mark
            !bitMaps.mark.getInBoundMultiBinned(searchBound.x, searchBound.y, searchBound.x2, searchBound.y2) &&
            isIn(datum.bound, datum.markBound)
          ) :
          (
            !checkCollision(searchBound, bitMaps.mark) &&
            !checkCollision(searchBound, bitMaps.label)
          )
      ) {
        datum.labelPlaced = true;
        var _inner = inner ? -1 : 1;
        datum.anchors.x = datum.bound[!dx ? 'xc' : (dx ^ _inner >= 0 ? 'x2' : 'x')];
        datum.anchors.y = datum.bound[!dy || dx ? 'yc' : (dy ^ _inner >= 0 ? 'y2' : 'y')];
      }
    }
  }
}

function isIn(b, mb) {
  return mb.x1 <= b.x && b.x2 <= mb.x2 && mb.y1 <= b.y && b.y2 <= mb.y2;
}

function getSearchBound(bound, bm) {
  var _x = bm.bin(bound.x),
      _y = bm.bin(bound.y),
      _x2 = bm.bin(bound.x2),
      _y2 = bm.bin(bound.y2),
      w = bm.width, h = bm.height;
  _x = _x < 0 ? 0 : _x > w - 1 ? w - 1 : _x;
  _y = _y < 0 ? 0 : _y > h - 1 ? h - 1 : _y;
  _x2 = _x2 < 0 ? 0 : _x2 > w - 1 ? w - 1 : _x2;
  _y2 = _y2 < 0 ? 0 : _y2 > h - 1 ? h - 1 : _y2;
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

function getMarkBitMap(data, width, height, marktype, marks, anchors) {
  var n = data.length, m = marks.length;

  if (!n) return null;
  var bitMap = new MultiBitMap(width, height), i, hasInner = false;

  for (i = 0; i < anchors.length; i++) {
    if ((anchors[i] >>> 0x4) || ((anchors[i] & 0xf) === 0x5)) {
      hasInner = true;
      break;
    }
  }

  var canvas, context,
      writeOnCanvas = m || (marktype && marktype !== 'line'),
      items;

  if (writeOnCanvas) {
    canvas = document.getElementById('canvasrender');
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
    var originalItems,
        itemsLen, j;

    for (i = 0; i < m; i++) {
      originalItems = marks[i];
      itemsLen = originalItems.length;
      if (!itemsLen) continue;

      if (hasInner) {
        items = new Array(itemsLen);
        for (j = 0; j < itemsLen; j++) {
          items[j] = prepareMarkItem(originalItems[j]);
        }
      } else {
        items = originalItems;
      }

      Marks[items[0].mark.marktype].draw(context, {items: items}, null);
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
          if (!hasInner || alpha !== 0x10000000) {
            bitMap.mark(x, y);
          }
        }
      }
    }
  } else {
    var d;
    for (i = 0; i < n; i++) {
      d = data[i]
      bitMap.mark(d.x, d.y);
    }
  }

  // bitMap.print();
  return bitMap;
}

function prepareMarkItem(originalItem) {
  var item = {};
  for (var key in originalItem) {
    item[key] = originalItem[key];
  }
  if (item.stroke) {
    item.stroke = '#000';
    item.strokeOpacity = 1;
  }
  if (item.fill) {
    item.fill = '#000';
    item.fillOpacity = 0.0625;
    item.stroke = '#000';
    item.strokeOpacity = 1;
  }
  return item;
}