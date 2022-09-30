import { IField } from "./../Component";
import { IAttribute, IChoiceItem, IResponse } from "./../interfaces";
import { IInputs } from "../generated/ManifestTypes";

import ICDSDataProvider from "./ICDSDataProvider";
import { getPropertyValue, setObjectProperty } from "../Utilities";
import { IDropdownOption } from "@fluentui/react";
import { AttributeType } from "../enums";
import { resolve } from "path";
import { url } from "inspector";

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

  getOptions(entity: string, objecttypecode?: number): Promise<IChoiceItem[]> {
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

    if (filter != 'paging')
      options = filter;

    if (optionSet) {
      var objTypeTag = "";
      if (objecttypecode)
        objTypeTag = `<condition attribute="objecttypecode" operator="eq" value='${objecttypecode}' />`;
      var optionSetFetch = `<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
            <entity name='stringmap' >
                <attribute name='attributevalue' />
                <attribute name='value' />
                <filter type='and' >
                    <condition attribute='attributename' operator='eq' value= '${entity}' />
                    ${objTypeTag}
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

    if (filter == 'paging')
      return result;
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
        "')/Attributes?&$filter=AttributeOf%20eq%20null",
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
            let attributes: IAttribute[] = [];
            result.value.map((attribute: any) => {
              if (attribute) {
                let attrb: IAttribute = {
                  LogicalName: attribute.LogicalName,
                  Label: attribute.DisplayName?.UserLocalizedLabel?.Label,
                  AttributeType: attribute.AttributeType,
                  SchemaName: attribute.SchemaName
                };
                switch (attribute.AttributeType.toString()) {
                  case AttributeType.Lookup.toString():
                  case AttributeType.Customer.toString():
                    setObjectProperty(attrb, "Targets", attribute.Targets);
                    break;
                }
                attributes.push(attrb);
              }
            });
            resolve(attributes);
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

  addAttribute(entity: string, field: IField): Promise<boolean> {
    var xhr = new XMLHttpRequest();
    var baseUrl = this.getBaseUrl();

    xhr.open(
      "POST",
      baseUrl + `/api/data/v9.1/EntityDefinitions(${entity})/Attributes`,
      true
    );

    xhr.setRequestHeader("Accept", "pplication/json");
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    xhr.setRequestHeader("OData-MaxVersion", "4.0");
    xhr.setRequestHeader("OData-Version", "4.0");

    return new Promise(function (resolve, reject) {
      let attr = {
        AttributeType: "String",
        AttributeTypeName: {
          Value: "StringType",
        },
        Description: {
          "@odata.type": "Microsoft.Dynamics.CRM.Label",
          LocalizedLabels: [
            {
              "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
              Label: field.label,
              LanguageCode: 1033,
            },
          ],
        },
        DisplayName: {
          "@odata.type": "Microsoft.Dynamics.CRM.Label",
          LocalizedLabels: [
            {
              "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
              Label: field.label,
              LanguageCode: 1033,
            },
          ],
        },
        RequiredLevel: {
          Value: "None",
          CanBeChanged: true,
          ManagedPropertyLogicalName: "canmodifyrequirementlevelsettings",
        },
        SchemaName: field.name,
        "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
        FormatName: {
          Value: "Text",
        },
        MaxLength: 100,
      };
      xhr.send(JSON.stringify(attr));
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          // If successful         
          resolve(true);
        } else {
          // If failed
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.setRequestHeader("OData-MaxVersion", "4.0");
      xhr.setRequestHeader("OData-Version", "4.0");
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
      xhr.send();
    });
  }

  relaterow(entity: string, id: string, relationship: string, value: string): Promise<boolean> {
    var xhr = new XMLHttpRequest();
    var baseUrl = this.getBaseUrl();
    var url = baseUrl + `/api/data/v9.2/${entity}s(${id})`;

    xhr.open(
      "POST",
      url,
      true
    );

    xhr.setRequestHeader("Accept", "pplication/json");
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    xhr.setRequestHeader("OData-MaxVersion", "4.0");
    xhr.setRequestHeader("OData-Version", "4.0");

    

    return new Promise(function (resolve, reject) {
      let attr = {
        "ewosa_incident_ewosa_systemicissue@odata.bind": `ewosa_systemicissues(${value})`
      };
      //xhr.send(JSON.stringify(attr));
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          // If successful         
          resolve(true);
        } else {
          // If failed
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      
      xhr.setRequestHeader("OData-MaxVersion", "4.0");
      xhr.setRequestHeader("OData-Version", "4.0");
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
      xhr.send(JSON.stringify(attr));
    });
  }

  createAssociatedRequest(decisionId: string, complianceReferralId: string) {
    var baseUrl = this.getBaseUrl();
    var associatedReferralDecision = {
        "@odata.id": baseUrl + "/api/data/v9.1/new_decisions(" + decisionId + ")"
    };

    var req = new XMLHttpRequest();
    req.open("POST", baseUrl + "/api/data/v9.1/new_compliancereferrals(" + complianceReferralId + ")/new_decisionslinkedtoreferrals/$ref", false);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {
        if (this.readyState == 4 /* complete */) {
            req.onreadystatechange = null;
            if (this.status == 204) {
                var accountUri = this.getResponseHeader("OData-EntityId");
            } else {
                var error = JSON.parse(this.response).error;
                alert(error.message);
            }
        }
    };
    req.send(JSON.stringify(associatedReferralDecision));
}


  getEntities(
    onlyActivities: string,
    supportsActivities: string
  ): Promise<IDropdownOption[]> {
    var req = new XMLHttpRequest();
    var baseUrl = this.getBaseUrl();

    return new Promise(function (resolve, reject) {
      var filter =
        "IsValidForAdvancedFind%20eq%20true%20and%20IsCustomizable/Value%20eq%20true";
      if (onlyActivities !== "All") {
        filter = filter + "%20and%20IsActivity%20eq%20true";
      }
      if (supportsActivities !== "All") {
        filter = filter + "%20and%20HasActivities%20eq%20true";
      }
      //filter += '&$orderby=DisplayName'
      req.open(
        "GET",
        baseUrl +
        "/api/data/v9.1/EntityDefinitions?$select=LogicalName,DisplayName&$filter=" +
        filter,
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

            var options: IDropdownOption[] = [];
            result.value.map((item: any) => {
              options.push({
                key: item.LogicalName,
                text: item.DisplayName.UserLocalizedLabel.Label,
              });
            });

            resolve(options);
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

  getPagingEntities(url: string) {

    var req = new XMLHttpRequest();
    var baseUrl = this.getBaseUrl();

    return new Promise(function (resolve, reject) {      
      req.open(
        "GET",
        url,
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

            resolve(result);
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

  async getEntityMetadata(entityName: string, attributes: string[]) {
    const result = await this.context.utils.getEntityMetadata(
      entityName,
      attributes
    );
    console.log(result);
    return result;
  }

  async createRecord1(entity: string, data: any): Promise<string> {
    const result = await this.context.webAPI.createRecord(entity, data);
    return result.id;
  }

  async createRecord(entity: string, data: any): Promise<IResponse> {
    var response: IResponse = {};
    const result = await this.context.webAPI.createRecord(entity, data).then(
      function success(result) {
        response.value = result.id;
        return response;
      },
      function (error) {
        response.errorCode = error.errorCode;
        response.message = error.message;
        return response;
      }
    );

    return Promise.resolve(result);
  }

  async updateRecord(entity: string, id: string, data: any): Promise<IResponse> {
    var response: IResponse = {};
    const result = await this.context.webAPI.updateRecord(entity, id, data).then(
      function success(result) {
        response.value = result.id;
        return response;
      },
      function (error) {
        response.errorCode = error.errorCode;
        response.message = error.message;
        return response;
      }
    );

    return result;
  }

  async deleteRecord(entity: string, id: string): Promise<IResponse> {
    var response: IResponse = {};
    const result = await this.context.webAPI.deleteRecord(entity, id).then(
      function success(result) {
        response.value = result.id;
        return response;
      },
      function (error) {
        response.errorCode = error.errorCode;
        response.message = error.message;
        return response;
      }
    );
    return result;
  }

  getBaseUrl(): string {
    return getPropertyValue(this.context, "page").getClientUrl();
  }
}
