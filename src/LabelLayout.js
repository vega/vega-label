/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
import { canvas } from 'vega-canvas';
import { placeLabels as placeLabelsParticle } from './ParticleBasedLabel';
import { placeLabels as placeLabelsPixel } from './PixelBasedLabel';

export default function() {
  var context = canvas().getContext("2d"),
      dataFromMark = [],
      size,
      padding = 3,
      label = {};

  label.layout = function() {
    var n = dataFromMark.length,
        md, data = Array(n);

    for (var i = 0; i < n; i++) {
      md = dataFromMark[i];
      var textWidth = labelWidth(md.text, md.fontSize, md.font, context),
          textHeight = md.fontSize;

      data[i] = {
        fontSize: md.fontSize,
        x: md.x,
        y: md.y,
        textWidth: textWidth,
        textHeight: textHeight,
        boundFun: getBoundFunction(md.x, md.y, textWidth, textHeight),
        fill: md.fill,
        datum: md
      };
    }
    
    return placeLabelsPixel(data, size, padding);
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

  label.padding = function(_) {
    if (arguments.length) {
      padding = _ ? _ : 3;
      return label;
    } else {
      return padding;
    }
  }

  return label;
}

function getBoundFunction(x, y, w, h) {

  return function (dx, dy, padding) {
    var size = (dy * dy) + (dx * dx),
        _y = y + (h * dy / 2.0) + (padding * dy / size),
        _x = x + (w * dx / 2.0) + (padding * dx / size);
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
  context.font = fontSize + "px " + font;
  return context.measureText(text + ".").width;
}