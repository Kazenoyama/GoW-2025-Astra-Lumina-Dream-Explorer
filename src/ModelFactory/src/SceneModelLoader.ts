import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { Scene, AppendSceneAsync, LoadSceneAsync} from "@babylonjs/core";
import { ModelEnum } from "./ModelEnum";

/**
 * ModelLoader is a class that handles loading 3D models into a Babylon.js scene.
 */
export class SceneModelLoader {
    scene: Scene;

    constructor(Scene: Scene) {
        this.scene = Scene;
        registerBuiltInLoaders();
    }

    async appendSceneFromPath(modelEnum:ModelEnum): Promise<void> {
        try {
            await AppendSceneAsync(modelEnum, this.scene);
        } catch (error) {
            throw new Error(`Failed to load model from ${modelEnum}: ${error}`);
        }
    }

    async loadSceneFromPath(modelEnum: ModelEnum): Promise<void> {
        try {
            await LoadSceneAsync(modelEnum, this.scene.getEngine());
        } catch (error) {
            throw new Error(`Failed to load model from ${modelEnum}: ${error}`);
        }
    }
}