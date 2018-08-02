/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { canvas } from 'vega-canvas';
import placeLabelsParticle from './ParticleBasedLabel';
import placeLabelsPixel from './PixelBasedLabel';

var TOP = 0x0,
    MIDDLE = 0x1 << 0x2,
    BOTTOM = 0x2 << 0x2,
    LEFT = 0x0,
    CENTER = 0x1,
    RIGHT = 0x2,
    INNER = 0x1 << 0x4;

var anchorsMap = {
  'top-left': TOP + LEFT,
  'top': TOP + CENTER,
  'top-right': TOP + RIGHT,
  'left': MIDDLE + LEFT,
  'middle': MIDDLE + CENTER,
  'right': MIDDLE + RIGHT,
  'bottom-left': BOTTOM + LEFT,
  'bottom': BOTTOM + CENTER,
  'bottom-right': BOTTOM + RIGHT,
};

export default function() {
  var context = canvas().getContext("2d"),
      dataFromMark = [],
      size,
      offset,
      sort,
      anchors,
      marks,
      label = {};

  label.layout = function() {
    var n = dataFromMark.length,
        md, data = Array(n),
        marktype = n && dataFromMark[0].datum && dataFromMark[0].datum.mark ? dataFromMark[0].datum.mark.marktype : undefined;

    for (var i = 0; i < n; i++) {
      md = dataFromMark[i];
      var textWidth = labelWidth(md.text, md.fontSize, md.font, context),
          textHeight = md.fontSize,
          mb = marktype && marktype !== 'line' && md.datum.bounds ? md.datum.bounds : {
            x1: md.x,
            x2: md.x,
            y1: md.y,
            y2: md.y
          };

      data[i] = {
        fontSize: md.fontSize,
        x: md.x,
        y: md.y,
        textWidth: textWidth,
        textHeight: textHeight,
        boundFun: getBoundFunction([mb.x1, (mb.x1 + mb.x2) / 2.0, mb.x2, mb.y1, (mb.y1 + mb.y2) / 2.0, mb.y2], textWidth, textHeight, offset),
        fill: md.fill,
        sort: sort ? sort(md.datum) : undefined,
        markBound: mb,
        datum: md
      };
    }

    if (sort) data.sort(function(a, b) { return a.sort - b.sort; });

    return placeLabelsPixel(data, size, marktype, anchors, marks);
  };

  label.dataFromMark = function(_) {
    if (arguments.length) {
      dataFromMark = _;
      return label;
    } else {
      return dataFromMark;
    }
  };

  label.size = function(_) {
    if (arguments.length) {
      size = _ ? [+_[0], +_[1]] : undefined;
      return label;
    } else {
      return size;
    }
  };

  label.offset = function(_) {
    if (arguments.length) {
      offset = _;
      return label;
    } else {
      return offset;
    }
  }

  label.sort = function(_) {
    if (arguments.length) {
      sort = _;
      return label;
    } else {
      return sort;
    }
  }

  label.anchors = function(_) {
    if (arguments.length) {
      var n = _.length, i, directions;
      anchors = new Int8Array(n).fill(0x0);
      for (i = 0; i < n; i++) {
        directions = _[i].split('-');
        if (directions[0] === 'inner') {
          anchors[i] = INNER;
          directions.splice(0, 1);
        }
        anchors[i] |= anchorsMap[directions.join('-')];
      }
      return label;
    } else {
      return anchors;
    }
  }

  label.marks = function(_) {
    if (arguments.length) {
      marks = _ ? _ : [];
      return label;
    } else {
      return sort;
    }
  }

  return label;
}

function getBoundFunction(b, w, h, offset) {
  return function (dx, dy, inner) {
    var _inner = inner ? -1 : 1,
        _y = b[4 + dy] + (_inner * h * dy / 2.0) + (offset * dy * _inner),
        _x = b[1 + dx] + (_inner * w * dx / 2.0) + (offset * dx * _inner);
    return {
      y: _y - (h / 2.0),
      yc: _y,
      y2: _y + (h / 2.0),
      x: _x - (w / 2.0),
      xc: _x,
      x2: _x + (w / 2.0),
    }
  };
}

function labelWidth (text, fontSize, font, context) {
  context.font = fontSize + "px " + font; // add other font properties
  return context.measureText(text).width;
}