import { world, system } from "@minecraft/server";

// Periodic scan every 15 seconds (300 ticks)
system.runInterval(() => {
    const allPlayers = world.getAllPlayers();
    
    for (const player of allPlayers) {
        const inventory = player.getComponent("inventory").container;
        
        // Check all inventory slots
        for (let slot = 0; slot < inventory.size; slot++) {
            const item = inventory.getItem(slot);
            if (item?.typeId !== "glitch:op_pickaxe") continue;
            
            const enchants = item.getComponent("minecraft:enchantments");
            if (!enchants) continue;
            
            // Check for Mending
            let hasMending = false;
            for (const ench of enchants.enchantments) {
                if (ench.type.id === "mending") {
                    hasMending = true;
                    break;
                }
            }
            
            // Remove Mending if found
            if (hasMending) {
                const newItem = item.clone();
                const newEnchants = newItem.getComponent("minecraft:enchantments");
                newEnchants.enchantments = newEnchants.enchantments.filter(
                    e => e.type.id !== "mending"
                );
                inventory.setItem(slot, newItem);
            }
        }
    }
}, 10);