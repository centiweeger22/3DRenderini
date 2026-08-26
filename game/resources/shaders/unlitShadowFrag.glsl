#version 300 es
precision highp float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_tangent;
in vec3 v_bitangent;
in vec3 v_worldPosition;
in vec4 v_viewSpace;
in vec4 v_shadowSpace[2];
out vec4 fragColor;
uniform sampler2D u_texture;
uniform sampler2D u_normalMap;

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
    // u_oppositeLightDirection.x += 1.0;
    vec3 worldPos = v_worldPosition*0.2;
    worldPos += vec3(0.01,0.01,0.01);
    vec3 g = vec3(floor(worldPos.x - floor(worldPos.x/2.0)*2.0),floor(worldPos.y - floor(worldPos.y/2.0)*2.0),floor(worldPos.z - floor(worldPos.z/2.0)*2.0));
    vec3 color = vec3(1,1,1)*(g.x+g.y+g.z)/3.0;
    color = color * 0.5 + 0.5;

    float strength = 1.0;
    vec3 normalMap = texture(u_normalMap,v_texcoord).xyz * 2.0 - vec3(1.0);

    float t = dot(v_normal,u_oppositeLightDirection)*0.3;

    // normalMap += vec3(t,t,0.0);ffffff
    normalMap.xy *= strength;
    normalMap = normalize(normalMap);
    vec3 finalNormal = normalMap.x * v_tangent + normalMap.y * v_bitangent + normalMap.z * v_normal;

    // finalNormal += vec3(0.25,0.0,0.0);
    // finalNormal = normalize(finalNormal);
    vec3 lightd = normalize(u_oppositeLightDirection);
    // if (dot(v_normal,vec3(0,1,0)) > 0.99){
    //     lightd = normalize(u_oppositeLightDirection+vec3(-1.0,0.0,0.0));
    // }

    // fragColor = vec4(finalNormal,1);
    // return;
    float a = 0.6;
    float b = 1.0-a;
    float light = max(dot(finalNormal,lightd)*a+b,0.0);//(dot(finalNormal, lightd)*0.5+0.5) * smoothstep(0.0,0.5,dot(v_normal, lightd)*0.5+0.5);
    float shadowColor = 1.0;
    // if (light > 0.1)

    // light = 1.0;
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

    light *= 0.8;
    light += 0.8;


    // float darkness = 0.6;
    // light = clamp(light,0.0,1.0);
    // light = darkness*light + (1.0-darkness);
    // vec3 fogColor = vec3(0.9,0.9,1.0);
    // color *= light;
    // float depth = -v_viewSpace.z * 0.002;
    vec3 finalColor = texture(u_texture, v_texcoord).xyz * light;
    // finalColor = finalNormal * shadowColor;
    fragColor.xyz = finalColor;
    fragColor.w = 1.0;
}