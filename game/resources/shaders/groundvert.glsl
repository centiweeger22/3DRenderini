#version 300 es
precision highp float;
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
out vec2 v_texcoord;
out vec3 v_normal;

uniform mat4 u_objectMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

void main() {
  gl_Position = u_projectionMatrix * u_viewMatrix * u_objectMatrix * a_position;//poectionMatrix// * viewMatrix * modelMatrix * vertexPosition;
  v_texcoord = a_texcoord;
  v_normal = normalize((u_normalMatrix * vec4(a_normal,0)).xyz);
  // v_normal = 
  v_normal = a_normal;
}