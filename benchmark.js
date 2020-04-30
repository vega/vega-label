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

var suffix = ['cluster_3_', ''];
var types = ['clustered', 'uniform'];
var ns = [2000, 4000, 6000, 8000, 10000];
var sizes = [1000, 2000];

function render(typeItr, nItr, sizeItr) {
  var n = ns[nItr];
  var size = sizes[sizeItr];

  spec["width"] = size;
  spec["height"] = size;
  // spec["data"][0]["url"] = `../data/test_label_${suffix[typeItr]}${n}.json`;
  // spec["marks"][0]["encode"]["enter"]["size"]["value"] = 20000 * size * size / 1000000;
  // spec["marks"][2]["encode"]["enter"]["fontSize"]["value"] = 14 * size / 1000;
  // spec["marks"][2]["transform"][0]["size"] = [size, size, {type: types[typeItr]}];
  
  spec["marks"][4]["transform"][0]["size"] = [size, size, {type: types[typeItr]}];
  spec["marks"][5]["transform"][0]["size"] = [size, size, {type: types[typeItr]}];
  spec["marks"][2]["encode"]["update"]["strokeWidth"]["value"] = 1 * size / 1000;
  spec["marks"][3]["encode"]["update"]["size"]["value"] = 6 * size / 1000;
  spec["marks"][4]["encode"]["enter"]["fontSize"]["value"] = 7 * size / 1000;
  spec["marks"][5]["encode"]["enter"]["fontSize"]["value"] = 5 * size / 1000;
  new vega.View(vega.parse(spec))
    .renderer('canvas')     // set renderer (canvas or svg)
    .initialize('#vis')  // initialize view within parent dom container
    .hover()             // enable hover encode set processing
    .run();
  // return;

  sizeItr++;
  if (sizeItr >= sizes.length) {
    sizeItr = 0;
    nItr++;
  }
  if (nItr >= ns.length) {
    nItr = 0;
    typeItr++;
  }
  if (typeItr >= types.length) {
    console.log("done");
  } else {
    setTimeout(render, 60000, typeItr, nItr, sizeItr);
  }
}

// new vega.View(vega.parse(spec))
//   .renderer('canvas')     // set renderer (canvas or svg)
//   .initialize('#vis')  // initialize view within parent dom container
//   .hover()             // enable hover encode set processing
//   .run();
render(0, 0, 0);
