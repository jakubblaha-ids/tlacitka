import asyncio
import websockets
import json
import logging
import random
import sys

logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s')


# List of connected WebSocket clients
clients = set()

fake_ips = ["192.168.0.101", "192.168.0.102", "192.168.0.103"]
heartbeat_interval = 1


def print_active_clients():
    print(f"Active clients: {len(clients)}")
    for client in clients:
        print(f"  {client.remote_address}")


async def ainput(string: str) -> str:
    sys.stdout.write(string)
    sys.stdout.flush()

    return await asyncio.to_thread(sys.stdin.readline)


async def broadcast_message(message):
    await asyncio.gather(
        *[client.send(message) for client in clients]
    )


async def send_simulate_heartbeat():
    for ip in fake_ips:
        # Create a fake heartbeat message
        heartbeat = {
            "source": "relay",
            "event": "heartbeat",
            "ip": ip
        }

        # Broadcast the heartbeat message to all connected clients
        msg = json.dumps(heartbeat)
        await broadcast_message(msg)

        logging.debug(f"Sent fake heartbeat to {len(clients)} clients")


async def send_simulate_button_press():
    random_ip = random.choice(fake_ips)

    # Create a fake button press message
    button_press = {
        "source": "button",
        "event": "pressed",
        "ip": random_ip
    }

    # Broadcast the button press message to all connected clients
    msg = json.dumps(button_press)
    await broadcast_message(msg)

    logging.debug(f"Sent fake button press to {len(clients)} clients")


async def relay(websocket, path=None):
    # Add the new client connection to the set of clients
    clients.add(websocket)
    print(f"New connection from: {websocket.remote_address}")

    print_active_clients()

    try:
        async for message in websocket:
            try:
                # Parse the incoming message
                data = json.loads(message)

                # Check if the source is "button"
                if data.get("source") == "button":
                    # Modify the source
                    data["source"] = "relay"

                    # Relay the message to all connected clients
                    broadcast_message = json.dumps(data)
                    await asyncio.gather(
                        *[client.send(broadcast_message) for client in clients if client != websocket]
                    )
            except json.JSONDecodeError:
                print(f"Received non-JSON message: {message}")
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed: {websocket.remote_address}")
    finally:
        # Remove the client from the set when it disconnects
        clients.remove(websocket)


async def relay_hearbeat_loop():
    while True:
        msg = {
            "source": "relay",
            "event": "relay_heartbeat"
        }

        await broadcast_message(json.dumps(msg))
        logging.info(f"Sent relay heartbeat to {len(clients)} clients")

        await asyncio.sleep(heartbeat_interval)


async def heartbeat_simulate_loop():
    await asyncio.sleep(heartbeat_interval)

    while True:
        await send_simulate_heartbeat()
        await asyncio.sleep(heartbeat_interval)


async def button_press_simulate_loop():
    while True:
        await ainput("Press Enter to simulate button press\n")
        await send_simulate_button_press()


async def main():
    print("WebSocket relay server starting on ws://localhost:8080")

    async with websockets.serve(relay, "0.0.0.0", 8080):
        await asyncio.gather(
            asyncio.Future(),  # Run forever
            relay_hearbeat_loop(),

            # Simulations
            heartbeat_simulate_loop(),   # Run heartbeat loop
            button_press_simulate_loop()
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped.")
