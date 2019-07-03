vega.transforms.label = vegaLabel.label;

var jsonText;
var rawFile = new XMLHttpRequest();
// prettier-ignore
var specName
// ---------area---------
// = "area_job_voyager";
// = 'area';

// ---------line---------
= 'line_connected_scatter';
// = 'line_end';
// = 'line';

// ---------rect---------
// = 'rect_stack';
// = 'rect';

// -------scatter--------
// = 'scatter_asteroids_contour';
// = 'scatter_asteroids';
// = 'scatter_big_symbol';
// = 'scatter_car';
// = 'scatter_test';
// = 'scatter_zoom';

rawFile.open('GET', '../specs/label_' + specName + '.vg.json', false);
rawFile.onreadystatechange = () => {
  if (rawFile.readyState === 4)
    if (rawFile.status === 200 || rawFile.status === 0) {
      jsonText = rawFile.responseText;
    }
};
rawFile.send(null);

var spec = JSON.parse(jsonText);
new vega.View(vega.parse(spec))
  .renderer('canvas') // set renderer (canvas or svg)
  .initialize('#vis') // initialize view within parent DOM container
  .hover() // enable hover encode set processing
  .run();
