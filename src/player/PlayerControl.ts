import * as BABYLON from '@babylonjs/core';
import { Scene, Mesh, Ray, Vector3 } from '@babylonjs/core';

export class PlayerControl {
    private playerSphere: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private moveSpeed: number = 1.2; // Movement speed
    private glideSpeed: number = 0.8; // Gliding horizontal speed multiplier
    private glideFallRate: number = 0.3; // Reduced falling speed when gliding 
    private isGrounded: boolean = true;
    private isGliding: boolean = false; // Track gliding state
    private airTime: number = 0; // Track time spent in air
    private glideActivationTime: number = 0.5; // Seconds in air before glide activates
    private frictionForce: number = 0.95; // Friction coefficient
    private stopFrictionForce: number = 0.5;
    private keysPressed: Set<string> = new Set();
    private movementKeysReleased: boolean = true;
    private maxVelocity: number = 10; // Maximum horizontal velocity
    private maxGlideVelocity: number = 6.5; // Maximum horizontal velocity while gliding
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
            this.updateGlideState();
            this.updateMovementState();
            this.applyMovement();
            this.applyFriction();
            this.applyGlide();
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
     * Update gliding state based on air time
     */
    private updateGlideState(): void {
        // If on ground, reset air time and disable glide
        if (this.isGrounded) {
            this.airTime = 0;
            if (this.isGliding) {
                this.isGliding = false;
                console.log("Gliding deactivated - landed");
            }
            return;
        }
        
        // If in air, increment air time
        this.airTime += this.scene.getEngine().getDeltaTime() / 1000; // Convert to seconds
        
        // Activate glide after being in air for a certain time
        if (!this.isGliding && this.airTime >= this.glideActivationTime) {
            this.isGliding = true;
            console.log("Auto-gliding activated after " + this.airTime.toFixed(2) + "s in air");
        }
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
            
            // During gliding, increase horizontal movement capability
            if (this.isGliding) {
                transformedImpulse.scaleInPlace(this.glideSpeed);
            }
            
            this.applyImpulse(transformedImpulse);
        }
    }
    
    /**
     * Apply glide physics when gliding
     */
    private applyGlide(): void {
        if (!this.playerSphere.physicsBody || this.isGrounded) return;
        
        if (this.isGliding) {
            const currentVelocity = this.playerSphere.physicsBody.getLinearVelocity();
            if (currentVelocity) {
                // Only reduce fall speed, not rising speed
                if (currentVelocity.y < 0) {
                    currentVelocity.y *= this.glideFallRate;
                    this.playerSphere.physicsBody.setLinearVelocity(currentVelocity);
                }
            }
            
            // Visual feedback for gliding
            this.updateGlideVisuals(true);
        } else {
            // Remove visual feedback when not gliding
            this.updateGlideVisuals(false);
        }
    }
    
    /**
     * Update the visual appearance of the player based on glide state
     */
    private updateGlideVisuals(isGliding: boolean): void {
        if (!this.playerSphere.material) {
            this.createPlayerMaterial();
        }
        
        const material = this.playerSphere.material as BABYLON.StandardMaterial;
        if (material) {
            if (isGliding) {
                // Save original emissive color if not saved yet
                if (!this.playerSphere.metadata) {
                    this.playerSphere.metadata = {};
                }
                
                if (!this.playerSphere.metadata.originalEmissive) {
                    this.playerSphere.metadata.originalEmissive = material.emissiveColor?.clone() || new BABYLON.Color3(0, 0, 0);
                }
                
                // Apply glide effect
                material.emissiveColor = new BABYLON.Color3(0.3, 0.5, 0.8);
            } else if (this.playerSphere.metadata?.originalEmissive) {
                // Restore original appearance
                material.emissiveColor = this.playerSphere.metadata.originalEmissive;
            }
        }
    }
    
    /**
     * Create a material for the player if none exists
     */
    private createPlayerMaterial(): void {
        const material = new BABYLON.StandardMaterial("playerMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        this.playerSphere.material = material;
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
        if (this.playerSphere.physicsBody) {
            const velocity = this.playerSphere.physicsBody.getLinearVelocity();
            if (velocity) {
                const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                // Use higher max velocity during gliding
                const maxVel = this.isGliding ? this.maxGlideVelocity : this.maxVelocity;
                
                if (horizontalSpeed > maxVel) {
                    const scale = maxVel / horizontalSpeed;
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
        if (this.playerSphere.physicsBody && this.isGrounded) {
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
        
        // Update ground state
        this.isGrounded = !!hit?.hit;
    }
    
    /**
     * Get the player mesh
     * @returns The player mesh
     */
    public getPlayerMesh(): BABYLON.Mesh {
        return this.playerSphere;
    }
}