import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { showCompassUI } from "./scoreboard.js";

const ARMOR_OPTIONS = [
    { name: "Leather Armor", cost: 10000, texture: "textures/items/leather_chestplate", structure: "leather_kit" },
    { name: "Iron Armor", cost: 30000, texture: "textures/items/iron_chestplate", structure: "iron_kit" },
    { name: "Gold Armor", cost: 40000, texture: "textures/items/gold_chestplate", structure: "gold_kit" },
    { name: "Diamond Armor", cost: 500000, texture: "textures/items/diamond_chestplate", structure: "diamond_kit" },
    { name: "Netherite Armor", cost: 5000000, texture: "textures/items/netherite_chestplate", structure: "netherite_kit" }
];

const GOD_ARMOR_OPTIONS = [
    { name: "Crystal Kit", cost: 1000000, texture: "textures/items/end_crystal", structure: "crystal_kit" },
    { name: "Azure Kit", cost: 30000000, texture: "textures/ui/promo_gift_small_blue", structure: "azure_kit" },
    { name: "OP Pickaxe", cost: 5500000, texture: "textures/items/diamond_pickaxe", give: "glitch:op_pickaxe" },
    { name: "OP Sword", cost: 30000000, texture: "textures/items/diamond_sword", give: "glitch:op_sword" }
];

const SPECIAL_OPTIONS = [
    // { name: "Mending Lvl.1", cost: 100000, texture: "textures/items/book_enchanted", enchant: "mending", level: "1" }, // level: enchant level for a certain item
    // { name: "Sharpness Lvl.6", cost: 100000, texture: "textures/items/book_enchanted", enchant: "sharpness", level: "6" }, // level: enchant level for a certain item
    { name: "Haste Boost for 20m", cost: 50000, texture: "textures/ui/haste_effect", effect: "haste", time: "20000" }, // 20 Minutes
    { name: "Speed Boost for 5m", cost: 30000, texture: "textures/ui/speed_effect", effect: "speed", time: "5000" }, // 5 Minutes
    { name: "Jump Boost for 5m", cost: 30000, texture: "textures/ui/jump_boost_effect", effect: "jump_boost", time: "5000" } // 5 Minutes
];

const UTILITY_OPTIONS = [
    { name: "Pearl Kit", cost: 50000, texture: "textures/items/ender_pearl", structure: "pearl_kit" },
    { name: "Trim Templates Kit", cost: 20000, texture: "textures/items/dune_armor_trim_smithing_template", structure: "template_kit" },
    { name: "Arrow Kit", cost: 15000, texture: "textures/items/arrow", structure: "arrow_kit" },
    { name: "XP Kit", cost: 65000, texture: "textures/items/experience_bottle", structure: "xp_kit" },
    { name: "Potion Kit", cost: 40000, texture: "textures/items/potion_bottle_splash_saturation", structure: "potion_kit" }
];

const BUILDS_OPTIONS = [
    /*{ name: "Seeds Kit", cost: 50000, texture: "textures/items/seeds_wheat", structure: "crystal_kit" },
    { name: "Blocks Kit", cost: 50000, texture: "textures/items/ruby", structure: "crystal_kit" },
    { name: "Interior Kit", cost: 50000, texture: "textures/items/sign", structure: "crystal_kit" },
    { name: "Redstone Kit", cost: 50000, texture: "textures/items/redstone_dust", structure: "crystal_kit" }*/
];

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getScore(player, objective) {
    try {
        return world.scoreboard.getObjective(objective).getScore(player);
    } catch {
        return 0;
    }
}

function deductMoney(player, amount) {
    try {
        const obj = world.scoreboard.getObjective("Money");
        const current = obj.getScore(player);
        obj.setScore(player, current - amount);
    } catch {}
}

//
// Main Shop UI
//

export function MainShopUI(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aShopping Menu")
        .body("Choose an option:");
        
        form.button("Armor Kits", "textures/items/gold_chestplate")
            .button("Godly Kits", "textures/items/netherite_chestplate")
            .button("Special Kits", "textures/items/book_enchanted")
            .button("Combat & Utilities Kits", "textures/items/shulker_shell")
            .button("Farming & Building Kits", "textures/items/wood_axe")
            .button("§cBack", "textures/ui/arrow_left");

    form.show(player).then((response) => {
        if (response.canceled) return;

        switch (response.selection) {
            case 0:
                NormalArmorShop(player);
                break;
            case 1:
                GodArmorShop(player);
                break;
            case 2:
                SpecialShop(player);
                break;
            case 3:
                CombatShop(player);
                break;
            case 4:
                FarmingShop(player);
                break;
            case 5: 
                showCompassUI(player);
                break;
        }
    }).catch((error) => {
        console.error("§7[§c-§7] §rFailed to show warp panel:§c", error);
    });
}

//
// Section for Main Shop UI
//

