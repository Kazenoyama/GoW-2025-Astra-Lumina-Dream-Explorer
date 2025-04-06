import * as BABYLON from "babylonjs";

// Create the Babylon.js scene
var canvas = document.getElementById("renderCanvas");
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("renderCanvas is not a valid HTMLCanvasElement");
}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, -10), scene);
camera.setTarget(BABYLON.Vector3.Zero());
camera.attachControl(canvas, true);
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
light.intensity = 0.7;

// Create a textured ground or world
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
groundMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // Set the ground color to blue
groundMaterial.diffuseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grass.png", scene); // Assign a valid texture
ground.material = groundMaterial;

// Create the player (just a simple sphere for now)
const player = BABYLON.MeshBuilder.CreateSphere("player", { diameter: 1 }, scene);
player.position.y = 1; // Slightly above ground

// Create a dynamic texture to track visited areas
const dynamicTexture = new BABYLON.DynamicTexture("dynamicTexture", { width: 512, height: 512 }, scene, false);
const dynamicContext = dynamicTexture.getContext();
dynamicContext.fillStyle = "black";
dynamicContext.fillRect(0, 0, 512, 512);
dynamicTexture.update();

// Create the shader material
const shaderMaterial = new BABYLON.ShaderMaterial("colorRevealShader", scene, {
    vertexSource: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        varying vec2 vUV;
        uniform mat4 worldViewProjection;
        void main() {
            vUV = uv;
            gl_Position = worldViewProjection * vec4(position, 1.0);
        }
    `,
    fragmentSource: `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        uniform sampler2D visitedTexture;

        vec3 toGrayscale(vec3 color) {
            float gray = dot(color, vec3(0.3, 0.59, 0.11)); // Standard grayscale conversion
            return vec3(gray);
        }

        void main() {
            vec3 color = texture2D(textureSampler, vUV).rgb;
            float visited = texture2D(visitedTexture, vUV).r; // Check if the area is visited
            vec3 grayscaleColor = toGrayscale(color); // Convert to grayscale
            color = vec3(color.r == 1.0 && color.g == 0.0 && color.b == 0.0 ? 1.0 : color.r, color.g, color.b); // Replace red with white
            vec3 finalColor = mix(grayscaleColor, color, visited); // Blend based on visited areas
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
}, {
    attributes: ["position", "uv"],
    uniforms: ["worldViewProjection", "textureSampler", "visitedTexture"]
});

// Apply shader to the ground
shaderMaterial.setTexture("textureSampler", groundMaterial.diffuseTexture);
shaderMaterial.setTexture("visitedTexture", dynamicTexture);
ground.material = shaderMaterial;

// Update the dynamic texture as the player moves
scene.registerBeforeRender(() => {
    const x = Math.floor((player.position.x + 5) / 10 * 512); // Map world position to texture coordinates
    const z = Math.floor((5 - player.position.z) / 10 * 512); // Corrected to account for inverted z direction

    dynamicContext.fillStyle = "white";
    dynamicContext.beginPath();
    dynamicContext.arc(x, z, 100, 0, 2 * Math.PI); // Mark the area as visited
    dynamicContext.fill();
    dynamicTexture.update();
});

// Move the player with arrow keys (simple controls)
scene.onKeyboardObservable.add((kbInfo) => {
    switch (kbInfo.event.key) {
        case "s": player.position.z -= 0.2; break;
        case "z": player.position.z += 0.2; break;
        case "q": player.position.x -= 0.2; break;
        case "d": player.position.x += 0.2; break;
    }
});

// Render loop
engine.runRenderLoop(() => {
    scene.render();
});

// Handle window resize
window.addEventListener("resize", () => {
    engine.resize();
});
