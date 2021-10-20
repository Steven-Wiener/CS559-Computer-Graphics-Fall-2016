/**
 * Created by SWiener 10.6.16
 */

"use strict";

function Painter(canvas, context) {
    this.triangles = [];
    this.canvas = canvas;
    this.context = context || canvas.getContext('2d');
	
	this.clear = function() {
		this.triangles = [];
	}
	
	this.triangle = function(v1, v2, v3, fill, stroke) {
		this.triangles.push(
			{
				"v1" : v1,
				"v2" : v2,
				"v3" : v3,
				"fill" : fill || "blue",
				"stroke" : stroke,
				"zmax" : Math.max(v1[2],v2[2],v3[2]),
				"zsum" : v1[2] + v2[2] +v3[2]
			}
		)
	}
	
	this.wireframe = function() {
		var that=this;
		this.triangles.forEach (function(t) {
			that.context.strokeStyle = t.stroke || t.fill;
			that.context.beginPath();
			that.context.moveTo(t.v1[0], t.v1[1]);
			that.context.lineTo(t.v2[0], t.v2[1]);
			that.context.lineTo(t.v3[0], t.v3[1]);
			that.context.closePath();
			that.context.stroke();
		});
	}
	
	this.render = function(nosort) {
		var that = this;
		 if (!nosort) {
			this.triangles.sort(function (a, b) {
				if (a.zsum > b.zsum) {
					return -1;
				} else {
					return 1;
				}
			});
		} else {
			// console.log("Not Sorting");
		}
		this.triangles.forEach(function (t) {
			that.context.beginPath();
			that.context.fillStyle = t.fill;
			// it is an error to set this to undefined - even though it works
			that.context.strokeStyle = t.stroke || "black";
			that.context.moveTo(t.v1[0], t.v1[1]);
			that.context.lineTo(t.v2[0], t.v2[1]);
			that.context.lineTo(t.v3[0], t.v3[1]);
			that.context.closePath();
			that.context.fill();
			if (t.stroke) {
				that.context.stroke()
			}
		});
	}
	
	this.addTris = function(mstack, verts, tris, fills, strokes) {
		// we can't use a foreach because we need to index into 3 arrays
		for (var i=0; i<tris.length; i++ ) {
			var t=tris[i];
			var p1 = mstack.transform(verts[t[0]]);
			var p2 = mstack.transform(verts[t[1]]);
			var p3 = mstack.transform(verts[t[2]]);
			this.triangle(p1,p2,p3,fills && fills[i],strokes&&strokes[i]);
		};
	}
}

Painter.prototype.addTris = function(mstack, verts, tris, fills, strokes) {
    // we can't use a foreach because we need to index into 3 arrays
    for (var i=0; i<tris.length; i++ ) {
        var t=tris[i];
        var p1 = mstack.transform(verts[t[0]]);
        var p2 = mstack.transform(verts[t[1]]);
        var p3 = mstack.transform(verts[t[2]]);
        this.triangle(p1,p2,p3,fills && fills[i],strokes&&strokes[i]);
    };
};


/**
 * static variables for drawing a cube - done this way since I don't know how to
 * do statics in JavaScript
 * These actually could even be constants (but they are array constants
 * @type {*[]}
 */
Painter.prototype.cubeVerts = [ [0,0,0], [1,0,0], [1,1,0], [0,1,0], [0,0,1], [1,0,1], [1,1,1], [0,1,1] ];
Painter.prototype.cubeTris = [
                     [0,1,2], [0,2,3],  // front is 0,1,2,3   z=0
                     [1,5,2], [5,2,6],  // side is  1,2,5,6   x=1
                     [4,5,6], [4,6,7],  // back is  4,5,6,7   z=1
                     [4,0,3], [4,3,7],  // side is  0,3,4,7   x=0
                     [3,2,7], [2,6,7],  // top is   2,3,6,7   y=1
                     [0,1,4], [1,4,5]
                    ];

Painter.prototype.cube = function(mstack, colors, strokes)
{
    this.addTris(mstack,this.cubeVerts,this.cubeTris,colors,strokes)
}

Painter.prototype.addFloor = function(matrixStack,color1,color2)
{
    var that = this;
    var color;
    for(var x=-3; x<3; x++) {
        for (var z=-3; z<3; z++) {
            var p1 = matrixStack.transform([x,0,z]);
            var p2 = matrixStack.transform([x+1,0,z]);
            var p3 = matrixStack.transform([x+1,0,z+1]);
            var p4 = matrixStack.transform([x,0,z+1]);
            if ( (x+z)%2 ) {
                color = color1 || "#EEE";
            } else {
                color = color2 || "#CCC";
            }
            that.triangle(p1,p2,p3,color);
            that.triangle(p1,p3,p4,color);
        }
    }
}
var Triangle = function (verticies, color) {
	this.v1 = verticies[0];
	this.v2 = verticies[1];
	this.v3 = verticies[2];
	this.color = color;
	
	
};

Triangle.prototype.draw = function (context, camera, projection, viewport) {
	line(this.v1, this.v2, camera, projection, viewport);
	line(this.v2, this.v3, camera, projection, viewport);
	line(this.v3, this.v1, camera, projection, viewport);
};

Triangle.prototype.getVerts = function () {
	return [this.v1, this.v2, this.v3];
};


Triangle.prototype.draw = function (context, wf, camera, projection, viewport) {
    if (wf) {
        line(this.v1, this.v2, camera, projection, viewport);
        line(this.v2, this.v3, camera, projection, viewport);
        line(this.v3, this.v1, camera, projection, viewport);
    } else {
        var c1 = to2d(this.v1, camera, projection, viewport);
        var c2 = to2d(this.v2, camera, projection, viewport);
        var c3 = to2d(this.v3, camera, projection, viewport);
        context.beginPath();
        context.moveTo(c1.x, c1.y);
        context.lineTo(c2.x, c2.y);
        context.lineTo(c3.x, c3.y);
        context.lineTo(c1.x, c1.y);
        context.fill();
        context.stroke();
    }
};

Triangle.prototype.getV1 = function () {
    return this.v1;
};

Triangle.prototype.getV2 = function () {
    return this.v2;
};

Triangle.prototype.getP3 = function () {
    return this.v3;
};