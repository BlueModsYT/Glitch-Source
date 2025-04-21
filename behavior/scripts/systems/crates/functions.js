export function spawnFirework(dimension, location) {
    const { x, y, z } = location;

    const offsets = [0, 0.2, -0.2, 0.1, -0.1];

    for (let i = 0; i < offsets.length; i++) {
        system.runTimeout(() => {
            dimension.runCommand(`summon fireworks_rocket ${x + offsets[i]} ${y + 1} ${z + offsets[i]}`);
        }, i * 2);
    }
}

export function deniedSound(player) {
    player.sendMessage("§g★ §cAccess Denied! Required: §6Special Key");
    player.runCommand("playsound random.break @s");
}

export function fullSound(player) {
    player.sendMessage("§g★ §cInventory full! Clear space and try again.");
    player.runCommand("playsound random.break @s");
}