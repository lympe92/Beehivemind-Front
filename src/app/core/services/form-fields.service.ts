import { Injectable } from '@angular/core';
import { FieldOption } from '../models/form-fields.model';

@Injectable({
  providedIn: 'root',
})
export class FormFieldsService {
  getSelectFieldSelectedItems(fieldOptions: FieldOption[], selectedValue: any | any[]): string {
    if (selectedValue === null || selectedValue === undefined) return '';

    const isMultiple = Array.isArray(selectedValue);
    if (!isMultiple) {
      const option = fieldOptions.find(opt => opt.returnValue === selectedValue);
      return option?.displayValue || '';
    }

    const result = selectedValue.map(
      (id: any) => fieldOptions?.find(option => option.returnValue === id)?.displayValue ?? '',
    );
    return result.length === 0
      ? ''
      : result.length === 1
        ? result[0]
        : `${result[0]} (+${result.length - 1} Others)`;
  }

  getSelectFieldNewValue(multiple: boolean, selectedValue: any | any[], option: FieldOption) {
    return multiple
      ? this.updateMultipleSelection(selectedValue, option.returnValue)
      : option.returnValue;
  }

  private updateMultipleSelection(currentSelections: any, newSelection: any): string[] | null {
    const currentSelectionsArray = Array.isArray(currentSelections)
      ? currentSelections
      : [currentSelections];
    const newSelectionArray = Array.isArray(newSelection) ? newSelection : [newSelection];
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
    input: any,
    displayValueKey: string,
    returnValueKey: string,
    searchableValuesKeys?: string[],
    dropdownDisplayValueKey?: string,
  ): FieldOption {
    const obj: FieldOption = {
      displayValue: input[displayValueKey] || '',
      returnValue: input[returnValueKey] || '',
      dropdownDisplayValue: dropdownDisplayValueKey
        ? input[dropdownDisplayValueKey]?.toString()
        : undefined,
    };
    if (searchableValuesKeys) obj.searchableValues = searchableValuesKeys.map(key => input[key]);
    return obj;
  }
}
