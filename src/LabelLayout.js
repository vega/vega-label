/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
import { canvas } from 'vega-canvas';
import { labelWidth } from './Common';
import { placeLabels } from './ParticleBasedLabel';
// import { placeLabels } from './OldPixelBasedLabel';
// import { placeLabels } from './PixelBasedLabel';

export default function() {
  var context = canvas().getContext("2d"),
      markData = [],
      size,
      padding = 3,
      label = {};

  label.layout = function() {
    var data = markData.map(function(d) {
      var textWidth = labelWidth(d.text, d.fontSize, d.font, context),
          textHeight = d.fontSize;
      return {
        fontSize: d.fontSize,
        x: d.x,
        y: d.y,
        textWidth: textWidth,
        textHeight: textHeight,
        boundaryFun: getBoundaryFunction(d.x, d.y, textWidth, textHeight),
        fill: d.fill,
        datum: d
      };
    });
    
    return placeLabels(data, size, padding);
  };

  label.markData = function(_) {
    if (arguments.length) {
      markData = _;
      return label;
    } else {
      return markData;
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

function getBoundaryFunction(x, y, w, h) {

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
