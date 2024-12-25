import { get, writable } from "svelte/store";
import type { GameStateManager } from "./GameStateManager";

const minHeartbeatInterval = 1500;

type WsEvent = "connected" | "heartbeat" | "pressed";

type WsMessage = {
    event: WsEvent;
    ip: string;
};

type ButtonClientStatus = {
    ip: string;
    lastHeartbeatTs: number;
    lastButtonPressTs: number;
    connected: boolean;
    pressedThisRound: boolean;
};

export class ButtonClientObserver {
    #gameStateManager: GameStateManager;

    connectedClients = writable<ButtonClientStatus[]>([]);
    isRelayConnected = writable(false);

    private socket: WebSocket;

    constructor(gameStateManager: GameStateManager) {
        this.#gameStateManager = gameStateManager;

        this.socket = new WebSocket("ws://mac.local:8080");

        this.socket.onopen = () => {
            console.log("Connected to relay.");
            this.isRelayConnected.set(true);
        };

        this.socket.onmessage = (event) => {
            this.onMessage(event.data);
        };

        setInterval(() => this.watchdogTask(), 500);
    }

    #getClientStatus(ip: string) {
        const clients = get(this.connectedClients);
        return clients.find((client) => client.ip === ip);
    }

    #triggerClientStatusUpdate() {
        this.connectedClients.update((clients) => [...clients]);
    }

    onMessage(message: string) {
        let json: WsMessage;

        try {
            json = JSON.parse(message);
        } catch (e) {
            console.log("Failed to parse message:", message);
            return;
        }

        console.log("Received message from client:", json);

        const event = json.event;
        const ip = json.ip;

        // if (event === "connected") {
        //     this.handleConnected(ip);
        // }

        if (event === "heartbeat") {
            this.handleHeartbeat(ip);
        }

        if (event === "pressed") {
            this.handleButton(ip);
        }
    }

    // handleConnected(ip: string) {
    //     console.log("Connected:", ip);
    // }

    handleHeartbeat(ip: string) {
        console.log("Heartbeat from", ip);

        const existingClientStatus = this.#getClientStatus(ip);

        if (existingClientStatus) {
            // Update last heartbeat timestamp
            existingClientStatus.lastHeartbeatTs = Date.now();
            this.#triggerClientStatusUpdate();
        } else {
            this.createClientRecord(ip);
            this.#gameStateManager.addPlayer(ip);
        }
    }

    handleButton(ip: string) {
        console.log("Button press from", ip);

        this.#gameStateManager.handlePress(ip);
    }

    createClientRecord(ip: string) {
        const clientStatus: ButtonClientStatus = {
            ip,
            lastHeartbeatTs: Date.now(),
            lastButtonPressTs: 0,
            connected: true,
            pressedThisRound: false,
        };

        this.connectedClients.update((clients) => [...clients, clientStatus]);
    }

    watchdogTask() {
        const clients = get(this.connectedClients);

        const now = Date.now();

        for (const client of clients) {
            client.connected = now - client.lastHeartbeatTs < minHeartbeatInterval;
        }

        this.connectedClients.set(clients);
    }
}
