/* 
P4 Steven Wiener
 */
var xsize = 500;
var ysize = 500;

function myApp() { "use strict";
	var canvas = document.getElementById('myCanvas');
	var context = canvas.getContext('2d');
	
	var m4 = twgl.m4;
	var v3 = twgl.v3;
	var rotInc = 0;

	var camX = document.getElementById('camX');
	camX.value = 0;
	var camY = document.getElementById('camY');
	camY.value = .1;
	var spinSpeed = document.getElementById('speed');
	spinSpeed.value = .01;
	var fov = document.getElementById('fov');
	fov.value = (fov.max/2 + fov.min/2);
	var wireframeToggle = document.getElementById('wireframeToggle');
	var perspectiveToggle = document.getElementById('perspectiveToggle');
	var sortToggle = document.getElementById('sortToggle');
	sortToggle.checked = true;
	var spinToggle = document.getElementById('spinToggle');
	spinToggle.checked = true;
	
	var painter = new Painter(canvas);
	
	/* var cubeR = 100; // radius
	var cubeV = [ // verticies
					[-cubeR, -cubeR, -cubeR], [cubeR, -cubeR, -cubeR],
					[cubeR, cubeR, -cubeR], [-cubeR, cubeR, -cubeR],
					[-cubeR, -cubeR, cubeR], [cubeR, -cubeR, cubeR],
					[cubeR, cubeR, cubeR], [-cubeR, cubeR, cubeR]
				];
	var cubeT = [
				[3,2,7], [2,6,7],  // top is   2,3,6,7   y=1
				[0,1,2], [0,2,3],  // front is 0,1,2,3   z=0
				[1,5,2], [5,2,6],  // side is  1,2,5,6   x=1
				[4,5,6], [4,6,7],  // back is  4,5,6,7   z=1
				[4,0,3], [4,3,7],  // side is  0,3,4,7   x=0
				[0,1,4], [1,4,5]
				]; */
	
	var pyrR = 200;
	var pyrV = [ [-pyrR, -pyrR, -pyrR], [pyrR, -pyrR, -pyrR], [pyrR, -pyrR, pyrR], [-pyrR, -pyrR, pyrR], [0, 2*pyrR, 0] ];
	var pyrT = [ [0,1,2], [0,3,2], [0,1,4], [1,2,4], [2,3,4], [3,0,4] ];
	
	var icoR = 100;
	var o = icoR * ((1 + Math.sqrt(5)) / 2);
	var icoV = [ [-icoR, o, 0], [icoR, o, 0], [-icoR, -o, 0], [icoR, -o, 0], [0, -icoR, o], [0, icoR, o], [0, -icoR, -o], [0, icoR, -o], [o, 0, -icoR], [o, 0, icoR], [-o, 0, -icoR], [-o, 0, icoR] ];
	var icoT = [
			[0, 11, 5],
			[0, 5, 1],
			[0, 1, 7],
			[0, 7, 10],
			[0, 10, 11],
			[1, 5, 9],
			[5, 11, 4],
			[11, 10, 2],
			[10, 7, 6],
			[7, 1, 8],
			[3, 9, 4],
			[3, 4, 2],
			[3, 2, 6],
			[3, 6, 8],
			[3, 8, 9],
			[4, 9, 5],
			[2, 4, 11],
			[6, 2, 10],
			[8, 6, 7],
			[9, 8, 1]
		];
	
	function drawStuff(viewProj, model, rbase, bbase, gbase, TArray, VArray) {		
        var dir = v3.normalize([1, 3, 2]);
		for (var i = 0; i < TArray.length; i++) {
            var t = TArray[i];
            var p1 = m4.transformPoint(model, VArray[t[0]]);
            var p2 = m4.transformPoint(model, VArray[t[1]]);
            var p3 = m4.transformPoint(model, VArray[t[2]]);

            // compute the normal
            var n = v3.normalize(v3.cross(v3.subtract(p1, p2), v3.subtract(p1, p3)));

            p1 = m4.transformPoint(viewProj, p1);
            p2 = m4.transformPoint(viewProj, p2);
            p3 = m4.transformPoint(viewProj, p3);

            var r = (rbase + (i % 2) * 10)*(.5 + Math.abs(v3.dot(n, dir)));
            var g = (gbase + (i % 2) * 10)*(.5 + Math.abs(v3.dot(n, dir)));
            var b = bbase*(.5 + Math.abs(v3.dot(n, dir)));

            var color = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";

            painter.triangle(p1, p2, p3, color);
		}
	}
	
	function Painter(canvas, context) {
		this.triangles = [];
		this.canvas = canvas;
		this.context = context || canvas.getContext('2d');
		
		this.clearTriangles = function() {
			this.triangles = [];
		}
		
		this.triangle = function(v1, v2, v3, fill, stroke) {
			this.triangles.push(
				{
					"v1" : v1,
					"v2" : v2,
					"v3" : v3,
					"fill" : fill,
					"stroke" : stroke,
					"zsum" : v1[2] + v2[2] +v3[2]
				}
			)
		}
		
		this.wireframe = function() {
			var that = this;
			this.triangles.forEach(function(t) {
				that.context.strokeStyle = t.stroke || t.fill;
				that.context.beginPath();
				that.context.moveTo(t.v1[0], t.v1[1]);
				that.context.lineTo(t.v2[0], t.v2[1]);
				that.context.lineTo(t.v3[0], t.v3[1]);
				that.context.closePath();
				that.context.stroke();
			})
		}

		this.render = function(sort) {
			var that = this;
			if (sort)
				this.triangles.sort(function (a, b) {
					if (a.zsum > b.zsum)
						return -1;
					else
						return 1;
				})
			this.triangles.forEach(function (t) {
				that.context.beginPath();
				that.context.fillStyle = t.fill;
				that.context.strokeStyle = t.stroke || "black";
				that.context.moveTo(t.v1[0], t.v1[1]);
				that.context.lineTo(t.v2[0], t.v2[1]);
				that.context.lineTo(t.v3[0], t.v3[1]);
				that.context.closePath();
				that.context.fill();
				if (t.stroke)
					that.context.stroke()
			})
		}
	}
	
	function draw() {
		// hack to clear the canvas fast
		canvas.width = canvas.width;
		
		var angleX = camX.value*Math.PI;
		var angleY = camY.value*Math.PI;
		var angleSpin = rotInc*spinSpeed.value*Math.PI;

		var eyeY = Math.sqrt(Math.pow(1500*Math.cos(angleX), 2) + Math.pow(1500*Math.sin(angleX), 2))*Math.sin(angleY);
		var eyeZ = Math.sqrt(Math.pow(1500*Math.cos(angleX), 2) + Math.pow(1500*Math.sin(angleX), 2))*Math.cos(angleY)*Math.cos(angleX);
		var eyeX = Math.sqrt(Math.pow(eyeZ, 2) + Math.pow(1500*Math.sin(angleX), 2))*Math.cos(angleY)*Math.sin(angleX);

		// camera transformation
		var Tc = m4.inverse(m4.lookAt([eyeX, eyeY, eyeZ], [0, 0, 0], [0, 1, 0]));

		// projection transformation
		var oRat = (fov.max - (fov.value - fov.min)) / 2;
		var Tp = (perspectiveToggle.checked) ? m4.perspective(Math.PI/(fov.value/180), 1, fov.min, fov.max)
											 : m4.ortho(-1*oRat, oRat, -1*oRat, oRat, -1*oRat, 1*oRat);

		// viewport transformation
		var Tv = m4.multiply(m4.scaling([100, -100, 100]), m4.translation([xsize/2, ysize/2, 0]));
		var Tcpv = m4.multiply(m4.multiply(Tc, Tp), Tv);

		// various spinning transforms
		var Tspin1 = m4.multiply(m4.translation([0, 0, 2*pyrR]), m4.axisRotation([0, 1, 0], angleSpin));
		var Tspin2 = m4.multiply(m4.translation([0, 0, (2*pyrR)+(4*icoR)]), m4.axisRotation([1, -1, 0], angleSpin));
		var Tspin3 = m4.multiply(m4.translation([0, 0, (2*pyrR)+(8*icoR)]), m4.axisRotation([-1, 1, 0], angleSpin));
		
		painter.clearTriangles();
		drawStuff(m4.multiply(Tspin1, Tcpv), m4.multiply(m4.rotationY(rotInc*speed.value*4*spinToggle.checked), m4.rotationX(rotInc*speed.value*4*spinToggle.checked)), 255, 105, 105, icoT, icoV);
		drawStuff(m4.multiply(Tspin2, Tcpv), m4.multiply(m4.rotationY(-rotInc*speed.value*4*spinToggle.checked), m4.rotationX(rotInc*speed.value*4*spinToggle.checked)), 105, 255, 105, icoT, icoV);
		drawStuff(m4.multiply(Tspin3, Tcpv), m4.multiply(m4.rotationY(-rotInc*speed.value*4*spinToggle.checked), m4.rotationX(-rotInc*speed.value*4*spinToggle.checked)), 105, 105, 255, icoT, icoV);
		drawStuff(Tcpv, m4.identity(), 0, 105, 105, pyrT, pyrV);
		if (wireframeToggle.checked)
			painter.wireframe();
		else
			painter.render(sortToggle.checked);
		rotInc = (rotInc + 1) % 200;

		window.requestAnimationFrame(draw);
	}
	window.requestAnimationFrame(draw);
};
window.onload = myApp;