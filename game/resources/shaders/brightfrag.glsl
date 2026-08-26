#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
out vec4 fragColor;
uniform sampler2D u_texture;
uniform vec3 u_oppositeLightDirection;

void main() {
    fragColor = texture(u_texture, v_texcoord,-1.0); // St the fragment color to red
    float light = dot(v_normal, u_oppositeLightDirection);
    float darkness = 0.1;
    light = darkness*light + (1.0-darkness);
    fragColor.rgb *= light;
}