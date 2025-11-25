/**
 * @file
 * Pendrop theme JavaScript
 *
 * This file contains base theme JavaScript. Component-specific JavaScript
 * is defined within each component's directory.
 */

(function (Drupal) {
  'use strict';

  Drupal.behaviors.pendropTheme = {
    attach: function (context, settings) {
      // Theme initialization code here
      console.log('Pendrop theme initialized');
    }
  };

})(Drupal);

