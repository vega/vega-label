function pointCoverLine(avoidMark, particles) {
  var i, j, n = avoidMark.length;
  var x1, x2, y1, y2, vx, vy, pvx, pvy, item;
  var halfWidth = avoidMark[0].strokeWidth / 2.0;
  for (i = 0; i < n; i++) {
    item = avoidMark[i];
    if (item.y1 === item.y2) {
      if (item.x1 < item.x2) {
        x1 = item.x1;
        x2 = item.x2;
      } else {
        x1 = item.x2;
        x2 = item.x1;
      }
      y1 = item.y1;

      for (j = 0; x1 + j < x2; j++) {
        particles.push([x1 + j, y1 + halfWidth]);
        particles.push([x1 + j, y1 - halfWidth]);
      }
      particles.push([x2, y1 + halfWidth]);
      particles.push([x2, y1 - halfWidth]);
      continue;
    }

    if (item.y1 < item.y2) {
      x1 = item.x1;
      x2 = item.x2;
      y1 = item.y1;
      y2 = item.y2;
    } else {
      x1 = item.x2;
      x2 = item.x1;
      y1 = item.y2;
      y2 = item.y1;
    }

    vx = x2 - x1;
    vy = y2 - y1;
    size = (vx * vx) + (vy * vy);
    pvx = -vy * halfWidth;
    pvy = vx * halfWidth;

    for (j = 0; y1 + (vy * j) < y2; j++) {
      particles.push([x1 + (vx * j) + pvx, y1 + (vy * j) + pvy]);
      particles.push([x1 + (vx * j) - pvx, y1 + (vy * j) - pvy]);
    }
    particles.push([x2 + pvx, y2 + pvy]);
    particles.push([x2 - pvx, y2 - pvy]);
  }
}

var CIRCLE_PARTS = [
  [            0, Math.PI * 0.5],
  [Math.PI * 0.5,       Math.PI],
  [      Math.PI, Math.PI * 1.5],
  [Math.PI * 1.5, Math.PI * 2.0],
];
var CIRCLE_PARTS_LEN = CIRCLE_PARTS.length;
function pointCoverCircle(avoidMark, particles) {
  var i, ang, angEnd, vang, r, n = avoidmark.length;
  var item, x, y, x0, y0;
  for (i = 0; i < n; i++) {
    item = avoidmark[i];
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

function pointCoverRect(avoidMark, particles) {
  var i, j, k, n = avoidmark.length;
  var x1, x2, y1, y2, item;
  for (i = 0; i < n; i++) {
    item = avoidmark[i];
    if (item.y1 < item.y2) {
      y1 = item.y1;
      y2 = item.y2;
    } else {
      y1 = item.y2;
      y2 = item.y1;
    }

    if (item.x1 < item.x2) {
      x1 = item.x1;
      x2 = item.x2;
    } else {
      x1 = item.x2;
      x2 = item.x1;
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

function pointCoverGeo(avoidMark, particles) {
  var i, n = avoidmark.length;
  var item, x, y, strokeWidth, coordinates, coordinatesLen;
  for (i = 0; i < n; i++) {
    item = avoidmark[i];
    strokeWidth = item.strokeWidth;
    coordinates = item.datum.geometry.coordinated;
    coordinatesLen = coordinates.length;

    // TODO: add line width
    for (j = 0; j < coordinatesLen; j++) {
      particles.push(coordinates[j]);
    }
  }
}

var pointCover = {
  rule: pointCoverLine,
  symbol: pointCoverCircle,
  rect: pointCoverRect,
  shape: pointCoverGeo,
};

export function pointCoverAvoidMarks(avoidMarks) {
  var particles = [],
      i, n = avoidMarks.length;
  for (i = 0; i < n; i++) {
    const t = markType(avoidMarks[i]);
    pointCover[t](avoidMarks[i], particles);
  }
  return particles
}

function markType(avoidMark) {
  return avoidMark[0].mark.marktype;
}
