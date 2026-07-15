export const CRTEffect = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uGlitchIntensity: { value: 0.0 },
    uResolution: { value: { x: 1920, y: 1080 } },
    uScanlineDensity: { value: 0.6 },
    uNoiseIntensity: { value: 0.06 },
    uChromaticStrength: { value: 0.008 },
    uFisheyeStrength: { value: 0.08 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGlitchIntensity;
    uniform vec2 uResolution;
    uniform float uScanlineDensity;
    uniform float uNoiseIntensity;
    uniform float uChromaticStrength;
    uniform float uFisheyeStrength;

    varying vec2 vUv;

    // Random hash
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // 2D value noise
    float noise2D(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // FBM for organic noise
    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amp * noise2D(p);
        p *= 2.0;
        amp *= 0.5;
      }
      return value;
    }

    // Fisheye barrel distortion
    vec2 fisheye(vec2 uv, float strength) {
      vec2 center = uv - 0.5;
      float r2 = dot(center, center);
      float factor = 1.0 + strength * r2;
      return center * factor + 0.5;
    }

    // Chromatic aberration
    vec3 sampleChromatic(vec2 uv, float strength, float time) {
      float scanOffset = sin(uv.y * uResolution.y * 0.5 + time * 10.0) * 0.001;
      float noiseOffset = fbm(uv * 8.0 + time * 0.5) * strength * 0.5;
      float totalOffset = strength + scanOffset + noiseOffset;

      float r = texture2D(tDiffuse, uv + vec2(totalOffset, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(totalOffset, 0.0)).b;
      return vec3(r, g, b);
    }

    // Scanlines
    float scanlines(vec2 uv, float time, float density) {
      float lines = sin(uv.y * uResolution.y * density * 2.0 + time * 0.3) * 0.12;
      float thick = sin(uv.y * uResolution.y * density * 0.5) * 0.04;
      return 1.0 - (lines + thick) * 0.4;
    }

    // Analog static
    float analogStatic(vec2 uv, float time, float intensity) {
      vec2 p = uv * vec2(uResolution.x / uResolution.y, 1.0) * 3.0;
      float s = fbm(p + time * 8.0) * intensity;
      // Horizontal line noise
      float line = sin(uv.y * uResolution.y * 4.0 + time * 200.0) * 0.5 + 0.5;
      s += line * intensity * 0.3;
      return s;
    }

    // Vignette
    float vignette(vec2 uv) {
      float dist = distance(uv, vec2(0.5));
      return 1.0 - smoothstep(0.3, 0.8, dist) * 0.5;
    }

    void main() {
      vec2 uv = vUv;

      // Fisheye
      float fisheyeAmount = uFisheyeStrength + uGlitchIntensity * 0.15;
      uv = fisheye(uv, fisheyeAmount);

      // Clamp to border
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // Chromatic aberration
      float chromatic = uChromaticStrength * (1.0 + uGlitchIntensity * 2.0);
      vec3 color = sampleChromatic(uv, chromatic, uTime);

      // Scanlines
      float scan = scanlines(uv, uTime, uScanlineDensity + uGlitchIntensity * 0.5);
      color *= scan;

      // Vignette
      color *= vignette(uv);

      // Analog static
      float staticNoise = analogStatic(uv, uTime, uNoiseIntensity + uGlitchIntensity * 0.2);
      color += vec3(staticNoise);

      // Heavy glitch at high intensity
      if (uGlitchIntensity > 0.6) {
        float jitter = sin(uTime * 60.0 + uv.y * 150.0) * (uGlitchIntensity - 0.6) * 0.03;
        color = mix(color, vec3(1.0, 0.0, 0.1), (uGlitchIntensity - 0.6) * 1.5);

        // Horizontal tear
        float tear = fract(uTime * 2.0 + 0.5);
        float tearMask = smoothstep(tear, tear + 0.003, uv.y) *
                         smoothstep(tear + 0.012, tear + 0.008, uv.y);
        color = mix(color, vec3(1.0), tearMask * (uGlitchIntensity - 0.5) * 2.0);
      }

      // CRT screen curvature glow
      float glow = 1.0 - distance(uv, vec2(0.5)) * 0.2;
      color *= glow;

      // Gamma correction
      color = pow(color, vec3(1.0 / 2.2));

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
