'use strict';

import Homey = require('homey');

class ValloxDriver extends Homey.Driver {

  async onInit() {
    this.log('[Initialisation 1/1] Vallox driver initialized');
  }

}

module.exports = ValloxDriver;
