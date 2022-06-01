import React = require("react");
import CSVReader from "react-csv-reader";
import CDSDataProvider from "./DataProvider/CDSDataProvider";
import ICDSDataProvider from "./DataProvider/ICDSDataProvider";
import { IInputs } from "./generated/ManifestTypes";

import Select from "react-select";
import {
  addPropertyToOobject,
  getBooleanFieldKey,
  getGridColumns,
  getLookupFieldValue,
  getPicklistItemValue,
  getPropertyValue,
  setObjectProperty,
} from "./Utilities";
import { IAttribute, IChoice, ILookup } from "./interfaces";
import { AttributeType } from "./enums";
import {
  DetailsList,
  Dropdown,
  DropdownMenuItemType,
  IColumn,
  IDropdownOption,
  IDropdownStyles,
} from "@fluentui/react";
import ICDS from "./DataProvider/ICDSD";
import CDS from "./DataProvider/CDS";
import { entities } from "./Data";

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
    this.clearTable = this.clearTable.bind(this);

    this._dataProvider = new CDSDataProvider(props);
    this._cds = new CDS(props);

    this.state = {
      process: "Add",
      fields: [],
      noofitems: 0,
      noofitemssucceeded: 0,
      noofitemsfailed: 0,
      cdsFields: [],
      csvFields: [],
      data: [],
      choices: [],
      lookups: [],
      entityName: "",
      entity: {},
      context: this.props,
      attributes: [],
      entities: entities,
      columns: [],
      items: [],
    };
  }

  private _dataProvider: ICDSDataProvider;
  private _cds: ICDS;

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
          this._dataProvider.getOptions(field.name).then((result: any) => {
            var ch = choices.find((choice) => choice.key == field.name);
            if (ch) ch.value = result;
            else choices.push({ key: field.name, value: result });
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
        this._dataProvider.getOptions(field.name).then((result: any) => {
          console.log(result);
        });
    });
  }

  private clearTable() {
    let {
      entityName,
      entity,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      fields,
    } = this.state;
    this.setState({ process: "Delete" });
    noofitemssucceeded = 0;
    noofitemsfailed = 0;
    this._dataProvider.retrieveMultipleRecords(entityName).then((items) => {
      this.setState({ noofitems: items.length });
      items.map((item: any) => {
        this._dataProvider
          .deleteRecord(entityName, item[entity._primaryIdAttribute])
          .then((result: any) => {
            noofitemssucceeded++;
            this.setState({ noofitemssucceeded });
            if (noofitems == noofitemssucceeded + noofitemsfailed) {
              this._cds.getItems(entityName, fields).then((items) => {
                console.log(items);
                this.setState({ items });
              });
            }
          });
      });
    });
  }

  private importToCDS() {
    let {
      data,
      fields,
      choices,
      lookups,
      entityName,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
    } = this.state;

    let columns = getGridColumns(fields);

    this.setState({ process: "Add", columns });
    noofitemssucceeded = 0;
    noofitemsfailed = 0;
    if (data.length > 0 && fields.length > 0) {
      this.InsertRows(data, fields, choices, lookups, entityName, noofitemssucceeded, noofitems, noofitemsfailed, 0, 3);
    }
  }

  private InsertRows(data: any, fields: IField[], choices: IChoice[], lookups: ILookup[], entityName: string, noofitemssucceeded: number, noofitems: number, noofitemsfailed: number, startIndex: number, endIndex: number) {
    var len = data.length > endIndex ? endIndex : data.length;
    for (let idx = startIndex; idx < len; idx++) {
      var item = data[idx]
      var inputData = {};
      fields.map((field: IField) => {
        if (field.name &&
          field.name != "" &&
          field.csvfield &&
          field.csvfield != "")
          if (item[field.csvfield])
            var value = item[field.csvfield];
        var fieldName = field.name;
        if (value) {
          switch (field.AttributeType) {
            case AttributeType.Picklist.toString():
              value = getPicklistItemValue(choices, fieldName, value);
              break;
            case AttributeType.Lookup.toString():
              value = getLookupFieldValue(lookups, fieldName, value);
              fieldName += "@odata.bind";
              break;
            case AttributeType.String.toString():
              value = value.toString();
              break;
            case AttributeType.Boolean.toString():
              value = getBooleanFieldKey(value.toString());
              break;
          }

          addPropertyToOobject(inputData, fieldName, value);
        }
      });
      if (Object.keys(inputData).length > 0)
        this._dataProvider
          .createRecord(entityName, inputData)
          .then((success: any) => {
            console.log(success);
            noofitemssucceeded++;
            this.setState({ noofitemssucceeded });

            if (noofitemssucceeded == len) {
              // this._dataProvider.retrieveMultipleRecords(entityName).then(items => {
              //   console.log(items);
              //   this.setState({items});
              // });
              this._cds.getItems(entityName, fields).then((items) => {
                console.log(items);
                this.setState({ items });
              });

              if (data.length > len)
                this.InsertRows(data, fields, choices, lookups, entityName, noofitemssucceeded, noofitems, noofitemsfailed, len, len + 3);
            }
          });
    }

    // data.map((item: any) => {

    // });

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
    let { fields, cdsFields, csvFields, choices, lookups } = this.state;
    var id = 1;
    fields = [];
    if (cdsFields.length > 0 && csvFields.length > 0) {
      csvFields.map((field) => {
        var cdsField = cdsFields.find(
          (cdsFld) =>
            cdsFld.label.replace(" ", "_").toLowerCase() == field.label
        );
        if (cdsField) {
          var newfield = {
            id: id,
            name: cdsField.value,
            label: cdsField.label,
            csvfield: field.label,
            AttributeType: cdsField.AttributeType,
            targets: [],
          };
          fields.push(newfield);
          id++;

          switch (cdsField.AttributeType) {
            case AttributeType.Picklist.toString():
              this._dataProvider
                .getOptions(cdsField.value)
                .then((result: any) => {
                  var ch = choices.find(
                    (choice) => choice.key == newfield.name
                  );
                  if (ch) ch.value = result;
                  else choices.push({ key: newfield.name, value: result });
                });
              break;

            case AttributeType.Lookup.toString():
              if (cdsField.Targets && cdsField.Targets.length > 0) {
                var entityName = "";
                if (cdsField.Targets.length > 0)
                  entityName = cdsField.Targets[0];
                this._dataProvider
                  .retrieveMultipleRecords(entityName)
                  .then((result: any) => {
                    this._dataProvider
                      .getEntityMetadata(entityName, [])
                      .then((entity) => {
                        var lkup = lookups.find(
                          (lookup) => lookup.key == newfield.name
                        );
                        if (lkup) lkup.value = result;
                        else
                          lookups.push({
                            key: newfield.name,
                            value: result,
                            entity,
                          });
                      });
                  });
              }
              break;
          }
        }
      });
    }

    this.setState({ fields });
  }

  private addField() {
    let { fields } = this.state;
    var id = 1;
    fields.map((field) => {
      field.id = id;
      id++;
    });
    fields.push({ id: id, name: "", label: "", csvfield: "", targets: [] });
    this.setState({ fields });
  }

  handleForce = (data: any, fileInfo: any) => {
    let csvFields: ISelectionOption[] = [];

    if (data.length > 0) {
      var fieldNames: string[] = Object.keys(data[0]);
      fieldNames.map((fieldName) => {
        csvFields.push({ value: fieldName, label: fieldName });
      });

      this.setState({ data, csvFields, noofitems: data.length });

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

  private setAttributes() { }

  public _onChanged(item: IDropdownOption) {
    var entityName = item.key.toString();
    this.setState({ entityName });

    this._dataProvider.getEntityMetadata(entityName, []).then((entity) => {
      this.setState({ entity });
      console.log(entity);

      this._dataProvider.getAttributes(entityName).then((attributes) => {
        var cdsFields: ISelectionOption[] = [];
        console.log(attributes);
        attributes.map((attribute) => {
          cdsFields.push({
            value: attribute.LogicalName,
            label: attribute.Label,
            AttributeType: attribute.AttributeType,
            Targets: attribute.Targets,
          });
        });

        var sabsid = cdsFields.find((field) => field.label == "SABSID");
        if (!sabsid) {
          this._dataProvider
            .addAttribute(entity._entityDescriptor.Id.guid, {
              name: "sabs_sabsid",
              label: "SABSID",
            })
            .then((result: any) => {
              console.log(result);
              cdsFields.push({
                value: "sabs_sabsid",
                label: "SABSID",
                AttributeType: "String",
                Targets: [],
              });
            });
          this.setState({ cdsFields });
        } else this.setState({ cdsFields });
        this.addFields();
      });
    });
  }

  public componentDidMount() {
    // if (window.location.hostname != "localhost") {
    //   this._dataProvider.getEntities("All", "All").then((entities) => {
    //     this.setState({ entities });
    //   });
    // }
  }

  public render() {
    let {
      fields,
      entities,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      items,
      columns,
      process,
    } = this.state;
    return (
      <div>
        <table width={"100%"}>
          <tr className="header">
            <th>Total Number of Items to {process}</th>
            <th>Succeeded</th>
            <th>Failed</th>
          </tr>
          <tr>
            <td className="total">{noofitems}</td>
            <td className="succeeded">{noofitemssucceeded}</td>
            <td className="failed">{noofitemsfailed}</td>
          </tr>
        </table>
        <DetailsList
          items={items}
          compact={true}
          columns={columns}
        // onRenderItemColumn={this._renderItemColumn}
        // selectionMode={SelectionMode.multiple}
        // getKey={this._getKey}
        // setKey="multiple"
        // layoutMode={DetailsListLayoutMode.justified}
        // isHeaderVisible={true}
        // selection={this._selection}
        // selectionPreservedOnEmptyClick={true}
        // onItemInvoked={this._onItemInvoked}
        // enterModalSelectionOnTouch={true}
        // ariaLabelForSelectionColumn="Toggle selection"
        // ariaLabelForSelectAllCheckbox="Toggle selection for all items"
        // checkButtonAriaLabel="select row"
        // onRenderDetailsFooter={this._onRenderDetailsFooter}
        />
        <table>
          <tr>
            <td>
              <Dropdown
                label="Table"
                defaultSelectedKey="broccoli"
                options={entities}
                disabled={false}
                styles={dropdownStyles}
                onChanged={this._onChanged}
              />
              {/* <input
                onChange={(value) => this.onTextChange(value, "entityName")}
              /> */}
            </td>
            <td>
              <CSVReader
                cssClass="react-csv-input"
                // label="Choose file"
                onFileLoaded={this.handleForce}
                parserOptions={this.papaparseOptions}
              />
            </td>
          </tr>
        </table>
        {/* <button onClick={this.buttonClick}>click me</button> */}
        <br />
        <table width="100%">
          <tr>
            <th>CDS Field</th>
            <th>CSV Field</th>
            <th>Type</th>
            <th>More Info</th>
            <th></th>
          </tr>
          {fields.map((field) => this._row(field))}
        </table>
        <br />
        <button onClick={this.addField}>Add field</button>
        <br />
        <br />
        <br />
        {/* <button onClick={this.getRelatedData}>Get Related Data</button> */}
        <button onClick={this.importToCDS}>Import to CDS</button> &nbsp;&nbsp;
        <button onClick={this.clearTable}>Clear Table</button>
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
            value={{ value: field.name, label: field.label }}
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
        <td style={{ textAlign: "center" }}>
          {field.AttributeType ? field.AttributeType : ""}
        </td>
        {/* <td>Lookup Table Name: </td> */}
        <td style={{ textAlign: "center", width: "20%" }}>
          {field.targets ? field.targets.join(",") : ""}
        </td>
        <td>
          <button onClick={() => this.removeField(field)}>Remove</button>
        </td>
      </tr>
    );
  }
}

export interface IState {
  process: string;
  fields: IField[];
  noofitemssucceeded: number;
  noofitemsfailed: number;
  noofitems: number;
  cdsFields: ISelectionOption[];
  csvFields: ISelectionOption[];
  data: any;
  choices: IChoice[];
  lookups: ILookup[];
  entityName: string;
  entity: any;
  context: ComponentFramework.Context<IInputs>;
  attributes: IAttribute[];
  entities: IDropdownOption[];
  items: any;
  columns: IColumn[];
}

export interface IField {
  id?: number;
  name: string;
  label: string;
  csvfield?: string;
  targets?: string[];
  choiceDataSet?: string;
  AttributeType?: string;
}

export interface ISelectionOption {
  value: string;
  label: string;
  AttributeType?: string;
  Targets?: string[];
}

export interface IEntity {
  _objectTypeCode?: number;
}

const dropdownStyles: Partial<IDropdownStyles> = {
  dropdown: { width: 300 },
};
