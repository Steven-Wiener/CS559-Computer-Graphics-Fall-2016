/**
 * Created by gleicher on 10/9/2015.
 */

/*
this is the "main" file - it gets loaded last - after all the objects are loaded
make sure that twgl is loaded first

it sets up the main function to be called on window.onload

 */

var gl;

var shaderProgram;
var viewM;
var texID;
 
var isValidGraphicsObject = function (object) {
	if(object.name === undefined) {
		console.log("warning: GraphicsObject missing name field");
		return false;
	}

	if(typeof object.draw !== "function" && typeof object.drawAfter !== "function") {
		console.log("warning: GraphicsObject of type " + object.name + " does not contain either a draw or drawAfter method");
		return false;
	}

	if(typeof object.center !== "function") {
		console.log("warning: GraphicsObject of type " + object.name + " does not contain a center method. ");
		return false;
	}

	if(typeof object.init !== "function") {
		console.log("warning: GraphicsObject of type " + object.name + " does not contain an init method. ");
		return false;
	}

	return true;
}

window.onload = function() {
    "use strict";

    // set up the canvas and context
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width",600);
    canvas.setAttribute("height",600);
    document.body.appendChild(canvas);

    // make a place to put the drawing controls - a div
    var controls = document.createElement("DIV");
    controls.id = "controls";
    document.body.appendChild(controls);

    // a switch between camera modes
    var uiMode = document.createElement("select");
    uiMode.innerHTML += "<option>ArcBall</option>";
    uiMode.innerHTML += "<option>Drive</option>";
    uiMode.innerHTML += "<option>Fly</option>";
    uiMode.innerHTML += "</select>";
    controls.appendChild(uiMode);

    var resetButton = document.createElement("button");
    resetButton.innerHTML = "Reset View";
    resetButton.onclick = function() {
        // note - this knows about arcball (defined later) since arcball is lifted
        arcball.reset();

        drivePos = [0,.2,5];
        driveTheta = 0;
        driveXTheta = 0;

    }
    controls.appendChild(resetButton);

    // make some checkboxes - using my cheesy panels code
    var checkboxes = makeCheckBoxes([ ["Run",1], ["Examine",0] ]); //

    // a selector for which object should be examined
    var toExamine = document.createElement("select");
    grobjects.forEach(function(obj) {
           toExamine.innerHTML +=  "<option>" + obj.name + "</option>";
        });
    controls.appendChild(toExamine);

    // make some sliders - using my cheesy panels code
    var sliders = makeSliders([["TimeOfDay",0,24,12]]);

    // this could be gl = canvas.getContext("webgl");
    // but twgl is more robust
    var gl = twgl.getWebGLContext(canvas);

    // make a fake drawing state for the object initialization
    var drawingState = {
        gl : gl,
        proj : twgl.m4.identity(),
        view : twgl.m4.identity(),
        camera : twgl.m4.identity(),
        sunDirection : [0,1,0]
    }

    // information for the cameras
    var lookAt = [0,0,0];
    var lookFrom = [0,5,-10];
    var fov = 1.1;
	
    var arcball = new ArcBall(canvas);

    // for timing
    var realtime = 0
    var lastTime = Date.now();

    // parameters for driving
    var drivePos = [0,.2,5];
    var driveTheta = 0;
    var driveXTheta = 0;

    // cheesy keyboard handling
    var keysdown = {};

    document.body.onkeydown = function(e) {
        var event = window.event ? window.event : e;
        keysdown[event.keyCode] = true;
        e.stopPropagation();
    };
    document.body.onkeyup = function(e) {
        var event = window.event ? window.event : e;
        delete keysdown[event.keyCode];
        e.stopPropagation();
    };
	
	var houseTexture = gl.createTexture();
    //gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, houseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	var houseImage = new Image();
	
	var cubeTexture = gl.createTexture();
    //gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	var cubeImage = new Image();
	
	var groundTexture = gl.createTexture();
    //gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	var groundImage = new Image();
	
	var sphereTexture = gl.createTexture();
    //gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	var sphereImage = new Image();

	function initTextures() {
		var i = 0;
		var img = new Array(6);
		var urls = [
		   "Textures/Skyboxes/posx.jpg", "Textures/Skyboxes/negx.jpg", 
		   "Textures/Skyboxes/posy.jpg", "Textures/Skyboxes/negy.jpg", 
		   "Textures/Skyboxes/posz.jpg", "Textures/Skyboxes/negz.jpg"
		];
		for (var j = 0; j < 6; j++) {
			img[j] = new Image();
			img[j].onload = function() {
				i++;
				if (i == 6) {
					texID = gl.createTexture();
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);
					var targets = [
					   gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
					   gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
					   gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z 
					];
					for (var j = 0; j < 6; j++) {
						gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
						gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
						gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					}
					gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
					draw();
				}
			}
			img[j].src = urls[j];
		}
		
		houseImage.onload = function() { loadTexture(houseImage, houseTexture, 1); };
		houseImage.crossOrigin = "anonymous";
		houseImage.src = "./Textures/house_texture.jpg";

		cubeImage.onload = function() { loadTexture(cubeImage, cubeTexture, 1); };
		cubeImage.crossOrigin = "anonymous";
		cubeImage.src = "./Textures/grid.jpg";

		groundImage.onload = function() { loadTexture(groundImage, groundTexture, 1); };
		groundImage.crossOrigin = "anonymous";
		groundImage.src = "./Textures/ground.jpg";

		sphereImage.onload = function() { loadTexture(sphereImage, sphereTexture, 1); };
		sphereImage.crossOrigin = "anonymous";
		sphereImage.src = "./Textures/grid2.jpg";
	}

    function loadTexture(image,texture,option) {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		if (option == 1) {// Option 1 : Use mipmap, select interpolation mode
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		} else if (option == 2) {// Option 2: At least use linear filters
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		} else {// Optional ... if your shader & texture coordinates go outside the [0,1] range
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}
    }
	
	function skyboxInit() {
		shaderProgram = twgl.createProgramInfo(gl,["skybox-vs","skybox-fs"]);
		gl.enable(gl.DEPTH_TEST);
		skybox = skybox(1000);
		var model = {};
		model.coordsBuffer = gl.createBuffer();
		model.indexBuffer = gl.createBuffer();
		model.count = skybox.indices.length;
		gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, skybox.vpos, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, skybox.indices, gl.STATIC_DRAW);
		model.render = function() { 
			gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
			gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram.program, "vpos"), 3, gl.FLOAT, false, 0, 0);
			gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram.program, "model"), false, viewM );
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
		}
		skybox = model;
	}
	
	// the actual draw function - which is the main "loop"
	function draw() {
		// advance the clock appropriately (unless its stopped)
		var curTime = Date.now();
		if (checkboxes.Run.checked) {
			realtime += (curTime - lastTime);
		}
		lastTime = curTime;

		// first, let's clear the screen
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// figure out the transforms
		var projM = twgl.m4.perspective(fov, 1, 0.1, 100);
		var cameraM = twgl.m4.lookAt(lookFrom,lookAt,[0,1,0]);

		mat4.perspective(projM, Math.PI/3, 1, 2, 2000);
		
		// implement the camera UI
		if (uiMode.value == "ArcBall") {
			viewM = arcball.getMatrix();
			twgl.m4.setTranslation(viewM, [0, 0, -10], viewM);
		} else if (uiMode.value == "Drive") {
			if (keysdown[65]) { driveTheta += .02; }
			if (keysdown[68]) { driveTheta -= .02; }
			if (keysdown[87]) {
				var dz = Math.cos(driveTheta);
				var dx = Math.sin(driveTheta);
				drivePos[0] -= .05*dx;
				drivePos[2] -= .05*dz;
			}
			if (keysdown[83]) {
				var dz = Math.cos(driveTheta);
				var dx = Math.sin(driveTheta);
				drivePos[0] += .05*dx;
				drivePos[2] += .05*dz;
			}

			cameraM = twgl.m4.rotationY(driveTheta);
			twgl.m4.setTranslation(cameraM, drivePos, cameraM);
			viewM = twgl.m4.inverse(cameraM);
		}else if (uiMode.value == "Fly") {

			if (keysdown[65] || keysdown[37]) { 
				driveTheta += .02; 
			}else if (keysdown[68] || keysdown[39]) { 
				driveTheta -= .02; 
			}

			if (keysdown[38]) { driveXTheta += .02; }
			if (keysdown[40]) { driveXTheta -= .02; }

			var dz = Math.cos(driveTheta);
			var dx = Math.sin(driveTheta);
			var dy = Math.sin(driveXTheta);

			if (keysdown[87]) {
				drivePos[0] -= .25*dx;
				drivePos[2] -= .25*dz;
				drivePos[1] += .25 * dy;
			}

			if (keysdown[83]) {
				drivePos[0] += .25*dx;
				drivePos[2] += .25*dz;
				drivePos[1] -= .25 * dy;
			}

			cameraM = twgl.m4.rotationX(driveXTheta);
			twgl.m4.multiply(cameraM, twgl.m4.rotationY(driveTheta), cameraM);
			twgl.m4.setTranslation(cameraM, drivePos, cameraM);
			viewM = twgl.m4.inverse(cameraM);
		}

		// Render Skybox
		gl.useProgram(shaderProgram.program);
		gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram.program, "proj"), false, projM);
		if (texID) {
			gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram.program, "vpos"));
			skybox.render();  
			gl.disableVertexAttribArray(gl.getAttribLocation(shaderProgram.program, "vpos"));
		}

		// get lighting information
		var tod = Number(sliders.TimeOfDay.value);
		var sunAngle = Math.PI * (tod-6)/12;
		var sunDirection = [Math.cos(sunAngle),Math.sin(sunAngle),0];

		// make a real drawing state for drawing
		var drawingState = {
			gl : gl,
			proj : projM,   // twgl.m4.identity(),
			view : viewM,   // twgl.m4.identity(),
			camera : cameraM,
			timeOfDay : tod,
			sunDirection : sunDirection,
			realtime : realtime
		}

		// initialize all of the objects that haven't yet been initialized (that way objects can be added at any point)
		grobjects.forEach(function(obj) { 
			if(!obj.__initialized) {
				if(isValidGraphicsObject(obj)){
					obj.init(drawingState);
					obj.__initialized = true;
				}
			}
		});

		// now draw all of the objects - unless we're in examine mode
		if (checkboxes.Examine.checked) {
			// get the examined object - too bad this is an array not an object
			var examined = undefined;
			grobjects.forEach(function(obj) { if (obj.name == toExamine.value) {examined=obj;}});
			var ctr = examined.center(drawingState);
			var shift = twgl.m4.translation([-ctr[0],-ctr[1],-ctr[2]]);
			twgl.m4.multiply(shift,drawingState.view,drawingState.view);

			if(examined.draw) examined.draw(drawingState);
			if(examined.drawAfter) examined.drawAfter(drawingState);
		} else {

			grobjects.forEach(function (obj) {
				if(obj.draw) obj.draw(drawingState);
			});

			grobjects.forEach(function (obj) {
				if(obj.drawAfter) obj.drawAfter();
			});
		}
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, houseTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, groundTexture);
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
		//gl.activeTexture(gl.TEXTURE0);
		//gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);
		window.requestAnimationFrame(draw);
	};
	
	initTextures();
	skyboxInit();
	window.setTimeout(draw,200);
    //draw();
};
