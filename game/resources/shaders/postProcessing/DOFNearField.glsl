#version 300 es
precision mediump float; // Set precisionfor floating-point numbers

in vec2 v_texcoord;
in vec3 v_normal;
out vec4 fragColor;
uniform sampler2D u_colorTexture0;
uniform sampler2D u_depthTexture;
uniform vec3 u_oppositeLightDirection;
uniform float u_alpha;
uniform float u_near;
uniform float u_far;
uniform float u_aspect;
uniform vec2 u_resolution;
uniform float u_targetDepth;
uniform float u_depthRange;
uniform float u_maxLevel;

// vec2 kernel[49] = vec2[](
//     vec2(-3, -3), vec2(-2, -3), vec2(-1, -3), vec2( 0, -3), vec2( 1, -3), vec2( 2, -3), vec2( 3, -3),
//     vec2(-3, -2), vec2(-2, -2), vec2(-1, -2), vec2( 0, -2), vec2( 1, -2), vec2( 2, -2), vec2( 3, -2),
//     vec2(-3, -1), vec2(-2, -1), vec2(-1, -1), vec2( 0, -1), vec2( 1, -1), vec2( 2, -1), vec2( 3, -1),
//     vec2(-3,  0), vec2(-2,  0), vec2(-1,  0), vec2( 0,  0), vec2( 1,  0), vec2( 2,  0), vec2( 3,  0),
//     vec2(-3,  1), vec2(-2,  1), vec2(-1,  1), vec2( 0,  1), vec2( 1,  1), vec2( 2,  1), vec2( 3,  1),
//     vec2(-3,  2), vec2(-2,  2), vec2(-1,  2), vec2( 0,  2), vec2( 1,  2), vec2( 2,  2), vec2( 3,  2),
//     vec2(-3,  3), vec2(-2,  3), vec2(-1,  3), vec2( 0,  3), vec2( 1,  3), vec2( 2,  3), vec2( 3,  3)
// );

vec2 kernel[49] = vec2[](
    vec2(0.000000f, 0.000000f),
	2.0f * vec2(1.000000f, 0.000000f),
	2.0f * vec2(0.707107f, 0.707107f),
	2.0f * vec2(-0.000000f, 1.000000f),
	2.0f * vec2(-0.707107f, 0.707107f),
	2.0f * vec2(-1.000000f, -0.000000f),
	2.0f * vec2(-0.707106f, -0.707107f),
	2.0f * vec2(0.000000f, -1.000000f),
	2.0f * vec2(0.707107f, -0.707107f),
	
	4.0f * vec2(1.000000f, 0.000000f),
	4.0f * vec2(0.923880f, 0.382683f),
	4.0f * vec2(0.707107f, 0.707107f),
	4.0f * vec2(0.382683f, 0.923880f),
	4.0f * vec2(-0.000000f, 1.000000f),
	4.0f * vec2(-0.382684f, 0.923879f),
	4.0f * vec2(-0.707107f, 0.707107f),
	4.0f * vec2(-0.923880f, 0.382683f),
	4.0f * vec2(-1.000000f, -0.000000f),
	4.0f * vec2(-0.923879f, -0.382684f),
	4.0f * vec2(-0.707106f, -0.707107f),
	4.0f * vec2(-0.382683f, -0.923880f),
	4.0f * vec2(0.000000f, -1.000000f),
	4.0f * vec2(0.382684f, -0.923879f),
	4.0f * vec2(0.707107f, -0.707107f),
	4.0f * vec2(0.923880f, -0.382683f),

	6.0f * vec2(1.000000f, 0.000000f),
	6.0f * vec2(0.965926f, 0.258819f),
	6.0f * vec2(0.866025f, 0.500000f),
	6.0f * vec2(0.707107f, 0.707107f),
	6.0f * vec2(0.500000f, 0.866026f),
	6.0f * vec2(0.258819f, 0.965926f),
	6.0f * vec2(-0.000000f, 1.000000f),
	6.0f * vec2(-0.258819f, 0.965926f),
	6.0f * vec2(-0.500000f, 0.866025f),
	6.0f * vec2(-0.707107f, 0.707107f),
	6.0f * vec2(-0.866026f, 0.500000f),
	6.0f * vec2(-0.965926f, 0.258819f),
	6.0f * vec2(-1.000000f, -0.000000f),
	6.0f * vec2(-0.965926f, -0.258820f),
	6.0f * vec2(-0.866025f, -0.500000f),
	6.0f * vec2(-0.707106f, -0.707107f),
	6.0f * vec2(-0.499999f, -0.866026f),
	6.0f * vec2(-0.258819f, -0.965926f),
	6.0f * vec2(0.000000f, -1.000000f),
	6.0f * vec2(0.258819f, -0.965926f),
	6.0f * vec2(0.500000f, -0.866025f),
	6.0f * vec2(0.707107f, -0.707107f),
	6.0f * vec2(0.866026f, -0.499999f),
	6.0f * vec2(0.965926f, -0.258818f)
);

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
    fragColor = vec4(0,0,0,0);
    float d = 2.0;
    for (int x = 0;x<49;x++){
        fragColor += texture(u_colorTexture0, v_texcoord + kernel[x] / u_resolution * d)/49.0;
    }

    // fragColor = vec4(vec3(a),1.0);
    // fragColor.a = 1.0;
    // float light = dot(v_normal, u_oppositeLightDirection);
    // fragColor *= u_alpha;
    // gl_FragColor = vec4(v_texcoord,0,1);
    // light = 0.3*light + 0.7;
    // gl_FragColor.rgb *= light;
}