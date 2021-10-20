precision highp float;
varying vec3 fNormal;
uniform vec2 resolution;
varying vec3 fPosition;
varying vec3 vPosition;
uniform float time;

float pulse(float val, float dst) {
  return floor(mod(val * dst, .7) + 0.5);
}

vec3 colors() {
  vec3 color = vec3(0.0, 0.0, 0.0);
  
  if (abs(mod(abs(vPosition.x), abs(.2 * sin(time * 10.0)))) < .05)
    color.x = 1.0;
  if (abs(mod(vPosition.y * vPosition.x, .2 * sin(time * 10.0 + 1.0))) < .1)
    color.z = 1.0;

  return color;
}

void main() {
  vec3 cpos = vPosition;
  float cposxy = cpos.x * cpos.y;
  float theta = time * 20.0;
  
  vec3 dir1 = vec3(0, 1, 0); // high noon
  vec3 dir2 = vec3(cos(theta), 0, sin(theta)); 
  vec3 dir3 = vec3(sin(theta), 0, cos(theta));
  
  float diffuse1 = .5 + dot(fNormal,dir1);
  float diffuse2 = pow(dot(fNormal,dir2), 3.0);
  float diffuse3 = pow(dot(fNormal,dir3), 3.0);
  vec3 col1 = diffuse2 * vec3(0, .5, .5);
  vec3 col2 = diffuse3 * vec3(0, 1, 1);
  vec3 col3 = vec3(pulse(cpos.y + cpos.z, 7.0), 0.25, pulse(cpos.x + cpos.y, 5.0));
  vec3 col4 = colors();
  
  gl_FragColor = vec4(diffuse1 * (col1 + col2 - col3 + col4), 1.0);
  //gl_FragColor = vec4(diffuse * color, 1.0);
  //gl_FragColor = vec4(colors(), 1.0);
}