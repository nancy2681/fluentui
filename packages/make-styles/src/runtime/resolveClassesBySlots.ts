import { DEFINITION_LOOKUP_TABLE } from '../constants';
import { hashSequence } from './utils/hashSequence';
import { ClassnamesMapping } from '../makeStyles';

export function resolveClassesBySlots<Slots extends string>(
  classnamesMapping: ClassnamesMapping<Slots>,
  dir: 'ltr' | 'rtl',
) {
  const resolvedClasses = {} as Record<Slots, string>;

  // eslint-disable-next-line guard-for-in
  for (const slotName in classnamesMapping) {
    const classnamesMappingForSlot = classnamesMapping[slotName];
    let classnamesForSlot = '';

    // eslint-disable-next-line guard-for-in
    for (const propertyHash in classnamesMappingForSlot) {
      const propertyMapping: string | [string, string] = classnamesMappingForSlot[propertyHash];

      if (propertyMapping) {
        const hasRTLClassName = typeof propertyMapping === 'object';

        if (dir === 'rtl') {
          classnamesForSlot += (hasRTLClassName ? propertyMapping[1] : propertyMapping) + ' ';
        } else {
          classnamesForSlot += (hasRTLClassName ? propertyMapping[0] : propertyMapping) + ' ';
        }
      }
    }

    classnamesForSlot = classnamesForSlot.slice(0, -1);

    const sequenceHash = hashSequence(classnamesForSlot, dir);

    const resultSlotClasses = sequenceHash + ' ' + classnamesForSlot;

    DEFINITION_LOOKUP_TABLE[sequenceHash] = [classnamesMapping[slotName], dir];
    resolvedClasses[slotName] = resultSlotClasses;
  }

  return resolvedClasses;
}
