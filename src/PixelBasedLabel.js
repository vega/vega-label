/*eslint no-unused-vars: "warn"*/
import { BitMap } from './BitMap';

export function placeLabels(data, size, padding) {
  var textWidth, textHeight,
      width = 0, height = 0,
      bitMaps = {},
      minTextWidth = Number.MAX_SAFE_INTEGER, 
      minTextHeight = Number.MAX_SAFE_INTEGER;

  width = size[0];
  height = size[1];

  bitMaps.mark = getMarkBitMap(data, width, height);
  // bitMaps.label = new BitMap(width, height);

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
      bitMaps.mark.unmark(d.x, d.y);
      findAvailablePosition(d, bitMaps, padding, function() {
        d.extendedSearchBound = getExtendedSearchBound(d, bitMaps.mark);
        if (!checkCollision(d.extendedSearchBound, bitMaps.mark) && !checkCollision(d.searchBound, bitMaps.mark)) {
          d.labelPlaced = true;
        }
      });
      bitMaps.mark.mark(d.x, d.y);

      if (d.labelPlaced) {
        placeLabel(d.searchBound, bitMaps.mark);
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

      if (outOfBound(searchBound, bitMaps.mark)) continue;
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      checkAvailability();
    }
    initJ = -1;
  }
}

function outOfBound(b, bm) {
  return b.startX < 0 || b.startY < 0 || b.endY >= bm.height || b.endX >= bm.width;
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

function placeLabel(b, bitMap) {
  bitMap.setAllScaled(b.startX, b.startY, b.endX, b.endY);
}

function checkCollision(b, bitMap) {

  return bitMap.getAllScaled(b.startX, b.startY, b.endX, b.endY);
}

function getMarkBitMap(data, width, height) {
  if (!data.length) return null;
  var bitMap = new BitMap(width, height);

  data.forEach(function(d) {
    bitMap.mark(d.x, d.y);
  });
  
  return bitMap;
}
