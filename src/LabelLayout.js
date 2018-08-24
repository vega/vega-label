/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/

import placeLabel from './PlaceLabel';
import placeLabelInArea from './PlaceLabelInArea';
import fillBitMap from './FillBitMap';
import BitMap from './BitMap';

var TOP = 0x0,
  MIDDLE = 0x1 << 0x2,
  BOTTOM = 0x2 << 0x2,
  LEFT = 0x0,
  CENTER = 0x1,
  RIGHT = 0x2;

var anchorsMap = {
  'top-left': TOP + LEFT,
  top: TOP + CENTER,
  'top-right': TOP + RIGHT,
  left: MIDDLE + LEFT,
  middle: MIDDLE + CENTER,
  right: MIDDLE + RIGHT,
  'bottom-left': BOTTOM + LEFT,
  bottom: BOTTOM + CENTER,
  'bottom-right': BOTTOM + RIGHT,
};

export default function() {
  var offset, sort, anchor, avoidMarks, size;
  var avoidBaseMark, lineAnchor, markIdx, padding;
  var label = {},
    texts = [];

  label.layout = function() {
    var n = texts.length;
    if (!size || size.length !== 2 || !n) return texts;

    var data = Array(n),
      marktype = texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined,
      transformed = texts[0].transformed,
      grouptype = marktype === 'group' ? texts[0].datum.items[markIdx].marktype : undefined,
      getMarkBound = getMarkBoundFactory(marktype, grouptype, lineAnchor, markIdx);

    var i, d, originalOpacity;
    for (i = 0; i < n; i++) {
      d = texts[i];

      data[i] = {
        textWidth: undefined,
        textHeight: d.fontSize,
        fontSize: d.fontSize,
        font: d.font,
        text: d.text,
        sort: sort ? sort(d.datum) : undefined,
        markBound: getMarkBound(d),
        originalOpacity: transformed ? originalOpacity : d.opacity,
        opacity: 0,
        datum: d,
      };
    }

    if (sort) data.sort((a, b) => a.sort - b.sort); // sort have to be number

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

    for (i = 0; i < n; i++) {
      d = data[i];
      if (d.originalOpacity !== 0) place(d);
    }

    bm1.print('bit-map-1');
    if (bm2) bm2.print('bit-map-2');
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
      for (var i = 0; i < n; i++) anchor[i] |= anchorsMap[_[i]];
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

function getMarkBoundFactory(marktype, grouptype, lineAnchor, markIdx) {
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

function placeFactory(gt, bm1, bm2, bm3, anchor, offset, size, avoidBaseMark) {
  var mb;
  var w = size[0],
    h = size[1];
  if (gt === 'area') {
    return function(d) {
      if (placeLabelInArea(d, bm1, bm2, h, avoidBaseMark)) d.opacity = d.originalOpacity;
    };
  } else {
    return function(d) {
      mb = d.markBound;
      if (mb[2] >= 0 && mb[5] >= 0 && mb[0] <= w && mb[3] <= h)
        if (placeLabel(d, bm1, bm2, anchor, offset)) d.opacity = d.originalOpacity;
    };
  }
}
