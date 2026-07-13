/**
 * In-memory Firestore mock for unit tests.
 *
 * Supports the subset of firebase-admin/firestore API used by src/lib/db/*:
 *   - collection, doc, CollectionReference, DocumentReference
 *   - get, set, update, delete, add
 *   - where, orderBy, limit, startAfter, get (Query)
 *   - runTransaction, batch, batch.set/update/delete/commit
 *
 * Each top-level collection lives in a Map<string, any>. Documents are stored
 * with a fake __path__ field for debugging.
 */

type DocData = Record<string, unknown> & { __path__?: string };

class FakeDocumentRef {
  readonly id: string;
  constructor(public readonly path: string) {
    const parts = path.split("/");
    this.id = parts[parts.length - 1];
  }

  collection(sub: string): FakeCollectionRef {
    return new FakeCollectionRef(`${this.path}/${sub}`);
  }

  async get(): Promise<FakeSnapshot> {
    const doc = store.get(this.path);
    return new FakeSnapshot(this.path, doc ?? null);
  }

  async set(data: DocData, options?: { merge?: boolean }): Promise<void> {
    const existing = options?.merge ? store.get(this.path) ?? {} : {};
    store.set(this.path, { ...existing, ...data, __path__: this.path });
  }

  async update(data: DocData): Promise<void> {
    const existing = store.get(this.path) ?? {};
    store.set(this.path, { ...existing, ...data, __path__: this.path });
  }

  async delete(): Promise<void> {
    store.delete(this.path);
  }
}

class FakeQuery {
  constructor(
    public readonly collectionPath: string,
    private filters: Array<(d: DocData) => boolean> = [],
    private orders: Array<{ field: string; dir: "asc" | "desc" }> = [],
    private lim: number | null = null
  ) {}

  where(field: string, op: string, value: unknown): FakeQuery {
    return new FakeQuery(
      this.collectionPath,
      [...this.filters, (d) => applyOp(d[field], op, value)],
      this.orders,
      this.lim
    );
  }

  orderBy(field: string, dir: "asc" | "desc" = "asc"): FakeQuery {
    return new FakeQuery(this.collectionPath, this.filters, [...this.orders, { field, dir }], this.lim);
  }

  limit(n: number): FakeQuery {
    return new FakeQuery(this.collectionPath, this.filters, this.orders, n);
  }

  async get(): Promise<FakeQuerySnapshot> {
    const docs: FakeSnapshot[] = [];
    for (const [path, data] of store.entries()) {
      if (!path.startsWith(this.collectionPath + "/")) continue;
      if (path.substring(this.collectionPath.length + 1).includes("/")) continue;
      const { __path__, ...rest } = data;
      const fullData = { ...rest, __path__ };
      if (this.filters.every((f) => f(fullData))) {
        docs.push(new FakeSnapshot(path, fullData));
      }
    }
    if (this.orders.length) {
      docs.sort((a, b) => {
        for (const { field, dir } of this.orders) {
          const av = a.data()?.[field];
          const bv = b.data()?.[field];
          if (av === bv) continue;
          const cmp = (av as number | string) > (bv as number | string) ? 1 : -1;
          return dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }
    const limited = this.lim !== null ? docs.slice(0, this.lim) : docs;
    return new FakeQuerySnapshot(limited);
  }
}

class FakeCollectionRef extends FakeQuery {
  constructor(public readonly path: string) {
    super(path);
  }

  doc(id?: string): FakeDocumentRef {
    return new FakeDocumentRef(id ? `${this.path}/${id}` : `${this.path}/auto-${++counter}`);
  }

  async add(data: DocData): Promise<FakeDocumentRef> {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
}

class FakeSnapshot {
  readonly exists: boolean;
  private readonly _data: DocData | null;
  readonly id: string;
  constructor(public readonly ref: string, data: DocData | null) {
    this._data = data;
    this.exists = data !== null;
    const parts = ref.split("/");
    this.id = parts[parts.length - 1];
  }
  data(): DocData | null {
    return this._data;
  }
}

class FakeQuerySnapshot {
  constructor(public readonly docs: FakeSnapshot[]) {}
  get size(): number {
    return this.docs.length;
  }
  forEach(cb: (snap: FakeSnapshot) => void): void {
    this.docs.forEach(cb);
  }
  empty: boolean = false;
}

class FakeBatch {
  private ops: Array<{ op: "set" | "update" | "delete"; path: string; data?: DocData }> = [];
  set(ref: FakeDocumentRef, data: DocData): this {
    this.ops.push({ op: "set", path: ref.path, data });
    return this;
  }
  update(ref: FakeDocumentRef, data: DocData): this {
    this.ops.push({ op: "update", path: ref.path, data });
    return this;
  }
  delete(ref: FakeDocumentRef): this {
    this.ops.push({ op: "delete", path: ref.path });
    return this;
  }
  async commit(): Promise<void> {
    for (const o of this.ops) {
      const ref = new FakeDocumentRef(o.path);
      if (o.op === "set") await ref.set(o.data!);
      else if (o.op === "update") await ref.update(o.data!);
      else await ref.delete();
    }
  }
}

class FakeTransaction {
  async get(ref: FakeDocumentRef): Promise<FakeSnapshot> {
    return ref.get();
  }
  set(ref: FakeDocumentRef, data: DocData): this {
    ref.set(data);
    return this;
  }
  update(ref: FakeDocumentRef, data: DocData): this {
    ref.update(data);
    return this;
  }
  delete(ref: FakeDocumentRef): this {
    ref.delete();
    return this;
  }
}

const store = new Map<string, DocData>();
let counter = 0;

function applyOp(actual: unknown, op: string, expected: unknown): boolean {
  switch (op) {
    case "==":
      return actual === expected;
    case "!=":
      return actual !== expected;
    case ">":
      return (actual as number) > (expected as number);
    case ">=":
      return (actual as number) >= (expected as number);
    case "<":
      return (actual as number) < (expected as number);
    case "<=":
      return (actual as number) <= (expected as number);
    case "in":
      return Array.isArray(expected) && (expected as unknown[]).includes(actual);
    case "not-in":
      return Array.isArray(expected) && !(expected as unknown[]).includes(actual);
    case "array-contains":
      return Array.isArray(actual) && (actual as unknown[]).includes(expected);
    case "array-contains-any":
      return Array.isArray(actual) && Array.isArray(expected)
        && (expected as unknown[]).some((v) => (actual as unknown[]).includes(v));
    default:
      throw new Error(`Mock: unsupported operator ${op}`);
  }
}

export interface MockFirestore {
  collection(path: string): FakeCollectionRef;
  doc(path: string): FakeDocumentRef;
  batch(): FakeBatch;
  runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T>): Promise<T>;
  reset(): void;
  dump(): Array<{ path: string; data: DocData }>;
}

export function createMockFirestore(): MockFirestore {
  return {
    collection: (p) => new FakeCollectionRef(p),
    doc: (p) => new FakeDocumentRef(p),
    batch: () => new FakeBatch(),
    runTransaction: async (fn) => fn(new FakeTransaction()),
    reset: () => {
      store.clear();
      counter = 0;
    },
    dump: () => Array.from(store.entries()).map(([path, data]) => ({ path, data })),
  };
}

export {
  FakeCollectionRef,
  FakeDocumentRef,
  FakeSnapshot,
  FakeQuerySnapshot,
  FakeBatch,
  FakeTransaction,
};