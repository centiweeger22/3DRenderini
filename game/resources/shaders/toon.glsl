#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
out vec4 fragColor;
in vec4 v_shadowSpace[2];
uniform sampler2D u_texture;
uniform highp sampler2DShadow u_shadowTexture;
uniform vec3 u_oppositeLightDirection;
uniform int u_renderShadow;
uniform float u_shadowDepth;
uniform float u_shadowResolution;
uniform float u_shadowSize;

void main() {
    vec4 texColor = vec4(1.0,1.0,1.0,1.0); // St the fragment color to red
    float light = (dot(normalize(v_normal), normalize(u_oppositeLightDirection)) + 1.0)*0.5;

    float m = 0.6;

    float shadowColor = 1.0;
    float bias = 0.0001;
    float ndotl = max(dot(normalize(v_normal),
                normalize(u_oppositeLightDirection)), 0.0);
    bias = max(0.003 * (1.0 - ndotl), 0.0001);

    if (u_renderShadow==1){
        vec3 shadowSpaceNDC = (v_shadowSpace[0].xyz / v_shadowSpace[0].w) * 0.5 + vec3(0.5);
        vec3 shadowSpaceNDC2 = (v_shadowSpace[1].xyz / v_shadowSpace[1].w) * 0.5 + vec3(0.5);
        bool renderShadows = (abs(shadowSpaceNDC.x-0.5)<0.5) && (abs(shadowSpaceNDC.y-0.5)<0.5); 

        if ((abs(shadowSpaceNDC.x-0.5)<0.45) && (abs(shadowSpaceNDC.y-0.5)<0.45)){
            shadowSpaceNDC.x *= 0.5;

            shadowColor = texture(u_shadowTexture,shadowSpaceNDC+vec3(0,0,-bias));
        }
        else if ((abs(shadowSpaceNDC2.x-0.5)<0.5) && (abs(shadowSpaceNDC2.y-0.5)<0.5)){
            shadowSpaceNDC2.x *= 0.5;
            shadowSpaceNDC2.x += 0.5;

            shadowColor = texture(u_shadowTexture,shadowSpaceNDC2+vec3(0,0,-bias));
        }
    }
    if (light > 0.5){
        light = max(0.5,light - (1.0-shadowColor)*0.5);
    }
    // light = (light-floor(light+0.5))*2.0;
    // fragColor.xyz = vec3(light);
    fragColor.w = 1.0;

    // float light2 = light*0.5-0.5;
    // light = floor(light);
    // light = clamp(light,0.0,1.0);
    // light += light2;


    // // light *= 0.3;
    // // light += 0.7;
    // fragColor.xyz = vec3(abs(light - 0.5));
    float x = light;
    if (x <= 0.5){
        light = m*x;
    }
    if (x > 0.5){
        light = 1.0+m*(x-1.0);
    }
    light -= 0.5;
    light *= 2.0;
    light += 0.5;
    // light *= 1.5;
    vec3 darkColor = mix(vec3(0.0,0.2,0.5),texColor.xyz,0.5);
    fragColor.xyz = mix(darkColor,texColor.xyz,light);
    // fragColor.xyz = vec3(-light);
    // if (texColor.w < 0.5){
    //     discard;
    // }
    // fragColor.w = 1.0;
    
    // fragColor.xyz *= shadowColor;
    // light = 0.3*light + 0.7;
    // fragColor.rgb *= light;

    // fragColor.r = shadowColor * 0.0;
    // fragColor.g = shadowSpaceNDC.z;
    // fragColor.xyz = vec3(-bias);
}