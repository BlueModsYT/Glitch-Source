import { world, ItemStack, system } from "@minecraft/server";
import { spawnFirework, deniedSound, fullSound } from "./functions.js";

const lootTable = [
    { id: "minecraft:iron_ingot", amount: 12, chance: 15 },
    { id: "minecraft:gold_ingot", amount: 10, chance: 13 },
    { id: "minecraft:redstone_block", amount: 6,  chance: 12 },
    { id: "minecraft:coal_block", amount: 5,  chance: 10 },
    { id: "minecraft:diamond_block", amount: 2,  chance: 10 },
    { id: "minecraft:emerald_block", amount: 2,  chance: 8 },
    { id: "minecraft:lapis_block", amount: 3,  chance: 6 },
    { id: "minecraft:copper_block", amount: 4,  chance: 6 },
    { id: "minecraft:netherite_ingot", amount: 1,  chance: 1 },
    { id: "glitch:epic_key", amount: 1,  chance: 0.1 }
];

const targetChestLocation = { x: 253, y: -55, z: 34};
const requiredItem = "glitch:rare_key";

function spawnFirework(dimension, location) {
    const { x, y, z } = location;

    const offsets = [0, 0.2, -0.2, 0.1, -0.1];

    for (let i = 0; i < offsets.length; i++) {
        system.runTimeout(() => {
            dimension.runCommand(`summon fireworks_rocket ${x + offsets[i]} ${y + 1} ${z + offsets[i]}`);
        }, i * 2);
    }
}

async function resetChest(dimension, location) {
    const { x, y, z } = location;
    await dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:air`);
    await dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:chest ["minecraft:cardinal_direction"="south"]`);
}

function giveRandomLoot(player) {
    const container = player.getComponent("inventory").container;
    
    // Calculate total weight
    const totalWeight = lootTable.reduce((sum, item) => sum + item.chance, 0);
    let random = Math.random() * totalWeight;
    
    // Find selected loot
    let selectedLoot;
    for (const item of lootTable) {
        random -= item.chance;
        if (random < 0) {
            selectedLoot = item;
            break;
        }
    }
    
    // Create item stack
    const itemStack = new ItemStack(selectedLoot.id, selectedLoot.amount);
    
    // Try to add to inventory
    const leftover = container.addItem(itemStack);
    if (leftover) {
        fullSound(player); // sound
        return false;
    }
    return true;
}

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player } = event;
    const { x, y, z } = block.location;
    
    // Check if interacting with target chest
    if (block.typeId !== "minecraft:chest" || 
        !Object.entries(targetChestLocation).every(([coord, val]) => block.location[coord] === val)) {
        return;
    }

    const container = player.getComponent("inventory").container;
    let keySlot = -1;

    // Search for required key
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item?.typeId === requiredItem) {
            keySlot = i;
            break;
        }
    }

    // Always reset chest after interaction
    system.run(async () => {
        await resetChest(block.dimension, block.location);
    });

    if (keySlot === -1) {
        deniedSound(player); // sound
        return;
    }

    // Attempt to give loot
    if (!giveRandomLoot(player)) return;

    // Remove key
    const keyStack = container.getItem(keySlot);
    if (keyStack.amount > 1) {
        keyStack.amount--;
        container.setItem(keySlot, keyStack);
    } else {
        container.setItem(keySlot, undefined);
    }

    // Success effects
    system.run(() => {
        spawnFirework(block.dimension, block.location);
        world.sendMessage(`§g★ §e${player.name} §ahas unlocked a rate crate!`);
    });
});
