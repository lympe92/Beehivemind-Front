export type FeedingType = 'stimulation' | 'maintenance';
export type FoodType = 'pollen patties' | 'sugar syrup' | 'fresh pollen' | 'fondant' | 'nutritional supplement';
export type FeedingUnit = 'kg' | 'libre' | 'lt' | 'gallon';

export interface Feeding {
  id: number;
  date: string;
  feeding_type: FeedingType;
  food_type: FoodType;
  food_quantity: number;
  unit: FeedingUnit;
  beehive?: { id: number; name: string };
}

export const FEEDING_TYPES: { value: FeedingType; label: string }[] = [
  { value: 'stimulation', label: 'Stimulation' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const FOOD_TYPES: { value: FoodType; label: string }[] = [
  { value: 'pollen patties', label: 'Pollen Patties' },
  { value: 'sugar syrup', label: 'Sugar Syrup' },
  { value: 'fresh pollen', label: 'Fresh Pollen' },
  { value: 'fondant', label: 'Fondant' },
  { value: 'nutritional supplement', label: 'Nutritional Supplement' },
];

export const FEEDING_UNITS: { value: FeedingUnit; label: string }[] = [
  { value: 'kg', label: 'Kg' },
  { value: 'libre', label: 'Libre' },
  { value: 'lt', label: 'Lt' },
  { value: 'gallon', label: 'Gallon' },
];
