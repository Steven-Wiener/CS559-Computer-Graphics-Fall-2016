/**
 * Created by SWiener on 11/15/16.
 */
var grobjects = grobjects || [];

// allow the constructor to be "leaked" out
var Stair = undefined;
	
var w1 = .25;
var w2 = 1.5;

var numStairs = 0;

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all stairs - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;

    // constructor for Stairs
    Stair = function Stair(name, position, size, color, rot) {
        this.name = name;
        this.position = position || [0,0,0];
        this.size = size || 1.0;
        this.color = color || [.7,.8,.9];
		this.rot = rot || [0,0,0];
		numStairs++;
    }
    Stair.prototype.init = function(drawingState) {
        var gl=drawingState.gl;
        // create the shaders once - for all stairs
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["stair-vs", "stair-fs"]);
        }
        if (!buffers) {
            var arrays = {
                vpos : { numComponents: 3, data: [
                    -w2, -w1, -w1,   w2, -w1, -w1,   w2, w1, -w1,    -w2, -w1, -w1,   w2, w1, -w1,  -w2, w1, -w1,    // z = 0
                    -w2, -w1, w1,   w2, -w1, w1,   w2, w1, w1,    -w2, -w1, w1,   w2, w1, w1,  -w2, w1, w1,    // z = 1
                    -w2, -w1, -w1,   w2, -w1, -w1,   w2, -w1, w1,    -w2, -w1, -w1,   w2, -w1, w1,  -w2, -w1, w1,    // y = 0
                    -w2, w1, -w1,   w2, w1, -w1,   w2, w1, w1,    -w2, w1, -w1,   w2, w1, w1,  -w2, w1, w1,    // y = 1
                    -w2, -w1, -w1,  -w2, w1, -w1,  -w2, w1, w1,    -w2, -w1, -w1,  -w2, w1, w1,  -w2, -w1, w1,    // x = 0
                     w2, -w1, -w1,   w2, w1, -w1,   w2, w1, w1,     w2, -w1, -w1,   w2, w1, w1,   w2, -w1, w1     // x = 1
                ] },
                vnormal : {numComponents:3, data: [
                    0,0,-1, 0,0,-1, 0,0,-1,     0,0,-1, 0,0,-1, 0,0,-1, // z = 0
                    0,0,1, 0,0,1, 0,0,1,        0,0,1, 0,0,1, 0,0,1, // z = 1
                    0,-1,0, 0,-1,0, 0,-1,0,     0,-1,0, 0,-1,0, 0,-1,0, // y = 0
                    0,1,0, 0,1,0, 0,1,0,        0,1,0, 0,1,0, 0,1,0, // y = 1
                    -1,0,0, -1,0,0, -1,0,0,     -1,0,0, -1,0,0, -1,0,0, // x = 0
                    1,0,0, 1,0,0, 1,0,0,        1,0,0, 1,0,0, 1,0,0 // x = 1
                ]}
            };
            buffers = twgl.createBufferInfoFromArrays(drawingState.gl,arrays);
        }

    };
    Stair.prototype.draw = function(drawingState) {
        // we make a model matrix to place the stair in the world
        var modelM = twgl.m4.scaling([this.size,this.size,this.size]);
		twgl.m4.rotateX(modelM, this.rot[0], modelM);
		twgl.m4.rotateY(modelM, this.rot[1], modelM);
		twgl.m4.rotateZ(modelM, this.rot[2], modelM);
        twgl.m4.setTranslation(modelM,this.position,modelM);
        // the drawing coce is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            staircolor:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    Stair.prototype.center = function(drawingState) {
        return this.position;
    }
})();
	
function Stairset(height, position, size, color, rot) {
	var i;
	/* this.position = position || [0,0,0];
	this.size = size || 1.0;
	this.color = color || [.7,.8,.9];
    this.rot = rot || [0,0,0]; */
	
	grobjects.push(new Stair("stair" + (1+numStairs), position, size, color, rot));
	for (i = 1; i < height; i++) {
		if (rot[0] == 0 && rot[1] == 0) {
			grobjects.push(new Stair("stair" + (1+numStairs), [position[0], position[1] + 2*(i-1)*w1, position[2] + 2*i*w1], size, color, rot));
			grobjects.push(new Stair("stair" + (1+numStairs), [position[0], position[1] + 2*i*w1, position[2] + 2*i*w1], size, color, rot));
		} else if (rot[1] != 0) {
			grobjects.push(new Stair("stair" + (1+numStairs), [position[0] + 2*i*w1, position[1] + 2*(i-1)*w1, position[2]], size, color, rot));
			grobjects.push(new Stair("stair" + (1+numStairs), [position[0] + 2*i*w1, position[1] + 2*i*w1, position[2]], size, color, rot));
		}
	}
}

// put some objects into the scene
// normally, this would happen in a "scene description" file
// but I am putting it here, so that if you want to get
// rid of stairs, just don't load this file.
Stairset(4, [0, w1, 2], 1, [.7,.8,.9], [0,Math.PI/2,0]);
Stairset(4, [0, w1, -2], 1, [.7,.8,.9], [0,Math.PI/2,0]);
