import { Weapon } from './Weapon';
import { BALANCE_CONFIG } from '../config/BalanceConfig';

export class Pistol extends Weapon {
  constructor() {
    super(BALANCE_CONFIG.weapons.pistol);
  }
}
