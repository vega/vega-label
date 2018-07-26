/*eslint no-unused-vars: "warn"*/
import { BitMap } from './BitMap';
import { MultiBitMap } from './MultiBitMap';

export function placeLabels(data, size, marktype, anchors) {
  var // textWidth, textHeight,
      width = 0, height = 0,
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
    // bitMaps.mark.unmark(d.x, d.y);
    if (marktype !== 'rect') bitMaps.mark.unmarkInBound(x1, y1, x2, y2);
    d.currentPosition = 0;
    findAvailablePosition(d, bitMaps, anchors, function(d1, bm) {
      return !checkCollision(d1.searchBound, bm.mark);
    });
    if (marktype !== 'rect') bitMaps.mark.markInBound(x1, y1, x2, y2);
    // bitMaps.mark.mark(d.x, d.y);
  }

  for (i = 0; i < n; i++) {
    d = data[i];
    mb = d.markBound;
    x1 = bitMaps.mark.bin(mb.x1);
    x2 = bitMaps.mark.bin(mb.x2);
    y1 = bitMaps.mark.bin(mb.y1);
    y2 = bitMaps.mark.bin(mb.y2);
    if (marktype !== 'rect') bitMaps.mark.unmarkInBound(x1, y1, x2, y2);
    if (d.labelPlaced) {
      findAvailablePosition(d, bitMaps, anchors, function(d1, bm) {
        return !checkCollision(getExtendedSearchBound(d1, bm.mark), bm.mark) && 
               !checkCollision(d1.searchBound, bm.label);
      });

      if (d.labelPlaced) {
        placeLabel(d.searchBound, bitMaps.label);
      } else {
        d.fill = null;
      }
    } else {
      d.fill = null;
    }
    d.x = d.bound.xc;
    d.y = d.bound.yc;
    if (marktype !== 'rect') bitMaps.mark.markInBound(x1, y1, x2, y2);
  }

  return data;
}

function findAvailablePosition(datum, bitMaps, anchors, checkCollisions) {
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
    if (checkCollisions(datum, bitMaps)) {
      datum.labelPlaced = true;
      break;
    }
  }
}

function getExtendedSearchBound(d, bm) {
  var bound = d.bound,
      w = d.textWidth * d.currentPosition[0],
      h = d.textHeight * d.currentPosition[1];
    
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
      for (i = 0; i < n; i++) {
        mb = data[i].markBound;
        bitMap.markInBound(mb.x1, mb.y1, mb.x2, mb.y2);
      }
      break;
    case 'rect':
    var x1, x2, y1, y2;
      for (i = 0; i < n; i++) {
        mb = data[i].markBound;
        x1 = bitMap.bin(mb.x1);
        x2 = bitMap.bin(mb.x2);
        y1 = bitMap.bin(mb.y1);
        y2 = bitMap.bin(mb.y2);
        bitMap.markInBoundBinned(x1, y1, x1, y2);
        bitMap.markInBoundBinned(x2, y1, x2, y2);
        bitMap.markInBoundBinned(x1, y1, x2, y1);
        bitMap.markInBoundBinned(x1, y2, x2, y2);
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
