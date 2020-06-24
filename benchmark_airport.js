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

var sizes = [1000, 2000, 4000, 8000];
// var sizes = [8000];

var hwRatio = 500 / 800;

function render(sizeItr) {
  var size = sizes[sizeItr];

  var height = size * hwRatio;
  spec["width"] = size;
  spec["height"] = height;
  spec["padding"] = 5 * size / 1000;
  
  // chart size
  spec["marks"][4]["transform"][0]["size"] = [size, height, {noTest: true}];
  spec["marks"][6]["transform"][0]["size"] = [size, height, {}];
  
  // line width
  spec["marks"][0]["encode"]["enter"]["strokeWidth"]["value"] = 0.5 * size / 1000;
  spec["marks"][2]["encode"]["update"]["strokeWidth"]["value"] = 0.5 * size / 1000;

  // point radius
  spec["marks"][1]["encode"]["update"]["size"]["value"] = Math.pow(1 * size / 1000, 2) * Math.PI;
  spec["marks"][3]["encode"]["update"]["size"]["value"] = Math.pow(1.5 * size / 1000, 2) * Math.PI;

  // font size
  spec["marks"][4]["encode"]["enter"]["fontSize"]["value"] = 7 * size / 1000;
  spec["marks"][6]["encode"]["enter"]["fontSize"]["value"] = 5 * size / 1000;
  new vega.View(vega.parse(spec))
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
