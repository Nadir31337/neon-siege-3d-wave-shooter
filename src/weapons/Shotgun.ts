import { Weapon } from './Weapon';
import { BALANCE_CONFIG } from '../config/BalanceConfig';

export class Shotgun extends Weapon {
  constructor() {
    super(BALANCE_CONFIG.weapons.shotgun);
  }
}
