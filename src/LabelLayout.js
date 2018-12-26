/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/

import placeLabel from './PlaceLabel';
import placeLabelInArea from './PlaceLabelInArea';
import fillBitMap from './FillBitMap';
import { default as BitMap, printBitMap } from './BitMap';
import anchorsOffsetDict from './AnchorsOffsetDict';

export default function() {
  var offset, sort, anchor, avoidMarks, size;
  var avoidBaseMark, lineAnchor, markIdx, padding;
  var label = {},
    texts = [];

  label.layout = function() {
    var n = texts.length;
    if (!n) return texts; // return immediately when there is not label to be placed

    if (!size || size.length !== 2) {
      throw Error('Size of chart should be specified as an array of width and height');
    }

    var data = new Array(n),
      marktype = texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined,
      transformed = texts[0].transformed,
      grouptype = marktype === 'group' ? texts[0].datum.items[markIdx].marktype : undefined,
      getMarkBoundary = getMarkBoundaryFactory(marktype, grouptype, lineAnchor, markIdx);

    // prepare text mark data for placing
    var i, d;
    for (i = 0; i < n; i++) {
      d = texts[i];

      data[i] = {
        textWidth: undefined,
        textHeight: d.fontSize,
        fontSize: d.fontSize,
        font: d.font,
        text: d.text,
        sort: sort ? sort(d.datum) : undefined,
        markBound: getMarkBoundary(d),
        originalOpacity: transformed ? d.originalOpacity : d.opacity,
        opacity: 0,
        datum: d,
      };
    }

    // sort field has to be primitive variable type
    if (sort) data.sort((a, b) => a.sort - b.sort);

    // a flag for determining if it is possible for label to be placed inside its base mark
    var labelInside = false;
    for (i = 0; i < anchor.length && !labelInside; i++) {
      labelInside = anchor[i] === 0x5 || offset[i] < 0;
    }

    var bitMaps, bm1, bm2, bm3;
    bitMaps = fillBitMap(data, size, marktype, avoidBaseMark, avoidMarks, labelInside, padding);
    bm1 = bitMaps[0];
    bm2 = bitMaps[1];
    bm3 = grouptype === 'area' ? new BitMap(size[0], size[1], padding) : undefined;
    var place = placeFactory(grouptype, bm1, bm2, bm3, anchor, offset, size, avoidBaseMark);

    // place all label
    for (i = 0; i < n; i++) {
      d = data[i];
      if (d.originalOpacity !== 0) place(d);
    }

    printBitMap(bm1, 'bit-map-1');
    if (bm2) printBitMap(bm2, 'bit-map-2');
    if (bm3) printBitMap(bm3, 'bit-map-before');
    return data;
  };

  label.texts = function(_) {
    if (arguments.length) {
      texts = _;
      return label;
    } else return texts;
  };

  label.offset = function(_, len) {
    if (arguments.length) {
      var n = _.length;
      offset = new Float64Array(len);
      for (var i = 0; i < n; i++) offset[i] = _[i] ? _[i] : 0;
      for (i = n; i < len; i++) offset[i] = offset[n - 1] ? offset[n - 1] : 0;
      return label;
    } else return offset;
  };

  label.anchor = function(_, len) {
    if (arguments.length) {
      var n = _.length;
      anchor = new Int8Array(len);
      for (var i = 0; i < n; i++) anchor[i] |= anchorsOffsetDict[_[i]];
      for (i = n; i < len; i++) anchor[i] = anchor[n - 1];
      return label;
    } else return anchor;
  };

  label.sort = function(_) {
    if (arguments.length) {
      sort = _;
      return label;
    } else return sort;
  };

  label.avoidMarks = function(_) {
    if (arguments.length) {
      avoidMarks = _;
      return label;
    } else return sort;
  };

  label.size = function(_) {
    if (arguments.length) {
      size = _;
      return label;
    } else return size;
  };

  label.avoidBaseMark = function(_) {
    if (arguments.length) {
      avoidBaseMark = _;
      return label;
    } else return avoidBaseMark;
  };

  label.lineAnchor = function(_) {
    if (arguments.length) {
      lineAnchor = _;
      return label;
    } else return lineAnchor;
  };

  label.markIdx = function(_) {
    if (arguments.length) {
      markIdx = _;
      return label;
    } else return markIdx;
  };

  label.padding = function(_) {
    if (arguments.length) {
      padding = _;
      return label;
    } else return padding;
  };

  return label;
}

