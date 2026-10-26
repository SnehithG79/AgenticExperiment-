// In-memory state store for processed ticket IDs.

export function createMemoryStore(initialIds = []) {
  const ids = new Set(initialIds);
  return {
    has: id => ids.has(id),
    add: id => { ids.add(id); },
  };
}
