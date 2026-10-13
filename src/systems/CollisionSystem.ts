import * as THREE from 'three';
import { Obstacle } from '../rendering/ArenaScene';

export class CollisionSystem {
  /**
   * Continuous collision detection: checks if the line segment from p0 to p1 intersects a sphere.
   */
  public static segmentIntersectsSphere(
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    center: THREE.Vector3,
    radius: number
  ): boolean {
    const d = new THREE.Vector3().subVectors(p1, p0);
    const f = new THREE.Vector3().subVectors(p0, center);

    const a = d.dot(d);
    if (a < 0.000001) {
      // Points are identical, do a simple distance check
      return p0.distanceToSquared(center) <= radius * radius;
    }

    const b = 2 * f.dot(d);
    const c = f.dot(f) - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return false;
    }

    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    // If either root falls within the segment [0, 1]
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
      return true;
    }

    // Or if the segment is completely inside the sphere
    if (t1 < 0 && t2 > 1) {
      return true;
    }

    return false;
  }

  /**
   * Resolves collision between an entity (treated as a cylinder on the XZ plane) and circular obstacles (pillars).
   */
  public static resolveEntityObstacles(entityPos: THREE.Vector3, entityRadius: number, obstacles: Obstacle[]): void {
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const dx = entityPos.x - obs.position.x;
      const dz = entityPos.z - obs.position.z;
      const distSq = dx * dx + dz * dz;
      const minDist = entityRadius + obs.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        const pushX = (dx / dist) * overlap;
        const pushZ = (dz / dist) * overlap;

        entityPos.x += pushX;
        entityPos.z += pushZ;
      }
    }
  }

  /**
   * Checks if a line segment intersects any circular obstacle on the XZ plane.
   */
  public static segmentIntersectsObstacles(
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    obstacles: Obstacle[]
  ): Obstacle | null {
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const center2D = new THREE.Vector3(obs.position.x, (p0.y + p1.y) / 2, obs.position.z);
      if (CollisionSystem.segmentIntersectsSphere(p0, p1, center2D, obs.radius)) {
        return obs;
      }
    }
    return null;
  }
}
