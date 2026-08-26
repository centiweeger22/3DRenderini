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

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

uniform mat4 u_boneMatrices[32];
uniform mat4 u_inverseBindMatrices[32];
uniform int u_skinning;
uniform float u_time;

void main() {
  mat4 finalMatrix = mat4(1.0);
  if (u_skinning == 1){
    finalMatrix = mat4(0.0);
    for (int i = 0;i<4;i++){
      int currentBone = int(a_joints[i]);
      float weight = a_weights[i]; 
      if (weight > 0.0){ 
        finalMatrix += (u_boneMatrices[currentBone] * u_inverseBindMatrices[currentBone]) * weight;
      }
    }
  }

  vec4 finalPosition = finalMatrix * a_position;


  gl_Position = u_projectionMatrix * u_viewMatrix * a_objectMatrix * finalPosition;//poectionMatrix// * viewMatrix * modelMatrix * vertexPosition;
  v_texcoord = a_texcoord;
  v_normal = normalize(transpose(inverse(mat3(a_objectMatrix * finalMatrix))) * a_normal);//normalize((a_normalMatrix * vec *4(a_normal,0)).xyz);
  v_worldPos = gl_Position.xyz;
}