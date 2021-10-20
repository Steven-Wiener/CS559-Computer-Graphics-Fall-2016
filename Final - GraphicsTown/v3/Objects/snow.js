var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Snow = undefined;

var numGroups = 0;

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;
	
	var iRadius = .5;
	var oRadius = 1;
	var steps = 10;

    // constructor for Cubes
    Snow = function Snow(name, position, color) {
        this.name = name;
        this.position = position || [0,0,0];
        this.color = color || [Math.random(),Math.random(),Math.random()];
		this.theta = Math.random()*Math.PI*2;
        this.phi = Math.random()*Math.PI-Math.PI/2;
        this.r = 0;
        this.t = 0;
        this.h = 0;
    }
    Snow.prototype.init = function(drawingState) {
        var gl = drawingState.gl;
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["phong-vs", "phong-fs"]);
        }
        var vertices = new Float32Array(6*steps);
		var normals = new Float32Array(6*steps);
		var d = 12*Math.PI/steps; // diameter
		var k = 0, c = 0, s = 0;
		for (var i = 0; i < steps; i++) {
			c = Math.cos(d*i);
			s = Math.sin(d*i);
			vertices[k++] = c*iRadius;
			vertices[k++] = s*iRadius;
			vertices[k++] = 0;
			vertices[k++] = c*oRadius;
			vertices[k++] = s*oRadius;
			vertices[k++] = 0;
		}
		for (var i = 0; i < steps * 2; i++) {
			normals[3*i] = normals[3*i+1] = 0;
			normals[3*i+2] = 1;
		}
		
        if (!buffers) {
            var arrays = {
                vpos : vertices,
                vnormal : normals
            };
            buffers = twgl.createBufferInfoFromArrays(drawingState.gl,arrays);
        }
    };
    Snow.prototype.draw = function(drawingState) {
        // we make a model matrix to place the cube in the world
        var y = this.position[1];
        var t = (drawingState.realtime%(y*100))/(y*4);
		
        this.r = 8*t;
        this.h = t*t;
		
        var modelM = twgl.m4.scaling([0.1,0.1,0.1]);
		var shiftArray = [this.r*Math.cos(this.theta)*Math.cos(this.phi), 
						(this.r*Math.sin(this.phi)-this.h)%y,
						this.r*Math.sin(this.theta)*Math.cos(this.phi)];
        var shift = twgl.m4.translation(shiftArray);
        twgl.m4.multiply(shift, modelM, modelM);
        twgl.m4.rotateY(modelM, t*Math.PI/2, modelM);
        twgl.m4.multiply(twgl.m4.translation(this.position), modelM, modelM);
		
        // the drawing code is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            color:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    Snow.prototype.center = function(drawingState) {
        return this.position;
    }

})();

function Snowflakes(position, color, quantity) {
	numGroups++;
	for (var i = 0; i < quantity; i++) {
		grobjects.push(new Snow("snowflake" + numGroups + "_" + i, position, color));
	}
}
Snowflakes([0,200,0],[1,1,1],20);
Snowflakes([0,160,0],[1,1,1],20);
Snowflakes([0,120,0],[1,1,1],20);
Snowflakes([0,80,0],[1,1,1],20);