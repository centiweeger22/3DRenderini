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
  vec4 weights = a_weights;
  if (u_skinning == 0){weights = vec4(0.0,0.0,0.0,0.0);}
  weights *= sin(u_time);
  float totalWeight = weights[0]+weights[1]+weights[2]+weights[3];
  vec4 finalPosition = a_position*(1.0-totalWeight);
  vec3 finalNormal = a_normal * (1.0-totalWeight);
  if (u_skinning == 1){
    for (int i = 0;i<4;i++){
      int currentBone = int(a_joints[i]);
      float weight = weights[i];
      if (weight > 0.0){
        mat4 matrix = u_inverseBindMatrices[currentBone] * u_boneMatrices[currentBone];
        finalPosition += (matrix * a_position) * weight;
        finalNormal += transpose(inverse(mat3(matrix))) * a_normal;
      }
    }
  }



  gl_Position = u_projectionMatrix * u_viewMatrix * a_objectMatrix * finalPosition;//poectionMatrix// * viewMatrix * modelMatrix * vertexPosition;
  v_texcoord = a_texcoord;
  v_normal = normalize(transpose(inverse(mat3(a_objectMatrix))) * finalNormal);//normalize((a_normalMatrix * vec *4(a_normal,0)).xyz);
  v_worldPos = gl_Position.xyz;
}