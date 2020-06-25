import RBush from 'rbush';

export function RBushMap(_width, _height) {
  this.tree = new RBush();
  this._width = _width;
  this._height = _height;

  this.add = function (x, y) {
    this.tree.insert({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y
    });
  };

  this.addWithData = function (x, y, data) {
    this.tree.insert({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y,
      data: data
    });
  };

  this.addRange = function (x1, y1, x2, y2) {
    this.tree.insert({
      minX: x1,
      minY: y1,
      maxX: x2,
      maxY: y2
    });
  }

  this.collides = function (x1, y1, x2, y2) {
    return this.tree.collides({
      minX: x1,
      minY: y1,
      maxX: x2,
      maxY: y2
    });
  }

  this.outOfBound = function(b) {
    return b.x < 0 || b.y < 0 || b.y2 >= this._height || b.x2 >= this._width;
  }

  this.write = function(id, width, height) {
    var canvas = document.getElementById(id);
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    var ctx = canvas.getContext("2d");
    var all = this.tree.all();
    for (var i = 0; i < all.length; i++) {
      if (all[i]) {
        ctx.fillStyle = all[i].color ? all[i].color : "black";
        ctx.fillRect(all[i].minX, all[i].minY, all[i].maxX - all[i].minX + 1, all[i].maxY - all[i].minY + 1);
      }
    }
  }
}
