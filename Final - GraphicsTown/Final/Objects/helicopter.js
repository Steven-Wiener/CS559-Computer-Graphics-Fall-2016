/**
 * Created by gleicher on 10/17/15.
 */
var grobjects = grobjects || [];

// make the two constructors global variables so they can be used later
var Copter = undefined;

/* this file defines a helicopter object and a helipad object

the helicopter is pretty ugly, and the rotor doesn't spin - but
it is intentionally simply. it's ugly so that students can make
it nicer!

it does give an example of index face sets

read a simpler object first.


the helipad is a simple object for the helicopter to land on.
there needs to be at least two helipads for the helicopter to work..


the behavior of the helicopter is at the end of the file. it is
an example of a more complex/richer behavior.
 */

(function () {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var copterBodyBuffers = undefined;
    var copterRotorBuffers = undefined;
    var copterNumber = 0;

    var padBuffers = undefined;
    var padNumber = 0;

    // constructor for Helicopter
    Copter = function Copter(name) {
        this.name = "copter"+copterNumber++;
        this.position = [0,0,0];    // will be set in init
        this.color = [.9,.9,.9];
        // about the Y axis - it's the facing direction
        this.orientation = 0;
    }
    Copter.prototype.init = function(drawingState) {
        var gl=drawingState.gl;
        var q = .25;  // abbreviation

        // create the shaders once - for all cubes
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["phong-vs", "phong-fs"]);
        }
        if (!copterBodyBuffers) {
            var arrays = {
                vpos : { numComponents: 3, data: [
                    .5, 0, 0,  0,0,.5,  -.5,0,0,  0,0, -.5, 0,.5,0,    0, -.5,0,
                    q,0,-q,  0,q,-q,  -q,0,-q,  0,-q,-q,  0,0,-1
                ] },
                vnormal : {numComponents:3, data: [
                    1,0,0,  0,0,1,  -1,0,0,  0,0,-1, 0,1,0,  0,-1,0,
                    1,0,0,  0,1,0,  -1,0,0,  0,-1,0,  0,0,-1
                ]},
                indices : [0,1,4, 1,2,4, 2,3,4, 3,0,4, 1,0,5, 2,1,5, 3,2,5, 0,3,5,
                           6,7,10, 7,8,10, 8,9,10, 9,6,10
                            ]
            };
            copterBodyBuffers = twgl.createBufferInfoFromArrays(drawingState.gl,arrays);

            var rarrays = {
                vpos : {numcomponents:3, data: [0,.5,0, 1,.5,.1, 1,.5, -.1,
                                                0,.5,0, -1,.5,.1, -1,.5, -.1]},
                vnormal : {numcomponents:3, data: [0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0]},
                indices : [0,1,2, 3,4,5]
            };
            copterRotorBuffers = twgl.createBufferInfoFromArrays(drawingState.gl,rarrays);
        }
        // put the helicopter on a random helipad
        // see the stuff on helicopter behavior to understand the thing
        //this.lastPad = randomHelipad();
        //this.position = twgl.v3.add(this.lastPad.center(),[0,.5+this.lastPad.helipadAltitude,0]);
        //this.state = 0; // landed
        //this.wait = getRandomInt(250,750);
        //this.lastTime = 0;

    };
    Copter.prototype.draw = function(drawingState) {
		var p0=[[5,5,0], [0,10,0], [-5,5,0], [-10,5,0], [0,5,7]];
		var p1=[[5,7,0], [0,10,5], [-5,0,0], [-10,7,0], [5,5,7]];
		var p2=[[0,10,-10], [-5,10,0], [-10,0,0], [-5,5,7], [5,0,0]];
		var p3=[[0,10,0], [-5,5,0], [-10,5,0], [0,5,7], [5,5,0]];
		// This is the function C(t)
		function curveValue(t){
			var f = Math.floor(t);
			t = t - f;
			
			var b0=(1-t)*(1-t)*(1-t);
			var b1=3*t*(1-t)*(1-t);
			var b2=3*t*t*(1-t);
			var b3=t*t*t;

			var result = [p0[f][0]*b0+p1[f][0]*b1+p2[f][0]*b2+p3[f][0]*b3,
						  p0[f][1]*b0+p1[f][1]*b1+p2[f][1]*b2+p3[f][1]*b3,
						  p0[f][2]*b0+p1[f][2]*b1+p2[f][2]*b2+p3[f][2]*b3];
			return result;
		}
		// And this is the derivative C'(t) -- which is the tangent vector
		function curveTangent(t){
			var f = Math.floor(t);
			t = t - f;
			
			var b0=-3*(1-t)*(1-t);
			var b1=3*(1-3*t)*(1-t);
			var b2=3*t*(2-3*t);
			var b3=3*t*t;

			var result = [p0[f][0]*b0+p1[f][0]*b1+p2[f][0]*b2+p3[f][0]*b3,
						  p0[f][1]*b0+p1[f][1]*b1+p2[f][1]*b2+p3[f][1]*b3,
						  p0[f][2]*b0+p1[f][2]*b1+p2[f][2]*b2+p3[f][2]*b3];
			return result;
		}
		
        var t = (drawingState.realtime%(10000))/(2000);
		
		this.angle = this.angle || 0;
		this.angle++;

		this.position = curveValue(t);
        var modelM = twgl.m4.rotationY(this.orientation);
		modelM = twgl.m4.rotateY(modelM, Math.PI, modelM);
		modelM = twgl.m4.multiply(modelM, twgl.m4.lookAt([0,0,0],curveTangent(t),[0,1,1]));
        twgl.m4.setTranslation(modelM,this.position,modelM);
		
        var modelR = twgl.m4.rotationY(this.angle);
		modelR = twgl.m4.rotateY(modelR, Math.PI, modelR);
		modelR = twgl.m4.multiply(modelR, twgl.m4.lookAt([0,0,0],curveTangent(t),[0,1,1]));
        twgl.m4.setTranslation(modelR,this.position,modelR);
		
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
		
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            color:this.color, model: modelM });
        twgl.setBuffersAndAttributes(gl,shaderProgram,copterBodyBuffers);
        twgl.drawBufferInfo(gl, gl.TRIANGLES, copterBodyBuffers);
		
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            color:this.color, model: modelR });
        twgl.setBuffersAndAttributes(gl,shaderProgram,copterRotorBuffers);
        twgl.drawBufferInfo(gl, gl.TRIANGLES, copterRotorBuffers);
    };
    Copter.prototype.center = function(drawingState) {
        return this.position;
    }
})();
grobjects.push(new Copter());
