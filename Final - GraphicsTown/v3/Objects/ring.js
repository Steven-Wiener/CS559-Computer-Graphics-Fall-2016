var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Ring = undefined;

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
	var steps = 64;
	
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
            shaderProgram = twgl.createProgramInfo(gl, ["tex-vs", "tex-fs"]);
        }
		var vertexPos = [];
		var normals = [];
		var texCoords = [];
		var ind = [];
		var d = 2*Math.PI/steps;
		if (iRadius == 0) {
			for (var i = 0; i < steps; i++) {
				var c = Math.cos(d*i);
				var s = Math.sin(d*i);
				vertexPos.push(c*oRadius);
				vertexPos.push(s*oRadius);
				vertexPos.push(0);
				texCoords.push(0.5 + 0.5*c);
				texCoords.push(0.5 + 0.5*s);
				ind.push(steps);
				ind.push(i);
				var val = i == steps-1 ? 0 : i + 1;
				ind.push(val);
			}
			vertexPos.push(0);
			vertexPos.push(0);
			vertexPos.push(0);
			texCoords.push(0);
			texCoords.push(0);
		}
		else {
			var r = iRadius / oRadius;
			for (var i = 0; i < steps; i++) {
				var c = Math.cos(d*i);
				var s = Math.sin(d*i);
				vertexPos.push(c*iRadius);
				vertexPos.push(s*iRadius);
				vertexPos.push(0);
				texCoords.push(0.5 + 0.5*c*r);
				texCoords.push(0.5 + 0.5*s*r);
				vertexPos.push(c*oRadius);
				vertexPos.push(s*oRadius);
				vertexPos.push(0);
				texCoords.push(0.5 + 0.5*c);
				texCoords.push(0.5 + 0.5*s);
			}
			for (var i = 0; i < steps - 1; i++) {
				ind.push(2*i);
				ind.push(2*i+1);
				ind.push(2*i+3);
				ind.push(2*i);
				ind.push(2*i+3);
				ind.push(2*i+2);
			}
			ind.push(2*i);
			ind.push(2*i+1);
			ind.push(1);
			ind.push(2*i);
			ind.push(1);
			ind.push(0);
			}
		var vertexCount = (iRadius == 0)? steps + 1 : steps * 2;
		for (var i = 0; i < vertexCount; i++) {
			normals.push(0);
			normals.push(0);
			normals.push(1);
		}
		
        if (!buffers) {
            var arrays = {
				vpos: {numComponents:3, data:vertexPos },
				vnormal: {numComponents:3, data:normals },
				vtexCoord: {numComponents:2, data:texCoords },
				indices: ind
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
		shaderProgram.texSampler = gl.getUniformLocation(shaderProgram.program, "texSampler");
		gl.uniform1i(gl.getUniformLocation(shaderProgram.program, "texSampler"), 2);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            color:this.color, model: modelM });
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
grobjects.push(new Ring("ring2",[0,0,-4], [1,0,0], .7, [0,0,0]));
grobjects.push(new Ring("ring3",[0,0,-4.01], [1,.75,0], .561, [0,0,0]));
grobjects.push(new Ring("ring4",[0,0,-4], [1,1,0], .449, [0,0,0]));
grobjects.push(new Ring("ring5",[0,0,-4], [0,1,0], .36, [0,0,0]));
grobjects.push(new Ring("ring6",[0,0,-4.01], [0,0,1], .289, [0,0,0]));
grobjects.push(new Ring("ring7",[0,0,-4.02], [.35,.35,1], .233, [0,0,0]));
grobjects.push(new Ring("ring8",[0,0,-4], [1,0,1], .189, [0,0,0]));