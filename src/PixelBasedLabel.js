/*eslint no-unused-vars: "warn"*/
import { BitMap } from './BitMap';

export function placeLabels(data, size, padding) {
  var textWidth, textHeight,
      width = 0, height = 0,
      bitMaps = {},
      n = data.length,
      d, i;

  data.sort(function(a, b) {
    textWidth = a.textWidth > b.textWidth ? a.textWidth : b.textWidth;
    textHeight = a.textHeight + b.textHeight;
    if (-textWidth <= a.x - b.x && a.x - b.x <= textWidth &&
        -textHeight <= a.y - b.y && a.y - b.y <= textHeight) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

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
  bitMaps.mark = getMarkBitMap(data, width, height);
  bitMaps.label = new BitMap(width, height);

  for (i = 0; i < n; i++) {
    d = data[i];
    bitMaps.mark.unmark(d.x, d.y);
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, bitMaps, padding, function() {
      return !checkCollision(d.searchBound, bitMaps.mark);
    });
    bitMaps.mark.mark(d.x, d.y);
  }

  for (i = 0; i < n; i++) {
    d = data[i];
    if (d.labelPlaced) {
      bitMaps.mark.unmark(d.x, d.y);
      findAvailablePosition(d, bitMaps, padding, function() {
        return !checkCollision(getExtendedSearchBound(d, bitMaps.mark), bitMaps.mark) && 
               !checkCollision(d.searchBound, bitMaps.label);
      });
      bitMaps.mark.mark(d.x, d.y);

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
  }

  return data;
}

function findAvailablePosition(datum, bitMaps, padding, checkCollisions) {
  var i, j,
      searchBound,
      initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.bound = datum.boundFun(i, j, padding);
      searchBound = getSearchBound(datum.bound, bitMaps.mark);

      if (outOfBound(searchBound, bitMaps.mark)) continue;
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      if (checkCollisions()) {
        datum.labelPlaced = true;
      }
    }
    initJ = -1;
  }
}

function outOfBound(b, bm) {
  return b.x < 0 || b.y < 0 || b.y2 >= bm.height || b.x2 >= bm.width;
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
  bitMap.flushBinned(b.x, b.y, b.x2, b.y2);
}

function checkCollision(b, bitMap) {
  return bitMap.getInBoundBinned(b.x, b.y, b.x2, b.y2);
}

function getMarkBitMap(data, width, height) {
  var n = data.length;

  if (!n) return null;
  var bitMap = new BitMap(width, height);

  for (var i = 0; i < n; i++) {
    bitMap.mark(data[i].x, data[i].y);
  }
  
  return bitMap;
}
