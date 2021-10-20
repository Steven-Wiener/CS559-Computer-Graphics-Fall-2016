var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Cone = undefined;

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cones - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;
	
	var radius = 0.5;
	var height = 2 * radius;
	var slices = 32;

    // constructor for Cones
    Cone = function Cone(name, position, color, size) {
        this.name = name;
        this.position = position || [0,0,0];
        this.color = color || [0,0.8,0];
		this.size = size || 1.0;
    }
    Cone.prototype.init = function(drawingState) {
		var gl=drawingState.gl;
		// create the shaders once - for all cones
		if (!shaderProgram) {
			shaderProgram = twgl.createProgramInfo(gl, ["tex-vs", "tex-fs"]);
		}
		var fractions = [ 0, 0.5, 0.75, 0.875, 0.9375 ];
		var vertexCount = fractions.length*(slices+1) + 2*slices + 2;
		var triangleCount = (fractions.length)*slices*2;
		var vertexPos = [];
		var normals = [];
		var texCoords = [];
		var ind = [];
		var normallength = Math.sqrt(height*height+radius*radius);
		var n1 = height/normallength;
		var n2 = radius/normallength; 
		var du = 2*Math.PI / slices;
		for (var j = 0; j < fractions.length; j++) {
			var uoffset = (j % 2 == 0? 0 : 0.5);
			for (var i = 0; i <= slices; i++) {
				var h1 = -height/2 + fractions[j]*height;
				var u = (i+uoffset)*du;
				var c = Math.cos(u);
				var s = Math.sin(u);
				vertexPos.push(c*radius*(1-fractions[j]));
				normals.push(c*n1);
				vertexPos.push(s*radius*(1-fractions[j]));
				normals.push(s*n1);
				vertexPos.push(h1);
				normals.push(n2);
				texCoords.push((i+uoffset)/slices);
				texCoords.push(fractions[j]);
			}
		}
		for (var j = 0; j < fractions.length-1; j++) {
			var row1 = j*(slices+1);
			var row2 = (j+1)*(slices+1);
			for (var i = 0; i < slices; i++) {
				ind.push(row1 + i);
				ind.push(row2 + i + 1);
				ind.push(row2 + i);
				ind.push(row1 + i);
				ind.push(row1 + i + 1);
				ind.push(row2 + i + 1);
			}
		}
		var start = vertexPos.length/3 - (slices+1);
		for (var i = 0; i < slices; i++) {
			var u = (i+0.5)*du;
			var c = Math.cos(u);
			var s = Math.sin(u);
			vertexPos.push(0);
			normals.push(c*n1);
			vertexPos.push(0);
			normals.push(s*n1);
			vertexPos.push(height/2);
			normals.push(n2);
			texCoords.push((i+0.5)/slices);
			texCoords.push(1);
		}
		for (var i = 0; i < slices; i++) {
			ind.push(start+i);
			ind.push(start+i+1);
			ind.push(start+(slices+1)+i);
		}
		// Bottom
		start = vertexPos.length/3;
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
    Cone.prototype.draw = function(drawingState) {
        // we make a model matrix to place the cone in the world
        var modelM = twgl.m4.scaling([this.size,this.size,this.size]);
        twgl.m4.rotateX(modelM, -Math.PI/2, modelM);
        twgl.m4.setTranslation(modelM,this.position,modelM);
        // the drawing coce is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
		shaderProgram.texSampler = gl.getUniformLocation(shaderProgram.program, "texSampler");
		gl.uniform1i(gl.getUniformLocation(shaderProgram.program, "texSampler"), 1);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            color:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    Cone.prototype.center = function(drawingState) {
        return this.position;
    }
})();

grobjects.push(new Cone("cone1",[2,1.5,4], [0,0.8,0], 1.0) );
grobjects.push(new Cone("cone2",[-3,1,1], [0,0.8,0], .75) );
grobjects.push(new Cone("cone3",[-4,1,0], [0,0.8,0], .75) );
grobjects.push(new Cone("cone4",[-9,7.5,-9], [0,0.8,0], 5.0) );
grobjects.push(new Cone("cone5",[9,6,-9], [0,0.8,0], 4.0) );
grobjects.push(new Cone("cone6",[-3,1.5,0], [0,0.8,0], 1.0) );