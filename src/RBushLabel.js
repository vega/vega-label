/*eslint no-unused-vars: "warn"*/
import { RBushMap } from './RBushMap';
import { getBoundary, POSITIONS, POSITIONS_LEN, considerLabelFactory, labelWidth } from './Common';
import { drawAvoidMarksAndVectorizeRects } from './ProjectionHybrid';

export function placeLabels(data, size, padding, avoidMarks) {
  var width = 0, height = 0, tree, n = data.length,
      minTextWidth = Number.MAX_SAFE_INTEGER,
      minTextHeight = Number.MAX_SAFE_INTEGER;

  width = size[0];
  height = size[1];
  for (var i = 0; i < n; i++) {
    var d = data[i];
    d.textWidth = labelWidth(d.text, d.fontSize, d.font);
    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
  }

  // var before;
  // before = performance.now();
  // todo: write marksInfo to bins
  var before = performance.now();
  tree = getMarkTree(data, width, height, avoidMarks, minTextWidth, minTextHeight);
  var after = (performance.now() - before);
  // tree.write("canvas", width, height);
  // console.log(process);
  // console.log(process.memoryUsage());
  // var k = "strin";
  // console.log(process.memoryUsage());
  data.forEach(considerLabelFactory(tree, padding, findPosition, place));
  // bins.write("canvas-after", width, height);

  return [data, after, tree];
}

function findPosition(datum, tree, padding) {
  var i, dx, dy;

  datum.labelPlaced = false;
  for (i = 0; i < POSITIONS_LEN && !datum.labelPlaced; i++) {
    dx = POSITIONS[i][0];
    dy = POSITIONS[i][1];

    datum.boundary = getBoundary(datum, dx, dy, padding);

    if (tree.outOfBound(datum.boundary)) continue;
    
    datum.currentPosition = [dx, dy];
    if (!checkCollision(datum.boundary, tree)) {
      datum.labelPlaced = true;
    }
  }
}

function place(datum, bin) {
  bin.addRange(datum.boundary.x, datum.boundary.y, datum.boundary.x2, datum.boundary.y2);
}

function checkCollision(b, bin) {
  return bin.collides(b.x, b.y, b.x2, b.y2);
}

function getMarkTree(data, width, height, avoidMarks, minTextWidth, minTextHeight) {
  if (!data.length) return null;
  var bin = new RBushMap(width, height);
  var marksInfo = drawAvoidMarksAndVectorizeRects(avoidMarks, width, height);

  var buffer = new Uint32Array(
    marksInfo.canvas.getImageData(0, 0, width, height).data.buffer
  );

  minTextWidth = ~~minTextWidth;
  minTextHeight = ~~minTextHeight;

  var x, y, surroundingPixels;
  var bulk = [];
  for (y = 1; y < height; y++) {
    for (x = 1; x < width; x++) {
      surroundingPixels =
        !!buffer[y     * width + x] +
        !!buffer[(y-1) * width + (x-1)] +
        !!buffer[y     * width + (x-1)] +
        !!buffer[(y-1) * width + x];
      if (0 < surroundingPixels && surroundingPixels < 4) {
        bulk.push({
          minX: x,
          minY: y,
          maxX: x,
          maxY: y
        });
      } else if (surroundingPixels === 4 && x % minTextWidth === 0 && y % minTextHeight === 0) {
        bulk.push({
          minX: x,
          minY: y,
          maxX: x,
          maxY: y
        });
      }
    }
  }

  var h_1 = height - 1, w_1 = width - 1;
  for (y = 1; y < height; y++) {
    if (buffer[y * width] || buffer[(y-1) * width]) {
      bulk.push({
        minX: 0,
        minY: y,
        maxX: 0,
        maxY: y
      });
    }

    if (buffer[y * width + w_1] || buffer[(y-1) * width + w_1]) {
      bulk.push({
        minX: width,
        minY: y,
        maxX: width,
        maxY: y
      });
    }
  }

  for (x = 1; x < width; x++) {
    if (buffer[x] || buffer[x-1]) {
      bulk.push({
        minX: x,
        minY: 0,
        maxX: x,
        maxY: 0
      });
    }

    if (buffer[h_1 * width + x] || buffer[h_1 * width + (x-1)]) {
      bulk.push({
        minX: x,
        minY: height,
        maxX: x,
        maxY: height
      });
    }
  }

  if (buffer[0]) {
    bulk.push({
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
    });
  }
  if (buffer[0 * width + w_1]) {
    bulk.push({
      minX: width,
      minY: 0,
      maxX: width,
      maxY: 0
    });
  }
  if (buffer[h_1 * width]) {
    bulk.push({
      minX: 0,
      minY: height,
      maxX: 0,
      maxY: height
    });
  }
  if (buffer[h_1 * width + w_1]) {
    bulk.push({
      minX: width,
      minY: height,
      maxX: width,
      maxY: height
    });
  }

  marksInfo.rects.forEach(function(r) {
    bulk.push(r);
  });
  bin.tree.load(bulk);
  return bin;
}
