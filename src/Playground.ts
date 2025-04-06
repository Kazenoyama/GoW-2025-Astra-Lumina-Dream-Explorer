import * as BABYLON from "@babylonjs/core";
import { CameraPlayer } from "./player/cameraPlayer";
import { PlayerControl } from "./player/PlayerControl";
import { PhysicsManager } from "./physics/PhysicsManager";

class Playground {
    public static async CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): Promise<BABYLON.Scene> {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new BABYLON.Scene(engine);
        
        // Initialize physics
        const physicsManager = new PhysicsManager(scene);
        physicsManager.initialize();
        
        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;
        
        // Our built-in 'sphere' shape. Params: name, options, scene
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
        // Move the sphere upward 1/2 its height
        sphere.position.y = 4; // Start higher to see the physics in action
        
        // Add physics imposter to the sphere
        physicsManager.addImpostor(
            sphere, 
            BABYLON.PhysicsImpostor.SphereImpostor, 
            { mass: 1, restitution: 0.7, friction: 0.5 }
        );
        
        // Create ground using the physics manager
        physicsManager.createGround();
        
        // Create the player controller with physics manager
        const playerControl = new PlayerControl(scene, physicsManager);
        
        // Create the camera controller
        const cameraPlayer = new CameraPlayer(scene, canvas, playerControl);
        
        // Make this camera the active camera for the scene
        scene.activeCamera = cameraPlayer.getCamera();
        
        return scene;
    }
}

export { Playground };