'use strict';

import Homey = require('homey');

class HomeyVent extends Homey.App {

  async onInit() {
    this.log('[Initialisation 1/1] Application initialised');
  }

}

module.exports = HomeyVent;
