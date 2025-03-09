import * as BABYLON from '@babylonjs/core';

export class PlayerControl {
    private playerSphere: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private moveSpeed: number = 0.1;
    
    
    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        
        // Get the existing sphere from the scene
        this.playerSphere = this.scene.getMeshByName("sphere") as BABYLON.Mesh;
        this.setupPlayerControls();
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
        switch (key.toLowerCase()) {
            case 'z': // Forward
                this.playerSphere.position.z += this.moveSpeed;
                break;
            case 's': // Backward
                this.playerSphere.position.z -= this.moveSpeed;
                break;
            case 'q': // Left
                this.playerSphere.position.x -= this.moveSpeed;
                break;
            case 'd': // Right
                this.playerSphere.position.x += this.moveSpeed;
                break;
        }
    }
    
    public getPlayerMesh(): BABYLON.Mesh {
        return this.playerSphere;
    }
}