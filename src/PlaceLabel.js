/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { canvas } from 'vega-canvas';
import { labelWidth } from './Common';

const SIZE_FACTOR = 0.707106781186548; // this is 1 over square root of 2
const ALIGN = ['right', 'center', 'left'];
const BASELINE = ['bottom', 'middle', 'top'];

export default function(d, bitmaps, anchors, offsets) {
  const context = canvas().getContext('2d');
  const n = offsets.length,
    textHeight = d.textHeight,
    markBound = d.markBound,
    text = d.text,
    font = d.font,
    bm0 = bitmaps[0],
    bm1 = bitmaps[1],
    scalePixel = bm0.scalePixel;
  let textWidth = d.textWidth;
  let dx, dy, isInside, sizeFactor, insideFactor;
  let x, x1, xc, x2, y1, yc, y2;
  let _x1, _x2, _y1, _y2;

  for (let i = 0; i < n; i++) {
    dx = (anchors[i] & 0x3) - 1;
    dy = ((anchors[i] >>> 0x2) & 0x3) - 1;

    isInside = (dx === 0 && dy === 0) || offsets[i] < 0;
    sizeFactor = dx && dy ? SIZE_FACTOR : 1;
    insideFactor = offsets[i] < 0 ? -1 : 1;

    yc = markBound[4 + dy] + (insideFactor * textHeight * dy) / 2.0 + offsets[i] * dy * sizeFactor;
    x = markBound[1 + dx] + offsets[i] * dx * sizeFactor;

    y1 = yc - textHeight / 2.0;
    y2 = yc + textHeight / 2.0;

    _y1 = scalePixel(y1);
    _y2 = scalePixel(y2);
    _x1 = scalePixel(x);

    if (!textWidth) {
      // const end = _x1 + (_y2 - _y1) * (~~(text.length / 3));
      if (isLabelPlacable(_x1, _x1, _y1, _y2, bm0, bm1, x, x, y1, y2, markBound, isInside))
        continue;
      else textWidth = labelWidth(context, text, textHeight, font);
    }

    xc = x + (insideFactor * textWidth * dx) / 2.0;
    x1 = xc - textWidth / 2.0;
    x2 = xc + textWidth / 2.0;

    _x1 = scalePixel(x1);
    _x2 = scalePixel(x2);

    if (!isLabelPlacable(_x1, _x2, _y1, _y2, bm0, bm1, x1, x2, y1, y2, markBound, isInside)) {
      d.x = !dx ? xc : dx * insideFactor < 0 ? x2 : x1;
      d.y = !dy ? yc : dy * insideFactor < 0 ? y2 : y1;

      d.align = ALIGN[dx * insideFactor + 1];
      d.baseline = BASELINE[dy * insideFactor + 1];

      bm0.markInRangeScaled(_x1, _y1, _x2, _y2);
      return true;
    }
  }
  return false;
}

function isLabelPlacable(_x1, _x2, _y1, _y2, bm0, bm1, x1, x2, y1, y2, markBound, isInside) {
  return (
    bm0.searchOutOfBound(_x1, _y1, _x2, _y2) ||
    (isInside
      ? checkCollision(_x1, _y1, _x2, _y2, bm1) || !isInMarkBound(x1, y1, x2, y2, markBound)
      : checkCollision(_x1, _y1, _x2, _y2, bm0))
  );
}

function isInMarkBound(x1, y1, x2, y2, markBound) {
  return markBound[0] <= x1 && x2 <= markBound[2] && markBound[3] <= y1 && y2 <= markBound[5];
}

export function checkCollision(x1, y1, x2, y2, bitMap) {
  return bitMap.getInRangeScaled(x1, y2, x2, y2) || bitMap.getInRangeScaled(x1, y1, x2, y2 - 1);
}
