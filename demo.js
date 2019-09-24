vega.transforms.label = Label.label;

var jsonText;
var rawFile = new XMLHttpRequest();
rawFile.open('GET', '../spec/label_spec_test_time.vg.json', false);
rawFile.onreadystatechange = () => {
  if(rawFile.readyState === 4)
    if(rawFile.status === 200 || rawFile.status === 0)
      jsonText = rawFile.responseText;
}
rawFile.send(null);

var spec = JSON.parse(jsonText);

var suffix = ['cluster_3_', ''];
var types = ['clustered', 'uniform'];
var ns = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
var sizes = [1000, 10000];

function render(typeItr, nItr, sizeItr, i) {
  var n = ns[nItr];
  var size = sizes[sizeItr];

  console.log(types[typeItr] + " " + n + " " + size);
  spec["width"] = size;
  spec["height"] = size;
  spec["data"][0]["url"] = `../data/test_label_${suffix[typeItr]}${n}.json`;
  spec["marks"][1]["transform"][0]["size"] = [size, size];
  // spec["marks"][1]["encode"]["enter"]["fontSize"]["value"] = 14 * size / 1000;
  new vega.View(vega.parse(spec))
    .renderer('canvas')     // set renderer (canvas or svg)
    .initialize('#vis')  // initialize view within parent dom container
    .hover()             // enable hover encode set processing
    .run();

  i++;
  if (i >= 10) {
    i = 0;
    sizeItr++;
  }
  if (sizeItr >= sizes.length) {
    sizeItr = 0;
    nItr++;
  }
  if (nItr >= ns.length) {
    nItr = 0;
    typeItr++;
  }
  if (typeItr < types.length) {
    setTimeout(render, 20000, typeItr, nItr, sizeItr, i);
  }
}

// new vega.View(vega.parse(spec))
//   .renderer('canvas')     // set renderer (canvas or svg)
//   .initialize('#vis')  // initialize view within parent dom container
//   .hover()             // enable hover encode set processing
//   .run();
render(0, 0, 0, 0);
