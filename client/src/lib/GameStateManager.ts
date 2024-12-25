import { get, writable } from "svelte/store";

const colorPool = ["red", "green", "blue", "tomato", "purple", "orange"];

type PlayerRecord = {
    id: string;
    color: string;
};

export class GameStateManager {
    pressedOrderIds = writable<string[]>([]);

    #players: PlayerRecord[] = [];

    #log(...args: any[]) {
        console.log("[GameStateManager]", ...args);
    }

    handlePress(id: string) {
        const order = get(this.pressedOrderIds);

        if (order.includes(id)) {
            this.#log(`Button with id ${id} already pressed.`);
            return;
        }

        this.pressedOrderIds.update((order) => {
            return [...order, id];
        });
    }

    resetRound() {
        this.pressedOrderIds.set([]);
    }

    addPlayer(id: string) {
        if (this.#players.find((player) => player.id === id)) {
            this.#log(`Player with id ${id} already exists.`);
            return;
        }

        const color = colorPool.pop() || "black";
        const player = { id, color };

        this.#players.push(player);
    }

    removePlayer(id: string) {
        const playerIndex = this.#players.findIndex((player) => player.id === id);

        if (playerIndex === -1) {
            return;
        }

        const player = this.#players.splice(playerIndex, 1)[0];
        colorPool.push(player.color);
    }

    getPlayerColor(id: string) {
        const player = this.#players.find((player) => player.id === id);

        if (!player) {
            this.#log(`Player with id ${id} not found.`);
            return;
        }

        return player.color;
    }
}
