<template>
  <div id="three-canvas"></div>
  <div id="name">Nick Wenzel</div>
  <div id="link-overlay">

    <a href="https://www.yourwebsite.com/resume" target="_blank">Resume</a>
    <a href="https://github.com/nickwenzel" target="_blank">GitHub</a>
    <a href="https://www.linkedin.com/in/nick-wenzel-78869a16b/" target="_blank">LinkedIn</a>
    <a href="https://soundcloud.com/ickslay20" target="_blank">SoundCloud</a>
  </div>
  <div id="copyright">© 2024</div>
</template>

<script>
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { LensDistortionShader } from './LensDistortionShader';

export default {
  mounted() {
    this.initThree();
  },

  methods: {
    initThree() {
      // Create the scene, camera, and renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });

      renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('three-canvas').appendChild(renderer.domElement);

      // Create a row of stacked cylinders
      const cylinderRows = [];
      const numCylinders = 6; // Number of cylinders in each row
      const numRows = 5; // Number of rows
      const numDepth = 5;
      const spacing = 3; // Spacing between cylinders
      let cylinderHeight = 2; // Initial height of each cylinder

      for (let j = 0; j < numRows; j++) {
        const row = new THREE.Group();
        for (let i = 0; i < numCylinders; i++) {
          const depth = new THREE.Group();
          for (let k = 0; k < numDepth; k++) {
            const geometry = new THREE.CylinderGeometry(0.1, 0.1, cylinderHeight);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const cylinder = new THREE.Mesh(geometry, material);

            cylinder.position.set(i * spacing, j * 1.5, k * 1);
            cylinder.rotation.z = THREE.MathUtils.degToRad(90);
            depth.add(cylinder);
          }
          row.add(depth);
        }
        cylinderRows.push(row);
        scene.add(row);
      }

      // Position the camera
      camera.position.z = 7;
      camera.position.y = 2.25;
      camera.position.x = 7.5;
      camera.rotation.x = 0;

      // Define the gradient
      const gradientColors = [
        0x833ab4, // Purple
        0xfd1d1d, // Red
        0xd4fc45  // Orange
      ];

      // Mouse position variables
      let mouseX = 0;
      let mouseY = 0;

      window.addEventListener('mousemove', (event) => {
        mouseX = event.clientX / window.innerWidth;
        mouseY = event.clientY / window.innerHeight;
      });

      let startingPhase = -0.8;
      let pulsePhase = startingPhase;
      let isResetting = false;

      function interpolateColor(color1, color2, factor) {

        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;

        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;

        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));

        return (r << 16) + (g << 8) + b;
      }

      function lightUpRows() {
        cylinderRows.forEach((row, rowIndex) => {
          row.children.forEach((cylinderGroup, cylinderIndex) => {
            cylinderGroup.children.forEach((cylinder, depthIndex) => {
              if (isResetting) {
                cylinder.material.color.setHex(0x000000); // Reset to black
              } else {
                const phaseOffset = depthIndex * 0.1; // Delay between each depth
                const intensity = 0.5 + 0.5 * Math.sin((pulsePhase + phaseOffset) * Math.PI);

                // Interpolate between gradient colors based on mouseX position
                const colorIndex = mouseX * (gradientColors.length - 1);
                const lowerIndex = Math.floor(colorIndex);
                const upperIndex = Math.ceil(colorIndex);
                const blendFactor = colorIndex - lowerIndex;
                const color = interpolateColor(gradientColors[lowerIndex], gradientColors[upperIndex], blendFactor);

                // Update the color
                cylinder.material.color.setHex(color);
                cylinder.material.opacity = intensity;
                cylinder.material.transparent = true;

                // Update the height based on mouseY position
                const newHeight = 0.3 + mouseY * 0.8; // Height variation between 1 and 4
                cylinder.scale.set(1, newHeight, 1); // Adjust the Y scale of the cylinder to change height
              }
            });
          });
        });

        if (!isResetting) {
          pulsePhase += -0.01; // Move pulse from back to front
        }

        // If pulsePhase reaches the threshold, reset the sequence
        if (pulsePhase < Math.PI * -1.491) {
          isResetting = true;
          pulsePhase = startingPhase; // Reset pulse phase for the next cycle
          setTimeout(() => {
            isResetting = false;
          }, 500); // Wait half a second before restarting the light-up sequence
        }
      }

      // Post-processing setup
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      // FXAA Pass
      const fxaaPass = new ShaderPass(FXAAShader);
      fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
      composer.addPass(fxaaPass);

      // DOF (Bokeh) Pass
      const bokehPass = new BokehPass(scene, camera, {
        focus: 3.0,
        aperture: 0.001,
        maxblur: 0.01,
      });
      composer.addPass(bokehPass);

      // chromatic aberration
      const chromaticAberrationPass = new ShaderPass(LensDistortionShader);
      composer.addPass(chromaticAberrationPass);

      // Resize handler to update camera and renderer on window resize
      window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
      });

      // Animate and render the scene
      function animate() {
        requestAnimationFrame(animate);

        lightUpRows();

        // Render the scene with post-processing
        composer.render();
      }

      animate();
    }
  }
};
</script>

<style scoped>

body, html {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevents scrolling */
  width: 100%;
  height: 100%;
}

#three-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#name {
  position: fixed;
  top: 50%;
  left: 10%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: row; /* Stack links vertically */
  align-items: center;
  z-index: 10; /* Ensure it’s above the canvas */
  padding: 10px 20px;
  font-family: robotolight;
  color: white;
  text-decoration: none;
  margin: 0 10px;
  font-size: 18px;
}

#link-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: row; /* Stack links vertically */
  align-items: center;
  z-index: 10; /* Ensure it’s above the canvas */
  padding: 10px 20px;

}

#link-overlay a {
  color: white;
  text-decoration: none;
  margin: 0 10px;
  font-size: 18px;
  font-family: robotomedium;
}

#link-overlay a:hover {
  font-family: robotomediumi;
}

#copyright {
  position: fixed;
  top: 50%;
  right: 10%;
  transform: translate(70%, -50%);
  display: flex;
  flex-direction: row; /* Stack links vertically */
  align-items: center;
  z-index: 10; /* Ensure it’s above the canvas */
  padding: 10px 20px;
  font-family: robotolight;
  color: white;
  text-decoration: none;
  margin: 0 10px;
  font-size: 18px;
}

</style>