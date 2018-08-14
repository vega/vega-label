/*eslint no-unused-vars: "warn"*/
import ArrayMap from "./ArrayMap";

export default function placeLabels(data, size, padding) {
  var width = 0,
    height = 0,
    bins = {},
    minTextWidth = Number.MAX_SAFE_INTEGER,
    minTextHeight = Number.MAX_SAFE_INTEGER,
    n = data.length,
    d,
    i;

  data.sort(function(a, b) {
    var textWidth = a.textWidth > b.textWidth ? a.textWidth : b.textWidth;
    var textHeight = a.textHeight + b.textHeight;
    if (
      -textWidth <= a.x - b.x &&
      a.x - b.x <= textWidth &&
      -textHeight <= a.y - b.y &&
      a.y - b.y <= textHeight
    ) {
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
  for (i = 0; i < n; i++) {
    d = data[i];
    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
  }
  bins.mark = getMarkBin(data, width, height, minTextWidth, minTextHeight);
  bins.label = new ArrayMap(width, height, minTextWidth, minTextHeight);

  for (i = 0; i < n; i++) {
    d = data[i];
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, bins, padding, function() {
      if (!checkCollision(d, d.bound, d.searchBound, bins.mark)) {
        d.labelPlaced = true;
      }
    });
  }

  for (i = 0; i < n; i++) {
    d = data[i];
    if (d.labelPlaced) {
      findAvailablePosition(d, bins, padding, function() {
        d.extendedBound = getExtendedBound(d);
        d.extendedSearchBound = getExtendedSearchBound(
          d.extendedBound,
          bins.mark
        );
        if (
          !checkCollision(
            d,
            d.extendedBound,
            d.extendedSearchBound,
            bins.mark
          ) &&
          !checkCollision(d, d.bound, d.searchBound, bins.label)
        ) {
          d.labelPlaced = true;
        }
      });

      if (d.labelPlaced) {
        placeLabel(d.bound, bins.label, minTextWidth, minTextHeight);
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

function findAvailablePosition(datum, bins, padding, checkAvailability) {
  var i,
    j,
    searchBound,
    initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.bound = datum.boundFun(i, j, padding);
      searchBound = getSearchBound(datum.bound, bins.mark);

      if (outOfBound(searchBound, bins.mark)) continue;

      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      checkAvailability();
    }
    initJ = -1;
  }
}

function outOfBound(b, bm) {
  return b.x < 0 || b.y < 0 || b.y2 >= bm.height || b.x2 >= bm.width;
}

function getExtendedBound(d) {
  var bound = d.bound,
    w = d.textWidth * d.currentPosition[0],
    h = d.textHeight * d.currentPosition[1];

  return {
    x: bound.x + (w < 0 ? w : 0),
    y: bound.y + (h < 0 ? h : 0),
    x2: bound.x2 + (w > 0 ? w : 0),
    y2: bound.y2 + (h > 0 ? h : 0)
  };
}

function getExtendedSearchBound(b, bm) {
  return {
    x: bm.binWidth(b.x),
    y: bm.binHeight(b.y),
    x2: bm.binWidth(b.x2),
    y2: bm.binHeight(b.y2)
  };
}

function getSearchBound(bound, bm) {
  return {
    x: bm.binWidth(bound.x),
    y: bm.binHeight(bound.y),
    x2: bm.binWidth(bound.x2),
    y2: bm.binHeight(bound.y2)
  };
}

function placeLabel(b, bin, minTextWidth, minTextHeight) {
  var x,
    y,
    sx = b.x,
    sy = b.y,
    ex = b.x2,
    ey = b.y2;

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

  for (x = searchBound.x; x <= searchBound.x2; x++) {
    for (y = searchBound.y; y <= searchBound.y2; y++) {
      bucket = bin.getBinned(x, y);
      if (
        bucket &&
        bucket.some(function(p) {
          return isIn(b, p) && !(p[0] === d.x && p[1] === d.y);
        })
      ) {
        return true;
      }
    }
  }

  return false;
}

function isIn(bound, point) {
  return (
    bound.x <= point[0] &&
    point[0] <= bound.x2 &&
    (bound.y <= point[1] && point[1] <= bound.y2)
  );
}

function getMarkBin(data, width, height, minTextWidth, minTextHeight) {
  var n = data.length;

  if (!n) return null;
  var bin = new ArrayMap(width, height, minTextWidth, minTextHeight);

  for (var i = 0; i < n; i++) {
    bin.add(data[i].x, data[i].y);
  }

  return bin;
}
