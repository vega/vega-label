vega.transforms.label = vegaLabel.label;

var jsonText;
var rawFile = new XMLHttpRequest();
// rawFile.open('GET', '../spec/label_big_symbol.vg.json', false);
// rawFile.open('GET', '../spec/label_line_chart.vg.json', false);
// rawFile.open('GET', '../spec/label_connected_scatter.vg.json', false);
// rawFile.open('GET', '../spec/label_rect.vg.json', false);
// rawFile.open('GET', '../spec/label_test.vg.json', false);
// rawFile.open('GET', '../spec/label_car.vg.json', false);
rawFile.open('GET', '../spec/label_scatter_zoom.vg.json', false);
// rawFile.open('GET', '../spec/label_asteroids.vg.json', false);
rawFile.onreadystatechange = () => {
  if(rawFile.readyState === 4)
    if(rawFile.status === 200 || rawFile.status === 0)
      jsonText = rawFile.responseText;
}
rawFile.send(null);

var spec = JSON.parse(jsonText);
new vega.View(vega.parse(spec))
  .renderer('svg')     // set renderer (canvas or svg)
  .initialize('#vis')  // initialize view within parent DOM container
  .hover()             // enable hover encode set processing
  .run();