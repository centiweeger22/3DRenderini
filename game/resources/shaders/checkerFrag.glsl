#version 300 es
precision highp float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_worldPosition;
in vec4 v_viewSpace;
in vec4 v_shadowSpace[2];
out vec4 fragColor;
uniform sampler2D u_texture;

uniform highp sampler2DShadow u_shadowTexture;
uniform vec3 u_oppositeLightDirection;
uniform int u_renderShadow;
uniform float u_shadowDepth;
uniform float u_shadowResolution;
uniform float u_shadowSize;

void main() {
    // vec2 texCoord = vec2(v_worldPosition.x+v_worldPosition.y,v_worldPosition.z+v_worldPosition.y);
    // texCoord *= 0.1;
    // texCoord.x -= floor(texCoord.x);
    // texCoord.y -= floor(texCoord.y);
    // fragColor = texture(u_texture, texCoord,-1.0); // St the fragment color to red
    vec3 worldPos = v_worldPosition*0.2;
    worldPos += vec3(0.01,0.01,0.01);
    vec3 g = vec3(floor(worldPos.x - floor(worldPos.x/2.0)*2.0),floor(worldPos.y - floor(worldPos.y/2.0)*2.0),floor(worldPos.z - floor(worldPos.z/2.0)*2.0));
    vec3 color = vec3(1,1,1)*(g.x+g.y+g.z)/3.0;
    color = color * 0.5 + 0.5;
    float light = dot(v_normal, u_oppositeLightDirection);
    float shadowColor = 1.0;
    // return;

    if (u_renderShadow==1){
        float bias = 0.0001;
        float ndotl = max(dot(normalize(v_normal),
            normalize(u_oppositeLightDirection)), 0.0);
        bias = max(0.0003 * (1.0 - ndotl), 0.0001);
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

            shadowColor = texture(u_shadowTexture,shadowSpaceNDC2+vec3(0,0,-2.0*bias));
        }
    }

    light *= shadowColor;

    float darkness = 0.6;
    light = clamp(light,0.0,1.0);
    light = darkness*light + (1.0-darkness);
    vec4 fogColor = vec4(0.9,0.9,1.0,0.0);
    color *= light;
    float depth = -v_viewSpace.z * 0.02;
    depth -= 1.0;
    depth = clamp(depth,0.0,1.0);
    // vec4 finalColor = mix(vec4(color,1.0),fogColor,depth);
    fragColor = vec4(color,1.0);
    // fragColor.w = 1.0;

    // if (abs(shadowSpaceNDC.x-0.5)<0.5 && abs(shadowSpaceNDC.y-0.5)<0.5){
    //     // fragColor.rgb = shadowSpaceNDC.xyz * light; 
    // }
    // fragColor.rgb = vec3(0);


    // fragColor.xyz = vec3(shadowColor)*0.01;
    // fragColor.r = shadowColor * 0.0;
    // fragColor.g = shadowSpaceNDC.z;
    // fragColor.b = 0.0;
    // fragColor.yzw = vec3(1.0);
    // fragColor.b = 1.0;
    // fragColor.xy = v_worldPosition.xy;
    // fragColor.xyz = vec3(shadowSpaceNDC.x);
    // if (shadowSpaceNDC.x > 0.5){
    //     fragColor.xyz = vec3(1,0,1);
    // }
    // if (!renderShadows){
    // fragColor.xyz = vec3(texture(u_shadowTexture,shadowSpaceNDC.xy).x*1000000.0);
    // }
}