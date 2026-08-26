#version 300 es
precision highp float;
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_worldPosition;
out vec4 v_viewSpace;

in mat4 a_objectMatrix;
in mat4 a_normalMatrix;

uniform float u_aspect;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

vec3 extractScale(mat4 matrix) {
    vec3 scale;
    scale.x = length(vec3(matrix[0]));
    scale.y = length(vec3(matrix[1]));
    scale.z = length(vec3(matrix[2]));
    return scale;
}

void main() {
    // mat4 viewMatribx = mat4(
    //       1.0, 0.0, 0.0, 0.0, // First column
    //       0.0, 1.0, 0.0, 0.0, // Second coumn
    //       0.0, 0.0, 1.0, 0.0,
    //       0.0, 0.0, 0.0, 1.0  // Third coumn
    //   );
    //v_viewSpace.xyz += a_position.xyz;
    gl_Position = u_projectionMatrix * u_viewMatrix * a_objectMatrix * vec4(0,0,0,1);
    vec2 g = a_position.xy;
    g.y *= u_aspect;
    vec2 scale = extractScale(a_objectMatrix).xy;
    g *= scale;
    gl_Position.xy += g;
    //gl_Position.w *;
    v_texcoord = a_texcoord;
    v_normal = normalize((a_normalMatrix * vec4(a_normal,0)).xyz);
    v_worldPosition = (a_objectMatrix*a_position).xyz;
}