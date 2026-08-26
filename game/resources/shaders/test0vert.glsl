#version 300 es
precision highp float;
in vec4 a_position;
in vec3 a_normal;
in vec4 a_tangent;
in vec2 a_texcoord;
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_bitangent;
out vec3 v_worldPosition;
out vec4 v_viewSpace;
out vec4 v_shadowSpace[2];

in mat4 a_objectMatrix;
in mat4 a_normalMatrix;

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

uniform mat4 u_shadowViewMatrix[2];
uniform mat4 u_shadowProjectionMatrix[2];

void main() {
  // mat4 viewMatribx = mat4(
  //       1.0, 0.0, 0.0, 0.0, // First column
  //       0.0, 1.0, 0.0, 0.0, // Second coumn
  //       0.0, 0.0, 1.0, 0.0,
  //       0.0, 0.0, 0.0, 1.0  // Third coumn
  //   );
  vec4 objPosition = a_objectMatrix * a_position;
  v_viewSpace = u_viewMatrix * objPosition;
  gl_Position = u_projectionMatrix * v_viewSpace;
  v_texcoord = a_texcoord;
  v_normal = normalize((a_normalMatrix * vec4(a_normal,0)).xyz);
  v_tangent = normalize((a_normalMatrix * vec4(a_tangent.xyz,0)).xyz);
  v_bitangent = cross(v_normal,v_tangent) * a_tangent.w;
  v_worldPosition = (a_objectMatrix*a_position).xyz;
  v_shadowSpace[0] = u_shadowProjectionMatrix[0] * u_shadowViewMatrix[0] * objPosition;
  v_shadowSpace[1] = u_shadowProjectionMatrix[1] * u_shadowViewMatrix[1] * objPosition;
}