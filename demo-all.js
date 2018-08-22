vega.transforms.label = vegaLabel.label;

var jsonText;
var rawFile = new XMLHttpRequest();
var specNames = [
  'area_job_voyager',
  'area',
  'line_connected_scatter',
  'line_end',
  'line',
  'rect_stack',
  'rect',
  'scatter_asteroids_contour',
  'scatter_big_symbol',
  'scatter_car',
  'scatter_test',
  'scatter_zoom',
];

var vis = document.getElementById('vis');

for (var i = 0; i < specNames.length; i++) {
  var name = 'vis' + i;
  var node = document.createElement('DIV');
  node.setAttribute('id', name);
  vis.appendChild(node);
  rawFile.open('GET', '../specs/label_' + specNames[i] + '.vg.json', false);
  rawFile.onreadystatechange = () => {
    if (rawFile.readyState === 4)
      if (rawFile.status === 200 || rawFile.status === 0) jsonText = rawFile.responseText;
  };
  rawFile.send(null);

  var spec = JSON.parse(jsonText);
  new vega.View(vega.parse(spec))
    .renderer('canvas') // set renderer (canvas or svg)
    .initialize('#' + name) // initialize view within parent DOM container
    .hover() // enable hover encode set processing
    .run();
}
