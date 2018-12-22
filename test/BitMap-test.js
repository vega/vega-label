const tape = require('tape');
const BitMap = require('../').BitMap;
// const label = require('../').label;

tape('BitMap scale pixel to the correct position in bit map', test => {
  const bm1 = new BitMap(200, 200, 0);
  test.equals(bm1.scalePixel(3), 3);
  test.equals(bm1.scalePixel(4), 4);

  const bm2 = new BitMap(1000, 1000, 0);
  test.equals(bm2.scalePixel(3), 3);
  test.equals(bm2.scalePixel(4), 4);

  const bm3 = new BitMap(1234, 1234, 0);
  test.equals(bm3.scalePixel(40), 32);
  test.equals(bm3.scalePixel(70), 56);

  const bm4 = new BitMap(2345, 3456, 0);
  test.equals(bm4.scalePixel(30), 10);
  test.equals(bm4.scalePixel(50), 17);

  test.equals(0, 0);
  test.end();
});

// tape('Wordcloud generates wordcloud layout', function(test) {
//   const bm = new BitMap(200, 200, 0);

//   var data = [
//     { text: 'foo', size: 49, index: 0 },
//     { text: 'bar', size: 36, index: 1 },
//     { text: 'baz', size: 25, index: 2 },
//     { text: 'abc', size: 1, index: 3 },
//   ];

//   var text = util.field('text'),
//     size = util.field('size'),
//     df = new vega.Dataflow(),
//     rot = df.add(null),
//     c0 = df.add(Collect),
//     wc = df.add(Wordcloud, {
//       size: [500, 500],
//       text: text,
//       fontSize: size,
//       fontSizeRange: [1, 7],
//       rotate: rot,
//       pulse: c0,
//     });

//   var angles = [0, 30, 60, 90];
//   rot.set(function(t) {
//     return angles[t.index];
//   });

//   df.pulse(c0, vega.changeset().insert(data)).run();
//   test.equal(c0.value.length, data.length);
//   test.equal(wc.stamp, df.stamp());

//   for (var i = 0, n = data.length; i < n; ++i) {
//     test.ok(data[i].x != null && !isNaN(data[i].x));
//     test.ok(data[i].y != null && !isNaN(data[i].y));
//     test.equal(data[i].font, 'sans-serif');
//     test.equal(data[i].fontSize, Math.sqrt(data[i].size));
//     test.equal(data[i].fontStyle, 'normal');
//     test.equal(data[i].fontWeight, 'normal');
//     test.equal(data[i].angle, angles[i]);
//   }

//   test.end();
// });
