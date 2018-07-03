import cloud from './LabelLayout';
import {Transform} from 'vega-dataflow';
import {inherits, isFunction} from 'vega-util';

var Output = ['x', 'y', 'angle', 'fontSize', 'fill'];

var Params = ['text', 'rotate', 'fontSize'];

export default function Label(params) {
  Transform.call(this, cloud(), params);
}

Label.Definition = {
  "type": "Label",
  "metadata": {"modifies": true},
  "params": [
    { "name": "fontSize", "type": "number", "expr": false, "default": 14 },
    { "name": "rotate", "type": "number", "expr": false, "default": 0 },
    { "name": "text", "type": "field" },
    { "name": "as", "type": "string", "array": true, "length": 3, "default": Output }
  ]
};

var prototype = inherits(Label, Transform);

prototype.transform = function(_, pulse) {
  function modp(param) {
    var p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  var mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || Params.some(modp))) return;

  var data = pulse.materialize(pulse.SOURCE).source,
      labelLayout = this.value,
      as = _.as || Output,
      fontSize = _.fontSize || 14;

  data.forEach(function(t) {
    t[as[2]] = 0;
    t[as[3]] = fontSize;
  });

  // configure layout
  var labels = labelLayout
    .points(data)
    .rotate(_.rotate || 0)
    .fontSize(fontSize)
    .layout();

  var i = -1,
      n = labels.length,
      w, t;

  while (++i < n) {
    w = labels[i];
    t = w.datum;

    t[as[0]] = w.x;
    t[as[1]] = w.y;
    t[as[2]] = w.angle;
    t[as[3]] = w.size;
    t[as[4]] = w.fill;
  }

  return pulse.reflow(mod).modifies(as);
};
