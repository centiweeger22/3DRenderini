#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
out vec4 fragColor;
uniform sampler2D u_texture;
uniform sampler2D u_depthTexture;
uniform vec3 u_oppositeLightDirection;
uniform float u_alpha;
uniform float u_near;
uniform float u_far;
uniform float u_targetDepth;
uniform float u_depthRange;
uniform float u_maxLevel;
uniform sampler2D u_colorTexture0;
uniform sampler2D u_colorTexture1;
uniform sampler2D u_colorTexture2;
uniform sampler2D u_colorTexture3;

void main() {
    // float d = texture(u_depthTexture, v_texcoord).x;
    // float depth = (2.0 * u_near * u_far) / (u_far + u_near - d * (u_far - u_near));
    // // fragColor.xyz = vec3(depth);
    // vec4 mainColor = texture(u_texture, v_texcoord);
    // vec4 blurColor = texture(u_texture, v_texcoord,3.5);

    // float targetDistance = u_targetDepth;
    // float range = u_depthRange;

    // float b = clamp((abs(depth - targetDistance)-10.0)/range,0.0,1.0);
    // float a = 1.0-b;

    // fragColor = a * mainColor + b * blurColor;
    vec2 cfColor = texture(u_colorTexture3, v_texcoord).rg;
    // float mainBlend = 1.0-(cfColor.r+cfColor.g);
    vec4 mixColor = mix(texture(u_colorTexture2, v_texcoord),texture(u_colorTexture1, v_texcoord),cfColor.g);
    fragColor = mix(mixColor,texture(u_colorTexture0, v_texcoord),cfColor.r);
    // fragColor.xyz = vec3(mainBlend+cfColor.x+cfColor.y);
    // fragColor = vec4(vec3(a),1.0);
    // fragColor.a = 1.0;
    // float light = dot(v_normal, u_oppositeLightDirection);
    // fragColor *= u_alpha;
    // gl_FragColor = vec4(v_texcoord,0,1);
    // light = 0.3*light + 0.7;
    // gl_FragColor.rgb *= light;
}