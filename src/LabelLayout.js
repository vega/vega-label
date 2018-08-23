/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import placeLabels from './PixelBasedLabel';

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
  var offsets, sort, anchors, avoidMarks, size;
  var avoidBaseMark, lineAnchor, markIdx, padding;
  var label = {},
    texts = [];

  label.layout = function() {
    var n = texts.length;
    if (!size || size.length !== 2 || !n) return texts;

    var data = Array(n),
      marktype = texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined,
      transformed = texts[0].transformed,
      isGroupLine = marktype === 'group' && texts[0].datum.items[markIdx].marktype === 'line',
      getMarkBound = getMarkBoundFactory(marktype, isGroupLine, lineAnchor, markIdx);

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

    return placeLabels(
      data,
      anchors,
      offsets,
      marktype,
      avoidMarks,
      size,
      avoidBaseMark,
      markIdx,
      padding
    );
  };

  label.texts = function(_) {
    if (arguments.length) {
      texts = _;
      return label;
    } else return texts;
  };

  label.offsets = function(_, len) {
    if (arguments.length) {
      var n = _.length;
      offsets = new Float64Array(len);
      for (var i = 0; i < n; i++) offsets[i] = _[i] ? _[i] : 0;
      for (i = n; i < len; i++) offsets[i] = offsets[n - 1] ? offsets[n - 1] : 0;
      return label;
    } else return offsets;
  };

  label.sort = function(_) {
    if (arguments.length) {
      sort = _;
      return label;
    } else return sort;
  };

  label.anchors = function(_, len) {
    if (arguments.length) {
      var n = _.length;
      anchors = new Int8Array(len);
      for (var i = 0; i < n; i++) anchors[i] |= anchorsMap[_[i]];
      for (i = n; i < len; i++) anchors[i] = anchors[n - 1];
      return label;
    } else return anchors;
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

function getMarkBoundFactory(marktype, isGroupLine, lineAnchor, markIdx) {
  if (!marktype) {
    return d => [d.x, d.x, d.x, d.y, d.y, d.y];
  } else if (marktype === 'line' || marktype === 'area') {
    return function(d) {
      var datum = d.datum;
      return [datum.x, datum.x, datum.x, datum.y, datum.y, datum.y];
    };
  } else if (isGroupLine) {
    var endItemIndex = lineAnchor === 'begin' ? m => m - 1 : () => 0;
    return function(d) {
      var items = d.datum.items[markIdx].items;
      var m = items.length;
      if (m) {
        var endItem = items[endItemIndex(m)];
        return [endItem.x, endItem.x, endItem.x, endItem.y, endItem.y, endItem.y];
      } else return [-1, -1, -1, -1, -1, -1]; // change to min int
    };
  } else {
    return function(d) {
      var b = d.datum.bounds;
      return [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
    };
  }
}
