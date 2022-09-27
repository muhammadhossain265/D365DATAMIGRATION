import { AttributeType } from "./enums";

export interface IChoice {
  key: string;
  value: IChoiceItem[];
}

export interface ILookup {
  key: string;
  value: any;
  entity: any;
  loaded: boolean;
}

export interface IChoiceItem {
  TypeCode: string;
  TypeText: string;
}

export interface IAttribute {
  LogicalName: string;
  Label: string;
  AttributeType: string;
  SchemaName: string;
  Targets?: string[];
}

export interface ILookupEntity {
  sabs_sabsid: string;
  _primaryIdAttribute: string;
}

export interface IResponse {
  value?: any;
  errorCode?:string;
  message?: string;
}

export interface IError {
  SABSID: string;
  Error: string;
}

export interface IEntity
{
  key: string;
  text: string;
  primaryentity: string;
  relationship: string;  
}
