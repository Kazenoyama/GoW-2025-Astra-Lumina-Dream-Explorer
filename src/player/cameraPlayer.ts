import * as BABYLON from '@babylonjs/core';
import { PlayerControl } from './PlayerControl';

export class CameraPlayer {
    private camera: BABYLON.FreeCamera;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private playerControl: PlayerControl;
    private keysPressed: { [key: string]: boolean } = {};
    private targetRotation: number | null = null;
    private rotationSpeed: number = 0.05; 
    
    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, playerControl: PlayerControl) {
        this.scene = scene;
        this.canvas = canvas;
        this.playerControl = playerControl;
        
        // Create a camera that follows the player
        this.camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 3, -5), this.scene);
        this.camera.attachControl(this.canvas, true);
        
        // Set up input handling (ONLY ONCE, not every frame)
        this.setupInputHandling();
        
        // Update camera position on each frame
        this.scene.registerBeforeRender(() => {
            this.updateCamera();
        });
    }
    
    private setupInputHandling(): void {
        window.addEventListener('keydown', (event) => {
            this.keysPressed[event.key.toLowerCase()] = true;
        });       
        window.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toLowerCase()] = false;
        });
    }
    private updateCamera(): void {
        const playerMesh = this.playerControl.getPlayerMesh();
        if (playerMesh) {
            // Handle rotation based on key state - only when no rotation is in progress
            if (this.targetRotation === null) {
                if (this.keysPressed['a']) {
                    this.targetRotation = this.normalizeAngle(this.camera.rotation.y + Math.PI/2);
                    // Temporarily ignore the key until it's released and pressed again
                    this.keysPressed['a'] = false;
                }
                
                if (this.keysPressed['e']) {
                    this.targetRotation = this.normalizeAngle(this.camera.rotation.y - Math.PI/2);
                    // Temporarily ignore the key until it's released and pressed again
                    this.keysPressed['e'] = false;
                    
                }
            }
            
            // If we have a target rotation, move towards it
            if (this.targetRotation !== null) {
                // Normalize current rotation
                const normalizedCurrentRotation = this.normalizeAngle(this.camera.rotation.y);
                
                // Find the shortest path to rotate (clockwise or counterclockwise)
                let angleDifference = this.targetRotation - normalizedCurrentRotation;
                
                // Ensure we take the shortest path around the circle
                if (angleDifference > Math.PI) {
                    angleDifference -= 2 * Math.PI;
                } else if (angleDifference < -Math.PI) {
                    angleDifference += 2 * Math.PI;
                }
                
                if (Math.abs(angleDifference) < this.rotationSpeed) {
                    // We're close enough, snap to the exact rotation
                    this.camera.rotation.y = this.targetRotation;
                    this.targetRotation = null; // Reset the target
                } else if (angleDifference > 0) {
                    this.camera.rotation.y += this.rotationSpeed;
                } else {
                    this.camera.rotation.y -= this.rotationSpeed;
                }
                
                // Normalize the camera rotation after changes
                this.camera.rotation.y = this.normalizeAngle(this.camera.rotation.y);
            }
    
            // Create an offset vector based on the current camera rotation
            const distance = 5;
            const height = 3;
            
            // Apply rotation to calculate the camera position in a circle around the player
            const offsetX = Math.sin(this.camera.rotation.y) * distance;
            const offsetZ = Math.cos(this.camera.rotation.y) * distance;
            
            // Position camera based on player position and rotated offset
            this.camera.position.x = playerMesh.position.x - offsetX;
            this.camera.position.y = playerMesh.position.y + height;
            this.camera.position.z = playerMesh.position.z - offsetZ;
            
            // Always look at the player
            this.camera.setTarget(playerMesh.position);
        }
    }
    
    // Add this utility method to normalize angles between -π and π
    private normalizeAngle(angle: number): number {
        // Keep the angle between -π and π
        while (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    }
    
    // Add this new method to expose the camera
    public getCamera(): BABYLON.FreeCamera {
        return this.camera;
    }
}