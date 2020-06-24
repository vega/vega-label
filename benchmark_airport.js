vega.transforms.label = Label.label;

var jsonText;
var rawFile = new XMLHttpRequest();
rawFile.open('GET', '../spec/label_reachable_airports.vg.json', false);
rawFile.onreadystatechange = () => {
  if(rawFile.readyState === 4)
    if(rawFile.status === 200 || rawFile.status === 0)
      jsonText = rawFile.responseText;
}
rawFile.send(null);

var spec = JSON.parse(jsonText);

var sizes = Label.benchmarkUtils.sizes;
// var sizes = [8000];
var resize = Label.benchmarkUtils.resize;

function render(sizeItr) {
  var size = sizes[sizeItr];
  new vega.View(vega.parse(resize(spec, size)))
    .renderer('canvas')     // set renderer (canvas or svg)
    .initialize('#vis')  // initialize view within parent dom container
    .hover()             // enable hover encode set processing
    .run();

  sizeItr++;
  if (sizeItr >= sizes.length) {
    console.log("done");
  } else {
    setTimeout(render, 40000 * size / 1000, sizeItr);
  }
}

// new vega.View(vega.parse(spec))
//   .renderer('canvas')     // set renderer (canvas or svg)
//   .initialize('#vis')  // initialize view within parent dom container
//   .hover()             // enable hover encode set processing
//   .run();
render(0, 0, 0);
