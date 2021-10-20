var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Sphere = undefined;

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;
	
	var radius = 0.5;
	var hSteps = 32;
	var vSteps = 16;

    // constructor for Cubes
    Sphere = function Sphere(name, position, color, trackDiameter, axis) {
        this.name = name;
        this.position = position || [0,0,0];
        this.color = color || [.7,.8,.9];
		
		this.lastTime = 0;
		this.orientation = 0;
		this.trackDiameter = trackDiameter || 8;
		this.axis = axis || 'Y';
    };
    Sphere.prototype.init = function(drawingState) {
        var gl=drawingState.gl;
        // create the shaders once - for all cubes
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["tex-vs", "tex-fs"]);
        }
		var vertexPos = [];
		var normals = [];
		var texCoords = [];
		var ind = [];
		var du = 2*Math.PI/hSteps;
		var dv = Math.PI/vSteps;
		for (var i = 0; i <= vSteps; i++) {
			var v = -Math.PI/2 + i*dv;
			for (var j = 0; j <= hSteps; j++) {
				var u = j*du;
				var x = Math.cos(u)*Math.cos(v);
				var y = Math.sin(u)*Math.cos(v);
				var z = Math.sin(v);
				vertexPos.push(radius*x);
				normals.push(x);
				vertexPos.push(radius*y);
				normals.push(y);
				vertexPos.push(radius*z);
				normals.push(z);
				texCoords.push(j/hSteps);
				texCoords.push(i/vSteps);
			} 
		}
		for (var j = 0; j < vSteps; j++) {
			var row1 = j*(hSteps+1);
			var row2 = (j+1)*(hSteps+1);
			for (var i = 0; i < hSteps; i++) {
				ind.push(row1 + i);
				ind.push(row2 + i + 1);
				ind.push(row2 + i);
				ind.push(row1 + i);
				ind.push(row1 + i + 1);
				ind.push(row2 + i + 1);
			}
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
    Sphere.prototype.draw = function(drawingState) {
		roll(this,drawingState);
        // we make a model matrix to place the sphere in the world
        var modelM = twgl.m4.rotationY(this.orientation);
        twgl.m4.rotateX(modelM, -this.orientation, modelM);
        twgl.m4.setTranslation(modelM, this.position, modelM);
        // the drawing code is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
		shaderProgram.texSampler = gl.getUniformLocation(shaderProgram.program, "texSampler");
		gl.uniform1i(gl.getUniformLocation(shaderProgram.program, "texSampler"), 3);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            color:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    Sphere.prototype.center = function(drawingState) {
        return this.position;
    }
	
	var speed = 1/100;
	var spinSpeed = 5/1000;
	
	function roll(sphere, drawingState) {
		if (!sphere.lastTime) {
			sphere.lastTime = drawingState.realtime;
			sphere.theta = 0;
			return;
		}
        var delta = drawingState.realtime - sphere.lastTime;
        sphere.lastTime = drawingState.realtime;
		sphere.theta += speed;
		
		var dest;
		if (sphere.axis == 'Y') {
			dest = [sphere.trackDiameter*Math.cos(sphere.theta), sphere.position[1], sphere.trackDiameter*Math.sin(sphere.theta)];
			sphere.dx = dest[0] - sphere.position[0];
			sphere.dy = 0;
			sphere.dz = dest[2] - sphere.position[2];
		} else if (sphere.axis == 'X') {
			dest = [sphere.position[0], sphere.trackDiameter*Math.cos(sphere.theta), sphere.trackDiameter*Math.sin(sphere.theta)];
			sphere.dx = 0;
			sphere.dy = dest[1] - sphere.position[1];
			sphere.dz = dest[2] - sphere.position[2];
		} else if (sphere.axis == 'Z') {
			dest = [sphere.trackDiameter*Math.cos(sphere.theta), sphere.trackDiameter*Math.sin(sphere.theta), sphere.position[2]];
			sphere.dx = dest[0] - sphere.position[0];
			sphere.dy = dest[1] - sphere.position[1];
			sphere.dz = 0;
		} else if (sphere.axis == 'Z2') {
			dest = [sphere.trackDiameter*Math.cos(-sphere.theta), sphere.trackDiameter*Math.sin(-sphere.theta), sphere.position[2]];
			sphere.dx = dest[0] - sphere.position[0];
			sphere.dy = dest[1] - sphere.position[1];
			sphere.dz = 0;
		}
		
		sphere.dst = Math.sqrt(sphere.dx*sphere.dx + sphere.dy*sphere.dy + sphere.dz*sphere.dz);
		
		sphere.vx = sphere.dx / sphere.dst;
		sphere.vy = sphere.dy / sphere.dst;
		sphere.vz = sphere.dz / sphere.dst;
		
		if (sphere.axis == 'Y')
			sphere.dir = Math.atan2(sphere.dx,sphere.dz);
		else if (sphere.axis == 'X')
			sphere.dir = Math.atan2(sphere.dy,sphere.dz);
		else if (sphere.axis == 'Z')
			sphere.dir = Math.atan2(sphere.dx,sphere.dy);
		else if (sphere.axis == 'Z2')
			sphere.dir = Math.atan2(-sphere.dx,-sphere.dy);
		
		var dtheta = sphere.dir - sphere.orientation;
		var rotAmt = spinSpeed * delta;
		if (dtheta > 0)
			sphere.orientation = Math.min(sphere.dir, sphere.orientation + rotAmt);
		else
			sphere.orientation = Math.max(sphere.dir, sphere.orientation + rotAmt);
			
		var go = Math.min(sphere.dst, (delta * speed));
		sphere.position[0] += sphere.vx * go;
		sphere.position[1] += sphere.vy * go;
		sphere.position[2] += sphere.vz * go;
		sphere.dst -= go;
	}
})();

grobjects.push(new Sphere("sphere1", [9,.5,0], [1,1,0], 8, 'Y'));
grobjects.push(new Sphere("sphere2", [7,0,-3.5], [1,0,0], 6, 'Z'));
grobjects.push(new Sphere("sphere3", [6,0,-3.5], [1,.75,0], 5, 'Z2'));
grobjects.push(new Sphere("sphere4", [0,5,-3.5], [1,1,0], 4, 'Z'));
grobjects.push(new Sphere("sphere5", [4,0,-3.5], [0,1,0], 3, 'Z2'));
grobjects.push(new Sphere("sphere6", [3,0,-3.5], [0,0,1], 2, 'Z'));
grobjects.push(new Sphere("sphere7", [2,0,-3.5], [.35,.35,1], 1, 'Z2'));
grobjects.push(new Sphere("sphere8", [1,0,-3.5], [1,0,1], .001, 'Z'));
