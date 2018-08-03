/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import BitMap from './BitMap';
import MultiBitMap from './MultiBitMap';
import { Marks } from 'vega-scenegraph';

export default function placeLabels(data, size, anchors, marks, offsets) {
  var width = 0, height = 0,
      bitMaps = {},
      n = data.length,
      d, i, mb,
      x1, y1, x2, y2;

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
  bitMaps.mark = getMarkBitMap(data, width, height, marks);
  bitMaps.label = new BitMap(width, height);

  for (i = 0; i < n; i++) {
    d = data[i];
    mb = d.markBound;
    
    x1 = bitMaps.mark.bin(mb.x1);
    x2 = bitMaps.mark.bin(mb.x2); 
    y1 = bitMaps.mark.bin(mb.y1);
    y2 = bitMaps.mark.bin(mb.y2);
    bitMaps.mark.unmarkInBound(x1, y1, x2, y2);
    findAvailablePosition(d, bitMaps, anchors, offsets);

    if (d.labelPlaced) {
      placeLabel(d.searchBound, bitMaps.label);
    } else {
      d.fill = null;
    }
    d.x = d.bound.xc;
    d.y = d.bound.yc;
    bitMaps.mark.markInBound(x1, y1, x2, y2);
  }
  console.log('--------------------------------------------------------------------');

  bitMaps.mark.print('markBitMap');
  bitMaps.label.print('labelBitMap');

  var canvas = document.getElementById('all-bitmaps');
  canvas.setAttribute("width", bitMaps.mark.bin(width));
  canvas.setAttribute("height", bitMaps.mark.bin(height));
  var ctx = canvas.getContext("2d");

  bitMaps.mark.printContext(ctx);
  bitMaps.label.printContext(ctx);

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
            !checkCollision(searchBound, bitMaps.mark) && // any label cannot be inside other mark
            isIn(datum.bound, datum.markBound)
          ) :
          (
            !checkCollision(searchBound, bitMaps.mark) &&
            !checkCollision(searchBound, bitMaps.label)
          )
      ) {
        datum.labelPlaced = true;
        var _inner = inner ? -1 : 1;
        datum.anchors.x2 = datum.bound[!dx ? 'xc' : (dx ^ _inner >= 0 ? 'x2' : 'x')];
        datum.anchors.y2 = datum.bound[!dy || dx ? 'yc' : (dy ^ _inner >= 0 ? 'y2' : 'y')];
      }
    }
  }
  if (datum.datum.text == '2000 dm8' || datum.datum.text == '1999 jl8') {
    console.log(datum);
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

function getMarkBitMap(data, width, height, marks) {
  var n = data.length;

  if (!n) return null;
  var bitMap = new MultiBitMap(width, height), i;

  if (marks.length) {
    var canvas = document.getElementById('canvasrender');
    var context = canvas.getContext('2d');
  
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    
    var m = marks.length,
        items;

    for (i = 0; i < m; i++) {
      items = marks[i];
      if (!items.length) continue;

      Marks[items[0].mark.marktype].draw(context, {items: items}, null);
    }
  
    var imageData = context.getImageData(0, 0, width, height),
        canvasBuffer = new Uint32Array(imageData.data.buffer);
  
    for (var y = 0; y < height; y++) { // make it faster by not checking every pixel.
      for (var x = 0; x < width; x++) {
        if (canvasBuffer[(y * width) + x] & 0xff000000) {
          bitMap.mark(x, y);
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
