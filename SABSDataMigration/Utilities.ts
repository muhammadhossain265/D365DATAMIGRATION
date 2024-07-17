import { IColumn } from "@fluentui/react";
import { text } from "stream/consumers";
import { IField } from "./Component";
import ICDSDataProvider from "./DataProvider/ICDSDataProvider";
import { AttributeType } from "./enums";
import { clients } from "./Environments";
import { FieldType } from "./FieldType";
import { IChoice, ILookup } from "./interfaces";
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

export function getPropertyValue(obj: any, prop: string) {
  if (obj && prop && prop != "") return obj[prop];
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

export function getVirtualItemValue(
  choices: IChoice[],
  pickList: string,
  choiceText: string
): string {

  let typecodes = '';
  let values = choiceText.split(',');
  values.map(pickl => {
    if (typecodes.length > 0)
      typecodes += ',';

    typecodes += getPicklistItemValue(choices, pickList, pickl.trim());
  });

  return typecodes;
}

export function getPicklistItemValue(
  choices: IChoice[],
  pickList: string,
  choiceText: string
): string {
  let choice = choices.find((choice) => choice.key == pickList);
  if (choice) {
    var choiceItem = choice.value.find((item) => item.TypeText.toLowerCase() == choiceText.toString().toLowerCase());
    if (choiceItem) return choiceItem.TypeCode;
    else
      alert(`Choice Item ${choiceText} does not exist in Choice ${pickList}`);
  } else alert(`Choice ${pickList} does not exist`);

  return "";
}

export function getLookupFieldValue(
  lookups: ILookup[],
  key: string,
  value: string,
  targets?: string[]
): string {

  var property = '';
  if (targets && targets.length > 0) {
    targets.map((target: string) => {
      if (property == '') {
        property = findLookupValue(lookups, key, value, target);
        if (property != '')
          return;
      }
    });
  }

  // let lookup = lookups.find((lookup) => lookup.key == target);
  // if (lookup) {
  //   var fieldName = 'sabs_sabsid';
  //   if (target) {
  //     switch (target) {
  //       case 'systemuser':
  //         fieldName = 'domainname'
  //         break;
  //         case 'account':
  //         case 'contact':
  //         fieldName = 'emailaddress1'
  //         break;
  //     }
  //   }
  //   if (target && target == 'systemuser')
  //     fieldName = 'domainname'
  //   var itm = lookup.value.find((item: any) => item[fieldName] == value);
  //   if (itm)
  //     return `/${lookup.entity._entitySetName}(${itm[lookup.entity._primaryIdAttribute]
  //       })`;
  //   else alert(`Lookup Item ${value} does not exist in Lookup ${key}`);
  // } else alert(`Lookup ${key} does not exist`);

  if (property == '')
    alert(`Lookup Item ${value} does not exist in Lookups ${targets?.join(',')}`);
  return property;
}

export function findLookupValue(lookups: ILookup[],
  key: string,
  value: string,
  target?: string) {

  let lookup = lookups.find((lookup) => lookup.key == target);
  if (lookup) {
    var fieldName = 'sabs_sabsid';
    if (target) {
      switch (target) {
        case 'systemuser':
          fieldName = 'domainname'
          break;
        // case 'account':
        // case 'contact':
        //   fieldName = 'emailaddress1'
        //   break;
      }
    }
    var itm = lookup.value.find((item: any) => item[fieldName] && item[fieldName].toLowerCase() == value.toString().toLowerCase());
    if (!!itm)
      return `/${lookup.entity._entitySetName}(${itm._primaryIdAttribute})`;
    //else alert(`Lookup Item ${value} does not exist in Lookup ${key}`);
  } else alert(`Lookup ${target} does not exist`);

  return "";

}

export function getBooleanFieldValue(obj: any, fieldname: string) {
  var value = obj[fieldname + "@OData.Community.Display.V1.FormattedValue"];
  if (value) return value;
  return "No";
}

export function getBooleanFieldKey(value: string) {
  if (value && value.length > 0) {
    if (value == "Yes") return true;
    return false;
  }
}

export function parseObj(obj: any, files: IField[]) {
  let objOut: any = {};
  files.map((field) => {
    objOut[field.name] = obj[field.name];
    switch (field.AttributeType) {
      case AttributeType.Picklist.toString():
        objOut[field.name + "text"] = getChoiceFieldValue(obj, field.name);
        break;
      case AttributeType.Boolean.toString():
        objOut[field.name] = getChoiceFieldValue(obj, field.name);
        break;
      case AttributeType.Lookup.toString():
      case AttributeType.Customer.toString():
        _setLookupFieldValue(objOut, obj, field.name, field.name);
        break;

    }
  });

  return objOut;
}

export function getGridColumns(fields: IField[]): IColumn[] {
  var minWidth = 1400 / fields.length;
  return fields.map((field) => {
    var fieldName = field.name;
    switch (field.AttributeType) {
      case AttributeType.Picklist.toString():
        fieldName = field.name + "text";
    }
    return {
      key: fieldName,
      fieldName: fieldName,
      name: field.label,
      minWidth: minWidth,
    };
  });
}

export function getLocalDateAndTimeString(date: Date) {
  if (date) {
    return date.toLocaleDateString('en-au') + ' ' + date.toLocaleTimeString('en-au');
  }

  return '';
}

export function getLocalDateString(date: Date) {
  if (date) {
    return date.toLocaleDateString('en-au');
  }

  return '';
}

export function setAttributeValue(name: string, value: any) {
  if (value) {
    // @ts-ignore
    var attribute = Xrm.Page.getAttribute(name);
    if (attribute)
      attribute.setValue(value.toString());
  }
}

export function getAttributeValue(name: string): any {
  if (name) {
    // @ts-ignore
    var attribute = Xrm.Page.getAttribute(name);
    if (attribute)
      return attribute.getValue();
    return '';
  }
}
export function isValidClient() {
  var url = window.location.href;
  var validclient = clients.find(client => url.includes(client.url));
  if (validclient) {
    if (validclient.exmpiry > new Date())
      return true;
    else alert(`Your Data Migration Tool subscription expired on ${getLocalDateString(validclient.exmpiry)}. \n Please contact Smart App Business Solutions Pty Ltd.`);
    return false;
  }
  else
    alert(`You do not have a valid subscription for Data Migration Tool.\n Please contact Smart App Business Solutions Pty Ltd.`);
  return false;
}

export function enclosedInQuote(str: string): boolean {
  return str[0] == "'" && str[str.length - 1] == "'"  
}

export function getCleanString(str: string): string {
  return str.replace(/["']/g, "");
}

// new Date().toLocaleTimeString()
// for (let i = 0; i < 500; i++) {
//   task(i);
//   if (i == 499)
//   new Date().toLocaleTimeString()
// }


// function task(i: number) {
//   var interval = i % 50 == 0 ? 2000 : 0;
//   setTimeout(function () {
//     console.log(i);
//   }, interval);
// }