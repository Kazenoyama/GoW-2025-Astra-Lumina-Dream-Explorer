import * as BABYLON from '@babylonjs/core';
import { PhysicsManager } from "../physics/PhysicsManager";

export class PlayerControl {
    private playerSphere: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private physicsManager: PhysicsManager;
    private moveSpeed: number = 1.2; // Movement speed
    private jumpForce: number = 10;
    private canJump: boolean = true;
    private frictionForce: number = 0.95; // Friction coefficient
    private stopFrictionForce: number = 0.5;
    private keysPressed: Set<string> = new Set();
    private movementKeysReleased: boolean = true;
    private maxVelocity: number = 10; // Maximum horizontal velocity
    private stopThreshold: number = 0.3; // Threshold for complete player stop
    
    /**
     * Creates a new player control instance
     * @param scene The Babylon scene
     * @param physicsManager The physics manager instance
     */
    constructor(scene: BABYLON.Scene, physicsManager: PhysicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        
        this.playerSphere = this.scene.getMeshByName("sphere") as BABYLON.Mesh;
        this.setupPlayerControls();
        
        this.scene.registerBeforeRender(() => {
            this.checkGroundContact();
            this.updateMovementState();
            this.applyMovement();
            this.applyFriction();
            this.limitMaxVelocity(); 
        });
    }
    
    /**
     * Set up keyboard controls for the player
     */
    private setupPlayerControls(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    this.keysPressed.add(key);
                    
                    if (key === ' ' && this.canJump) {
                        const jumpImpulse = new BABYLON.Vector3(0, this.jumpForce, 0);
                        this.physicsManager.applyImpulse(this.playerSphere, jumpImpulse);
                        this.canJump = false;
                    }
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    this.keysPressed.delete(key);
                    break;
            }
        });
    }
    
    /**
     * Update movement state based on pressed keys
     */
    private updateMovementState(): void {
        this.movementKeysReleased = !(['z', 's', 'q', 'd'].some(key => this.keysPressed.has(key)));
    }
    
    /**
     * Apply movement based on key inputs
     */
    private applyMovement(): void {
        if (!this.playerSphere.physicsImpostor) return;
        
        const impulseDirection = new BABYLON.Vector3(0, 0, 0);
        
        if (this.keysPressed.has('z')) impulseDirection.z += this.moveSpeed;
        if (this.keysPressed.has('s')) impulseDirection.z -= this.moveSpeed;
        if (this.keysPressed.has('q')) impulseDirection.x -= this.moveSpeed;
        if (this.keysPressed.has('d')) impulseDirection.x += this.moveSpeed;
        
        if (impulseDirection.length() > 0) {
            const cameraRotationY = (this.scene.activeCamera as BABYLON.FreeCamera)?.rotation.y || 0;
            const rotationMatrix = BABYLON.Matrix.RotationY(cameraRotationY);
            const transformedImpulse = BABYLON.Vector3.TransformNormal(impulseDirection, rotationMatrix);
            
            this.physicsManager.applyImpulse(this.playerSphere, transformedImpulse);
        }
    }
    
    /**
     * Limit the maximum horizontal velocity of the player
     */
    private limitMaxVelocity(): void {
        // Limit maximum horizontal velocity
        if (this.playerSphere.physicsImpostor) {
            const velocity = this.playerSphere.physicsImpostor.getLinearVelocity();
            if (velocity) {
                const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                
                if (horizontalSpeed > this.maxVelocity) {
                    const scale = this.maxVelocity / horizontalSpeed;
                    velocity.x *= scale;
                    velocity.z *= scale;
                    this.playerSphere.physicsImpostor.setLinearVelocity(velocity);
                }
            }
        }
    }
    
    /**
     * Apply friction to slow down the player when on the ground
     */
    private applyFriction(): void {
        if (this.playerSphere.physicsImpostor && this.canJump) {
            const currentVelocity = this.playerSphere.physicsImpostor.getLinearVelocity();
            
            if (currentVelocity) {
                // Apply stronger friction when no movement keys are pressed
                const friction = this.movementKeysReleased ? this.stopFrictionForce : this.frictionForce;
                
                const horizontalVelocity = new BABYLON.Vector3(
                    currentVelocity.x * friction,
                    currentVelocity.y,
                    currentVelocity.z * friction
                );
                
                this.playerSphere.physicsImpostor.setLinearVelocity(horizontalVelocity);
                
                // Complete stop at threshold
                if (Math.abs(horizontalVelocity.x) < this.stopThreshold && 
                    Math.abs(horizontalVelocity.z) < this.stopThreshold && 
                    this.movementKeysReleased) {
                    horizontalVelocity.x = 0;
                    horizontalVelocity.z = 0;
                    this.playerSphere.physicsImpostor.setLinearVelocity(horizontalVelocity);
                }
            }
        }
    }
    
    /**
     * Check if the player is in contact with the ground
     */
    private checkGroundContact(): void {
        this.canJump = this.physicsManager.isGrounded(this.playerSphere);
    }
    
    /**
     * Get the player mesh
     * @returns The player mesh
     */
    public getPlayerMesh(): BABYLON.Mesh {
        return this.playerSphere;
    }
}