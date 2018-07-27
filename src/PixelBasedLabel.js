/*eslint no-unused-vars: "warn"*/
import { BitMap } from './BitMap';
import { MultiBitMap } from './MultiBitMap';
import { pathCurves, shapes } from 'vega-scenegraph';
import { canvas } from 'vega-canvas';

export function placeLabels(data, size, marktype, anchors) {
  var width = 0, height = 0,
      bitMaps = {},
      n = data.length,
      d, i, mb,
      x1, y1, x2, y2;

  // var x = pathCurves('step', 'vertical', 0.5);
  // x1 = x;

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
      d.fill = 'none';
    }
    d.x = d.bound.xc;
    d.y = d.bound.yc;
    bitMaps.mark.markInBound(x1, y1, x2, y2);
  }

  return data;
}

function findAvailablePosition(datum, bitMaps, anchors) {
  var i, searchBound,
      n = anchors.length,
      dx, dy;

  datum.labelPlaced = false;
  for (i = datum.currentPosition; i < n; i++) {
    dx = (anchors[i] & 0xf) - 1;
    dy = (anchors[i] >>> 0x4) - 1;

    datum.bound = datum.boundFun(dx, dy);
    searchBound = getSearchBound(datum.bound, bitMaps.mark);

    if (bitMaps.mark.searchOutOfBound(searchBound)) continue;
    
    datum.currentPosition = i;
    datum.searchBound = searchBound;
    if (!checkCollision(getExtendedSearchBound(datum, bitMaps.mark, dx, dy), bitMaps.mark) &&
        !checkCollision(datum.searchBound, bitMaps.label)) {
      datum.labelPlaced = true;
      break;
    }
  }
}

function getExtendedSearchBound(d, bm, dx, dy) {
  var bound = d.bound,
      w = d.textWidth * dx,
      h = d.textHeight * dy;
    
  return {
    x: bm.bin(bound.x + (w < 0 ? w : 0)),
    y: bm.bin(bound.y + (h < 0 ? h : 0)),
    x2: bm.bin(bound.x2 + (w > 0 ? w : 0)),
    y2: bm.bin(bound.y2 + (h > 0 ? h : 0)),
  };
}

function getSearchBound(bound, bm) {
  return {
    x: bm.bin(bound.x),
    y: bm.bin(bound.y),
    x2: bm.bin(bound.x2),
    y2: bm.bin(bound.y2),
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
  var bitMap = new MultiBitMap(width, height), mb, i;

  switch (marktype) {
    case 'symbol':
    case 'rect':
      for (i = 0; i < n; i++) {
        mb = data[i].markBound;
        bitMap.markInBound(mb.x1, mb.y1, mb.x2, mb.y2);
      }
      break;
    case 'line':
      break;
    default:
      for (i = 0; i < n; i++) {
        bitMap.mark(data[i].x, data[i].y);
      }
  }
  
  return bitMap;
}
