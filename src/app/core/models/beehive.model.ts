export interface Queen {
  year: number;
}

export interface Beehive {
  id: number;
  uuid: string;
  name: string;
  apiaryId: number;
  queen: Queen | null;
}
