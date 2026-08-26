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
  mat4 viewMatribx = mat4(
        1.0, 0.0, 0.0, 0.0, // First column
        0.0, 1.0, 0.0, 0.0, // Second coumn
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0  // Third coumn
    );
  gl_Position = u_projectionMatrix * u_viewMatrix * u_objectMatrix * a_position;//poectionMatrix// * viewMatrix * modelMatrix * vertexPosition;
//   gl_Position.w = 0.0;
//   gl_Position.z = -1.0;
  v_texcoord = a_texcoord;
  v_normal = normalize((u_normalMatrix * vec4(a_normal,0)).xyz);
  gl_Position.z = gl_Position.w*2.0;
}