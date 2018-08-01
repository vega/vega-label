/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
import BitMap from './BitMap';
import MultiBitMap from './MultiBitMap';
import { Marks } from 'vega-scenegraph';

export default function placeLabels(data, size, marktype, anchors) {
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
  bitMaps.mark = getMarkBitMap(data, width, height, marktype);
  bitMaps.label = new BitMap(width, height);

  for (i = 0; i < n; i++) {
    d = data[i];
    mb = d.markBound;
    x1 = bitMaps.mark.bin(mb.x1);
    x2 = bitMaps.mark.bin(mb.x2); 
    y1 = bitMaps.mark.bin(mb.y1);
    y2 = bitMaps.mark.bin(mb.y2);
    bitMaps.mark.unmarkInBound(x1, y1, x2, y2);
    d.currentPosition = 0;
    findAvailablePosition(d, bitMaps, anchors);

    if (d.labelPlaced) {
      placeLabel(d.searchBound, bitMaps.label);
    } else {
      d.fill = null;
    }
    d.x = d.bound.xc;
    d.y = d.bound.yc;
    bitMaps.mark.markInBound(x1, y1, x2, y2);
  }

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

function findAvailablePosition(datum, bitMaps, anchors) {
  var i, searchBound,
      n = anchors.length,
      dx, dy, inner;


  if (datum.datum.datum.datum.year === 1975) {
    dx = 1;
  }
  datum.labelPlaced = false;
  for (i = datum.currentPosition; i < n; i++) {
    dx = (anchors[i] & 0x3) - 1;
    dy = ((anchors[i] >>> 0x2) & 0x3) - 1;
    inner = anchors[i] >>> 0x4;

    datum.bound = datum.boundFun(dx, dy, inner);
    searchBound = getSearchBound(datum.bound, bitMaps.mark);

    // if (bitMaps.mark.searchOutOfBound(searchBound)) continue;
    
    datum.currentPosition = i;
    datum.searchBound = searchBound;
    if (
      ((dx === 0 && dy === 0) || inner) ?
        (
          !checkCollision(searchBound, bitMaps.mark) && // any label cannot be inside other mark
          isIn(datum.bound, datum.markBound)
        ) :
        (
          // !checkCollision(getExtendedSearchBound(datum, bitMaps.mark, dx, dy), bitMaps.mark) &&
          !checkCollision(searchBound, bitMaps.mark) &&
          !checkCollision(searchBound, bitMaps.label)
        )
    ) {
      datum.labelPlaced = true;
      var _inner = inner ? -1 : 1;
      datum.anchor_x = datum.bound[dx * _inner === 0 ? 'xc' : (dx * _inner < 0 ? 'x2' : 'x')];
      datum.anchor_y = datum.bound[dy * _inner === 0 ? 'yc' : (dy * _inner < 0 ? 'y2' : 'y')];
      break;
    }
  }
}

function isIn(b, mb) {
  return mb.x1 <= b.x && b.x2 <= mb.x2 && mb.y1 <= b.y && b.y2 <= mb.y2;
}

function getExtendedSearchBound(d, bm, dx, dy) {
  var bound = d.bound,
      w = d.textWidth * dx,
      h = d.textHeight * dy;
  
  var _x = bm.bin(bound.x + (w < 0 ? w : 0)),
      _y = bm.bin(bound.y + (h < 0 ? h : 0)),
      _x2 = bm.bin(bound.x2 + (w > 0 ? w : 0)),
      _y2 = bm.bin(bound.y2 + (h > 0 ? h : 0));

  _x = _x < 0 ? 0 : _x;
  _y = _y < 0 ? 0 : _y;
  _x2 = _x2 >= bm.width ? bm.width - 1 : _x2;
  _y2 = _y2 >= bm.height ? bm.height - 1 : _y2;
  return {
    x: _x,
    y: _y,
    x2: _x2,
    y2: _y2,
  };
}

function getSearchBound(bound, bm) {
  var _x = bm.bin(bound.x),
      _y = bm.bin(bound.y),
      _x2 = bm.bin(bound.x2),
      _y2 = bm.bin(bound.y2);
  _x = _x < 0 ? 0 : _x;
  _y = _y < 0 ? 0 : _y;
  _x2 = _x2 >= bm.width ? bm.width - 1 : _x2;
  _y2 = _y2 >= bm.height ? bm.height - 1 : _y2;
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

function getMarkBitMap(data, width, height, marktype) {
  var n = data.length;

  if (!n) return null;
  var bitMap = new MultiBitMap(width, height), i;

  var canvas = document.getElementById('canvasrender');
  var context = canvas.getContext('2d');

  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  
  var scene;

  switch (marktype) {
    case 'line':
      scene = { items: [] };
      n = data.length;
      for (i = 0; i < n; i++) {
        scene.items.push({
          interpolate: 'cardinal',
          stroke: '#000',
          strokeWidth: 3,
          x: data[i].x,
          y: data[i].y
        });
      }
      Marks.line.draw(context, scene, null);

    case 'symbol':
    case 'rect':
      scene = { items: [] };
      for (i = 0; i < n; i++) {
        scene.items.push(data[i].datum.datum);
      }
      if (marktype === 'rect') {
        Marks.rect.draw(context, scene, null);
      } else {
        Marks.symbol.draw(context, scene, null);
      }
      break;

    default:
      for (i = 0; i < n; i++) {
        bitMap.mark(data[i].x, data[i].y);
      }
      return bitMap;
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

  bitMap.print();
  return bitMap;
}
