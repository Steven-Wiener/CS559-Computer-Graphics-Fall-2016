var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Cylinder = undefined;

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cylinders - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;
	
	var radius = 0.2;
	var height = 5 * radius;
	var slices = 32;

    // constructor for Cylinders
    Cylinder = function Cylinder(name, position, color, size) {
        this.name = name;
        this.position = position || [0,0,0];
        this.color = color || [0.5,0.3,0.1];
		this.size = size || 1.0;
    }
    Cylinder.prototype.init = function(drawingState) {
		var gl=drawingState.gl;
		// create the shaders once - for all cylinders
		if (!shaderProgram) {
			shaderProgram = twgl.createProgramInfo(gl, ["tex-vs", "tex-fs"]);
		}
		var vertexPos = [];
		var normals = [];
		var texCoords = [];
		var ind = [];
		var du = 2*Math.PI / slices;
		for (var i = 0; i <= slices; i++) {
			var u = i*du;
			var c = Math.cos(u);
			var s = Math.sin(u);
			vertexPos.push(c*radius);
			normals.push(c);
			vertexPos.push(s*radius);
			normals.push(s);
			vertexPos.push(-height/2);
			normals.push(0);
			texCoords.push(i/slices);
			texCoords.push(0);
			vertexPos.push(c*radius);
			normals.push(c);
			vertexPos.push(s*radius);
			normals.push(s);
			vertexPos.push(height/2);
			normals.push(0);
			texCoords.push(i/slices);
			texCoords.push(1);
		}
		for (var i = 0; i < slices; i++) {
			ind.push(2*i);
			ind.push(2*i+3);
			ind.push(2*i+1);
			ind.push(2*i);
			ind.push(2*i+2);
			ind.push(2*i+3);
		}
		// Bottom
		var start = vertexPos.length/3;
		vertexPos.push(0);
		normals.push(0);
		vertexPos.push(0);
		normals.push(0);
		vertexPos.push(-height/2);
		normals.push(-1);
		texCoords.push(0.5);
		texCoords.push(0.5); 
		for (var i = 0; i <= slices; i++) {
			var u = 2*Math.PI - i*du;
			var c = Math.cos(u);
			var s = Math.sin(u);
			vertexPos.push(c*radius);
			normals.push(0);
			vertexPos.push(s*radius);
			normals.push(0);
			vertexPos.push(-height/2);
			normals.push(-1);
			texCoords.push(0.5 - 0.5*c);
			texCoords.push(0.5 + 0.5*s);
		}
		for (var i = 0; i < slices; i++) {
			ind.push(start);
			ind.push(start + i + 1);
			ind.push(start + i + 2);
		}
		// Top
		start = vertexPos.length/3;
		vertexPos.push(0);
		normals.push(0);
		vertexPos.push(0);
		normals.push(0);
		vertexPos.push(height/2);
		normals.push(1);
		texCoords.push(0.5);
		texCoords.push(0.5); 
		for (var i = 0; i <= slices; i++) {
			var u = i*du;
			var c = Math.cos(u);
			var s = Math.sin(u);
			vertexPos.push(c*radius);
			normals.push(0);
			vertexPos.push(s*radius);
			normals.push(0);
			vertexPos.push(height/2);
			normals.push(1);
			texCoords.push(0.5 + 0.5*c);
			texCoords.push(0.5 + 0.5*s);
		}
		for (var i = 0; i < slices; i++) {
			ind.push(start);
			ind.push(start + i + 1);
			ind.push(start + i + 2);
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
    Cylinder.prototype.draw = function(drawingState) {
        // we make a model matrix to place the cylinder in the world
        var modelM = twgl.m4.scaling([this.size,this.size,this.size]);
        twgl.m4.rotateX(modelM, Math.PI/2, modelM);
        twgl.m4.setTranslation(modelM,this.position,modelM);
        // the drawing coce is straightforward - since twgl deals with the GL stuff for us
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
    Cylinder.prototype.center = function(drawingState) {
        return this.position;
    }
})();

grobjects.push(new Cylinder("cylinder1",[2,.501,4], [0.5,0.3,0.1], 1.0) );
grobjects.push(new Cylinder("cylinder2",[-3,.376,1], [0.5,0.3,0.1], .75) );
grobjects.push(new Cylinder("cylinder3",[-4,.376,0], [0.5,0.3,0.1], .75) );
grobjects.push(new Cylinder("cylinder4",[-9,2.501,-9], [0.5,0.3,0.1], 5.0) );
grobjects.push(new Cylinder("cylinder5",[9,2.001,-9], [0.5,0.3,0.1], 4.0) );
grobjects.push(new Cylinder("cylinder6",[-3,.501,0], [0.5,0.3,0.1], 1.0) );