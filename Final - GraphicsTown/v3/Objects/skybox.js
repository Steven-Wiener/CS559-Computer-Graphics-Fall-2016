function skybox(sideLength) {
	var r = (sideLength || 1)/2;
	var vertices = [];
	var normals = [];
	var texCoords = [];
	var ind = [];
	function face(xyz, normal) {
		var side = vertices.length/3;
		for (var i = 0; i < 12; i++)
			vertices.push(xyz[i]);
		for (var i = 0; i < 4; i++)
			normals.push(normal[0],normal[1],normal[2]);
		texCoords.push(0,0, 1,0, 1,1, 0,1);
		ind.push(side,side+1,side+2,side,side+2,side+3);
	}
	face( [-r,-r, r,  r,-r, r,  r, r, r, -r, r, r], [ 0, 0, 1] );
	face( [-r,-r,-r, -r, r,-r,  r, r,-r,  r,-r,-r], [ 0, 0,-1] );
	face( [-r, r,-r, -r, r, r,  r, r, r,  r, r,-r], [ 0, 1, 0] );
	face( [-r,-r,-r,  r,-r,-r,  r,-r, r, -r,-r, r], [ 0,-1, 0] );
	face( [ r,-r,-r,  r, r,-r,  r, r, r,  r,-r, r], [ 1, 0, 0] );
	face( [-r,-r,-r, -r,-r, r, -r, r, r, -r, r,-r], [-1, 0, 0] );
	return {
		vpos: new Float32Array(vertices),
		vnormal: new Float32Array(normals),
		vtexCoord: new Float32Array(texCoords),
		indices: new Uint16Array(ind)
	}
}