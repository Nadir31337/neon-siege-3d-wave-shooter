export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (item: T) => void;

  constructor(createFn: () => T, resetFn: (item: T) => void, initialCapacity: number = 20) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    for (let i = 0; i < initialCapacity; i++) {
      this.pool.push(this.createFn());
    }
  }

  public get(): T {
    if (this.pool.length > 0) {
      const item = this.pool.pop()!;
      this.resetFn(item);
      return item;
    }
    const item = this.createFn();
    this.resetFn(item);
    return item;
  }

  public release(item: T): void {
    this.pool.push(item);
  }

  public get size(): number {
    return this.pool.length;
  }
}
