
/*eslint no-unused-vars: "warn"*/
import { ArrayMap } from './ArrayMap';
import { getBoundary, labelWidth, POSITIONS, POSITIONS_LEN, considerLabelFactory } from './Common';
import { drawAvoidMarksAndVectorizeRects } from './ProjectionHybrid';

export function placeLabels(data, size, padding, avoidMarks) {
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
    d.textWidth = labelWidth(d.text, d.fontSize, d.font);
    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
    maxTextWidth = d.textWidth > maxTextWidth ? d.textWidth : maxTextWidth;
    maxTextHeight = d.textHeight > maxTextHeight ? d.textHeight : maxTextHeight;
  }
  // todo: write marksInfo to bins
  var before = performance.now();
  bins.mark = getMarkBin(data, width, height, maxTextWidth, maxTextHeight, minTextWidth, minTextHeight, avoidMarks);
  var after = (performance.now() - before);
  // bins.mark.write("canvas", width, height);
  // console.log(process);
  // console.log(process.memoryUsage());
  // var k = "strin";
  // console.log(process.memoryUsage());

  data.forEach(considerLabelFactory(bins, padding, findPosition, place));
  // bins.mark.write("canvas-after", width, height);

  return [data, after];
}

function findPosition(datum, bins, padding) { var i,
      dx, dy,
      searchBound;

  datum.labelPlaced = false;
  for (i = 0; i < POSITIONS_LEN && !datum.labelPlaced; i++) {
    dx = POSITIONS[i][0];
    dy = POSITIONS[i][1];

    datum.boundary = getBoundary(datum, dx, dy, padding);
    searchBound = getSearchBound(datum.boundary, bins.mark);

    if (outOfBound(datum.boundary, bins.mark)) continue;
    
    datum.currentPosition = [dx, dy];
    datum.searchBound = searchBound;
    if (!checkCollision(datum, datum.boundary, datum.searchBound, bins.mark)) {
      datum.labelPlaced = true;
    }
  }
}

export function outOfBound(b, bm) {
  return b.x < 0 || b.y < 0 || b.y2 >= bm._height || b.x2 >= bm._width;
}

function getSearchBound(bound, bm) {
  return {
    startX: bm.binWidth(bound.x),
    startY: bm.binHeight(bound.y),
    endX: bm.binWidth(bound.x2),
    endY: bm.binHeight(bound.y2),
  };
}

function place(datum, bin) {
  var x, y,
      sx = datum.boundary.x, sy = datum.boundary.y,
      ex = datum.boundary.x2, ey = datum.boundary.y2;
  
  var minTextWidth = bin.minTextWidth;
  var minTextHeight = bin.minTextHeight;
  
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
  return (bound.x < point[0] && point[0] < bound.x2) &&
         (bound.y < point[1] && point[1] < bound.y2);
}

function getMarkBin(data, width, height, maxTextWidth, maxTextHeight, minTextWidth, minTextHeight, avoidMarks) {
  if (!data.length) return null;
  var bin = new ArrayMap(width, height, maxTextWidth, maxTextHeight, minTextWidth, minTextHeight);
  var marksInfo = drawAvoidMarksAndVectorizeRects(avoidMarks, width, height);

  var buffer = new Uint32Array(
    marksInfo.canvas.getImageData(0, 0, width, height).data.buffer
  );

  minTextWidth = ~~minTextWidth;
  minTextHeight = ~~minTextHeight;

  var x, y, surroundingPixels;
  for (y = 1; y < height; y++) {
    for (x = 1; x < width; x++) {
      surroundingPixels =
        !!buffer[y     * width + x] +
        !!buffer[(y-1) * width + (x-1)] +
        !!buffer[y     * width + (x-1)] +
        !!buffer[(y-1) * width + x];
      if (0 < surroundingPixels && surroundingPixels < 4) {
        bin.add(x, y);
      } else if (surroundingPixels === 4 && x % minTextWidth === 0 && y % minTextHeight === 0) {
        bin.add(x, y);
      }
    }
  }

  var h_1 = height - 1, w_1 = width - 1;
  for (y = 1; y < height; y++) {
    if (buffer[y * width] || buffer[(y-1) * width]) {
      bin.add(0, y);
    }

    if (buffer[y * width + w_1] || buffer[(y-1) * width + w_1]) {
      bin.add(width, y);
    }
  }

  for (x = 1; x < width; x++) {
    if (buffer[x] || buffer[x-1]) {
      bin.add(x, 0);
    }

    if (buffer[h_1 * width + x] || buffer[h_1 * width + (x-1)]) {
      bin.add(x, height);
    }
  }

  if (buffer[0]) {
    bin.add(0, 0);
  }
  if (buffer[0 * width + w_1]) {
    bin.add(width, 0);
  }
  if (buffer[h_1 * width]) {
    bin.add(0, height);
  }
  if (buffer[h_1 * width + w_1]) {
    bin.add(width, height);
  }

  marksInfo.rects.forEach(function(r) {
    bin.addRect(r.minX, r.minY, r.maxX, r.maxY);
  });
  return bin;
}
