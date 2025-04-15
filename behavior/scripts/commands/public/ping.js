import { world, system } from "@minecraft/server";
import { Command } from "../CommandHandler.js";
import main from "../config.js";

Command.register({
    name: "ping",
    description: "",
    aliases: [],
}, async (data) => {
    await system.waitTicks(1);
    
    const { player } = data;
    const start = Date.now();
    
    player.runCommand(`testfor @s`);
    
    const responseTime = Date.now() - start;
    
    let pingStatus = "§aLow";
    if (responseTime > 100) {
        pingStatus = "§cHigh";
    } else if (responseTime > 50) {
        pingStatus = "§gMedium";
    }
    
    const worldTPS = Math.min(20, 20);
    player.sendMessage(`§7[§a#§7] §aPing§7: §e${responseTime}ms §7[${pingStatus}§7] | §aTPS: §e${worldTPS}§7/§e20`);
    
    player.runCommand(`playsound random.orb @s`);
});