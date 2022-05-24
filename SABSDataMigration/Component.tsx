import React = require("react");
import CSVReader from "react-csv-reader";
import CDSDataProvider from "./DataProvider/CDSDataProvider";
import ICDSDataProvider from "./DataProvider/ICDSDataProvider";
import { IInputs } from "./generated/ManifestTypes";

import Select from "react-select";
import { addPropertyToOobject, getPicklistItemValue, getPropertyValue, setObjectProperty } from "./Utilities";
import { IAttribute, IChoice } from "./interfaces";
import { AttributeType } from "./enums";
import { Dropdown, DropdownMenuItemType, IDropdownOption, IDropdownStyles } from "@fluentui/react";

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
    // this.buttonClick = this.buttonClick.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.addField = this.addField.bind(this);
    this.removeField = this.removeField.bind(this);
    this.importToCDS = this.importToCDS.bind(this);
    this.getRelatedData = this.getRelatedData.bind(this);
    this.onChange = this.onChange.bind(this);
    this._onChanged = this._onChanged.bind(this);

    this._dataProvider = new CDSDataProvider(props);

    this.state = {
      fields: [],
      cdsFields: [],
      csvFields: [],
      data: [],
      choices: [],
      entityName: "",
      entity: {},
      context: this.props,
      attributes: [],
      entities: []
    };
  }

  private _dataProvider: ICDSDataProvider;

  private onChange(e: any, field: IField, fieldName: string) {
    let { fields, choices } = this.state;
    var currentField = fields.find(
      (fld) => getPropertyValue(fld, fieldName) == e.value
    );
    if (currentField)
      alert(`This field has alredy been selected in row ${currentField.id}`);
    else {
      currentField = fields.find((fld) => field.id == fld.id);
      if (currentField) {
        addPropertyToOobject(currentField, fieldName, e.value);
        if (e.AttributeType) currentField.AttributeType = e.AttributeType;
      }

      switch (currentField?.AttributeType) {
        case AttributeType.Picklist.toString():
          this._dataProvider
            .getOptions(field.name)
            .then((result: any) => {
              var ch = choices.find(choice => choice.key == field.name);
              if (ch)
                ch.value = result;
              else
                choices.push({ key: field.name, value: result });
            });
          break;

      }

      this.setState({ fields, choices });
    }
  }

  private onTextChange(e: any, fieldName: string) {
    switch (fieldName) {
      case "entityName":
        this.setState({ entityName: e.target.value });
        break;
    }
  }

  private getRelatedData() {
    let { fields, entity: enity } = this.state;

    fields.map((field: IField) => {
      if (
        field.name &&
        field.name != "" &&
        field.csvfield &&
        field.csvfield != ""
      )
        this._dataProvider
          .getOptions(field.name)
          .then((result: any) => {
            console.log(result);
          });
    });
  }

  private importToCDS() {
    let { data, fields, choices, entityName } = this.state;
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
            if (item[field.csvfield])
              var value = item[field.csvfield];
          if (value) {
            switch (field.AttributeType) {
              case AttributeType.Picklist.toString():
                value = getPicklistItemValue(choices, field.name, value);
                break;
              case AttributeType.String.toString():
                value = value.toString();
                break;
            }

            addPropertyToOobject(inputData, field.name, value);
          }
        });
        if (Object.keys(inputData).length > 0)
          this._dataProvider.createRecord(entityName, inputData);
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

  private addFields() {
    let { fields, cdsFields, csvFields } = this.state;
    var id = 1;
    fields = [];
    if (cdsFields.length > 0 && csvFields.length > 0) {
      csvFields.map(field=> {
        var cdsField = cdsFields.find(cdsFld => cdsFld.label.replace(' ', '_').toLowerCase() == field.label);
        if (cdsField) {
          fields.push({ id: id, name: cdsField.value, csvfield: field.label, targets: [] });
        }
      });
    }

    this.setState({fields});
  }

  private addField() {
    let { fields } = this.state;
    var id = 1;
    fields.map((field) => {
      field.id = id;
      id++;
    });
    fields.push({ id: id, name: "", csvfield: "", targets: [] });
    this.setState({ fields });
  }

  // private buttonClick() {
  //   let { entityName } = this.state;
  //   let cdsFields: ISelectionOption[] = [];
  //   if (entityName) {
  //     var attributes: string[] = [];
  //     this._dataProvider
  //       .getEntityMetadata(entityName, attributes)
  //       .then((result) => {
  //         console.log(result);
  //         this.setState({ entity: result });
  //         if (result._entityDescriptor.AttributeNames.length > 0) {
  //           result._entityDescriptor.AttributeNames.map((field: string) => {
  //             cdsFields.push({ value: field, label: field });
  //           });

  //           this.setState({ cdsFields });
  //         }
  //       });

  //     this._dataProvider.getAttributes(entityName).then((result) => {
  //       console.log(result);
  //       this.setState({ attributes: result });
  //       result.map((item) => {
  //         cdsFields.push({
  //           value: item.LogicalName,
  //           label: item.LogicalName,
  //           AttributeType: item.AttributeType,
  //         });
  //       });

  //       this.setState({ cdsFields });
  //     });
  //   }
  // }

  handleForce = (data: any, fileInfo: any) => {
    let csvFields: ISelectionOption[] = [];

    if (data.length > 0) {
      var fieldNames: string[] = Object.keys(data[0]);
      fieldNames.map((fieldName) => {
        csvFields.push({ value: fieldName, label: fieldName });
      });

      this.setState({ data, csvFields });

      this.addFields();
    }
    console.log(data, fileInfo);
  };

  papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header: any) => header.toLowerCase().replace(/\W/g, "_"),
  };

  public _onChanged(item: IDropdownOption) {
    var entityName = item.key.toString();
    this.setState({ entityName });

    this._dataProvider.getEntityMetadata(entityName, []).then((entity) => {
      this.setState({ entity });
      console.log(entity);
    });

    this._dataProvider.getAttributes(entityName).then(attributes => {
      var cdsFields: ISelectionOption[] = [];
      console.log(attributes);
      attributes.map(attribute => {
        cdsFields.push({ value: attribute.LogicalName, label: attribute.Label, AttributeType: attribute.AttributeType });
      });
      this.setState({ cdsFields });
      this.addFields();
    });
  }  

  public componentDidMount() {
    if (window.location.hostname != "localhost") {
      this._dataProvider.getEntities('All', 'All').then(entities => {
        this.setState({ entities });
      });

    }
  }

  public render() {
    let { fields, entities } = this.state;
    return (
      <div>
        <table>
          <tr>
            <td>Table Name</td>
            <td>
              <Dropdown
                label="Disabled example with defaultSelectedKey"
                defaultSelectedKey="broccoli"
                options={entities
                }
                disabled={false}
                styles={dropdownStyles}
                onChanged={this._onChanged}
              />
              {/* <input
                onChange={(value) => this.onTextChange(value, "entityName")}
              /> */}
            </td>
          </tr>
        </table>
        {/* <button onClick={this.buttonClick}>click me</button> */}
        <CSVReader
          cssClass="react-csv-input"
          // label="Choose file"
          onFileLoaded={this.handleForce}
          parserOptions={this.papaparseOptions}
        />
        <br />
        <table width="100%">
          <tr><th>CDS Field</th><th>CSV Field</th><th>Type</th><th>More Info</th><th></th></tr>
          {fields.map((field) => this._row(field))}</table>
        <br />
        <button onClick={this.addField}>Add field</button>
        <br />
        <br />
        <br />
        <br />
        <br />
        {/* <button onClick={this.getRelatedData}>Get Related Data</button> */}
        <br />
        <br />
        <button onClick={this.importToCDS}>Import to CDS</button>
      </div>
    );
  }

  private _row(field: IField) {
    let { cdsFields, csvFields } = this.state;

    return (
      <tr>
        {/* <td>Field Name: </td> */}
        <td width="25%">
          <Select
            options={cdsFields}
            onChange={(e) => this.onChange(e, field, "name")}
          />
        </td>
        {/* <td>CSV Field: </td> */}
        <td width="25%">
          <Select
            options={csvFields}
            onChange={(e) => this.onChange(e, field, "csvfield")}
            value={{ value: field.csvfield, label: field.csvfield }}
          />
        </td>
        {/* <td>Type:</td> */}
        <td>{field.AttributeType ? field.AttributeType : ""}</td>
        {/* <td>Lookup Table Name: </td> */}
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
  choices: IChoice[];
  entityName: string;
  entity: any;
  context: ComponentFramework.Context<IInputs>;
  attributes: IAttribute[];
  entities: IDropdownOption[];
}

export interface IField {
  id: number;
  name: string;
  csvfield: string;
  targets: string[];
  choiceDataSet?: string;
  AttributeType?: string;
}

export interface ISelectionOption {
  value: string;
  label: string;
  AttributeType?: string;
}

export interface IEntity {
  _objectTypeCode?: number;
}

const dropdownStyles: Partial<IDropdownStyles> = {
  dropdown: { width: 300 },
};