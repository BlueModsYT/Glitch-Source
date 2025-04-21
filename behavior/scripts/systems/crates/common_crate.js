import { world, ItemStack, system } from "@minecraft/server";
import { spawnFirework, deniedSound, fullSound } from "./functions.js";

const lootTable = [
    { id: "minecraft:coal", amount: 16, chance: 26 },
    { id: "glitch:poopstick", amount: 2, chance: 26 },
    { id: "minecraft:gold_ingot", amount: 5, chance: 10 },
    { id: "minecraft:iron_ingot", amount: 8, chance: 10 },
    { id: "minecraft:redstone", amount: 10, chance: 10 },
    { id: "minecraft:diamond", amount: 2, chance: 5  },
    { id: "minecraft:emerald", amount: 3, chance: 5  },
    { id: "minecraft:totem_of_undying", amount: 1, chance: 5  },
    { id: "glitch:rare_key", amount: 1, chance: 1.5 },
    { id: "minecraft:netherite_ingot", amount: 1, chance: 1.5 }
];

const targetChestLocation = { x: 238, y: -55, z: 34 };
const requiredItem = "glitch:common_key";

async function resetChest(dimension, location) {
    const { x, y, z } = location;
    await dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:air`);
    await dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:chest ["minecraft:cardinal_direction"="south"]`);
}

function giveRandomLoot(player) {
    const container = player.getComponent("inventory").container;
    
    const totalWeight = lootTable.reduce((sum, item) => sum + item.chance, 0);
    let random = Math.random() * totalWeight;
    
    let selectedLoot;
    for (const item of lootTable) {
        random -= item.chance;
        if (random < 0) {
            selectedLoot = item;
            break;
        }
    }
    
    const itemStack = new ItemStack(selectedLoot.id, selectedLoot.amount);
    
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
    
    if (block.typeId !== "minecraft:chest" || 
        !Object.entries(targetChestLocation).every(([coord, val]) => block.location[coord] === val)) {
        return;
    }

    const container = player.getComponent("inventory").container;
    let keySlot = -1;

    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item?.typeId === requiredItem) {
            keySlot = i;
            break;
        }
    }

    system.run(async () => {
        await resetChest(block.dimension, block.location);
    });

    if (keySlot === -1) {
        deniedSound(player); // sound
        return;
    }

    if (!giveRandomLoot(player)) return;

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
        world.sendMessage(`§g★ §e${player.name} §ahas unlocked a common crate!`);
    });
});
