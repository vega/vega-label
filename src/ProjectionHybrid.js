import { drawAvoidMarks } from "./ProjectionImage";

export function drawAvoidMarksAndVectorizeRects(avoidMarks, width, height) {
  var withoutRects = [],
      rects = [];

  avoidMarks.forEach(function(m) {
    (markType(m) === 'rect' ? rects : withoutRects).push(m);
  })

  return {
    canvas: drawAvoidMarks(withoutRects, width, height),
    rects: extractRectsInfo(rects)
  };
}

function extractRectsInfo(rects) {
  var rectsLength = rects.length,
      rectsInfo = [];
  var i, j, rectLength, rect, item, halfStrokeWidth;

  for (i = 0; i < rectsLength; i++) {
    rect = rects[i];
    rectLength = rect.length;
    for (j = 0; j < rectLength; j++) {
      item = rect[j];
      if (item.stroke) {
        halfStrokeWidth = item.strokeWidth;
        halfStrokeWidth = halfStrokeWidth === null || halfStrokeWidth === undefined ? 0.5 : (halfStrokeWidth / 2.0);
        rectsInfo.push({
          minX: item.x - halfStrokeWidth,
          minY: item.y - halfStrokeWidth,
          maxX: item.x2 + halfStrokeWidth,
          maxY: item.y2 + halfStrokeWidth,
        });
      } else if (item.fill) {
        rectsInfo.push({
          minX: item.x,
          minY: item.y,
          maxX: item.x2,
          maxY: item.y2,
        });
      }
    }
  }

  return rectsInfo;
}

function markType(avoidMark) {
  return avoidMark.length !== 0 && avoidMark[0].mark.marktype;
}