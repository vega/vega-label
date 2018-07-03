vega.transforms.label = Label.label;

var jsonText;
var rawFile = new XMLHttpRequest();
  rawFile.open('GET', './bar.vg.json', false);
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