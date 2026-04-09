import { Beehive } from './beehive.model';

export interface Inspection {
  id: number;
  date: string;
  beehive: Beehive;
  population: number;
  frame_space: number;
  pollen: number;
  honey: number;
  opened_brood: number;
  closed_brood: number;
  varroa: 0 | 1;
  american_foulbrood: 0 | 1;
  european_foulbrood: 0 | 1;
  nosema: 0 | 1;
}

export interface AvgInspection {
  date: string;
  population: number;
  frame_space: number;
  pollen: number;
  honey: number;
  opened_brood: number;
  closed_brood: number;
}