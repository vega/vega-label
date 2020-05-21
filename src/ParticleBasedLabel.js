/*eslint no-unused-vars: "warn"*/
import { ArrayMap } from './ArrayMap';
import { getBoundary, labelWidth, POSITIONS, POSITIONS_LEN } from './Common';

export function placeLabels(data, size, padding, marksInfo, marksRenderer) {
  var width = 0, height = 0, bins = {}, n = data.length,
      minTextWidth = Number.MAX_SAFE_INTEGER,
      minTextHeight = Number.MAX_SAFE_INTEGER,
      maxTextWidth = Number.MIN_SAFE_INTEGER,
      maxTextHeight = Number.MIN_SAFE_INTEGER;

  width = size[0];
  height = size[1];

  // var before;
  // before = performance.now();
  for (var i = 0; i < n; i++) {
    var d = data[i];
    var datum = d.datum;
    d.textWidth = labelWidth(datum.text, datum.fontSize, datum.font);
    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
    maxTextWidth = d.textWidth > maxTextWidth ? d.textWidth : maxTextWidth;
    maxTextHeight = d.textHeight > maxTextHeight ? d.textHeight : maxTextHeight;
  }
  // todo: write marksInfo to bins
  var before = performance.now();
  bins.mark = getMarkBin(data, width, height, maxTextWidth, maxTextHeight, marksInfo, marksRenderer);
  var after = (performance.now() - before);
  // bins.mark.write("canvas", width, height);
  // console.log(process);
  // console.log(process.memoryUsage());
  // var k = "strin";
  // console.log(process.memoryUsage());

  data.forEach(function(d) {
    if (d.x === undefined || d.y === undefined) {
      d.fill = null;
      d.z = 0;
      return;
    }
    d.z = 1;
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
  // bins.mark.write("canvas-after", width, height);

  return [data, after];
}

function findAvailablePosition(datum, bins, padding, checkAvailability) {
  var i,
      dx, dy,
      searchBound;

  datum.labelPlaced = false;
  for (i = 0; i < POSITIONS_LEN && !datum.labelPlaced; i++) {
    dx = POSITIONS[i][0];
    dy = POSITIONS[i][1];

    datum.boundary = getBoundary(datum, dx, dy, padding);
    searchBound = getSearchBound(datum.boundary, bins.mark);

    if (outOfBound(searchBound, bins.mark)) continue;
    
    datum.currentPosition = [dx, dy];
    datum.searchBound = searchBound;
    checkAvailability();
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

function getMarkBin(data, width, height, maxTextWidth, maxTextHeight, marksInfo, marksRenderer) {
  if (!data.length) return null;
  var bin = new ArrayMap(width, height, maxTextWidth, maxTextHeight);

  if (marksRenderer === 'image') {
    var buffer = new Uint32Array(
      marksInfo.getImageData(0, 0, width, height).data.buffer
    );

    var x, y;
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (buffer[y * width + x]) {
          bin.add(x, y);
        }
      }
    }
  } else {
    var i, len = marksInfo.length;
    for (i = 0; i < len; i++) {
      bin.add(marksInfo[i][0], marksInfo[i][1]);
    }
  }
  return bin;
}