export function NormalArmorShop(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §a Armor Shop")
        .body("§cWARNING§r: These Kits are already Enchanted with better Enchantments:");

    ARMOR_OPTIONS.forEach(opt =>
        form.button(`§f${opt.name}\n§7[ §2$§a${formatNumber(opt.cost)} §7]`, opt.texture)
    );
    form.button("§cBack", "textures/ui/arrow_left");

    form.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection === ARMOR_OPTIONS.length) {
            MainShopUI(player);
            return;
        }

        const selected = ARMOR_OPTIONS[response.selection];
        ConformationHandle(player, selected);
    }).catch(error => {
        console.error("Failed to show shop menu:", error);
    });
}

function GodArmorShop(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aGodly Kit Shop")
        .body("§cWARNING§r: These Kits are already Enchanted with better Enchantments:");

    GOD_ARMOR_OPTIONS.forEach(opt =>
        form.button(`§f${opt.name}\n§7[ §2$§a${formatNumber(opt.cost)} §7]`, opt.texture)
    );
    form.button("§cBack", "textures/ui/arrow_left");

    form.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection === GOD_ARMOR_OPTIONS.length) {
            MainShopUI(player);
            return;
        }

        const selected = GOD_ARMOR_OPTIONS[response.selection];
        ConformationHandle(player, selected);
    }).catch(error => {
        console.error("Failed to show shop menu:", error);
    });
}

function SpecialShop(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aSpecial Kit Shop")
        .body("Choose an option:");

    SPECIAL_OPTIONS.forEach(opt =>
        form.button(`§f${opt.name}\n§7[ §2$§a${formatNumber(opt.cost)} §7]`, opt.texture)
    );
    form.button("§cBack", "textures/ui/arrow_left");

    form.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection === SPECIAL_OPTIONS.length) {
            MainShopUI(player);
            return;
        }

        const selected = SPECIAL_OPTIONS[response.selection];
        ConformationHandle(player, selected);
    }).catch(error => {
        console.error("Failed to show shop menu:", error);
    });
}

function CombatShop(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aCombat Kit Shop")
        .body("Choose an option:");

    UTILITY_OPTIONS.forEach(opt =>
        form.button(`§f${opt.name}\n§7[ §2$§a${formatNumber(opt.cost)} §7]`, opt.texture)
    );
    form.button("§cBack", "textures/ui/arrow_left");

    form.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection === UTILITY_OPTIONS.length) {
            MainShopUI(player);
            return;
        }

        const selected = UTILITY_OPTIONS[response.selection];
        ConformationHandle(player, selected);
    }).catch(error => {
        console.error("Failed to show shop menu:", error);
    });
}

function FarmingShop(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aFarming Kit Shop")
        .body("§cBuilding Kits still in development, we are working on this near future.");

    BUILDS_OPTIONS.forEach(opt =>
        form.button(`§f${opt.name}\n§7[ §2$§a${formatNumber(opt.cost)} §7]`, opt.texture)
    );
    form.button("§cBack", "textures/ui/arrow_left");

    form.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection === BUILDS_OPTIONS.length) {
            MainShopUI(player);
            return;
        }

        const selected = BUILDS_OPTIONS[response.selection];
        ConformationHandle(player, selected);
    }).catch(error => {
        console.error("Failed to show shop menu:", error);
    });
}

//
// Shop Confirmation Handler
//

function ConformationHandle(player, option) {
    const money = getScore(player, "Money");

    const preview = new ActionFormData()
        .title("§l§aConfirm Purchase")
        .body(
            `§fYou're about to purchase:\n\n` +
            `§e${option.name}\n§fCost: §a$${formatNumber(option.cost)}\n\n` +
            `§fYour balance: §a$${formatNumber(money)}\n\n` +
            `Proceed with this purchase?`
        )
        .button("§aConfirm", "textures/ui/confirm")
        .button("§cCancel", "textures/ui/cancel");

    preview.show(player).then(res => {
        if (res.canceled || res.selection === 1) return;

        if (money < option.cost) {
            player.sendMessage("§cYou don't have enough money!");
            return;
        }
        
        if (option.give) {
            player.runCommand(`give @s ${option.give}`);
            deductMoney(player, option.cost);
            player.sendMessage(`§aYou purchased §e${option.name}§a for §2$§a${formatNumber(option.cost)}!`);
        } else if (option.effect) {
            player.runCommand(`effect @s ${option.effect} ${option.time} 1`);
            deductMoney(player, option.cost);
            player.sendMessage(`§aYou purchased §e${option.name}§a for §2$§a${formatNumber(option.cost)}!`);
        } else {
            player.runCommand(`structure load ${option.structure} ~ ~1 ~`);
            deductMoney(player, option.cost);
            player.sendMessage(`§aYou purchased §e${option.name}§a for §2$§a${formatNumber(option.cost)}!`);
        }
    }).catch(err => {
        console.error("Failed to show confirmation panel:", err);
    });
}

//
// Enchant UI Panel Main
//

function enchantUIPanel(player) {
}