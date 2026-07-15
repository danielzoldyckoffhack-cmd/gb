export const VhsShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uGlitchIntensity: { value: 0.0 },
    uResolution: { value: { x: 640, y: 480 } },
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

    varying vec2 vUv;

    // ── Noise ──
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.1;
        a *= 0.5;
      }
      return v;
    }

    // ── Fisheye ──
    vec2 fisheye(vec2 uv, float s) {
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      return c * (1.0 + s * r2) + 0.5;
    }

    // ── Scanlines CRT ──
    float scanlines(vec2 uv) {
      float val = sin(uv.y * uResolution.y * 1.8) * 0.08;
      float thick = sin(uv.y * uResolution.y * 0.3) * 0.03;
      return 1.0 - (val + thick);
    }

    // ── Pixel grid (CRT aperture) ──
    float aperture(vec2 uv) {
      vec2 grid = uv * uResolution;
      float x = sin(grid.x * 3.14159 * 0.5) * 0.02;
      float y = sin(grid.y * 3.14159 * 0.5) * 0.02;
      return 1.0 - (x + y);
    }

    // ── Chromatic aberration ──
    vec3 chromatic(vec2 uv, float strength) {
      float r = texture2D(tDiffuse, uv + vec2(strength * 0.01, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(strength * 0.01, 0.0)).b;
      return vec3(r, g, b);
    }

    // ── Vignette ──
    float vignette(vec2 uv) {
      float d = distance(uv, vec2(0.5));
      return 1.0 - smoothstep(0.25, 0.95, d) * 0.7;
    }

    void main() {
      vec2 uv = vUv;

      // Fisheye (subtle)
      float fe = 0.08 + uGlitchIntensity * 0.2;
      uv = fisheye(uv, fe);

      // Clamp
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // ── Horizontal jitter ──
      if (uGlitchIntensity > 0.2) {
        float j = sin(uv.y * uResolution.y * 0.3 + uTime * 30.0) * uGlitchIntensity * 0.006;
        uv.x += j;
      }

      // ── Vertical roll (tracking error) ──
      if (uGlitchIntensity > 0.5) {
        float roll = fract(uTime * 0.5 + uGlitchIntensity * 2.0);
        float rollMask = smoothstep(roll, roll + 0.01, uv.y) * smoothstep(roll + 0.06, roll + 0.04, uv.y);
        uv.y += rollMask * 0.03;
      }

      // ── Sample with chromatic aberration ──
      float chroma = 0.5 + uGlitchIntensity * 3.0;
      vec3 color = chromatic(uv, chroma);

      // ── Scanlines ──
      color *= scanlines(uv);

      // ── Aperture grid ──
      color *= aperture(uv);

      // ── Vignette ──
      color *= vignette(uv);

      // ── Analog static ──
      float staticN = fbm(uv * 4.0 + uTime * 5.0) * (0.03 + uGlitchIntensity * 0.15);
      color += vec3(staticN * 0.7, staticN * 0.4, staticN * 0.5);

      // ── Sync tear ──
      if (uGlitchIntensity > 0.3) {
        float tear = fract(uTime * (0.5 + uGlitchIntensity * 2.0));
        float tearM = smoothstep(tear, tear + 0.002, uv.y) * smoothstep(tear + 0.01, tear + 0.005, uv.y);
        if (tearM > 0.0) {
          vec3 tearColor = texture2D(tDiffuse, uv + vec2(0.01 * uGlitchIntensity, 0.0)).rgb;
          color = mix(color, tearColor, tearM * 0.5);
        }
      }

      // ── Heavy glitch ──
      if (uGlitchIntensity > 0.6) {
        float flash = step(0.98, fract(uTime * 4.0 + hash(uv * 10.0)));
        color = mix(color, vec3(1.0, 0.9, 0.9), flash * (uGlitchIntensity - 0.5) * 0.3);
      }

      // ── Signal dropout ──
      float drop = step(0.998, fract(uTime * 1.5 + hash(uv * 3.0)));
      color *= 1.0 - drop * uGlitchIntensity * 0.8;

      // ── Color bleed ──
      float bleed = fbm(uv * 10.0 + uTime * 2.0) * 0.02 * uGlitchIntensity;
      color.r += bleed;
      color.b -= bleed * 0.5;

      // ── Gamma ──
      color = pow(color, vec3(1.0 / 2.2));

      // ── Slight blue shift (CRT phosphor) ──
      color *= vec3(0.95, 0.97, 1.02);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
