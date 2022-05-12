import { AttributeType } from "./enums";

export interface IChoice {
  key: string;
  value: IChoiceItem[];
}

export interface IChoiceItem {
  TypeCode: string;
  TypeText: string;
}

export interface IAttribute {
  LogicalName: string;
  AttributeType: string;
}
