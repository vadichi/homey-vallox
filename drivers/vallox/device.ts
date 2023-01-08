'use strict';

import Homey = require('homey');
import Vallox = require('@danielbayerlein/vallox-api');

class ValloxDevice extends Homey.Device {

  private vallox: typeof Vallox;
  private lastProfile: number = 0;

  private setProfileActionFlow = this.homey.flow.getActionCard('set-profile');
  private onProfileTriggerFlow = this.homey.flow.getTriggerCard('on-profile');
  private poolingInterval: any;

  async onInit() {
    this.log('[Initialisation 1/6] Vallox device initialized');

    this.vallox = new Vallox({ ip: this.getSetting('address'), port: 80 });
    this.log('[Initialisation 2/6] Vallox API connection established');

    this.registerCapabilityListener('profile', (profile) => this.profileCapabilityListener(profile));
    this.log('[Initialisation 3/6] Set profile capability listener registered');

    this.setProfileActionFlow.registerRunListener((args, state) => this.profileActionListener(args, state));
    this.log('[Initialisation 4/6] Set profile action flow registered');

    this.onProfileTriggerFlow.registerRunListener((args, state) => this.profileTriggerListener(args, state));
    this.log('[Initialisation 5/6] On profile change trigger flow listener registered');

    this.poolingInterval = setInterval(() => this.poolDeviceState(), this.getSetting('pooling_rate') * 1000);
    this.log('[Initialisation 6/6] State pooling task registered');
  }

  async onAdded() {
    this.log('[New Device 1/1] Vallox device added');
  }

  async onSettings(event: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string|void> {
    this.log('[Settings Change 1/3] Vallox device settings changed');

    if (event.oldSettings.address !== event.newSettings.address) {
      this.log('[Settings Change 2/3] New IP address set');

      this.vallox = new Vallox({ ip: event.newSettings.address, port: 80 });
      this.log('[Settings Change 3/3] New Vallox device initialised');
    }

    if (event.oldSettings.pooling_rate !== event.newSettings.pooling_rate) {
      this.log('[Settings Change 2/3] New pooling rate set');

      clearInterval(this.poolingInterval);
      setInterval(() => this.poolDeviceState(), event.newSettings.pooling_rate * 1000);
      this.log('[Settings Change 3/3] Pooling rate changed');
    }
  }

  async onRenamed(name: string) {
    this.log(`[Name Change 1/1] Vallox device renamed to ${name}`);
  }

  async onDeleted() {
    this.log('[Device Deleted 1/1] Vallox device deleted');
  }

  private async profileCapabilityListener(profile: string) {
    await this.vallox.setProfile(parseInt(profile, 10), undefined);
    this.log(`[Capability] Switched profile to ${profile} via capability`);
  }

  private async profileActionListener(args: any, _: any) {
    await this.vallox.setProfile(parseInt(args.profile, 10), undefined);
    this.log(`[Action Card] Switched profile to ${args.profile} via action card`);
  }

  private async profileTriggerListener(args: any, state: any) {
    this.log(`[Trigger Card] Profile changed to ${state.profile.toString()}, evaluating whether to run trigger flow`);
    return parseInt(args.profile, 10) === state.profile;
  }

  private async poolDeviceState() {
    const profile = await this.vallox.getProfile();
    this.setCapabilityValue('profile', profile.toString()).catch();

    if (profile !== this.lastProfile) {
      this.lastProfile = profile;
      this.onProfileTriggerFlow.trigger({}, { profile }).catch();
    }
  }

}

module.exports = ValloxDevice;
