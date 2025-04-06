import * as BABYLON from '@babylonjs/core';
import { PhysicsManager } from "../physics/PhysicsManager";

export class PlayerControl {
    private playerSphere: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private physicsManager: PhysicsManager;
    private moveSpeed: number = 2;
    private jumpForce: number = 10;
    private canJump: boolean = true;
    
    constructor(scene: BABYLON.Scene, physicsManager: PhysicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        
        // Get the existing sphere from the scene
        this.playerSphere = this.scene.getMeshByName("sphere") as BABYLON.Mesh;
        this.setupPlayerControls();
        
        // Check for ground contact to enable jumping
        this.scene.registerBeforeRender(() => {
            this.checkGroundContact();
        });
    }
    
    private setupPlayerControls(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    this.handleKeyDown(kbInfo.event.key);
                    break;
            }
        });
    }
    
    private handleKeyDown(key: string): void {
        // Check if sphere has physics imposter
        if (!this.playerSphere.physicsImpostor) return;
        
        const impulseDirection = new BABYLON.Vector3(0, 0, 0);
        
        switch (key.toLowerCase()) {
            case 'z': // Forward
                impulseDirection.z = this.moveSpeed;
                break;
            case 's': // Backward
                impulseDirection.z = -this.moveSpeed;
                break;
            case 'q': // Left
                impulseDirection.x = -this.moveSpeed;
                break;
            case 'd': // Right
                impulseDirection.x = this.moveSpeed;
                break;
            case ' ': // Space for jump
                if (this.canJump) {
                    impulseDirection.y = this.jumpForce;
                    this.canJump = false;
                }
                break;
        }
        
        if (impulseDirection.length() > 0) {
            // Apply impulse in the direction of the camera's forward
            const cameraRotationY = (this.scene.activeCamera as BABYLON.FreeCamera)?.rotation.y || 0;
            
            // Create a rotation matrix from the camera Y rotation
            const rotationMatrix = BABYLON.Matrix.RotationY(cameraRotationY);
            
            // Transform the impulse direction by the rotation matrix
            const transformedImpulse = BABYLON.Vector3.TransformNormal(impulseDirection, rotationMatrix);
            
            // Apply the impulse using the physics manager
            this.physicsManager.applyImpulse(this.playerSphere, transformedImpulse);
        }
    }
    
    private checkGroundContact(): void {
        this.canJump = this.physicsManager.isGrounded(this.playerSphere);
    }
    
    public getPlayerMesh(): BABYLON.Mesh {
        return this.playerSphere;
    }
}