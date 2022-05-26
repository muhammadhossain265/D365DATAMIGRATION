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
  

  getItems(entity: string, fields: IField[], filter?: string): Promise<any> {
    return this._dataProvider
      .retrieveMultipleRecords(entity, filter)
      .then((result) => {
        return result.map((activity: any) => {
          return parseObj(activity, fields);
          
        });
      });

    //throw new TypeError("No implemented");
  }
}
