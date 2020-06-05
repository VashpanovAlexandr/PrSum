#version 300 es
//precision mediump float;
precision highp float;

uniform sampler2D uSampler;

uniform vec4 uZone;
uniform float uCellR;
uniform float uCellG;
uniform float uCellB;
uniform float uTime;

out vec4 oColor;

float Mandl( vec2 C, vec2 Z )
{
    vec2 C0 = C;
    float n = 0.0;
    float moduleC = 0.0;
    for(float j = 0.0; j < 255.0; j++)
    {
        C0 = vec2(C0.x * C0.x - C0.y * C0.y, C0.y * C0.x + C0.x * C0.y) + Z;
        moduleC = C0.x * C0.x + C0.y * C0.y;
       // n = j;
        if (moduleC >= 16.0)
        {
            n = j;
            break;    
        } 
    }
    return n;
}
void main(void)
{
    float n;
    vec2 C = vec2(0.35, 0.38);
    vec2 Z;
    vec2 xy = uZone.xz + gl_FragCoord.xy / 500.0 * (uZone.yw - uZone.xz);
    //vec2 xy = vec2(0.0, 0.0);
    C.x = 0.5 + 0.711 * sin(uTime / 8.2);
    C.y = 1.05 + 3.711 * sin(uTime / 8.2);
    Z.x = xy.x;
    Z.y = xy.y;
    n = Mandl(Z, C);
    oColor = texture(uSampler, xy);   
    oColor.x += n * uCellR / 255.0;
    oColor.y += n * uCellG / 255.0;
    oColor.z += n * uCellB / 255.0;      
}