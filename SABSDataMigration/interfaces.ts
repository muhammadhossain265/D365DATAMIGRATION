import { AttributeType } from "./enums";

export interface IChoice {
  key: string;
  value: IChoiceItem[];
}

export interface ILookup {
  key: string;
  value: any;
  entity: any;
}

export interface IChoiceItem {
  TypeCode: string;
  TypeText: string;
}

export interface IAttribute {
  LogicalName: string;
  Label: string;
  AttributeType: string;
  Targets?: string[];
}