/**
 * Factory function for function for getting base mark boundary, depending on mark and group type.
 * When mark type is undefined, line or area: boundary is the coordinate of each data point.
 * When base mark is grouped line, boundary is either at the beginning or end of the line depending
 * on the value of lineAnchor.
 * Otherwise, use boundary of base mark.
 *
 * @param {string} marktype mark type of base mark (marktype can be undefined if label does not use
 *                          reactive geometry to any other mark)
 * @param {string} grouptype group type of base mark if mark type is 'group' (grouptype can be
 *                           undefined if the base mark is not in group)
 * @param {string} lineAnchor anchor point of group line mark if group type is 'line' can be either
 *                            'begin' or 'end'
 * @param {number} markIdx index of base mark if base mark is in a group with multiple marks
 *
 * @returns function(d) for getting mark boundary from data point information d
 */
function getMarkBoundaryFactory(marktype, grouptype, lineAnchor, markIdx) {
  if (!marktype) {
    return d => [d.x, d.x, d.x, d.y, d.y, d.y];
  } else if (marktype === 'line' || marktype === 'area') {
    return function(d) {
      var datum = d.datum;
      return [datum.x, datum.x, datum.x, datum.y, datum.y, datum.y];
    };
  } else if (grouptype === 'line') {
    var endItemIndex = lineAnchor === 'begin' ? m => m - 1 : () => 0;
    return function(d) {
      var items = d.datum.items[markIdx].items;
      var m = items.length;
      if (m) {
        var endItem = items[endItemIndex(m)];
        return [endItem.x, endItem.x, endItem.x, endItem.y, endItem.y, endItem.y];
      }
      var min = Number.MIN_SAFE_INTEGER;
      return [-min, -min, -min, -min, -min, -min];
    };
  } else {
    return function(d) {
      var b = d.datum.bounds;
      return [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
    };
  }
}

/**
 * Factory function for label-placing function, depending on the type of group base mark.
 * Use placing label function from PlaceLabelInArea iff the grouptype is 'area'.
 * Otherwise, use regular placing label function from PlaceLabel.
 *
 * @param {string} grouptype type of group base mark (grouptype can be undefined if the base mark
 *                           is not in group)
 * @param {BitMap} bm1
 * @param {BitMap} bm2
 * @param {BitMap} bm3
 * @param {array} anchor array of anchos point (int8). this array is parallel with offset
 * @param {array} offset array of offset (float64). this array is parallel with anchor
 * @param {array} size array of chart size in format [width, height]
 * @param {bool} avoidBaseMark a boolean flag if avoiding base mark when placing label
 *
 * @returns function(d) for placing label with data point information d
 */
function placeFactory(grouptype, bm1, bm2, bm3, anchor, offset, size, avoidBaseMark) {
  var mb;
  var w = size[0],
    h = size[1];
  if (grouptype === 'area') {
    return function(d) {
      if (placeLabelInArea(d, bm1, bm2, bm3, w, h, avoidBaseMark)) d.opacity = d.originalOpacity;
    };
  } else {
    return function(d) {
      mb = d.markBound;
      if (mb[2] >= 0 && mb[5] >= 0 && mb[0] <= w && mb[3] <= h)
        if (placeLabel(d, bm1, bm2, anchor, offset)) d.opacity = d.originalOpacity;
    };
  }
}
