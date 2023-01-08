'use strict';

import Homey = require('homey');
import Vallox = require('@danielbayerlein/vallox-api');

class ValloxDevice extends Homey.Device {

  vallox: typeof Vallox;
  lastProfile: number = 0;

  setProfileActionFlow = this.homey.flow.getActionCard('set-profile');
  onProfileTriggerFlow = this.homey.flow.getTriggerCard('on-profile');

  async onInit() {
    this.log('[Initialisation 1/6] Vallox device initialized');

    this.vallox = new Vallox({ ip: this.getSetting('address'), port: 80 });
    this.log('[Initialisation 2/6] Vallox API connection established');

    this.registerCapabilityListener('profile', async (profile) => {
      await this.vallox.setProfile(parseInt(profile, 10));
      this.log(`[Capability] Switched profile to ${profile} via capability`);
    });
    this.log('[Initialisation 3/6] Set profile capability listener registered');

    this.setProfileActionFlow.registerRunListener(async (args, state) => {
      await this.vallox.setProfile(parseInt(args.profile, 10));
      this.log(`[Action Card] Switched profile to ${args.profile} via action card`);
    });
    this.log('[Initialisation 4/6] Set profile action flow registered');

    this.onProfileTriggerFlow.registerRunListener(async (args, state) => {
      this.log(`[Trigger Card] Profile changed to ${state.profile.toString()}, evaluating whether to run trigger flow`);
      return parseInt(args.profile, 10) === state.profile;
    });
    this.log('[Initialisation 5/6] On profile change trigger flow listener registered');

    setInterval(async () => {
      const profile = await this.vallox.getProfile();
      this.setCapabilityValue('profile', profile.toString()).catch();

      if (profile !== this.lastProfile) {
        this.lastProfile = profile;
        this.onProfileTriggerFlow.trigger({}, { profile }).catch();
      }
    }, 1000);
    this.log('[Initialisation 6/6] State pooling task registered');
  }

  async onAdded() {
    this.log('[New Device 1/1] Vallox device added');
  }

  async onSettings(event: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string|void> {
    this.log('[Settings Change 1/2] Vallox device settings changed');

    this.vallox = new Vallox({ ip: event.newSettings.ip, port: 80 });
    this.log('[Settings Change 2/2] New Vallox device initialised');
  }

  async onRenamed(name: string) {
    this.log(`[Name Change 1/1] Vallox device renamed to ${name}`);
  }

  async onDeleted() {
    this.log('[Device Deleted 1/1] Vallox device deleted');
  }

}

module.exports = ValloxDevice;
