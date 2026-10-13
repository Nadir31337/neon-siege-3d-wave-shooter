import { Weapon } from './Weapon';
import { BALANCE_CONFIG } from '../config/BalanceConfig';

export class SMG extends Weapon {
  constructor() {
    super(BALANCE_CONFIG.weapons.smg);
  }
}
