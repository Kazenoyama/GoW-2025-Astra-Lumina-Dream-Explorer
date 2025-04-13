import { CannonJSPlugin, PhysicsImpostor,Scene,Vector3,AbstractMesh,Mesh,MeshBuilder, Ray} from '@babylonjs/core';

import * as CANNON from 'cannon';

// Make CANNON available globally for the physics plugin
(window as any).CANNON = CANNON;

export class PhysicsManager {
    private scene: Scene;
    private physicsPlugin: CannonJSPlugin; 
    private gravity: Vector3;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.gravity = new Vector3(0, -9.81, 0);
        this.physicsPlugin = new CannonJSPlugin();
    }
    
    /**
     * Initialize the physics engine with the scene
     */
    public initialize(): void {
        this.scene.enablePhysics(this.gravity, this.physicsPlugin);
        console.log("Physics engine initialized with Cannon.js");
    }
    
    /**
     * Add a physics impostor to a mesh
     * @param mesh The mesh to add physics to
     * @param type The type of physics impostor
     * @param options The physics options
     */
    public addImpostor(mesh: AbstractMesh, type: number, options: { mass: number, restitution?: number, friction?: number }): void {mesh.physicsImpostor = new PhysicsImpostor
        (
            mesh,
            type,
            options,
            this.scene
        );
    }
    
    /**
     * Apply an impulse to a physics-enabled mesh
     * @param mesh The mesh to apply the impulse to
     * @param direction The direction vector of the impulse
     * @param contactPoint The point of contact (default: mesh position)
     */
    public applyImpulse(mesh: AbstractMesh,direction: Vector3,contactPoint?: Vector3): void 
    {
        if (mesh.physicsImpostor) {
            mesh.physicsImpostor.applyImpulse(direction,contactPoint || mesh.position);
        }
    }
    
    /**
     * Check if a mesh is in contact with the ground
     * @param mesh The mesh to check
     * @param groundName The name of the ground mesh
     * @param distance The distance to check from the mesh
     */
    public isGrounded(mesh: AbstractMesh, groundName: string = "ground", distance: number = 1.5): boolean {
        const origin = mesh.position.clone();
        
        
        const rayStart = new Vector3(origin.x, origin.y + 0.1, origin.z);
        const direction = new Vector3(0, -1, 0);
        const ray = new Ray(rayStart, direction, distance);
        const hit = this.scene.pickWithRay(ray);
        
       
        return !!hit?.hit;
    }
    
    /**
     * Create a physics-enabled ground
     * @param name The name of the ground mesh
     * @param options The ground creation options
     * @param physicsOptions The physics options
     */
    public createGround(name: string = "ground", options: { width: number, height: number } = { width: 200, height: 20 },physicsOptions: { mass: number, restitution: number, friction: number } = { mass: 0, restitution: 0.3, friction: 0.3 }): Mesh
     {
        const ground = MeshBuilder.CreateGround(name, options, this.scene);
        this.addImpostor(ground, PhysicsImpostor.BoxImpostor, physicsOptions);
        return ground;
    }
    
    /**
     * Get the physics plugin
     */
    public getPhysicsPlugin(): CannonJSPlugin {
        return this.physicsPlugin;
    }
}