precision highp float;
varying vec3 fNormal;
varying vec3 fPosition;
varying vec3 vPosition;

float pulse(float val, float dst) {
  return floor(mod(val * dst, 2.5) + .25);
}

void main() {
  vec3 dir = vec3(1, 1, 0);
  vec3 cpos = vPosition;
  vec3 color = vec3(0, pulse(cpos.y + cpos.x, 6.0), 1); 
  vec3 color2 = vec3(pulse(cpos.y + cpos.z, 5.0), 0, .5);
  
  // Lighting comes from one direction, but color is based on the object position
  float diffuse = .5 + dot(fNormal,dir);
  float diffuse2 = pow(dot(fNormal,dir), 2.0);
  gl_FragColor = vec4(diffuse * (color + color2), 1.0);
}