// @ts-check
import * as mc from '@minecraft/server';

const unclaimedCountKey = 'kill_reward:unclaimedCount';

mc.world.afterEvents.entityDie.subscribe((event) => {
	const { damageSource, deadEntity } = event;

	if (damageSource.damagingEntity) {
		const damagingEntity = damageSource.damagingEntity;
		const killerIsPlayer = damagingEntity.typeId === 'minecraft:player';
		const entityIsPlayer = deadEntity.typeId === 'minecraft:player';
		if (entityIsPlayer)
			mc.system.run(async () => {
				if (killerIsPlayer) {
					const killerPlayer = /** @type {mc.Player} */ (damagingEntity),
						deadPlayer = /** @type {mc.Player} */ (deadEntity);

					await killerPlayer.dimension.runCommandAsync(`give ${killerPlayer.name} minecraft:diamond`);

					killerPlayer.sendMessage(`You killed ${deadPlayer.name}, you get 1 diamond.`);
					entityIsPlayer && deadPlayer.sendMessage(`You were killed by ${killerPlayer.name}`);
				} else {
					let unclaimedCount = mc.world.getDynamicProperty(unclaimedCountKey);
					if (unclaimedCount === undefined || typeof unclaimedCount !== 'number' || unclaimedCount <= 0) unclaimedCount = 0;
					mc.world.setDynamicProperty(unclaimedCountKey, unclaimedCount + 1);
					// mc.world.sendMessage(`A kill reward has been added. Use 'claim' to get it.`);
					mc.world.sendMessage('This death has not been claimed by anyone.');
				}
			});
	}
});

// not supported yet
mc.world.afterEvents.chatSend.subscribe((event) => {
	const { message, sender } = event;

	if (message === 'claim') {
		mc.system.run(async () => {
			const unclaimedCount = mc.world.getDynamicProperty(unclaimedCountKey);
			if (unclaimedCount === undefined || typeof unclaimedCount !== 'number' || unclaimedCount <= 0) {
				sender.sendMessage('There are no unclaimed rewards.');
			} else {
				await sender.dimension.runCommandAsync(`give ${sender.name} minecraft:diamond ${unclaimedCount}`);
				sender.sendMessage('Your reward has been claimed.');
				mc.world.sendMessage(`A kill reward has been claimed by ${sender.name}.`);
				mc.world.setDynamicProperty(unclaimedCountKey, unclaimedCount - 1);
			}
		});
	}
});
