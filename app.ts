'use strict';

import Homey = require('homey');

class HomeyVallox extends Homey.App {

  async onInit() {
    this.log('[Initialisation 1/1] Application initialised');
  }

}

module.exports = HomeyVallox;
