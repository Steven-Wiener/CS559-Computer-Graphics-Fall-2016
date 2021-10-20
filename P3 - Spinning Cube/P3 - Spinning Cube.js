var m4, v3, canvas, context, xChange, yChange, zChange, xRot, yRot, zRot, speed;

var translate2D = function (point, camMatrix, projMatrix, vportMatrix) {
	var proj = m4.multiply(camMatrix, projMatrix);
	var vec = v3.create();
	vec[0] = point.x;
	vec[1] = point.y;
	vec[2] = point.z;
	return new Point(m4.transformPoint(m4.multiply(vportMatrix, proj), vec));
};

var line = function (p1, p2, camMatrix, projMatrix, vportMatrix) {
	p1 = translate2D(p1, camMatrix, projMatrix, vportMatrix);
	p2 = translate2D(p2, camMatrix, projMatrix, vportMatrix);

	context.beginPath();
	context.moveTo(p1.x, p1.y);
	context.lineTo(p2.x, p2.y);
	context.stroke();
};

var Cube = function (c1, c2) {
	this.c1 = c1;
	this.c2 = c2;
};

Cube.prototype.draw = function (ctx, camMatrix, projMatrix, vportMatrix) {
	var p1 = new Point([this.c1.x, this.c1.y, this.c1.z]);
	var p2 = new Point([this.c1.x, this.c1.y, this.c2.z]);
	var p3 = new Point([this.c1.x, this.c2.y, this.c1.z]);
	var p4 = new Point([this.c1.x, this.c2.y, this.c2.z]);
	var p5 = new Point([this.c2.x, this.c1.y, this.c1.z]);
	var p6 = new Point([this.c2.x, this.c1.y, this.c2.z]);
	var p7 = new Point([this.c2.x, this.c2.y, this.c1.z]);
	var p8 = new Point([this.c2.x, this.c2.y, this.c2.z]);

	var triangles = [new Triangle([p1, p2, p4]), new Triangle([p1, p2, p6]), new Triangle([p1, p3, p4]), new Triangle([p1, p3, p5]), new Triangle([p1, p6, p5]), new Triangle([p2, p4, p8]), new Triangle([p2, p6, p8]), new Triangle([p3, p5, p7]), new Triangle([p3, p7, p4]), new Triangle([p4, p7, p8]), new Triangle([p5, p6, p7]), new Triangle([p6, p7, p8])];

	var centers = [];
	for (var i = 0; i < 12; i++) {
		var v = triangles[i].getVerts();
		var p1 = translate2D(v[0], camMatrix, projMatrix, vportMatrix).getCoords();
		var p2 = translate2D(v[1], camMatrix, projMatrix, vportMatrix).getCoords();
		var p3 = translate2D(v[2], camMatrix, projMatrix, vportMatrix).getCoords();
		centers.push([0, 0, 0]);
		centers[i] = new Point([(p1[0] + p2[0] + p3[0]) / 3, (p1[1] + p2[1] + p3[1]) / 3, (p1[2] + p2[2] + p3[2]) / 3]);
		
		p1 = v[0].getCoords();
		p2 = v[1].getCoords();
		p3 = v[2].getCoords();
		var normal = v3.normalize(v3.cross([p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]], [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]]));

		triangles[i].draw(ctx, camMatrix, projMatrix, vportMatrix);
	}
};

var Triangle = function (threePoints) {
	this.v1 = threePoints[0];
	this.v2 = threePoints[1];
	this.v3 = threePoints[2];
};

Triangle.prototype.draw = function (context, camera, projection, viewport) {
	line(this.v1, this.v2, camera, projection, viewport);
	line(this.v2, this.v3, camera, projection, viewport);
	line(this.v3, this.v1, camera, projection, viewport);
};

Triangle.prototype.getVerts = function () {
	return [this.v1, this.v2, this.v3];
};

var Point = function (coordinates) {
	this.x = coordinates[0];
	this.y = coordinates[1];
	this.z = coordinates[2];
};

Point.prototype.getCoords = function () {
	return [this.x, this.y, this.z];
};

var corner1 = new Point([-1, -1, -1]);
var corner2 = new Point([1, 1, 1]);
var cube = new Cube(corner1, corner2);
var angle = 0;

canvas = document.getElementById('myCanvas');
context = canvas.getContext('2d');

xChange = document.getElementById('xSlider');
yChange = document.getElementById('ySlider');
zChange = document.getElementById('zSlider');
xRot = document.getElementById('xRotSlider');
yRot = document.getElementById('yRotSlider');
zRot = document.getElementById('zRotSlider');
speed = document.getElementById('speedSlider');

m4 = twgl.m4;
v3 = twgl.v3;
canvas.width = 600;
canvas.height = 600;

function draw() {
	angle -= -speed.value;
	context.save();
	context.clearRect(0, 0, 600, 600);

	context.scale(100, 100);
	context.translate(1, 1);
	context.scale(1, -1);
	context.lineWidth = 0.02;

	var camMatrix = m4.identity();
	var camTranslation = v3.create();
	camTranslation[0] = xChange.value;
	camTranslation[1] = yChange.value;
	camTranslation[2] = zChange.value;
	m4.rotateX(camMatrix, xRot.value, camMatrix);
	m4.rotateY(camMatrix, yRot.value, camMatrix);
	m4.rotateZ(camMatrix, zRot.value, camMatrix);
	m4.translate(camMatrix, camTranslation, camMatrix);
	m4.rotateY(camMatrix, angle, camMatrix);

	m4.translate(m4.identity(), v3.create(), m4.identity());

	cube.draw(context, camMatrix, m4.ortho(-2, 2, -2, 2, -8, 4), m4.identity());

	window.requestAnimationFrame(draw);
	context.restore();
}

draw();