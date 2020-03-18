/*eslint no-unused-vars: "warn"*/
import { ArrayMap } from './ArrayMap';
import { getBoundary, labelWidth } from './Common';

export function placeLabels(data, size, padding) {
  var width = 0, height = 0,
      bins = {},
      minTextWidth = Number.MAX_SAFE_INTEGER, 
      minTextHeight = Number.MAX_SAFE_INTEGER;

  width = size[0];
  height = size[1];

  // var before;
  // before = performance.now();
  data.forEach(function(d) {
    var datum = d.datum;
    d.textWidth = labelWidth(datum.text, datum.fontSize, datum.font);
    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
  });
  bins.mark = getMarkBin(data, width, height, minTextWidth, minTextHeight);

  data.forEach(function(d) {
    d.z = 1;
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, bins, padding, function() {
      if (!checkCollision(d, d.boundary, d.searchBound, bins.mark)) {
        d.labelPlaced = true;
      }
    });

    if (d.labelPlaced) {
      placeLabel(d.boundary, bins.mark, minTextWidth, minTextHeight);
    } else {
      d.fill = null;
      d.z = 0;
    }
    d.x = d.boundary.xc;
    d.y = d.boundary.yc;
  });
  // console.log(performance.now() - before);
  // bins.mark.write("canvas", width, height);

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
      datum.boundary = getBoundary(datum, i, j, padding);
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
  var x, y, p, bucket;

  for (x = searchBound.startX; x <= searchBound.endX; x++) {
    for (y = searchBound.startY; y <= searchBound.endY; y++) {
      bucket = bin.getBinned(x, y);
      if (bucket) {
        for (p = 0; p < bucket.length; p++) {
          if (isIn(b, bucket[p])) return true;
        }
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
