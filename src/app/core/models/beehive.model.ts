export interface Queen {
  year: number;
}

/**
 * A hive is known by its number — never a name. The number is an integer ≥ 1,
 * unique within its apiary; the API numbers new hives itself (max + 1).
 */
export interface Beehive {
  id: number;
  uuid: string;
  number: number;
  apiaryId: number;
  queen: Queen | null;
}

/** "Beehive 12" — how every page names a hive. */
export function beehiveLabel(hive: Pick<Beehive, 'number'>): string {
  return `Beehive ${hive.number}`;
}

/** "#12" — where space is tight: a table cell under a "Beehive" header. */
export function beehiveTag(hive: Pick<Beehive, 'number'>): string {
  return `#${hive.number}`;
}

/** Hive lists read in number order, an apiary's hives together. */
export function compareBeehives(a: Beehive, b: Beehive): number {
  return a.apiaryId - b.apiaryId || a.number - b.number || a.id - b.id;
}
