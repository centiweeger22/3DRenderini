#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
out vec4 fragColor;
uniform sampler2D u_texture;
uniform vec3 u_oppositeLightDirection;

void main() {
    fragColor = texture(u_texture, v_texcoord); // St the fragment color to red
    float light = dot(v_normal, u_oppositeLightDirection);
    // light = 0.3*light + 0.7;
    // fragColor.rgb *= light;
}