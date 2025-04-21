import { system, world } from '@minecraft/server';

function durabilityOnChanged(item, player, isHitEntity = false) {
    let level = item.getComponent("minecraft:enchantable")?.getEnchantment("unbreaking")?.level;

    function durability() {
        let durability = item.getComponent("minecraft:durability");

        const t = Math.floor(Math.random() * 100);

        if (t < durability.getDamageChance()) {
            if (!isHitEntity) durability.damage += 1;
            if (durability.damage >= durability.maxDurability) {
                player.playSound("random.break");
                if (!isHitEntity) player.getComponent('equippable').setEquipment('Mainhand', undefined)
            } else {
                if (!isHitEntity) player.getComponent('equippable').setEquipment('Mainhand', item)
            }
        } else {
            if (!isHitEntity) return;
            durability.damage -= 1;
            if (!isHitEntity) player.getComponent('equippable').setEquipment('Mainhand', item);
        }
    }

    const t = Math.floor(Math.random() * 10)
    if (level === 1 && t > 8) return;
    else if (level === 2 && t > 6) return;
    else if (level === 3 && t > 4) return;
    else durability();
}

world.beforeEvents.worldInitialize.subscribe(initEvent => { initEvent.itemComponentRegistry.registerCustomComponent('op_pickaxe:trigger', { 
    onHitEntity: e => { durabilityOnChanged(e.itemStack, e.source, true); },
    onMineBlock: e => { durabilityOnChanged(e.itemStack, e.source, false); },
    });
});
 