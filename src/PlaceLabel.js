/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { labelWidth } from './common';

var SIZE_FACTOR = 0.707106781186548;
var ALIGN = ['right', 'center', 'left'];
var BASELINE = ['bottom', 'middle', 'top'];

export default function(d, layer1, layer2, anchors, offsets) {
  var n = offsets.length,
    textWidth = d.textWidth,
    textHeight = d.textHeight,
    markBound = d.markBound,
    text = d.text,
    font = d.font;
  var dx, dy, isInside, sizeFactor, insideFactor;
  var x, x1, xc, x2, y1, yc, y2;
  var _x1, _x2, _y1, _y2;
  var bin = layer1.bin;

  for (var i = 0; i < n; i++) {
    dx = (anchors[i] & 0x3) - 1;
    dy = ((anchors[i] >>> 0x2) & 0x3) - 1;

    isInside = (dx === 0 && dy === 0) || offsets[i] < 0;
    sizeFactor = dx && dy ? SIZE_FACTOR : 1;
    insideFactor = offsets[i] < 0 ? -1 : 1;

    yc = markBound[4 + dy] + (insideFactor * textHeight * dy) / 2.0 + offsets[i] * dy * sizeFactor;
    x = markBound[1 + dx] + offsets[i] * dx * sizeFactor;

    y1 = yc - textHeight / 2.0;
    y2 = yc + textHeight / 2.0;

    _y1 = bin(y1);
    _y2 = bin(y2);
    _x1 = bin(x);

    if (!textWidth) {
      // var end = _x1 + (_y2 - _y1) * (~~(text.length / 3));
      if (isLabelPlacable(_x1, _x1, _y1, _y2, layer1, layer2, x, x, y1, y2, markBound, isInside))
        continue;
      else textWidth = labelWidth(text, textHeight, font);
    }

    xc = x + (insideFactor * textWidth * dx) / 2.0;
    x1 = xc - textWidth / 2.0;
    x2 = xc + textWidth / 2.0;

    _x1 = bin(x1);
    _x2 = bin(x2);

    if (!isLabelPlacable(_x1, _x2, _y1, _y2, layer1, layer2, x1, x2, y1, y2, markBound, isInside)) {
      d.x = !dx ? xc : dx * insideFactor < 0 ? x2 : x1;
      d.y = !dy ? yc : dy * insideFactor < 0 ? y2 : y1;

      d.align = ALIGN[dx * insideFactor + 1];
      d.baseline = BASELINE[dy * insideFactor + 1];

      layer1.markInBoundBinned(_x1, _y1, _x2, _y2);
      return true;
    }
  }
  return false;
}

function isLabelPlacable(_x1, _x2, _y1, _y2, layer1, layer2, x1, x2, y1, y2, markBound, isInside) {
  return (
    layer1.searchOutOfBound(_x1, _y1, _x2, _y2) ||
    (isInside
      ? checkCollision(_x1, _y1, _x2, _y2, layer2) || !isInMarkBound(x1, y1, x2, y2, markBound)
      : checkCollision(_x1, _y1, _x2, _y2, layer1))
  );
}

function isInMarkBound(x1, y1, x2, y2, markBound) {
  return markBound[0] <= x1 && x2 <= markBound[2] && markBound[3] <= y1 && y2 <= markBound[5];
}

export function checkCollision(x1, y1, x2, y2, bitMap) {
  return bitMap.getInBoundBinned(x1, y2, x2, y2) || bitMap.getInBoundBinned(x1, y1, x2, y2 - 1);
}
