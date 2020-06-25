var vg = vega;
var l = Label;

var jsonText;
var rawFile = new XMLHttpRequest();
rawFile.open('GET', '../spec/label_reachable_airports.vg.json', false);
rawFile.onreadystatechange = () => {
  if(rawFile.readyState === 4)
    if(rawFile.status === 200 || rawFile.status === 0)
      jsonText = rawFile.responseText;
}
rawFile.send(null);

vg.transforms.label = l.label;
var spec = JSON.parse(jsonText);
var resize = l.benchmarkUtils.resize;

// eslint-disable-next-line no-unused-vars
function render() {
  var size = document.getElementById("size").value;
  var labeler = document.getElementById("labeler").value;
  new vg.View(vg.parse(resize(spec, size, labeler)))
    .renderer('canvas')     // set renderer (canvas or svg)
    .initialize('#vis')  // initialize view within parent dom container
    .hover()             // enable hover encode set processing
    .run();
}
