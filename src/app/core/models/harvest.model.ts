export type HarvestType = 'honey' | 'pollen' | 'royal jelly' | 'propolis';
export type HarvestUnit = 'kg' | 'libre' | 'lt' | 'gallon';

export interface Harvest {
  id: number;
  date: string;
  honey_type: HarvestType;
  honey_description: string;
  food_quantity: number;
  unit: HarvestUnit;
  beehive?: { id: number; name: string };
}

export const HARVEST_TYPES: { value: HarvestType; label: string }[] = [
  { value: 'honey',       label: 'Honey' },
  { value: 'pollen',      label: 'Pollen' },
  { value: 'royal jelly', label: 'Royal Jelly' },
  { value: 'propolis',    label: 'Propolis' },
];

export const HARVEST_UNITS: { value: HarvestUnit; label: string }[] = [
  { value: 'kg',     label: 'Kg' },
  { value: 'libre',  label: 'Libre' },
  { value: 'lt',     label: 'Lt' },
  { value: 'gallon', label: 'Gallon' },
];
