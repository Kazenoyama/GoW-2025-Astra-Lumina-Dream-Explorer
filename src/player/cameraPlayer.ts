import * as BABYLON from '@babylonjs/core';
import { PlayerControl } from './PlayerControl';

export class CameraPlayer {
    private camera: BABYLON.FreeCamera;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private playerControl: PlayerControl;
    private keysPressed: { [key: string]: boolean } = {};
    
    // Variables for mouse camera control
    private isPointerLocked: boolean = false;
    private mouseSensitivity: number = 0.002; // Mouse sensitivity
    private previousMouseX: number = 0;
    private cameraHeight: number = 2; // Camera height (reduced from previous value of 3)
    private cameraDistance: number = 4.5; // Adjusted distance (previously 5)
    
    /**
     * Creates a new camera controller that follows the player
     * @param scene The Babylon scene
     * @param canvas The HTML canvas element
     * @param playerControl The player control instance
     */
    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, playerControl: PlayerControl) {
        this.scene = scene;
        this.canvas = canvas;
        this.playerControl = playerControl;
        
        // Create camera that follows the player
        this.camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 2, -4.5), this.scene);
        this.camera.attachControl(this.canvas, true);
        
        // Disable default camera controls
        this.camera.inputs.clear();
        
        // Set up input handling
        this.setupInputHandling();
        
        // Update camera position on each frame
        this.scene.registerBeforeRender(() => {
            this.updateCamera();
        });
    }
    
    /**
     * Set up keyboard and mouse input handling
     */
    private setupInputHandling(): void {
        // Handle keyboard inputs (for other functions if needed)
        window.addEventListener('keydown', (event) => {
            this.keysPressed[event.key.toLowerCase()] = true;
        });       
        window.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toLowerCase()] = false;
        });
        
        // Set up pointer lock for mouse camera control
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.canvas.requestPointerLock = this.canvas.requestPointerLock || 
                                               (this.canvas as any).mozRequestPointerLock ||
                                               (this.canvas as any).webkitRequestPointerLock;
                this.canvas.requestPointerLock();
            }
        });
        
        // Event to detect pointer lock state
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
            this.previousMouseX = 0; // Reset previous position
        });
        
        // Handle mouse movement for camera rotation
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                // Horizontal mouse movement for rotation
                const deltaX = event.movementX || 0;
                
                // Apply rotation based on mouse movement
                this.camera.rotation.y += deltaX * this.mouseSensitivity;
                
                // Normalize rotation angle
                this.camera.rotation.y = this.normalizeAngle(this.camera.rotation.y);
            }
        });
    }
    
    /**
     * Update camera position to follow player
     */
    private updateCamera(): void {
        const playerMesh = this.playerControl.getPlayerMesh();
        if (playerMesh) {
            // Create offset vector based on current camera rotation
            const offsetX = Math.sin(this.camera.rotation.y) * this.cameraDistance;
            const offsetZ = Math.cos(this.camera.rotation.y) * this.cameraDistance;
            
            // Position camera based on player position and calculated offset
            this.camera.position.x = playerMesh.position.x - offsetX;
            this.camera.position.y = playerMesh.position.y + this.cameraHeight;
            this.camera.position.z = playerMesh.position.z - offsetZ;
            
            // Always look at the player
            this.camera.setTarget(playerMesh.position);
        }
    }
    
    /**
     * Utility method to normalize angles between -π and π
     * @param angle The angle to normalize in radians
     * @returns Normalized angle
     */
    private normalizeAngle(angle: number): number {
        // Keep angle between -π and π
        while (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    }
    
    /**
     * Get the camera instance
     * @returns The free camera instance
     */
    public getCamera(): BABYLON.FreeCamera {
        return this.camera;
    }
}