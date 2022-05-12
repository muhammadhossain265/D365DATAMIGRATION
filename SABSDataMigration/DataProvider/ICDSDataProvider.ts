import { IAttribute } from "./../interfaces";
import { IChoiceItem } from "../interfaces";

export default interface ICDSDataProvider {
  retrieveMultipleRecords(
    entity: string,
    filter?: string,
    optionSet?: boolean
  ): Promise<any>;
  retrieveRecord(entity: string, id: string): Promise<any>;
  getEntityMetadata(entityName: string, attributes: string[]): Promise<any>;
  updateRecord: any;
  deleteRecord: any;
  createRecord: any;
  getOptions(enity: string, objecttypecode: number): Promise<IChoiceItem[]>;
  getAttributes(entity: string): Promise<IAttribute[]>;

  // getAssets: Promise<any>;
}
