export interface Queen {
  year: number;
}

export interface Beehive {
  id: number;
  name: string;
  queen: Queen | null;
}
