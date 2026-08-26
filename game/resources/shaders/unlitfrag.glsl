#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_worldPos;
out vec4 fragColor;
uniform sampler2D u_texture;
uniform vec3 u_oppositeLightDirection;
uniform float u_alpha;

void main() {
    fragColor = texture(u_texture, v_texcoord); // St the fragment color to red
    float light = dot(v_normal, u_oppositeLightDirection);
    // fragColor.xyz = vec3(fragColor.a);
    // fragColor.a = 1.0;
    // fragColor = vec4(sin(v_worldPos),1);
    // light = 0.3*light + 0.7;
    // fragColor.rgb *= light;
    fragColor.a *= u_alpha;
}