/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
import { labelWidth } from './Common';
// import { placeLabels } from './ParticleBasedLabel';
// import { placeLabels } from './OldPixelBasedLabel';
import { placeLabels } from './PixelBasedLabel';

export default function() {
  var markData = [],
      size,
      padding = 3,
      label = {};

  label.layout = function() {
    var data = markData.map(function(d) {
      var textHeight = d.fontSize;
      return {
        fontSize: d.fontSize,
        x: d.x,
        y: d.y,
        textWidth: null,
        textHeight: textHeight,
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
