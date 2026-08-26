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

vec3 extractScale(mat4 matrix) {
    vec3 scale;
    // The scale is the length (magnitude) of the basis vectors
    scale.x = length(vec3(matrix[0])); // Length of the first column (X-axis)
    scale.y = length(vec3(matrix[1])); // Length of the second column (Y-axis)
    scale.z = length(vec3(matrix[2])); // Length of the third column (Z-axis)
    return scale;
}

mat4 removeTranslation(mat4 matrix) {
    mat4 result = matrix;
    result[3][0] = 0.0; // X translation
    result[3][1] = 0.0; // Y translation
    result[3][2] = 0.0; // Z translation
    // The last element, result[3][3], should remain 1.0 for homogeneous coordinates
    return result;
}

void main() {
  // vec3 scale = u_objectMatrix*u_projectionMatrix*vec4(1,1,1,0)/u_objectMatrix*u_projectionMatrix*vec4(2,2,2,0)
  vec4 centerPoint = vec4(0,0,0,0);
  gl_Position = u_projectionMatrix * u_viewMatrix * u_objectMatrix * a_position;//poectionMatrix// * viewMatrix * modelMatrix * vertexPosition;
  //gl_Position = (removeTranslation(u_objectMatrix)*a_position) * vec4(extractScale(u_projectionMatrix),0);
  v_texcoord = a_texcoord;
  // v_normal = normalize((u_normaMaix * vec4(a_normal,0)).xyz);
}