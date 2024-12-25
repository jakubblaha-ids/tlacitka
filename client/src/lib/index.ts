import { ButtonClientObserver } from "./ButtonClientObserver";
import { GameStateManager } from "./GameStateManager";

export const gameStateManager = new GameStateManager();
export const buttonClientObserver = new ButtonClientObserver(gameStateManager);
