/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { canvas } from 'vega-canvas';
import { placeLabels as placeLabelsParticle } from './ParticleBasedLabel';
import { placeLabels as placeLabelsPixel } from './PixelBasedLabel';

export default function() {
  var context = canvas().getContext("2d"),
      dataFromMark = [],
      size,
      distance,
      priority,
      anchors,
      label = {};

  label.layout = function() {
    var n = dataFromMark.length,
        md, data = Array(n),
        marktype = n && dataFromMark[0].datum && dataFromMark[0].datum.mark ? dataFromMark[0].datum.mark.marktype : undefined;

    for (var i = 0; i < n; i++) {
      md = dataFromMark[i];
      var textWidth = labelWidth(md.text, md.fontSize, md.font, context),
          textHeight = md.fontSize,
          mb = marktype ? md.datum.bounds : {
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
        boundFun: getBoundFunction([mb.x1, (mb.x1 + mb.x2) / 2.0, mb.x2, mb.y1, (mb.y1 + mb.y2) / 2.0, mb.y2], textWidth, textHeight, distance),
        fill: md.fill,
        priority: priority ? md[priority] : undefined,
        markBound: mb,
        datum: md
      };
    }

    if (priority) data.sort(function(a, b) { return a.priority - b.priority; });

    return placeLabelsPixel(data, size, marktype, anchors);
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

  label.distance = function(_) {
    if (arguments.length) {
      distance = _;
      return label;
    } else {
      return distance;
    }
  }

  label.priority = function(_) {
    if (arguments.length) {
      priority = _;
      return label;
    } else {
      return priority;
    }
  }

  var anchorsMap = {
    'top-left': 0x00,
    'top': 0x01,
    'top-right': 0x02,
    'left': 0x10,
    'middle': 0x11,
    'right': 0x12,
    'bottom-left': 0x20,
    'bottom': 0x21,
    'bottom-right': 0x22
  };

  label.anchors = function(_) {
    if (arguments.length) {
      var n = _.length, i;
      anchors = new Int8Array(n).fill(0);
      for (i = 0; i < n; i++) {
        anchors[i] = anchorsMap[_[i]];
      }
      return label;
    } else {
      return anchors;
    }
  }

  return label;
}

function getBoundFunction(b, w, h, distance) {
  return function (dx, dy) {
    var _y = b[4 + dy] + (h * dy / 2.0) + (distance * dy),
        _x = b[1 + dx] + (w * dx / 2.0) + (distance * dx);
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