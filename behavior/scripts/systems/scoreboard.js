import { system, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import main from "../commands/config.js";
import { getRank } from "./ranks.js";
import { MainShopUI } from "./shop.js";

// Scoreboard Objectives
export const objectives = {
    money: "Money",
    kills: "Kills",
    deaths: "Deaths",
    killstreak: "KS",
    days: "D",
    hours: "H",
    minutes: "M",
    seconds: "S",
    online: "Online",
    cps: "CPS",
    clicks: "Clicks"
};

// Maximum money limit (prevents negative money)
const MONEY_LIMIT = 2_147_483_647;

// Function to Format Large Numbers
export function formatNumber(value) {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + "B";
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + "M";
    if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + "K";
    return value.toString();
}

// Initialize Scoreboards if Not Exists
system.run(() => {
    Object.values(objectives).forEach(obj => {
        if (!world.scoreboard.getObjective(obj)) {
            world.scoreboard.addObjective(obj, obj);
        }
    });
});

// Increase Score (Prevents Exceeding Money Limit & Adds Warning)
function increaseScore(player, objective, amount = 1) {
    if (!player.scoreboardIdentity) {
        system.runTimeout(() => increaseScore(player, objective, amount), 20);
        return;
    }

    if (objective === objectives.money) {
        let currentMoney = getScore(player, objectives.money);

        if (currentMoney >= MONEY_LIMIT) {
            player.sendMessage(`§cWarning! Your balance is at the maximum limit ($${formatNumber(MONEY_LIMIT)}). You must spend or remove money before earning more.`);
            return;
        }

        let newMoney = currentMoney + amount;

        if (newMoney > MONEY_LIMIT) {
            newMoney = MONEY_LIMIT;
            player.sendMessage(`§cYou have reached the maximum balance of $${formatNumber(MONEY_LIMIT)}. You cannot earn more until you spend some money.`);
        }

        setScore(player, objectives.money, newMoney);
    } else {
        setScore(player, objective, getScore(player, objective) + amount);
    }
}

// Set Score on Scoreboard (Prevents Exceeding Money Limit & Fixes Reset Issue)
function setScore(player, objective, value) {
    if (!player.scoreboardIdentity) {
        console.warn(`Scoreboard identity for player ${player.name} is not available. Retrying...`);
        system.runTimeout(() => setScore(player, objective, value), 20); // Retry after 1 second (20 ticks)
        return;
    }

    if (objective === objectives.money) {
        if (value > MONEY_LIMIT) {
            value = MONEY_LIMIT;
            player.sendMessage(`§cYour balance is now at the maximum limit ($${formatNumber(MONEY_LIMIT)}). You must spend or remove money before earning more.`);
        } else if (value < 0) {
            value = 0;
        }
    }

    const obj = world.scoreboard.getObjective(objective);
    if (obj) obj.setScore(player.scoreboardIdentity, value);
}

// Ensure Money Stays Within Limit (Even When Using Commands)
system.runInterval(() => {
    world.getPlayers().forEach(player => {
        let money = getScore(player, objectives.money);
        if (money > MONEY_LIMIT) {
            setScore(player, objectives.money, MONEY_LIMIT);
        } else if (money < 0) {
            setScore(player, objectives.money, 0);
        }
    });
}, 5);

// Set Default Score to 0 When Player Joins
system.runInterval(() => {
    const overworld = world.getDimension("overworld");

    Object.values(objectives).forEach(objective => {
        overworld.runCommand(`scoreboard players add @a ${objective} 0`);
    });
}, 100);

// Get Score from Scoreboard (Returns 0 if Undefined)
export function getScore(player, objective) {
    if (!player.scoreboardIdentity) {
        console.warn(`Scoreboard identity for player ${player.name} is not available. Retrying...`);
        return 0; // Return 0 temporarily and retry later if needed
    }

    const obj = world.scoreboard.getObjective(objective);
    return obj && player.scoreboardIdentity ? obj.getScore(player.scoreboardIdentity) ?? 0 : 0;
}

// CPS Systems
const clickRecords = new Map();

world.afterEvents.entityHurt.subscribe(event => {
    const damageSource = event.damageSource;
    const player = damageSource.damagingEntity;

    if (player?.typeId === "minecraft:player") {
        const now = Date.now();
        if (!clickRecords.has(player.id)) {
            clickRecords.set(player.id, []);
        }
        clickRecords.get(player.id).push(now);
    }
});

system.runInterval(() => {
    const now = Date.now();
    world.getPlayers().forEach(player => {
        const clicks = clickRecords.get(player.id) || [];
        const recentClicks = clicks.filter(t => now - t <= 1000);
        clickRecords.set(player.id, recentClicks);
        setScore(player, objectives.cps, recentClicks.length);
    });
}, 20);

// Handle Killstreak
world.afterEvents.entityDie.subscribe(event => {
    const { damageSource, deadEntity } = event;

    if (deadEntity.typeId === "minecraft:player") {
        setScore(deadEntity, objectives.killstreak, 0);
        increaseScore(deadEntity, objectives.deaths);

        const killer = damageSource.damagingEntity;
        if (killer?.typeId === "minecraft:player") {
            const player = killer;
            
            increaseScore(player, objectives.kills, 1);
            increaseScore(player, objectives.killstreak, 1);
            increaseScore(player, objectives.money, 1000);

            const effectOptions = {
                duration: 1,
                amplifier: 255,
                showParticles: false
            };
            player.addEffect("instant_health", effectOptions.duration, effectOptions);
            player.sendMessage(`§aKilled §e${deadEntity}§a, Received +$1,000 and Full Health!`);
        }
    }
});

// Time Tracking (Only While Online)
system.runInterval(() => {
    world.getPlayers().forEach(player => {
        increaseScore(player, objectives.seconds);
        
        if (getScore(player, objectives.seconds) >= 60) {
            setScore(player, objectives.seconds, 0);
            increaseScore(player, objectives.minutes);
        }

        if (getScore(player, objectives.minutes) >= 60) {
            setScore(player, objectives.minutes, 0);
            increaseScore(player, objectives.hours);
        }
        
        if (getScore(player, objectives.hours) >= 12) {
            setScore(player, objectives.hours, 0);
            increaseScore(player, objectives.days);
        }
    });
}, 20);

// Online Players Update  
system.runInterval(() => {
    const onlinePlayers = world.getPlayers().length;  
    world.getPlayers().forEach(player => {  
        setScore(player, objectives.online, onlinePlayers);  
    });  
}, 1);

const pingCooldown = new Map();

function measurePing(player) {
    const now = Date.now();
    const cooldown = 200;
    
    if (pingCooldown.has(player.id)) {
        const { lastCheck, lastPing } = pingCooldown.get(player.id);
        if (now - lastCheck < cooldown) {
            return lastPing;
        }
    }

    const start = Date.now();
    try {
        player.runCommand("testfor @s");
        const currentPing = Date.now() - start;
        pingCooldown.set(player.id, {
            lastCheck: now,
            lastPing: currentPing
        });
        return currentPing;
    } catch {
        pingCooldown.set(player.id, {
            lastCheck: now,
            lastPing: -1
        });
        return -1;
    }
}

// Auto `/titleraw` Update
function playerScoreboard(player) {
    const ping = measurePing(player);
    const rank = getRank(player);
    const rankText = rank.join("§7,§r ");
    const money = formatNumber(getScore(player, objectives.money));
    
    const statsJSON = {
        "rawtext": [
            { "text": `\n\n§9Player Stats:\n` },
            { "text": `§l§i|§r §5IGN: §f` }, { "selector": "@s" }, { "text": `\n` },
            { "text": `§l§i|§r §9Rank: §b${rankText}\n` },
            { "text": `§l§i|§r §5Money: §2$§a${money}\n` },
            { "text": `§l§i|§r §9Killstreak: §f` }, { "score": { "name": "@s", "objective": objectives.killstreak } }, { "text": `\n` },
            { "text": `§l§i|§r §5K/D: §f[` }, { "score": { "name": "@s", "objective": objectives.kills } }, { "text": "] [" }, { "score": { "name": "@s", "objective": objectives.deaths } }, { "text": `]\n` },
            { "text": `§l§i|§r §9Ping: ${ping > 0 ? `§f${ping} §ams` : "§f0 §ams"}\n` },
            { "text": "§l§i|§r §5CPS: §f" }, { "score": { "name": "@s", "objective": objectives.cps } }, { "text": "\n" },
            { "text": `§l§i|§r §5Time: §5D:§f`}, { "score": { "name": "@s", "objective": objectives.days } }, { "text": ` §5H:§f` }, { "score": { "name": "@s", "objective": objectives.hours } }, { "text": ` §5M:§f` }, { "score": { "name": "@s", "objective": objectives.minutes } }, { "text": ` §5S:§f` }, { "score": { "name": "@s", "objective": objectives.seconds } }, { "text": `\n\n` },
            { "text": `§9Server Info:\n` },
            { "text": `§l§i|§r §5Online: §f` }, { "score": { "name": "@s", "objective": objectives.online } }, { "text": `/11\n` },
            { "text": `§l§i|§r §9Discord: §fe4pAc2J4e6\n` },
            { "text": `§l§i|§r §5Realm: §fD6WisWH4c4xqh9A\n\n` }
        ]
    };
    
    try {
        system.run(() => player.runCommand(`titleraw @s title ${JSON.stringify(statsJSON)}`));
    } catch (error) {
        console.error("Title command failed:", error);
    }
}

system.runInterval(() => {
    world.getPlayers().forEach(player => {
        playerScoreboard(player);
    });
}, 1);

//
// Compass Panels
//

world.afterEvents.itemUse.subscribe((event) => {
    const { itemStack, source } = event;

    if (itemStack.typeId === "glitch:itemui" && source?.typeId === "minecraft:player") {
        showCompassUI(source);
        source.playSound("note.bell", { pitch: 1, volume: 0.4 });
    }
});

export function showCompassUI(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aPlayer Menu")
        .body("Choose an option:");

    form.button("Profile", "textures/items/book_portfolio")
        .button("Shop Kits", "textures/items/gold_pickaxe")
        .button("Warp Area", "textures/ui/conduit_power_effect")
        .button("Server Info", "textures/ui/mashup_world");
    
    form.show(player).then((response) => {
        if (response.canceled) return;

        switch (response.selection) {
            case 0:
                ProfileHandle(player);
                break;
            case 1:
                MainShopUI(player);
                break;
            case 2:
                WarpHandle(player);
                break;
            case 3:
                ServerInfoHandle(player);
                break;
        }
    }).catch((error) => {
        console.error("§7[§c-§7] §rFailed to show compass panel:§c", error);
    });
}

function ProfileHandle(player) {
    const rank = getRank(player);
    const money = formatNumber(getScore(player, objectives.money));
    const killstreak = getScore(player, objectives.killstreak);
    const kills = getScore(player, objectives.kills);
    const deaths = getScore(player, objectives.deaths);
    const online = getScore(player, objectives.online);

    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aStatistics")
        .body(
            `§f================================\n` +
            `§l§aPlayer Status:\n\n` +
            `§l§i|§r §5IGN: §f${player.name}\n` +
            `§l§i|§r §9Rank: §b${rank}\n` +
            `§l§i|§r §5Money: §a$${money}\n` +
            `§l§i|§r §9Kills: §f${kills}\n` +
            `§l§i|§r §5Deaths: §f${deaths}\n` +
            `§l§i|§r §9Killstreak: §f${killstreak}\n` +
            `§l§i|§r §5K/D: §f[${kills}] [${deaths}]\n` +
            `\n\n§f================================`
        );

    form.button("§cBack", "textures/ui/arrow_left");

    form.show(player).then(response => {
        if (response.canceled) return;

        switch (response.selection) {
            case 0:
                showCompassUI(player);
                break;
        }
    }).catch(error => {
        console.error("§7[§c-§7] §rFailed to show profile panel:§c", error);
    });
}

//
// Warp Handling Systems
//

function WarpHandle(player) {
    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aWarps Menu")
        .body("Choose an option:");

    form.button("Spawn", "textures/ui/conduit_power_effect")
        .button("Mining Area", "textures/items/diamond_pickaxe")
        .button("Kit Opener", "textures/items/shulker_shell")
        .button("Coming Soon", "textures/ui/missing_item")
        .button("§cBack", "textures/ui/arrow_left");
        
    form.show(player).then((response) => {
        if (response.canceled) return;

        switch (response.selection) {
            case 0:
                SpawnHandle(player);
                break;
            case 1:
                MiningHandle(player);
                break;
            case 2:
                // KitOpener(player);
                player.playSound("random.break", { pitch: 1, volume: 0.4 });
                break;
            case 3:
                // WarpHandle(player)
                player.playSound("random.break", { pitch: 1, volume: 0.4 });
                break;
            case 4: 
                showCompassUI(player);
                break;
        }
    }).catch((error) => {
        console.error("§7[§c-§7] §rFailed to show warp panel:§c", error);
    });
}

function SpawnHandle(player) {
    const startPos = player.location;
    let countdown = 5;

    const id = system.runInterval(() => {
        const currentPos = player.location;

        if (
            Math.floor(currentPos.x) !== Math.floor(startPos.x) ||
            Math.floor(currentPos.y) !== Math.floor(startPos.y) ||
            Math.floor(currentPos.z) !== Math.floor(startPos.z)
        ) {
            player.sendMessage("§cTeleport cancelled because you moved.");
            player.playSound("random.break", { pitch: 1, volume: 0.4 });
            system.clearRun(id);
            return;
        }

        if (countdown > 0) {
            player.sendMessage(`§aTeleporting in §e${countdown}§a...`);
            player.playSound("note.pling", { pitch: 1, volume: 0.4 });
            countdown--;
        } else {
            player.runCommand("tp @s 245 -51 68.01"); 
            player.sendMessage("§aSuccesfully teleported to Spawn");
            player.runCommand("playsound random.levelup @s");
            system.clearRun(id);
        }
    }, 20); 
}

function ShopHandle(player) {
    const startPos = player.location;
    let countdown = 5;

    const id = system.runInterval(() => {
        const currentPos = player.location;

        if (
            Math.floor(currentPos.x) !== Math.floor(startPos.x) ||
            Math.floor(currentPos.y) !== Math.floor(startPos.y) ||
            Math.floor(currentPos.z) !== Math.floor(startPos.z)
        ) {
            player.sendMessage("§cTeleport cancelled because you moved.");
            player.playSound("random.break", { pitch: 1, volume: 0.4 });
            system.clearRun(id);
            return;
        }

        if (countdown > 0) {
            player.sendMessage(`§aTeleporting in §e${countdown}§a...`);
            player.playSound("note.pling", { pitch: 1, volume: 0.4 });
            countdown--;
        } else {
            player.runCommand("tp @s 0 100 0"); 
            player.sendMessage("§aSuccesfully teleported to Shop");
            player.runCommand("playsound random.levelup @s");
            system.clearRun(id);
        }
    }, 20);
}

function MiningHandle(player) {
    const startPos = player.location;
    let countdown = 5;

    const radius = 25;
    const center = { x: -16.67, y: -52.00, z: -489.06 };

    const id = system.runInterval(() => {
        const currentPos = player.location;

        if (
            Math.floor(currentPos.x) !== Math.floor(startPos.x) ||
            Math.floor(currentPos.y) !== Math.floor(startPos.y) ||
            Math.floor(currentPos.z) !== Math.floor(startPos.z)
        ) {
            player.sendMessage("§cTeleport cancelled because you moved.");
            player.playSound("random.break", { pitch: 1, volume: 0.4 });
            system.clearRun(id);
            return;
        }

        if (countdown > 0) {
            player.sendMessage(`§aTeleporting in §e${countdown}§a...`);
            player.playSound("note.pling", { pitch: 1, volume: 0.4 });
            countdown--;
        } else {
            const offsetX = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
            const offsetZ = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
            const finalX = center.x + offsetX;
            const finalZ = center.z + offsetZ;

            player.runCommand(`tp @s ${finalX.toFixed(2)} ${center.y} ${finalZ.toFixed(2)}`);
            player.sendMessage("§aSuccessfully teleported to the Mining Area!");
            player.runCommand("playsound random.levelup @s");
            system.clearRun(id);
        }
    }, 20);
}

function ServerInfoHandle(player) {
    const devs = main.developers.join("§7, §a"); 

    const form = new ActionFormData()
        .title("§l§dGlitch §0| §aInformation")
        .body(
            `§7- Development by: §a${devs}\n\n` +
            `§eClick the button below to copy the Discord link!`
        )
        
    form.button("Copy Discord Link", "textures/ui/discord-icon-512x")
        .button("Back", "textures/ui/arrow_left");

    form.show(player).then((response) => {
        if (response.canceled || response.selection === 2) return;

        if (response.selection === 0) {
            if(!testIfPlayerCanUsePCCopyTextPanel(player)){
                player.sendMessage("§7[§b#§7] §aDiscord Link: §ehttps://discord.gg/ppPT3MvgCk");
                player.sendMessage("§7[§b#§7] §aPlease manually copy the link from the chat.");
            }else{
                pcCopyTextPanel(player, "https://discord.gg/ppPT3MvgCk");
            }
        } else if (response.selection === 1) {
            showCompassUI(player);
        }
    }).catch((error) => {
        console.error("Failed to show About form:", error);
    });
}