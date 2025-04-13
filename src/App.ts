import { Engine, Scene, ArcRotateCamera, Vector3} from "@babylonjs/core";
 import { BasicScene } from "./Scene/BasicScene";
 class App {
     private canvas: HTMLCanvasElement
     private engine: Engine;
     private scene: Scene;
 
     constructor() {
         this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
         this.engine = new Engine(this.canvas, true);
         this.scene = new BasicScene(this.engine);
         this.initCamera();
         this.runMainRenderLoop();
     }
 
     private initCamera() {
         var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this.scene);
         camera.attachControl(this.canvas, true);
     }
 
     private runMainRenderLoop() {
         this.engine.runRenderLoop(() => {
             this.scene.render();
         });
     }
 }
 
 new App();