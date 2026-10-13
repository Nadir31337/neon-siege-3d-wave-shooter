import * as THREE from 'three';
import { Entity } from '../entities/Entity';

export class SpatialGrid<T extends Entity> {
  private cellSize: number;
  private grid: Map<string, T[]> = new Map();

  constructor(cellSize: number = 6.0) {
    this.cellSize = cellSize;
  }

  public clear(): void {
    this.grid.clear();
  }

  private getKey(x: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  public insert(item: T): void {
    const key = this.getKey(item.position.x, item.position.z);
    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(item);
  }

  public getNeighbors(position: THREE.Vector3, radius: number): T[] {
    const results: T[] = [];
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize);
    const maxZ = Math.floor((position.z + radius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const key = `${cx},${cz}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            results.push(cell[i]);
          }
        }
      }
    }
    return results;
  }
}
