import { IField } from "../Component";
import { IInputs } from "../generated/ManifestTypes";
import {
  addPropertyToOobject,
  getChoiceFieldValue,
  GetValue,
  parseObj,
  _setLookupFieldValue,
} from "../Utilities";
import CDSDataProvider from "./CDSDataProvider";
import ICDS from "./ICDSD";
import ICDSDataProvider from "./ICDSDataProvider";

export default class CDS implements ICDS {
  constructor(context: ComponentFramework.Context<IInputs>) {
    this.context = context;
    this._dataProvider = new CDSDataProvider(context);
  }

  private _dataProvider: ICDSDataProvider;
  private context: ComponentFramework.Context<IInputs>;

  closecase(incident: any): Promise<any> {

    var incidentresolution = {
      "subject": 'Closed as part of Data Migation',
      "incidentid@odata.bind": `/incidents(${incident.incidentid})`,
      "timespent": incident.ewosa_timespent ? incident.ewosa_timespent : 0,
      "description": 'Closed as part of Data Migaration'
    };

    var parameters = {
      "IncidentResolution": incidentresolution,
      "Status": -1
    };

    var req = new XMLHttpRequest();
    return new Promise(function (resolve, reject) {
      var url = window.location.origin + "/api/data/v9.2/CloseIncident";
      req.open("POST", url, true);
      req.setRequestHeader("OData-MaxVersion", "4.0");
      req.setRequestHeader("OData-Version", "4.0");
      req.setRequestHeader("Accept", "application/json");
      req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
      req.onreadystatechange = function () {
        if (this.readyState === 4) {
          req.onreadystatechange = null;
          if (this.status === 204) {
            resolve(req.responseText);
          } else {
            resolve(this.responseText);
          }
        }
      };

      req.send(JSON.stringify(parameters));
    });
  }

  getactivecases(top?: number): Promise<any> {
    var filter = '?$filter=statecode eq 0';
    if (top)
      filter += `&$top=${top}`;
    return this._dataProvider.retrieveMultipleRecords('incident', filter);
  }

  getItems(entity: string, fields: IField[], filter?: string): Promise<any> {
    return this._dataProvider
      .retrieveMultipleRecords(entity, filter)
      .then((result) => {
        return result.map((activity: any) => {
          return parseObj(activity, fields);
        });
      });
  }

  deactivateitem(entity: string, sabsid: string,): Promise<any> {
    return this.getitembysabsid(entity, sabsid).then(result => {
      if (result) {
        var id = result[`${entity}id`];
        if (id) {
          return this._dataProvider.updateRecord(entity, id, {statecode: 1});
        }
        else {
          alert(`Could not find primary key for SABSID ${sabsid}`);
          return null;
        }
      }
    })
  }

  getitembysabsid(entity: string, sabsid: string): Promise<any> {
    return this._dataProvider.retrieveMultipleRecords(entity, `?$filter=sabs_sabsid eq '${sabsid}' and statecode eq 0`).then(result => {
      if (result.length > 0)
        return result[0];
      return null;
    })
  }
}
