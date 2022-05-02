import React = require("react");
import CSVReader from "react-csv-reader";
import CDSDataProvider from "./DataProvider/CDSDataProvider";
import ICDSDataProvider from "./DataProvider/ICDSDataProvider";
import { IInputs } from "./generated/ManifestTypes";

import Select from "react-select";
import { addPropertyToOobject } from "./Utilities";

export default class Component extends React.Component<
  ComponentFramework.Context<IInputs>,
  IState
> {
  constructor(props: ComponentFramework.Context<IInputs>) {
    super(props);

    var entityId = "";
    if (window.location.hostname != "localhost") {
      // @ts-ignore
      entityId = Xrm.Page.data.entity._entityId.guid;
    }
    this.buttonClick = this.buttonClick.bind(this);
    this.addField = this.addField.bind(this);
    this.importToCDS = this.importToCDS.bind(this);

    this._dataProvider = new CDSDataProvider(props);

    this.state = {
      fields: [],
      cdsFields: [],
      csvFields: [],
      data: [],
    };
  }

  private _dataProvider: ICDSDataProvider;

  private importToCDS() {
    let { data, fields } = this.state;
    if (data.length > 0) {
      data.map((item: any) => {
        var inputData = {};
        fields.map((field: IField) => {
          if (field.name && field.name != "")
            addPropertyToOobject(inputData, field.name, item[field.csvfield]);
        });
        this._dataProvider.updateRecord("contact", inputData);
      });
    }
  }

  private addField() {
    let { fields } = this.state;
    fields.push({ name: "", csvfield: "" });
    this.setState({ fields });
  }

  private buttonClick() {
    var tableName = "contact";
    var attributes: string[] = [];
    this._dataProvider
      .getEntityMetadata(tableName, attributes)
      .then((result) => {
        console.log(result);
      });
    alert("Yes, got it!!");
  }

  handleForce = (data: any, fileInfo: any) => {
    let csvFields: ISelectionOption[] = [];

    if (data.length > 0) {
      var fieldNames: string[] = Object.keys(data[0]);
      fieldNames.map((fieldName) => {
        csvFields.push({ value: fieldName, label: fieldName });
      });
      this.setState({ data, csvFields });
    }
    console.log(data, fileInfo);
  };

  papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header: any) => header.toLowerCase().replace(/\W/g, "_"),
  };

  public componentDidMount() {
    let cdsFields: ISelectionOption[] = [];
    this._dataProvider.getEntityMetadata("contact", []).then((result) => {
      if (result._entityDescriptor.AttributeNames.length > 0) {
        result._entityDescriptor.AttributeNames.map((field: string) => {
          cdsFields.push({ value: field, label: field });
        });
        this.setState({ cdsFields });
      }
      console.log(result);
    });
  }

  public render() {
    let { fields } = this.state;
    return (
      <div>
        <table>
          <tr>
            <td>Table Name</td>
            <td>
              <input />
            </td>
          </tr>
        </table>
        <button onClick={this.buttonClick}>click me</button>
        <CSVReader
          cssClass="react-csv-input"
          label="Choose file"
          onFileLoaded={this.handleForce}
          parserOptions={this.papaparseOptions}
        />
        <p>and then open the console</p>
        <table>{fields.map((filed) => this._row())}</table>
        <br />
        <button onClick={this.addField}>Add field</button>
        <button onClick={this.importToCDS}>Iport to CDS</button>
      </div>
    );
  }

  private _row() {
    let { cdsFields, csvFields } = this.state;

    return (
      <tr>
        <td>Field Name: </td>
        <td>
          <Select options={cdsFields} />
        </td>
        <td>CSV Field: </td>
        <td>
          <Select options={csvFields} />
        </td>
        <td>Lookup Table Name: </td>
        <td>
          <input />
        </td>
      </tr>
    );
  }
}

export interface IState {
  fields: IField[];
  cdsFields: ISelectionOption[];
  csvFields: ISelectionOption[];
  data: any;
}

export interface IField {
  name: string;
  csvfield: string;
}

export interface ISelectionOption {
  value: string;
  label: string;
}
