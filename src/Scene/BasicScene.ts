import { Scene, Engine, Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";
import { addKeyboardControlsOnSceneToMesh } from "./InputController";
import { ModelEnum } from "../ModelFactory/src/ModelEnum";
import { SceneModelLoader } from "../ModelFactory/src/SceneModelLoader";

 export class BasicScene extends Scene {
 
     constructor(engine: Engine) {
         super(engine);
         this.createScene();
     }
 
     public async createScene() {
         this.initLight();
         var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this);
         var modelLoader: SceneModelLoader = new SceneModelLoader(this);
        await modelLoader.appendSceneFromPath(ModelEnum.MAP);
         this.addInspector();
         addKeyboardControlsOnSceneToMesh(this, sphere);
     }
 
     private initLight() {
         var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this);
     }
 
     private addInspector() {
         window.addEventListener("keydown", (ev) => {
             // Shift+Ctrl+Alt+I
             if (isShiftCtrlAltIPressed(ev)) {
                 if (this.debugLayer.isVisible()) {
                     this.debugLayer.hide();
                 } else {
                     this.debugLayer.show();
                 }
             }
         });
 
         function isShiftCtrlAltIPressed(ev: KeyboardEvent) {
             return ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73;
         }
     }
}