import React = require("react");
import CSVReader from "react-csv-reader";
import CDSDataProvider from "./DataProvider/CDSDataProvider";
import ICDSDataProvider from "./DataProvider/ICDSDataProvider";
import { IInputs } from "./generated/ManifestTypes";

import Select from "react-select";
import { addPropertyToOobject, getPropertyValue } from "./Utilities";

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
    this.removeField = this.removeField.bind(this);
    this.importToCDS = this.importToCDS.bind(this);
    this.onChange = this.onChange.bind(this);

    this._dataProvider = new CDSDataProvider(props);

    this.state = {
      fields: [],
      cdsFields: [],
      csvFields: [],
      data: [],
    };
  }

  private _dataProvider: ICDSDataProvider;

  private onChange(e: any, field: IField, fieldName: string) {
    let { fields } = this.state;
    var currentField = fields.find(
      (fld) => getPropertyValue(fld, fieldName) == e.value
    );
    if (currentField)
      alert(`This field has alredy been selected in row ${currentField.id}`);
    else {
      currentField = fields.find((fld) => field.id == fld.id);
      if (currentField) addPropertyToOobject(currentField, fieldName, e.value);
      this.setState({ fields });
    }
  }

  private importToCDS() {
    let { data, fields } = this.state;
    if (data.length > 0 && fields.length > 0) {
      data.map((item: any) => {
        var inputData = {};
        fields.map((field: IField) => {
          if (
            field.name &&
            field.name != "" &&
            field.csvfield &&
            field.csvfield != ""
          )
            addPropertyToOobject(inputData, field.name, item[field.csvfield]);
        });
        if (Object.keys(inputData).length > 0)
          this._dataProvider.updateRecord("contact", inputData);
      });
    }
  }

  private removeField(field: IField) {
    let { fields } = this.state;
    fields = fields.filter((fld) => fld.id !== field.id);
    var id = 1;
    fields.map((field) => {
      field.id = id;
      id++;
    });
    this.setState({ fields });
  }

  private addField() {
    let { fields } = this.state;
    var id = 1;
    fields.map((field) => {
      field.id = id;
      id++;
    });
    fields.push({ id: id, name: "", csvfield: "" });
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
        <br />
        <table width="100%">{fields.map((field) => this._row(field))}</table>
        <br />
        <button onClick={this.addField}>Add field</button>
        <br />
        <br />
        <br />
        <br />
        <br />
        <button onClick={this.importToCDS}>Iport to CDS</button>
      </div>
    );
  }

  private _row(field: IField) {
    let { cdsFields, csvFields } = this.state;

    return (
      <tr>
        <td>Field Name: </td>
        <td width="25%">
          <Select
            options={cdsFields}
            onChange={(e) => this.onChange(e, field, "name")}
          />
        </td>
        <td>CSV Field: </td>
        <td width="25%">
          <Select
            options={csvFields}
            onChange={(e) => this.onChange(e, field, "csvfield")}
            value={{ value: field.csvfield, label: field.csvfield }}
          />
        </td>
        <td>Lookup Table Name: </td>
        <td width="25%">
          <input />
        </td>
        <td>
          <button onClick={() => this.removeField(field)}>Remove</button>
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
  id: number;
  name: string;
  csvfield: string;
}

export interface ISelectionOption {
  value: string;
  label: string;
}
