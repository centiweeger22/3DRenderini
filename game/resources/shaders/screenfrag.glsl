#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
out vec4 fragColor;
uniform sampler2D u_texture;
uniform vec3 u_oppositeLightDirection;
uniform float u_alpha;

void main() {
    fragColor = texture(u_texture, v_texcoord * vec2(1, -1)+vec2(0.0,1.0)); // St the fragment color to red
    float light = dot(v_normal, u_oppositeLightDirection);
    fragColor *= u_alpha;
    // if (fragColor.w < 1.0){discard;}
    // gl_FragColor = vec4(v_texcoord,0,1);
    // light = 0.3*light + 0.7;
    // gl_FragColor.rgb *= light;
}