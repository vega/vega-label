/*eslint no-unused-vars: "warn"*/
import { ArrayMap } from './ArrayMap';

export function placeLabels(data, size, padding) {
  var textWidth, textHeight,
      width = 0, height = 0,
      bins = {},
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
  data.forEach(function(d) {
    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
  });
  bins.mark = getMarkBin(data, width, height, minTextWidth, minTextHeight);
  bins.label = new ArrayMap(width, height, minTextWidth, minTextHeight);

  data.forEach(function(d) {
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, bins, padding, function() {
      if (!checkCollision(d, d.boundary, d.searchBound, bins.mark)) {
        d.labelPlaced = true;
      }
    });
  });

  data.forEach(function(d) {
    d.z = 1;
    if (d.labelPlaced) {
        findAvailablePosition(d, bins, padding, function() {
          d.extendedBoundary = getExtendedBound(d);
          d.extendedSearchBound = getExtendedSearchBound(d.extendedBoundary, bins.mark);
          if (!checkCollision(d, d.extendedBoundary, d.extendedSearchBound, bins.mark) && !checkCollision(d, d.boundary, d.searchBound, bins.label)) {
            d.labelPlaced = true;
          }
        });

        if (d.labelPlaced) {
          placeLabel(d.boundary, bins.label, minTextWidth, minTextHeight);
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

function findAvailablePosition(datum, bins, padding, checkAvailability) {
  var i, j,
      searchBound,
      initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.boundary = datum.boundaryFun(i, j, padding);
      searchBound = getSearchBound(datum.boundary, bins.mark);

      if (outOfBound(searchBound, bins.mark)) continue;
      
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

function getExtendedBound(d) {
  var bound = d.boundary,
      w = d.textWidth * d.currentPosition[0],
      h = d.textHeight * d.currentPosition[1];

  return {
    x: bound.x + (w < 0 ? w : 0),
    y: bound.y + (h < 0 ? h : 0),
    x2: bound.x2 + (w > 0 ? w : 0),
    y2: bound.y2 + (h > 0 ? h : 0),
  }
}

function getExtendedSearchBound(b, bm) {
  return {
    startX: bm.binWidth(b.x),
    startY: bm.binHeight(b.y),
    endX: bm.binWidth(b.x2),
    endY: bm.binHeight(b.y2),
  };
}

function getSearchBound(bound, bm) {
  return {
    startX: bm.binWidth(bound.x),
    startY: bm.binHeight(bound.y),
    endX: bm.binWidth(bound.x2),
    endY: bm.binHeight(bound.y2),
  };
}

function placeLabel(b, bin, minTextWidth, minTextHeight) {
  var x, y,
      sx = b.x, sy = b.y,
      ex = b.x2, ey = b.y2;
  
  for (x = sx; x < ex; x += minTextWidth) {
    for (y = sy; y < ey; y += minTextHeight) {
      if (x === b.x && y === b.y) continue;
      bin.add(x, y);
    }
  }

  for (x = sx; x < ex; x += minTextWidth) {
    bin.add(x, ey);
  }

  for (y = sy; y < ey; y += minTextHeight) {
    bin.add(ex, y);
  }

  bin.add(ex, ey);
}

function checkCollision(d, b, searchBound, bin) {
  var x, y, bucket;

  for (x = searchBound.startX; x <= searchBound.endX; x++) {
    for (y = searchBound.startY; y <= searchBound.endY; y++) {
      bucket = bin.getBinned(x, y);
      if (bucket && bucket.some(function(p) { return isIn(b, p) && !(p[0] === d.x && p[1] === d.y) })) {
        return true;
      }
    }
  }
  
  return false;
}

function isIn(bound, point) {
  return (bound.x <= point[0] && point[0] <= bound.x2) &&
         (bound.y <= point[1] && point[1] <= bound.y2);
}

function getMarkBin(data, width, height, minTextWidth, minTextHeight) {
  if (!data.length) return null;
  var bin = new ArrayMap(width, height, minTextWidth, minTextHeight);

  data.forEach(function(d) {
    bin.add(d.x, d.y);
  });
  
  return bin;
}
