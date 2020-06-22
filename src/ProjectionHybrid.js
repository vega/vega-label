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
  var i, j, rectLength, rect, item;

  for (i = 0; i < rectsLength; i++) {
    rect = rects[i];
    rectLength = rect.length;
    for (j = 0; j < rectLength; j++) {
      item = rect[j];
      rectsInfo.push({
        minX: item.x,
        minY: item.y,
        maxX: item.x2,
        maxY: item.y2,
        fill: item.fill,
        stoke: item.stroke,
        strokeWidth: item.strokeWidth
      });
    }
  }

  return rectsInfo;
}

function markType(avoidMark) {
  return avoidMark.length !== 0 && avoidMark[0].mark.marktype;
}