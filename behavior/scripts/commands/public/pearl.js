import { world, system } from "@minecraft/server";
import { Command } from "../CommandHandler.js";
import main from "../config.js";

const playerCooldowns = new Map();
let defaultCooldownSeconds = 7; // Default cooldown in seconds
const MIN_COOLDOWN_SECONDS = 3;  // Minimum allowed cooldown duration

system.runInterval(() => {
    const currentTick = system.currentTick;

    for (const player of world.getPlayers()) {
        const playerName = player.name;
        const cooldownEndTick = playerCooldowns.get(playerName);

        if (cooldownEndTick && currentTick >= cooldownEndTick) {
            player.sendMessage("§aYou can now use Ender Pearls again!");
            system.run(() => player.runCommand(`playsound note.bell @s`));
            playerCooldowns.delete(playerName);
        }
    }
}, 20);

world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const { itemStack } = event;

    if (itemStack.typeId === "minecraft:ender_pearl") {
        const playerName = player.name;
        const currentTick = system.currentTick;

        if (playerCooldowns.has(playerName)) {
            const cooldownEndTick = playerCooldowns.get(playerName);

            if (currentTick < cooldownEndTick) {
                const remainingTicks = cooldownEndTick - currentTick;
                const remainingSeconds = Math.ceil(remainingTicks / 20);

                player.sendMessage(`§cYou are on cooldown for using Ender Pearls! Please wait §e${remainingSeconds} §cseconds.`);
                system.run(() => player.runCommand(`playsound random.break @s`));
                
                event.cancel = true;
                return;
            }
        }

        const cooldownTicks = defaultCooldownSeconds * 20;
        playerCooldowns.set(playerName, currentTick + cooldownTicks);
        player.sendMessage(`§aEnder Pearl used! You are now on a ${defaultCooldownSeconds}-second cooldown.`);
    }
});

Command.register({
    name: "pearl",
    description: "",
    aliases: [],
    permission: (player) => player.hasTag(main.adminTag),
}, (data, args) => {
    const { player } = data;
    const action = args[0]?.toLowerCase();
    const duration = parseInt(args[1]);

    if (!["set", "remove"].includes(action)) {
        player.sendMessage('§cInvalid action! Use: §3!pearl §eset §7<§aseconds§7> §7/ §3!pearl §cremove');
        return system.run(() => player.runCommand('playsound random.break @s'));
    }

    if (action === "set") {
        if (isNaN(duration) || duration < MIN_COOLDOWN_SECONDS) {
            player.sendMessage(`§cInvalid duration! It must be at least §e${MIN_COOLDOWN_SECONDS} §cseconds.`);
            return system.run(() => player.runCommand('playsound random.break @s'));
        }

        defaultCooldownSeconds = duration;
        player.sendMessage(`§aEnder Pearl cooldown set to §e${duration} §aseconds.`);
        system.run(() => player.runCommand('playsound random.levelup @s'));

    } else if (action === "remove") {
        defaultCooldownSeconds = 7;  // Reset to default 10s
        player.sendMessage(`§aEnder Pearl cooldown reset to default §e${defaultCooldownSeconds} §aseconds.`);
        system.run(() => player.runCommand('playsound random.levelup @s'));
    }
});