#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_worldPos;
out vec4 fragColor;
in vec4 v_shadowSpace[2];
uniform sampler2D u_texture;
uniform sampler2D u_reflectionTexture;
uniform highp sampler2DShadow u_shadowTexture;
uniform vec3 u_oppositeLightDirection;
uniform int u_renderShadow;
uniform float u_shadowDepth;
uniform float u_shadowResolution;
uniform float u_shadowSize;
uniform highp mat4 u_viewMatrix;
uniform highp mat4 u_objectMatrix;


void main() {

    mat4 m = u_viewMatrix; // Your model matrix
    vec3 colX = vec3(m[0][0], m[0][1], m[0][2]);
    vec3 colY = vec3(m[1][0], m[1][1], m[1][2]);
    vec3 colZ = vec3(m[2][0], m[2][1], m[2][2]);

    // Normalize the columns to get the 3x3 rotation matrix
    mat3 rotationOnly = mat3(normalize(colX), normalize(colY), normalize(colZ));
    
    m = u_objectMatrix; // Your model matrix
    colX = vec3(m[0][0], m[0][1], m[0][2]);
    colY = vec3(m[1][0], m[1][1], m[1][2]);
    colZ = vec3(m[2][0], m[2][1], m[2][2]);

    // Normalize the columns to get the 3x3 rotation matrix
    mat3 rotationOnlyObject = mat3(normalize(colX), normalize(colY), normalize(colZ));

    vec3 normal2 = normalize(v_normal);
    vec3 reflectedVector = u_oppositeLightDirection - 2.0*(dot(u_oppositeLightDirection,normal2))*normal2;
    reflectedVector = rotationOnly * reflectedVector;
    fragColor = texture(u_texture, v_texcoord); // St the fragment color to red
    float light = -dot(normalize(reflectedVector), normalize(inverse(u_viewMatrix)[3].xyz-v_worldPos));
    
    // light = light*light*light*light*light;


    // mat4 matrixThinky = inverse(u_viewMatrix);
    vec3 cameraDirection = normalize(v_worldPos-inverse(u_viewMatrix)[3].xyz); 
    vec3 reflectionDirection = cameraDirection - 2.0*(dot(cameraDirection,normal2))*normal2;
    float outsideLight = (dot(reflectionDirection,cameraDirection)+1.0)*0.15+0.2;
    vec2 samplePosition = vec2(atan(reflectionDirection.z,reflectionDirection.x)/(3.1415926*2.0)+0.5,-((reflectionDirection.y*0.5)+0.5));
    vec4 f = texture(u_reflectionTexture,samplePosition);
    float light3 = dot(normalize(v_normal),normalize(u_oppositeLightDirection))*0.5+0.5;
    float light4 = 1.3;
    if (light3 < 0.5){
        light4 = 1.0;
    }
    f *= light4;
    fragColor *= f*2.0;
    fragColor.w = 1.0;

        light = light*0.5+0.5;
    light = (pow(light,3.0)+0.2)*0.4+0.05;
    // light *=0.07;
    // light -=0.3;
    // gl_FragColor.rgb += vec3(1,1,1) * light;
    light = floor(light+0.5)*0.1;
    fragColor.rgb += vec3(1,1,1)*light;

    float light2 = dot(v_normal, u_oppositeLightDirection);
    float ambientLight = 0.7    ;
    light2 = (1.0-ambientLight)*light2 + ambientLight;
    fragColor.rgb *= light2;

    float shadowColor = 1.0;
    // return;

    if (u_renderShadow==1){
        float bias = 0.0001;
        float ndotl = max(dot(normalize(v_normal),
            normalize(u_oppositeLightDirection)), 0.0);
        bias = max(0.001 * (1.0 - ndotl), 0.0001);
        vec3 shadowSpaceNDC = (v_shadowSpace[0].xyz / v_shadowSpace[0].w) * 0.5 + vec3(0.5);
        vec3 shadowSpaceNDC2 = (v_shadowSpace[1].xyz / v_shadowSpace[1].w) * 0.5 + vec3(0.5);
        bool renderShadows = (abs(shadowSpaceNDC.x-0.5)<0.5) && (abs(shadowSpaceNDC.y-0.5)<0.5); 
        // fragColor.rgb = shadowSpaceNDC;

        if ((abs(shadowSpaceNDC.x-0.5)<0.45) && (abs(shadowSpaceNDC.y-0.5)<0.45)){
            shadowSpaceNDC.x *= 0.5;

            shadowColor = texture(u_shadowTexture,shadowSpaceNDC+vec3(0,0,-bias));
            // fragColor.rgb = vec3(1,0,0);
        }
        else if ((abs(shadowSpaceNDC2.x-0.5)<0.5) && (abs(shadowSpaceNDC2.y-0.5)<0.5)){
            shadowSpaceNDC2.x *= 0.5;
            shadowSpaceNDC2.x += 0.5;

            shadowColor = texture(u_shadowTexture,shadowSpaceNDC2+vec3(0,0,-2.0*bias));
            // fragColor.rgb = vec3(1,0,0);
        }
    }

    shadowColor *= 0.1;
    fragColor.rgb += shadowColor-0.2;

    // gl_FragColor += 3
    // gl_FragColor.rgb = vec3(1,0,0);

}