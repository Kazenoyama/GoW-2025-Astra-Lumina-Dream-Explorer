import * as BABYLON from "@babylonjs/core";
import { Playground } from "./Playground";



var canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
var engine = new BABYLON.Engine(canvas, true);

const scene = Playground.CreateScene(engine, canvas);
engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
