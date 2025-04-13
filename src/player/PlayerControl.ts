import * as BABYLON from '@babylonjs/core';
import { Scene, Mesh, Ray, Vector3 } from '@babylonjs/core';

export class PlayerControl {
    private playerSphere: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private moveSpeed: number = 1.2; // Movement speed
    private jumpForce: number = 10;
    private canJump: boolean = true;
    private isJumping: boolean = false; // New variable to track jump state
    private frictionForce: number = 0.95; // Friction coefficient
    private stopFrictionForce: number = 0.5;
    private keysPressed: Set<string> = new Set();
    private movementKeysReleased: boolean = true;
    private maxVelocity: number = 10; // Maximum horizontal velocity
    private stopThreshold: number = 0.3; // Threshold for complete player stop
    
    /**
     * Creates a new player control instance
     * @param scene The Babylon scene
     * @param playerSphere The player sphere mesh
     */
    constructor(scene: Scene, playerSphere: Mesh) {
        this.scene = scene;
        this.playerSphere = playerSphere;
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
            const keyEvent = kbInfo.event;
            const key = keyEvent.key.toLowerCase();
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    this.keysPressed.add(key);
                    // Check if it's spacebar AND player can jump AND is not currently jumping
                    if ((key === ' ' || keyEvent.code === 'Space') && this.canJump && !this.isJumping) {
                        const jumpImpulse = new Vector3(0, this.jumpForce, 0);
                        this.applyImpulse(jumpImpulse);
                        this.canJump = false;
                        this.isJumping = true; // Set jumping state to true
                        console.log("Jump initiated!");
                    }
                    break;
                    
                case BABYLON.KeyboardEventTypes.KEYUP:
                    this.keysPressed.delete(key);
                    
                    // Reset jumping state when spacebar is released
                    if (key === ' ' || keyEvent.code === 'Space') {
                        this.isJumping = false;
                        console.log("Space released, can jump again when on ground");
                    }
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
        if (!this.playerSphere.physicsBody) return;
        const impulseDirection = new Vector3(0, 0, 0);
        if (this.keysPressed.has('z')) impulseDirection.z += this.moveSpeed;
        if (this.keysPressed.has('s')) impulseDirection.z -= this.moveSpeed;
        if (this.keysPressed.has('q')) impulseDirection.x -= this.moveSpeed;
        if (this.keysPressed.has('d')) impulseDirection.x += this.moveSpeed;
        if (impulseDirection.length() > 0) {
            const cameraRotationY = (this.scene.activeCamera as BABYLON.FreeCamera)?.rotation.y || 0;
            const rotationMatrix = BABYLON.Matrix.RotationY(cameraRotationY);
            const transformedImpulse = Vector3.TransformNormal(impulseDirection, rotationMatrix);
            this.applyImpulse(transformedImpulse);
        }
    }
    
    /**
     * Apply an impulse to the player
     * @param direction The direction vector of the impulse
     */
    private applyImpulse(direction: Vector3): void {
        if (this.playerSphere.physicsBody) {
            this.playerSphere.physicsBody.applyImpulse(direction, this.playerSphere.getAbsolutePosition());
        }
    }

    /**
     * Limit the maximum horizontal velocity of the player
     */
    private limitMaxVelocity(): void {
        // Limit maximum horizontal velocity
        if (this.playerSphere.physicsBody) {
            const velocity = this.playerSphere.physicsBody.getLinearVelocity();
            if (velocity) {
                const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                if (horizontalSpeed > this.maxVelocity) {
                    const scale = this.maxVelocity / horizontalSpeed;
                    velocity.x *= scale;
                    velocity.z *= scale;
                    this.playerSphere.physicsBody.setLinearVelocity(velocity);
                }
            }
        }
    }
    
    /**
     * Apply friction to slow down the player when on the ground
     */
    private applyFriction(): void {
        if (this.playerSphere.physicsBody && this.canJump) {
            const currentVelocity = this.playerSphere.physicsBody.getLinearVelocity();
            if (currentVelocity) {
                // Apply stronger friction when no movement keys are pressed
                const friction = this.movementKeysReleased ? this.stopFrictionForce : this.frictionForce;
                const horizontalVelocity = new Vector3(
                    currentVelocity.x * friction,
                    currentVelocity.y,
                    currentVelocity.z * friction
                );
                
                this.playerSphere.physicsBody.setLinearVelocity(horizontalVelocity);
                
                // Complete stop at threshold
                if (Math.abs(horizontalVelocity.x) < this.stopThreshold && 
                    Math.abs(horizontalVelocity.z) < this.stopThreshold && 
                    this.movementKeysReleased) {
                        horizontalVelocity.x = 0;
                        horizontalVelocity.z = 0;
                        this.playerSphere.physicsBody.setLinearVelocity(horizontalVelocity);
                }
            }
        }
    }
    
    /**
     * Check if the player is in contact with the ground
     */
    private checkGroundContact(): void {
        // Cast a ray downward from the player sphere
        const origin = this.playerSphere.position.clone();
        const rayStart = new Vector3(origin.x, origin.y + 0.2, origin.z);
        const direction = new Vector3(0, -1, 0);
        const ray = new Ray(rayStart, direction, 1.5); // Ray length slightly larger than radius
        const hit = this.scene.pickWithRay(ray);
        
        this.canJump = !!hit?.hit;
    }
    
    /**
     * Get the player mesh
     * @returns The player mesh
     */
    public getPlayerMesh(): BABYLON.Mesh {
        return this.playerSphere;
    }
    
    private setupInputs() {
        // Your input control setup code...
    }
}