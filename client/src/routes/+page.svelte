<script lang="ts">
    import { buttonClientObserver, gameStateManager } from "$lib";
    import Signal from "$lib/icons/Signal.svelte";
    import SignalSlash from "$lib/icons/SignalSlash.svelte";
    import { scale } from "svelte/transition";

    const { pressedOrderIds } = gameStateManager;
    const { connectedClients, isRelayConnected } = buttonClientObserver;
</script>

<div class="flex flex-col fixed inset-0 gap-y-4 bg-gray-900 overflow-hidden pb-4">
    <div class="px-3 py-2 font-semibold">
        {#if $isRelayConnected}
            <span class="text-green-500"> Relay connected. </span>
        {:else}
            <span class="text-red-500"> Relay disconnected! </span>
        {/if}
    </div>

    <!-- Connection status -->
    <div class="flex gap-x-4 px-4">
        {#each $connectedClients as clientStatus}
            <div
                class="grid place-items-center rounded-lg h-full p-4"
                style="background-color: {gameStateManager.getPlayerColor(clientStatus.ip)};"
            >
                {#if clientStatus.connected}
                    <div class="text-green-500 p-2 bg-white rounded-lg">
                        <Signal />
                    </div>
                {:else}
                    <div class="text-red-500 p-2 bg-white rounded-lg">
                        <SignalSlash />
                    </div>
                {/if}
            </div>
        {/each}
    </div>

    <!-- Press order -->
    <div class="px-4 rounded-lg flex-grow">
        {#each $pressedOrderIds as playerId, index}
            {@const margin = 40 * index}

            <div
                class="h-52 grid place-items-center rounded-2xl relative shadow-2xl text-2xl"
                style="background-color: {gameStateManager.getPlayerColor(playerId)}; transform: translateY({-100 *
                    index}px); z-index: {$pressedOrderIds.length -
                    index}; margin-left: {margin}px; margin-right: {margin}px; filter: brightness({1 - index * 0.25})"
                transition:scale={{ duration: 200 }}
            >
                <!-- {index + 1} -->
            </div>
        {/each}
    </div>

    <div class="px-4 flex-shrink-0">
        <button
            onclick={() => gameStateManager.resetRound()}
            class="bg-gray-700 font-semibold w-full py-6 rounded-lg text-white active:brightness-90"
        >
            Reset
        </button>
    </div>
</div>
