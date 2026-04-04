export class Registry<E> extends Set<E> {
  _E!: E;

  public all(): Array<E> {
    return Array.from(this);
  }
}
