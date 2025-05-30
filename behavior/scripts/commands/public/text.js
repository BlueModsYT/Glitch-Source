import { world, system } from "@minecraft/server";
import { Command } from "../CommandHandler.js";
import main from "../config.js";

// all rights reserved @bluemods.lol - discord account. || Please report any bugs or glitches in our discord server https://dsc.gg/bluemods.

Command.register({
    name: "floatingtext",
    description: "",
    aliases: [],
    permission: (player) => player.hasTag(main.adminTag),
}, (data, args) => {
    const player = data.player;

    const fullArgs = data.message.split(" ");
    if (fullArgs.length < 2) {
        player.sendMessage("§7[§b#§7] §cInvalid action! §aUse this method§7: §3!floatingtext §7<§atext§7> §7[§gx, y, z§7]");
        return;
    }

    if (!data.message.includes("\"")) {
        player.sendMessage("§7[§a-§7] §cError: Text must be enclosed in quotation marks (\")");
        player.sendMessage("§7[§a-§7] §eExample: !floatingtext \"Your text here\"");
        return;
    }

    const textMatch = data.message.match(/"([^"]*)"/);
    if (!textMatch) {
        player.sendMessage("§7[§a-§7] §cError: Could not parse text. Make sure to use proper quotation marks");
        return;
    }

    let text = textMatch[1];
    text = text.replace(/\\n/g, '\n');
    
    const remainingArgs = data.message.slice(textMatch.index + textMatch[0].length).trim().split(" ").filter(arg => arg);

    let x = "~";
    let y = "~1";
    let z = "~";

    if (remainingArgs.length >= 3) {
        x = remainingArgs[0];
        y = remainingArgs[1];
        z = remainingArgs[2];
    }

    try {
        system.run(() => {
            player.runCommand(`summon bluemods:floating_text ${x} ${y} ${z} ~~ minecraft:become_neutral "${text}"`);
        });
        player.sendMessage(`§7[§a-§7] §aAdded floating text at ${x} ${y} ${z}`);
    } catch (e) {
        player.sendMessage("§7[§a-§7] §cFailed to create floating text. Please check your coordinates.");
        console.warn(`Floating text summon failed: ${e}`);
    }
});