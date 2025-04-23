import { world, system } from "@minecraft/server";
import { Command } from "../CommandHandler.js";
import main from "../config.js";

Command.register({
    name: "compass",
    description: "",
    aliases: [],
}, (data) => {
    const player = data.player;

    const inventory = player.getComponent("inventory")?.container;
    if (!inventory) return;

    let hasCompass = false;
    for (let i = 0; i < inventory.size; i++) {
        const item = inventory.getItem(i);
        if (item && item.typeId === "glitch:itemui") {
            hasCompass = true;
            break;
        }
    }

    if (!hasCompass) {
        system.run(() => player.runCommand('give @s glitch:itemui'));
        player.sendMessage("§aYou received a compass!");
    } else {
        player.sendMessage("§cYou already have a compass in your inventory.");
        system.run(() => player.runCommand('playsound random.break @s'));
    }

    system.run(() => player.runCommand('playsound note.pling @s'));
});