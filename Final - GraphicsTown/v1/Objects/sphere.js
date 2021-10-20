/**
 * Created by gleicher on 10/9/15.
 */
/*
 a second example object for graphics town
 check out "simplest" first

 the sphere is more complicated since it is designed to allow making many cubes

 we make a constructor function that will make instances of cubes - each one gets
 added to the grobjects list

 we need to be a little bit careful to distinguish between different kinds of initialization
 1) there are the things that can be initialized when the function is first defined
    (load time)
 2) there are things that are defined to be shared by all cubes - these need to be defined
    by the first init (assuming that we require opengl to be ready)
 3) there are things that are to be defined for each sphere instance
 */
var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Sphere = undefined;

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
	
	var radius = 1;
	var hSteps = 128;
	var vSteps = 64;

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
            shaderProgram = twgl.createProgramInfo(gl, ["sphere-vs", "sphere-fs"]);
        }
		var vertices = new Float32Array( 3*(hSteps+1)*(vSteps+1) );
		var normals = new Float32Array( 3*(hSteps+1)*(vSteps+1) );
		var du = 24*Math.PI/hSteps;
		var dv = Math.PI/vSteps;
		var i,j,u,v,x,y,z;
		var k = 0;
		for (i = 0; i <= vSteps; i++) {
			v = -Math.PI/2 + i*dv;
			for (j = 0; j <= hSteps; j++) {
				u = j*du;
				x = Math.cos(u)*Math.cos(v);
				y = Math.sin(u)*Math.cos(v);
				z = Math.sin(v);
				vertices[k] = radius*x;
				normals[k++] = x;
				vertices[k] = radius*y;
				normals[k++] = y;
				vertices[k] = radius*z;
				normals[k++] = z;
			} 
		}
        if (!buffers) {
            var arrays = {
                vpos : vertices,
                vnormal : normals
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
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            spherecolor:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    Sphere.prototype.center = function(drawingState) {
        return this.position;
    }
	
	var speed = 1/100;
	var spinSpeed = 1/10;
	
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
		} else {
			dest = [sphere.trackDiameter*Math.cos(sphere.theta), sphere.trackDiameter*Math.sin(sphere.theta), sphere.position[2]];
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
		else
			sphere.dir = Math.atan2(sphere.dx,sphere.dy);
		
		//var dtheta = sphere.dir - sphere.orientation;
		var rotAmt = spinSpeed * delta;
		//if (dtheta > 0)
			sphere.orientation = Math.min(sphere.dir, sphere.orientation + rotAmt);
		//else
			//sphere.orientation = Math.max(sphere.dir, sphere.orientation + rotAmt);
			
		var go = Math.min(sphere.dst, (delta * speed));
		sphere.position[0] += sphere.vx * go;
		sphere.position[1] += sphere.vy * go;
		sphere.position[2] += sphere.vz * go;
		sphere.dst -= go;
	}
})();

// put some objects into the scene
// normally, this would happen in a "scene description" file
// but I am putting it here, so that if you want to get
// rid of cubes, just don't load this file.
grobjects.push(new Sphere("sphere1", [8,1,0], [1,1,0], 9, 'Y'));
grobjects.push(new Sphere("sphere2", [7,0,1], [1,0,0], 7, 'Z'));
//grobjects.push(new Sphere("sphere2",[0,1,1], 2, 100, 50, [1,0,1]));
