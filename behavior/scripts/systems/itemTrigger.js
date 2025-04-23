import { system, world, EquipmentSlot } from "@minecraft/server";

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const equipment = player.getComponent("equippable");
        if (!equipment) continue;
        
        const item = equipment.getEquipment(EquipmentSlot.Mainhand);
        if (!item || item.typeId !== "glitch:op_pickaxe") continue;
        
        const enchantable = item.getComponent("minecraft:enchantable");
        if (!enchantable) continue;
        
        const mendingEnchantment = enchantable.getEnchantment("minecraft:mending");
        if (mendingEnchantment) {
            enchantable.removeEnchantment("minecraft:mending");
            equipment.setEquipment(EquipmentSlot.Mainhand, item);
        }
    }
});

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const equipment = player.getComponent("equippable");
        if (!equipment) continue;
        
        const item = equipment.getEquipment(EquipmentSlot.Mainhand);
        if (!item || item.typeId !== "glitch:op_sword") continue;
        
        const enchantable = item.getComponent("minecraft:enchantable");
        if (!enchantable) continue;
        
        const mendingEnchantment = enchantable.getEnchantment("minecraft:fire_aspect");
        if (mendingEnchantment) {
            enchantable.removeEnchantment("minecraft:fire_aspect");
            equipment.setEquipment(EquipmentSlot.Mainhand, item);
        }
    }
});

function durabilityOnChanged(item, player, isHitEntity = false) {
    let level = item.getComponent("minecraft:enchantable")?.getEnchantment("unbreaking")?.level;
    
    function durability() {
        let durability = item.getComponent("minecraft:durability");
        const t = Math.floor(Math.random() * 100);
        
        if (t < durability.getDamageChance()) {
            if (!isHitEntity) durability.damage += 1;
            if (durability.damage >= durability.maxDurability) {
                player.playSound("random.break");
                if (!isHitEntity) player.getComponent('equippable').setEquipment('Mainhand', undefined);
            } else {
                if (!isHitEntity) player.getComponent('equippable').setEquipment('Mainhand', item);
            }
        } else {
            if (!isHitEntity) return;
            durability.damage -= 1;
            if (!isHitEntity) player.getComponent('equippable').setEquipment('Mainhand', item);
        }
    }
    
    const t = Math.floor(Math.random() * 10);
    if (level === 1 && t > 8) return;
    else if (level === 2 && t > 6) return;
    else if (level === 3 && t > 4) return;
    else durability();
}

world.afterEvents.playerBreakBlock.subscribe(event => {
    const player = event.player;
    const equipment = player.getComponent("equippable");
    if (!equipment) return;
    
    const item = equipment.getEquipment(EquipmentSlot.Mainhand);
    if (!item || item.typeId !== "glitch:op_pickaxe") return;
    
    durabilityOnChanged(item, player, false);
});