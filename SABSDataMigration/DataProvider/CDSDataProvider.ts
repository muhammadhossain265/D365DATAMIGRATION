import { IInputs } from "../generated/ManifestTypes";

import ICDSDataProvider from "./ICDSDataProvider";

export default class CDSDataProvider implements ICDSDataProvider {
  constructor(context: ComponentFramework.Context<IInputs>) {
    this.context = context;
  }

  private context: ComponentFramework.Context<IInputs>;

  async retrieveRecord(entity: string, id: string) {
    const result = await this.context.webAPI.retrieveRecord(entity, id);
    return result;
  }

  // getOptions(entity: string): Promise<any> {
  //     return this.retrieveMultipleRecords(entity, null, true).then(result => {
  //         return result.map((item: any) => {
  //         });
  // }

  getOptions(entity: string): Promise<any> {
    return this.retrieveMultipleRecords(entity, "", true).then((result) => {
      return result.map((item: any) => {
        return { TypeCode: item["attributevalue"], TypeText: item["value"] };
      });
    });
  }

  async retrieveMultipleRecords(
    entity: string,
    filter?: string,
    optionSet?: boolean
  ): Promise<any> {
    var options: string | undefined, optionSetFetch: string;

    options = filter;

    if (optionSet) {
      var optionSetFetch = `<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
            <entity name='stringmap' >
                <attribute name='attributevalue' />
                <attribute name='value' />
                <filter type='and' >
                    <condition attribute='attributename' operator='eq' value= '${entity}' />
                </filter>
            </entity>
        </fetch>`;

      options = "?fetchXml=" + encodeURIComponent(optionSetFetch);
      entity = "stringmap";
    }

    const result = await this.context.webAPI.retrieveMultipleRecords(
      entity,
      options
    );
    return result.entities;
  }

  async getEntityMetadata(entityName: string, attributes: string[]) {
    const result = await this.context.utils.getEntityMetadata(
      entityName,
      attributes
    );
    console.log(result);
    return result;
  }

  async createRecord(entity: string, data: any): Promise<string> {
    const result = await this.context.webAPI.createRecord(entity, data);
    return result.id;
  }

  async updateRecord(entity: string, id: string, data: any): Promise<string> {
    const result = await this.context.webAPI.updateRecord(entity, id, data);
    return result.id;
  }

  async deleteRecord(entity: string, id: string): Promise<string> {
    const result = await this.context.webAPI.deleteRecord(entity, id);
    return result.id;
  }
}
