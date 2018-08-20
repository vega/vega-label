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
  var offsets, sort, anchors, avoidMarks, allowOutside, size, avoidBaseMark, lineAnchor;
  var label = {},
    texts = [];

  label.layout = function() {
    var n = texts.length,
      data = Array(n),
      marktype =
        n && texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined,
      transformed = n ? texts[0].transformed : false;

    if (!size || size.length !== 2) return texts;

    console.time('layout');
    var i, d, originalOpacity;
    var getMarkBound = getMarkBoundFactory(marktype, lineAnchor);
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

    if (sort) {
      data.sort(function(a, b) {
        return a.sort - b.sort;
      });
    }

    console.timeEnd('layout');
    return placeLabels(
      data,
      anchors,
      offsets,
      marktype,
      avoidMarks,
      allowOutside,
      size,
      avoidBaseMark
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

  label.allowOutside = function(_) {
    if (arguments.length) {
      allowOutside = _;
      return label;
    } else return allowOutside;
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

  return label;
}

function getMarkBoundFactory(marktype, lineAnchor) {
  if (!marktype) {
    return function(d) {
      return [d.x, d.x, d.x, d.y, d.y, d.y];
    };
  } else if (marktype === 'line' || marktype === 'area') {
    return function(d) {
      var datum = d.datum;
      return [datum.x, datum.x, datum.x, datum.y, datum.y, datum.y];
    };
  } else if (marktype === 'group') {
    var endItemIndex = endItemIndexFactory(lineAnchor);
    return function(d) {
      var items = d.datum.items[0].items;
      var m = items.length;
      if (m) {
        var endItem = items[endItemIndex(m)];
        return [endItem.x, endItem.x, endItem.x, endItem.y, endItem.y, endItem.y];
      } else return [-1, -1, -1, -1, -1, -1];
    };
  } else {
    return function(d) {
      var b = d.datum.bounds;
      return [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
    };
  }
}

function endItemIndexFactory(lineAnchor) {
  if (lineAnchor === 'begin') {
    return function(m) {
      return m - 1;
    };
  }

  return function() {
    return 0;
  };
}
