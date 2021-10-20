/**
 * Created by gleicher on 10/9/15.
 */
/*
 a second example object for graphics town
 check out "simplest" first

 the ring is more complicated since it is designed to allow making many cubes

 we make a constructor function that will make instances of cubes - each one gets
 added to the grobjects list

 we need to be a little bit careful to distinguish between different kinds of initialization
 1) there are the things that can be initialized when the function is first defined
    (load time)
 2) there are things that are defined to be shared by all cubes - these need to be defined
    by the first init (assuming that we require opengl to be ready)
 3) there are things that are to be defined for each ring instance
 */
var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Ring = undefined;

var vertices;
var normals;

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;

	var iRadius = 8;
	var oRadius = 10;
	var steps = 500;
	
    // constructor for Cubes
    Ring = function Ring(name, position, color, size, rot) {
        this.name = name;
        this.position = position || [0,0,0];
        this.color = color || [.7,.8,.9];
        this.size = size || 1.0;
        this.rot = rot || [Math.PI/2,0,0];
    }
    Ring.prototype.init = function(drawingState) {
        var gl=drawingState.gl;
        // create the shaders once - for all cubes
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["ring-vs", "ring-fs"]);
        }
		vertices = new Float32Array(6*steps);
		normals = new Float32Array(6*steps);
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
    Ring.prototype.draw = function(drawingState) {
        // we make a model matrix to place the ring in the world
        var modelM = twgl.m4.scaling([this.size,this.size,this.size]);
		twgl.m4.rotateX(modelM, this.rot[0], modelM);
		twgl.m4.rotateY(modelM, this.rot[1], modelM);
		twgl.m4.rotateZ(modelM, this.rot[2], modelM);
        twgl.m4.setTranslation(modelM,this.position,modelM);
        // the drawing code is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            ringcolor:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    Ring.prototype.center = function(drawingState) {
        return this.position;
    }
})();

// put some objects into the scene
// normally, this would happen in a "scene description" file
// but I am putting it here, so that if you want to get
// rid of cubes, just don't load this file.
grobjects.push(new Ring("ring1",[0,0.005,0], [.7,.8,.9], 1, [Math.PI/2,0,0]));
grobjects.push(new Ring("ring2",[0,0,0], [1,0,0], 7/10, [0,0,0]));
grobjects.push(new Ring("ring3",[0,0,0.01], [1,.75,0], 6/10, [0,0,0]));
grobjects.push(new Ring("ring4",[0,0,0], [1,1,0], 5/10, [0,0,0]));
grobjects.push(new Ring("ring5",[0,0,0], [0,1,0], 4/10, [0,0,0]));
grobjects.push(new Ring("ring6",[0,0,0.01], [0,0,1], 3.5/10, [0,0,0]));
grobjects.push(new Ring("ring7",[0,0,0.02], [.35,.35,1], 3/10, [0,0,0]));
grobjects.push(new Ring("ring8",[0,0,0], [1,0,1], 2.5/10, [0,0,0]));

/* grobjects.push(new Ring("ring2",[0,0,0], [1,0,0], 7/10, [0,0,0]));
grobjects.push(new Ring("ring3",[0,0,0.01], [1,.75,0], 6/10, [0,Math.PI/8,0]));
grobjects.push(new Ring("ring4",[0,0,0], [1,1,0], 5/10, [0,Math.PI/4,0]));
grobjects.push(new Ring("ring5",[0,0,0], [0,1,0], 4/10, [0,3*Math.PI/8,0]));
grobjects.push(new Ring("ring6",[0,0,0], [0,0,1], 3.5/10, [0,Math.PI/2,0]));
grobjects.push(new Ring("ring7",[0,0,0], [.35,.35,1], 3/10, [0,5*Math.PI/8,0]));
grobjects.push(new Ring("ring8",[0,0,0], [1,0,1], 2.5/10, [0,3*Math.PI/4,0])); */
