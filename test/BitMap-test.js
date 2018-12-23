const tape = require('tape');
const BitMap = require('../').BitMap;

function createUnscaledBitMap() {
  return new BitMap(100, 100, 0);
}

function createScaledBitMap() {
  return new BitMap(1234, 1234, 0);
}

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

  const bm5 = new BitMap(2345, 3456, 7);
  test.equals(bm5.scalePixel(30), 12);
  test.equals(bm5.scalePixel(50), 20);

  test.end();
});

tape('BitMap get, mark, and unmark single pixel correctly', test => {
  const bms = createUnscaledBitMap();
  bms.mark(13, 14);
  bms.markScaled(17, 18);
  test.ok(bms.get(13, 14));
  test.ok(bms.getScaled(13, 14));
  test.ok(bms.get(17, 18));
  test.ok(bms.getScaled(17, 18));

  test.notOk(bms.get(14, 14));
  test.notOk(bms.getScaled(14, 14));
  test.notOk(bms.get(13, 15));
  test.notOk(bms.getScaled(13, 15));

  bms.unmark(13, 14);
  bms.unmarkScaled(17, 18);
  test.notOk(bms.get(13, 14));
  test.notOk(bms.get(17, 18));

  const bml = createScaledBitMap();
  bml.mark(13, 14);
  bml.markScaled(27, 28);
  test.ok(bml.get(13, 14));
  test.ok(bml.getScaled(bml.scalePixel(13), bml.scalePixel(14)));
  test.ok(bml.getScaled(27, 28));

  test.notOk(bml.get(14, 14));
  test.notOk(bml.getScaled(bml.scalePixel(14), bml.scalePixel(14)));
  test.notOk(bml.getScaled(26, 28));

  bml.unmark(13, 14);
  bml.unmarkScaled(27, 28);
  test.notOk(bms.get(13, 14));
  test.notOk(bms.getScaled(27, 28));
  test.end();
});
