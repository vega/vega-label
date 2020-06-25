/*eslint no-unused-vars: "warn"*/

function angledLine(x1, y1, x2, y2, vx, vy, particles) {
  var i, tmp;
  if (x1 > x2) {
    tmp = x1;
    x1 = x2;
    x2 = x1;

    tmp = y1;
    y1 = y2;
    y2 = tmp;
  }

  if (vx < 0) {
    vx = -vx;
    vy = -vy;
  }

  for (i = 0; x1 + (vx * i) < x2; i++) {
    particles.push([x1 + (vx * i), y1 + (vy * i)]);
  }
  particles.push([x2, y2]);
}

function verticalLine(x, y1, y2, particles) {
  var i;
  for (i = 0; y1 + i < y2; i++) {
    particles.push([x, y1 + i]);
  }
  particles.push([x, y2]);
}

function pointCoverLine(datum, halfWidth, particles) {
  var x1, x2, y1, y2, i, vx, vy, size, pvx, pvy, x, y;
  if (datum.y === datum.y2) {
    if (datum.x < datum.x2) {
      x1 = datum.x;
      x2 = datum.x2;
    } else {
      x1 = datum.x2;
      x2 = datum.x;
    }
    y1 = datum.y;

    for (i = 0; x1 + i < x2; i++) {
      verticalLine(x1 + i, y1 - halfWidth, y1 + halfWidth, particles);
    }
    verticalLine(x2, y1 - halfWidth, y1 + halfWidth, particles);
    return;
  }

  if (datum.y < datum.y2) {
    x1 = datum.x;
    x2 = datum.x2;
    y1 = datum.y;
    y2 = datum.y2;
  } else {
    x1 = datum.x2;
    x2 = datum.x;
    y1 = datum.y2;
    y2 = datum.y;
  }

  vx = x2 - x1;
  vy = y2 - y1;
  size = Math.sqrt((vx * vx) + (vy * vy));
  vx /= size;
  vy /= size;
  pvx = -vy * halfWidth;
  pvy = vx * halfWidth;

  for (i = 0; y1 + (vy * i) < y2; i++) {
    x = x1 + (vx * i);
    y = y1 + (vy * i);
    angledLine(x - pvx, y - pvy, x + pvx, y + pvy, -vy, vx, particles);
  }
  angledLine(x2 - pvx, y2 - pvy, x2 + pvx, y2 + pvy, -vy, vx, particles);
}

function pointCoverLines(avoidMark, particles) {
  var i, n = avoidMark.length;
  var halfWidth = avoidMark[0].strokeWidth / 2.0;
  for (i = 0; i < n; i++) {
    pointCoverLine(avoidMark[i], halfWidth, particles);
  }
}

var CIRCLE_PARTS = [
  [            0, Math.PI * 0.5],
  [Math.PI * 0.5,       Math.PI],
  [      Math.PI, Math.PI * 1.5],
  [Math.PI * 1.5, Math.PI * 2.0],
];
var CIRCLE_PARTS_LEN = CIRCLE_PARTS.length;
function pointCoverCircles(avoidMark, particles) {
  var i, j, ang, angEnd, vang, r, n = avoidMark.length;
  var item, x, y, x0, y0;
  for (i = 0; i < n; i++) {
    item = avoidMark[i];
    r = Math.sqrt(item.size / Math.PI);
    x0 = item.x;
    y0 = item.y;
    vang = 2 * Math.asin(0.5 / r);

    for (j = 0; j < CIRCLE_PARTS_LEN; j++) {
      angEnd = CIRCLE_PARTS[j][1];
      for (ang = CIRCLE_PARTS[j][0]; ang < angEnd; ang += vang) {
        x = r * Math.cos(ang);
        y = r * Math.sin(ang);
        particles.push([x0 + x, y0 + y]);
      }
    }
  }
}

function pointCoverRects(avoidMark, particles) {
  var i, j, k, n = avoidMark.length;
  var x1, x2, y1, y2, item;
  for (i = 0; i < n; i++) {
    item = avoidMark[i];
    if (!item.fill) {
      continue;
    }

    if (item.y < item.y2) {
      y1 = item.y;
      y2 = item.y2;
    } else {
      y1 = item.y2;
      y2 = item.y;
    }

    if (item.x < item.x2) {
      x1 = item.x;
      x2 = item.x2;
    } else {
      x1 = item.x2;
      x2 = item.x;
    }

    // TODO: incoperate label width/height
    for (j = 0; y1 + j < y2; j++) {
      for (k = 0; x1 + k < x2; k++) {
        particles.push([x1 + k, y1 + j]);
      }
      particles.push([x2, y1 + j]);
    }

    for (j = 0; x1 + j < x2; j++) {
      particles.push([x1 + j, y2]);
    }

    particles.push([x2, y2]);
  }
}

function pointCoverPaths(avoidMark, particles) {
  var i, j, k, avoidMarkLen = avoidMark.length, pathsLen, pointsLen;
  var paths, pathString, points, point, x, y, prevX, prevY;
  var halfWidth = avoidMark[0].strokeWidth / 2.0;
  for (i = 0; i < avoidMarkLen; i++) {
    pathString = avoidMark[i].path;
    if (!pathString) {
      continue;
    }
    paths = pathString.substring(1, pathString.length - 1).split("ZM");
    pathsLen = paths.length;
    for (j = 0; j < pathsLen; j++) {
      points = paths[j].split("L");
      pointsLen = points.length;

      point = points[0].split(",");
      prevX = parseFloat(point[0]);
      prevY = parseFloat(point[1]);

      for (k = 1; k < pointsLen; k++) {
        point = points[k].split(",");
        x = parseFloat(point[0]);
        y = parseFloat(point[1]);
        pointCoverLine(
          {
            x1: prevX,
            y1: prevY,
            x2: x,
            y2: y,
          },
          halfWidth,
          particles
        )
        prevX = x;
        prevY = y;
      }
    }
  }
  return;
}

var pointCover = {
  rule: pointCoverLines,
  symbol: pointCoverCircles,
  rect: pointCoverRects,
  path: pointCoverPaths,
};

// eslint-disable-next-line no-unused-vars
export function pointCoverAvoidMarks(avoidMarks, _width, _height) {
  var particles = [],
      i, n = avoidMarks.length;
  for (i = 0; i < n; i++) {
    var t = markType(avoidMarks[i]);
    pointCover[t](avoidMarks[i], particles);
  }
  // console.log(particles.length);
  return particles;
}

function markType(avoidMark) {
  return avoidMark.length !== 0 && avoidMark[0].mark.marktype;
}
