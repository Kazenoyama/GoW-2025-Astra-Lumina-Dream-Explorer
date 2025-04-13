import { Scene, Engine, Vector3, HemisphericLight, MeshBuilder, TransformNode, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin"; 

import { ModelEnum } from "../ModelFactory/src/ModelEnum";
import { SceneModelLoader } from "../ModelFactory/src/SceneModelLoader";
import { CameraPlayer } from "../player/cameraPlayer";
import { PlayerControl } from "../player/PlayerControl";

// Declare global HavokPhysics for proper TypeScript recognition
declare const HavokPhysics: () => Promise<any>;

export class BasicScene extends Scene {
    private _isInitialized = false;
    
    constructor(engine: Engine) {
        super(engine);
        
    }
 
    public async createScene() {
        // Éviter la double initialisation
        if (this._isInitialized) {
            return this;
        }
        this._isInitialized = true;
        
        // 1. Create light
        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this);
        light.intensity = 0.7;
        
        // 2. Initialize Havok physics
        console.log("Initializing Havok physics...");
        try {
            const havokInstance = await HavokPhysics();
            const havokPlugin = new HavokPlugin(true, havokInstance);
            
            // 3. Enable physics in the scene with gravity
            this.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
            console.log("Physics enabled successfully");
        } catch (error) {
            console.error("Failed to initialize Havok physics:", error);
            throw new Error("Physics initialization failed");
        }
        
        // 4. Load the map
        console.log("Loading map...");
        const modelLoader = new SceneModelLoader(this);
        await modelLoader.appendSceneFromPath(ModelEnum.MAP);
        console.log("Map loaded successfully");
        
        // 5. Find all ground/static meshes
        console.log("Finding static meshes for physics...");
        const staticMeshes = this.meshes.filter(mesh => 
            // Filter for potential ground/static elements based on naming or position
            mesh.name.toLowerCase().includes("ground") || 
            mesh.name.toLowerCase().includes("floor") || 
            mesh.name.toLowerCase().includes("world") ||
            mesh.name.toLowerCase().includes("terrain") ||
            (mesh.parent && mesh.parent instanceof TransformNode && mesh.position.y < 0.5)
        );

        console.log(`Found ${staticMeshes.length} potential static meshes`);
        
        // 6. Add physics to all static meshes using PhysicsAggregate
        let mapHeight = 0;
        for (const mesh of staticMeshes) {
            try {
                // Create a static physics aggregate for each mesh
                new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0.3, friction: 0.3 }, this);
                
                // Track the highest point of any static mesh
                const boundingInfo = mesh.getBoundingInfo();
                const meshHeight = boundingInfo.maximum.y;
                if (meshHeight > mapHeight) {
                    mapHeight = meshHeight;
                }
                
                console.log(`Added physics to: ${mesh.name}`);
            } catch (error) {
                console.error(`Failed to add physics to ${mesh.name}:`, error);
            }
        }
        
        // Fallback height if no static meshes found
        if (mapHeight === 0) mapHeight = 5;
        console.log(`Using map height: ${mapHeight}`);
        
        // 7. Create the player sphere
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, this);
        sphere.position.y = mapHeight + 5; 
        
        // 8. Add physics to the sphere using PhysicsAggregate
        let sphereAggregate;
        try {
            // The sphere will be dynamic with mass of 1
            sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { 
                mass: 1, 
                restitution: 0.4, 
                friction: 0.5 
            }, this);
            console.log("Added physics to player sphere");
        } catch (error) {
            console.error("Failed to add physics to sphere:", error);
            // Create a fallback if physics failed
            console.warn("Using fallback sphere without physics");
        }
        
        // 9. Setup player control and camera
        const playerControl = new PlayerControl(this, sphere);
        const canvas = this.getEngine().getRenderingCanvas();
        if (!canvas) {
            throw new Error("Canvas is null, cannot initialize CameraPlayer");
        }
        const cameraPlayer = new CameraPlayer(this, canvas, playerControl);
        this.activeCamera = cameraPlayer.getCamera();
        
        // 10. Add inspector shortcut
        this.addInspector();
        // 11. Wait for scene to be fully ready
        await new Promise<void>((resolve) => {
            this.executeWhenReady(() => {
                console.log("Scene is fully ready");
                resolve();
            });
        });
        
        return this;
    }
 
    private addInspector() {
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this.debugLayer.isVisible()) {
                    this.debugLayer.hide();
                } else {
                    this.debugLayer.show();
                }
            }
        });
    }
}