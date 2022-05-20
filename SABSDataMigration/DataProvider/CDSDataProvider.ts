import { IAttribute, IChoiceItem } from "./../interfaces";
import { IInputs } from "../generated/ManifestTypes";

import ICDSDataProvider from "./ICDSDataProvider";
import { getPropertyValue } from "../Utilities";
import { IDropdownOption } from "@fluentui/react";

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

  getOptions(entity: string, objecttypecode: number): Promise<IChoiceItem[]> {
    return this.retrieveMultipleRecords(entity, "", true, objecttypecode).then(
      (result) => {
        return result.map((item: any) => {
          return { TypeCode: item["attributevalue"], TypeText: item["value"] };
        });
      }
    );
  }

  async retrieveMultipleRecords(
    entity: string,
    filter?: string,
    optionSet?: boolean,
    objecttypecode?: number
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
                    <condition attribute="objecttypecode" operator="eq" value='${objecttypecode}' />
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

  getAttributes(entity: string): Promise<IAttribute[]> {
    var req = new XMLHttpRequest();
    var baseUrl = this.getBaseUrl();

    return new Promise(function (resolve, reject) {
      req.open(
        "GET",
        baseUrl +
          "/api/data/v9.1/EntityDefinitions(LogicalName='" +
          entity +
          "')/Attributes?$select=LogicalName,DisplayName,AttributeType&$filter=AttributeOf%20eq%20null",
        true
      );
      req.onreadystatechange = function () {
        if (req.readyState !== 4) return;
        if (req.status >= 200 && req.status < 300) {
          // If successful
          try {
            var result = JSON.parse(req.responseText);
            if (parseInt(result.StatusCode) < 0) {
              reject({
                status: result.StatusCode,
                statusText: result.StatusMessage,
              });
            }
            resolve(result.value);
          } catch (error) {
            throw error;
          }
        } else {
          // If failed
          reject({
            status: req.status,
            statusText: req.statusText,
          });
        }
      };
      req.setRequestHeader("OData-MaxVersion", "4.0");
      req.setRequestHeader("OData-Version", "4.0");
      req.setRequestHeader("Accept", "application/json");
      req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
      req.send();
    });
  }

  getEntities(onlyActivities: string, supportsActivities:string):Promise<IDropdownOption[]> {
		var req = new XMLHttpRequest();
		var baseUrl=this.getBaseUrl();

		return new Promise(function (resolve, reject) {
			var filter="IsValidForAdvancedFind%20eq%20true%20and%20IsCustomizable/Value%20eq%20true";
			if (onlyActivities!=="All"){
				filter=filter+"%20and%20IsActivity%20eq%20true";
			}
			if (supportsActivities!=="All"){
				filter=filter+"%20and%20HasActivities%20eq%20true";
			}
			req.open("GET", baseUrl + "/api/data/v9.1/EntityDefinitions?$select=LogicalName,DisplayName&$filter="+filter, true);
			req.onreadystatechange = function () {
				
				if (req.readyState !== 4) return;
				if (req.status >= 200 && req.status < 300) {
					
					// If successful
					try {
						
						var result = JSON.parse(req.responseText);
						if (parseInt(result.StatusCode) < 0) {
							reject({
								status: result.StatusCode,
								statusText: result.StatusMessage
							});
						}

            var options: IDropdownOption[] = [];
            result.value.map((item: any) => {
              options.push({key: item.LogicalName, text: item.DisplayName.UserLocalizedLabel.Label})
            })

						resolve(options);
					}
					catch (error) {
						throw error;
					}

				} else {
					// If failed
					reject({
						status: req.status,
						statusText: req.statusText
					});
				}

			};
			req.setRequestHeader("OData-MaxVersion", "4.0");
			req.setRequestHeader("OData-Version", "4.0");
			req.setRequestHeader("Accept", "application/json");
			req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			req.send();
		});
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

  getBaseUrl(): string {
    return getPropertyValue(this.context, "page").getClientUrl();
  }
}
