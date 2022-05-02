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
  getOptions(enity: string): any;

  // getAssets: Promise<any>;
}
