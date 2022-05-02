import { text } from "stream/consumers";
import ICDSDataProvider from "./DataProvider/ICDSDataProvider";
export function GetValue(value: any): any {
  if (value != undefined && value != null) return value;
}

export function _setLookupFieldValue(
  item: any,
  itemReceived: any,
  field: string,
  newFieldName?: string
) {
  var receivedField = `_${field}_value`,
    fieldName = `${field}name`,
    receivedFieldName = `_${field}_value@OData.Community.Display.V1.FormattedValue`;

  if (itemReceived[receivedField]) {
    item[field] = itemReceived[receivedField];
    item[fieldName] = itemReceived[receivedFieldName];
    if (newFieldName) item[newFieldName] = itemReceived[receivedFieldName];
  }
}

export function _getLastFewDigits(text: string, noOfDigits: number) {
  if (text && text.length > noOfDigits) return text.substring(text.length - 4);
  return "";
}

//   export function getLookupFieldValue(itemReceived: any, field: string) {
//     var receivedField = `_${field}_value`,
//       fieldName = `${field}name`,
//       receivedFieldName = `_${field}_value@OData.Community.Display.V1.FormattedValue`

//     if (itemReceived[receivedField]) {
//       item[field] = itemReceived[receivedField];
//       item[fieldName] = itemReceived[receivedFieldName];

//     }
//   }

export function getChoiceFieldValue(item: any, field: string): any {
  var receivedFieldName = `${field}@OData.Community.Display.V1.FormattedValue`;

  if (item[field]) {
    return item[receivedFieldName];
  }

  return "";
}

export const getVariance = (
  previousYear: number,
  currentYear: number
): number => {
  let c,
    p,
    r = 0;

  c = currentYear ? currentYear : 0;
  p = previousYear ? previousYear : 0;
  r = p ? ((c - p) * 100) / p : 0;

  return Number(r.toFixed(2));
};

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export type Order = "asc" | "desc";

export function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
export function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export function addPropertyToOobject(
  obj: any,
  parameter: string,
  value: any
): any {
  obj[parameter] = value;
  return obj;
}

export function getNextWord(value?: string): string {
  return value ? " " + value : "";
}

export function setObjectProperty(
  object: any,
  propertyName: string,
  value: any
) {
  object[propertyName] = value;
}
