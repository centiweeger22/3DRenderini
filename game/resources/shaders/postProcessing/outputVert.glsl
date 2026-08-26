#version 300 es
precision highp float;
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_worldPos;

in mat4 a_objectMatrix;

in vec4 a_joints;
in vec4 a_weights;

out vec4 v_shadowSpace[2];

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

uniform mat4 u_boneMatrices[32];
uniform mat4 u_inverseBindMatrices[32];
uniform int u_skinning;
uniform float u_time;

uniform mat4 u_shadowViewMatrix[2];
uniform mat4 u_shadowProjectionMatrix[2];

void main() {
  gl_Position = a_objectMatrix * a_position;//poectionMatrix// * viewMatrix * modelMatrix * vertexPosition;
  v_texcoord = a_texcoord;
  v_normal = a_normal;//normalize(transpose(inverse(mat3(a_objectMatrix * finalMatrix))) * a_normal);//normalize((a_normalMatrix * vec *4(a_normal,0)).xyz);
  v_worldPos = gl_Position.xyz;
}