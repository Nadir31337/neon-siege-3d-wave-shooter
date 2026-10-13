import { Weapon } from './Weapon';
import { BALANCE_CONFIG } from '../config/BalanceConfig';

export class Railgun extends Weapon {
  constructor() {
    super(BALANCE_CONFIG.weapons.railgun);
  }
}
