import cloud from './LabelLayout';
import {Transform} from 'vega-dataflow';
import {inherits, isFunction} from 'vega-util';

var Output = ['x', 'y', 'z', 'fill', 'align', 'baseline'];

var Params = [];

export default function Label(params) {
  Transform.call(this, cloud(), params);
}

Label.Definition = {
  "type": "Label",
  "metadata": {"modifies": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "padding", "type": "number", "default": 2},
    { "name": "as", "type": "string", "array": true, "length": Output.length, "default": Output }
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
      padding = _.padding || 3;

  var n1 = Date.now();
  // configure layout
  var labels = labelLayout
    .markData(data)
    .size(_.size)
    .padding(padding)
    .layout(),
    t;

  labels.forEach(function(l) {
    t = l.datum;
    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.z
    t[as[3]] = l.fill;
    t[as[4]] = 'center';
    t[as[5]] = 'middle';
  });
  var n2 = Date.now();
  var n3 = n2-n1;
  n1 = n3;

  return pulse.reflow(mod).modifies(as);
};
