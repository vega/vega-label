/*eslint no-unused-vars: "warn"*/
import { BitMap } from './OldBitMap';

export function placeLabels(data, size, padding) {
  var textWidth, textHeight,
      width = 0, height = 0,
      bitMaps = {},
      minTextWidth = Number.MAX_SAFE_INTEGER, 
      minTextHeight = Number.MAX_SAFE_INTEGER;

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
    data.forEach(function(d) {
        width = Math.max(width, d.x + d.textWidth);
        height = Math.max(height, d.y + d.textHeight);
      });
  }
  bitMaps.mark = getMarkBitMap(data, width, height);
  bitMaps.label = new BitMap(width, height);

  data.forEach(function(d) {
    bitMaps.mark.unmark(d.x, d.y);
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, bitMaps, padding, function() {
      if (!checkCollision(d.searchBound, bitMaps.mark)) {
        d.labelPlaced = true;
      }
    });
    bitMaps.mark.mark(d.x, d.y);

    if (d.labelPlaced) {
        minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
        minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
    }
  });

  minTextWidth = bitMaps.mark.bin(minTextWidth);
  minTextHeight = bitMaps.mark.bin(minTextHeight)

  data.forEach(function(d) {
    d.z = 1;
    if (d.labelPlaced) {
      findAvailablePosition(d, bitMaps, padding, function() {
        d.extendedSearchBound = getExtendedSearchBound(d, bitMaps.mark);
        if (!checkCollision(d.extendedSearchBound, bitMaps.mark) && !checkCollision(d.searchBound, bitMaps.label)) {
          d.labelPlaced = true;
        }
      });

      if (d.labelPlaced) {
        placeLabel(d.searchBound, bitMaps.label, minTextWidth, minTextHeight);
      } else {
        d.fill = null;
        d.z = 0;
      }
    } else {
      d.fill = null;
      d.z = 0;
    }
    d.x = d.boundary.xc;
    d.y = d.boundary.yc;
  });

  return data;
}

function findAvailablePosition(datum, bitMaps, padding, checkAvailability) {
  var i, j,
      searchBound,
      initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.boundary = datum.boundaryFun(i, j, padding);
      searchBound = getSearchBound(datum.boundary, bitMaps.mark);

      if (searchBound.startX < 0 || searchBound.startY < 0 || 
        searchBound.endY >= bitMaps.mark.height || searchBound.endX >= bitMaps.mark.width) {
        continue;
      }
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      checkAvailability();
    }
    initJ = -1;
  }
}

function getExtendedSearchBound(d, bm) {
  var bound = d.boundary,
      w = d.textWidth * d.currentPosition[0],
      h = d.textHeight * d.currentPosition[1];
    
  return {
    startX: bm.bin(bound.x + (w < 0 ? w : 0)),
    startY: bm.bin(bound.y + (h < 0 ? h : 0)),
    endX: bm.bin(bound.x2 + (w > 0 ? w : 0)),
    endY: bm.bin(bound.y2 + (h > 0 ? h : 0)),
  };
}

function getSearchBound(bound, bm) {
  return {
    startX: bm.bin(bound.x),
    startY: bm.bin(bound.y),
    endX: bm.bin(bound.x2),
    endY: bm.bin(bound.y2),
  };
}

function placeLabel(b, bitMap, minTextWidth, minTextHeight) {
  var x, y;
  b.startX = b.startX > 0 ? b.startX : 0;
  b.startY = b.startY > 0 ? b.startY : 0;
  b.endX = b.endX < bitMap.width ? b.endX : bitMap.width;
  b.endY = b.endY < bitMap.height ? b.endY : BitMap.height;
  
  for (x = b.startX; x < b.endX; x += minTextWidth) {
    for (y = b.startY; y < b.endY; y += minTextHeight) {
      bitMap.markBinned(x, y);
    }
  }

  [b.startX, b.endX].forEach(function(_x) {
    [b.startY, b.endY].forEach(function(_y) {
      bitMap.markBinned(_x, _y);
    });
  });
}

function checkCollision(b, bitMap) {
  var x, y;
  b.startX = b.startX > 0 ? b.startX : 0;
  b.startY = b.startY > 0 ? b.startY : 0;
  b.endX = b.endX < bitMap.width ? b.endX : bitMap.width;
  b.endY = b.endY < bitMap.height ? b.endY : BitMap.height;

  for (x = b.startX; x <= b.endX; x++) {
    for (y = b.startY; y <= b.endY; y++) {
      if (bitMap.getBinned(x, y)) {
        return true;
      }
    }
  }
  
  return false;
}

function getMarkBitMap(data, width, height) {
  if (!data.length) return null;
  var bitMap = new BitMap(width, height);

  data.forEach(function(d) {
    bitMap.mark(d.x, d.y);
  });
  
  return bitMap;
}
