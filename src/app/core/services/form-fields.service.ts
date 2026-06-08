import { Injectable } from '@angular/core';
import { FieldOption } from '../models/form-fields.model';

@Injectable({
  providedIn: 'root',
})
export class FormFieldsService {
  getSelectFieldSelectedItems(fieldOptions: FieldOption[], selectedValue: unknown): string {
    if (selectedValue === null || selectedValue === undefined) return '';

    if (!Array.isArray(selectedValue)) {
      const option = fieldOptions.find(opt => opt.returnValue === selectedValue);
      return option?.displayValue || '';
    }

    const result = selectedValue.map(
      id => fieldOptions?.find(option => option.returnValue === id)?.displayValue ?? '',
    );
    return result.length === 0
      ? ''
      : result.length === 1
        ? result[0]
        : `${result[0]} (+${result.length - 1} Others)`;
  }

  getSelectFieldNewValue(multiple: boolean, selectedValue: unknown, option: FieldOption) {
    return multiple
      ? this.updateMultipleSelection(selectedValue, option.returnValue)
      : option.returnValue;
  }

  private updateMultipleSelection(currentSelections: unknown, newSelection: unknown): string[] | null {
    const currentSelectionsArray = (
      Array.isArray(currentSelections) ? currentSelections : [currentSelections]
    ) as string[];
    const newSelectionArray = (
      Array.isArray(newSelection) ? newSelection : [newSelection]
    ) as string[];
    return this.mergeArraysWithoutDuplicates(currentSelectionsArray, newSelectionArray);
  }

  mergeArraysWithoutDuplicates(array1: string[], array2: string[]): string[] | null {
    const uniqueToArray1 = array1.filter(item => !array2.includes(item) && item != null);
    const uniqueToArray2 = array2.filter(item => !array1.includes(item) && item != null);
    return [...uniqueToArray1, ...uniqueToArray2].length > 0
      ? [...uniqueToArray1, ...uniqueToArray2]
      : null;
  }

  convertToFieldOption(
    input: Record<string, unknown>,
    displayValueKey: string,
    returnValueKey: string,
    searchableValuesKeys?: string[],
    dropdownDisplayValueKey?: string,
  ): FieldOption {
    const obj: FieldOption = {
      displayValue: (input[displayValueKey] as string) || '',
      returnValue: (input[returnValueKey] as FieldOption['returnValue']) || '',
      dropdownDisplayValue: dropdownDisplayValueKey
        ? (input[dropdownDisplayValueKey] as { toString(): string } | undefined)?.toString()
        : undefined,
    };
    if (searchableValuesKeys) {
      obj.searchableValues = searchableValuesKeys.map(key => String(input[key]));
    }
    return obj;
  }
}