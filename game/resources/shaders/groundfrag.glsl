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
    float ambientLight = 0.7    ;
    light = (1.0-ambientLight)*light + ambientLight;
    fragColor.rgb *= light;
    // fragColor = vec4(v_normal,1);
    // fragColor = vec4((v_texcoord.y-v_normal.y)*-1.,0,(v_texcoord.y-v_normal.y),1);
}       