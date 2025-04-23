import { world, system, EntityAttributeComponent, EntityHealthComponent, EntityScaleComponent } from "@minecraft/server";
import main from "../commands/config.js"
import { formatNumber, objectives, getScore } from "./scoreboard.js";

// All rights reserved @bluemods.lol - discord account. | Please report any bugs or glitches in our discord server https://dsc.gg/bluemods

const Default_Prefix = "rank:";
const Default_Rank = "§6Member";

function getChatRanks(player) {
    const ranks = player.getTags()
        .filter(tag => tag.startsWith(Default_Prefix))
        .map(tag => tag.replace(Default_Prefix, ""))
        .slice(0, 3);
    return ranks.length === 0 ? [Default_Rank] : ranks;
}

function getNameTagRanks(player) {
    const ranks = player.getTags()
        .filter(tag => tag.startsWith(Default_Prefix))
        .map(tag => tag.replace(Default_Prefix, ""))
        .slice(0, 4);
    return ranks.length === 0 ? [Default_Rank] : ranks;
}

function formatChatMessage(player, message) {
    const ranks = getChatRanks(player);
    const rankText = ranks.join(" §7|§r ");
    return `§l§7<§r${rankText}§l§7>§r§7 ${player.name} §l§b»§r §f${message}`;
}

function chat(data) {
    const player = data.sender;
    const message = data.message;
    
    const chatMessage = formatChatMessage(player, message);
    system.run(() => world.getDimension("overworld").runCommand(`tellraw @a {"rawtext":[{"text":${JSON.stringify(chatMessage)}}]}`));
    
    data.cancel = true;
}

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const ranks = getNameTagRanks(player).join(" §7|§r ");
        const money = formatNumber(getScore(player, objectives.money));
        player.nameTag = `${player.name} §7| §2$§a${money}\n§7[ §r${ranks} §7]`;
    }
}, 0);

system.runInterval(() => {
    system.run(() => world.getDimension("overworld").runCommand(`scoreboard players reset @a Sents`));
}, 6000);

world.beforeEvents.chatSend.subscribe((data) => {
    if (!data.message.startsWith(main.prefix)) {
        chat(data);
    }
});

export { getChatRanks as getRank }; // Export the nameTag version as getRank for compatibility