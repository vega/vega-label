/*eslint no-console: "warn"*/
/*eslint no-unused-vars: "warn"*/
import labelLayout from "./LabelLayout";
import { Transform } from "vega-dataflow";
import { inherits, isFunction } from "vega-util";

var Output = [
  "x",
  "y",
  "opacity",
  "align",
  "baseline",
  "originalOpacity",
  "transformed",
  "fontSize"
];

var Params = ["offset"];

var defaultAnchors = [
  "top-left",
  "left",
  "bottom-left",
  "top",
  "bottom",
  "top-right",
  "right",
  "bottom-right"
];

export default function Label(params) {
  Transform.call(this, labelLayout(), params);
}

Label.Definition = {
  type: "Label",
  metadata: { modifies: true },
  params: [
    { name: "allowOutside", type: "boolean", defalut: false },
    { name: "size", type: "number", array: true, length: [2] },
    { name: "offsets", type: "number", array: true, default: [1] },
    { name: "sort", type: "field" },
    { name: "anchors", type: "string", array: true, default: defaultAnchors },
    { name: "avoidMarks", type: "data", array: true },
    {
      name: "as",
      type: "string",
      array: true,
      length: Output.length,
      default: Output
    }
  ]
};

var prototype = inherits(Label, Transform);

prototype.transform = function(_, pulse) {
  console.time("label");
  function modp(param) {
    var p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  var mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || Params.some(modp))) return;

  var data = pulse.materialize(pulse.SOURCE).source,
    labelLayout = this.value,
    as = _.as ? _.as : Output,
    offsets = _.offsets ? _.offsets : [1],
    anchors = _.anchors ? _.anchors : defaultAnchors,
    numberPositions =
      offsets.length > anchors.length ? offsets.length : anchors.length;

  // configure layout
  var labels = labelLayout
      .texts(data)
      .sort(_.sort)
      .offsets(offsets, numberPositions)
      .anchors(anchors, numberPositions)
      .avoidMarks(_.avoidMarks ? _.avoidMarks : [])
      .allowOutside(_.allowOutside ? _.allowOutside : false)
      .size(_.size)
      .layout(),
    n = data.length;

  for (var i = 0; i < n; i++) {
    var l = labels[i],
      t = l.datum;

    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.opacity;
    t[as[3]] = l.align;
    t[as[4]] = l.baseline;
    t[as[5]] = l.originalOpacity;
    t[as[6]] = true;
    t[as[7]] = l.fontSize;
  }

  console.timeEnd("label");

  return pulse.reflow(mod).modifies(as);
};
