import * as BABYLON from "@babylonjs/core";
import { CameraPlayer } from "./player/cameraPlayer";
import { PlayerControl } from "./player/PlayerControl";

class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new BABYLON.Scene(engine);
        
        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;
        
        // Our built-in 'sphere' shape. Params: name, options, scene
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;
        
        // Our built-in 'ground' shape. Params: name, options, scene
        //@ts-ignore
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
        
        // Create the player controller
        const playerControl = new PlayerControl(scene);
        
        // Create the camera controller
        const cameraPlayer = new CameraPlayer(scene, canvas, playerControl);
        
        // Make this camera the active camera for the scene
        scene.activeCamera = cameraPlayer.getCamera();
        
        return scene;
    }
}

export { Playground };