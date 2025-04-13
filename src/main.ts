import * as BABYLON from "@babylonjs/core";
import { Playground } from "./Playground";

var canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
var engine = new BABYLON.Engine(canvas, true);

// Handle async scene creation correctly
Playground.CreateScene(engine, canvas).then(scene => {
  engine.runRenderLoop(() => {
    scene.render();
  });
});

window.addEventListener("resize", () => {
  engine.resize();
});
