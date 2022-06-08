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
  getLocalDateAndTimeString,
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
  PrimaryButton,
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
    var batch = null;

    if (window.location.hostname != "localhost") {
      // @ts-ignore
      entityId = Xrm.Page.data.entity._entityId.guid;
      // @ts-ignore
      batch = Xrm.Page.getAttribute('sabs_name');
      if (batch)
        batch = batch.getValue();
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
      noofitemstodelete: 0,
      noofitemsdeleted: 0,
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
      batch: batch
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
      noofitemsdeleted,
      fields,
    } = this.state;
    noofitemssucceeded = 0;
    this.setState({ process: "Delete", noofitemssucceeded });

    this.deleteRecords(entityName, entity, noofitemssucceeded, noofitemsdeleted, fields);
  }

  private deleteRecords(entityName: string, entity: any, noofitemssucceeded: number, noofitemsdeleted: number, fields: IField[]) {
    let { batch } = this.state;
    if (batch.length > 0) {
      noofitemsdeleted = 0;
      this._dataProvider.retrieveMultipleRecords(entityName, '?$top=40&$orderby=modifiedon desc').then((items) => {        
        //this.setState({ noofitems: items.length });
        this.setState({ noofitemstodelete: items.length });
        items.map((item: any) => {
          if (item["sabs_batch"] && item["sabs_batch"].length > 0 && item["sabs_batch"] == batch) {
          this._dataProvider
            .deleteRecord(entityName, item[entity._primaryIdAttribute])
            .then((result: any) => {
              noofitemssucceeded++;
              noofitemsdeleted++;
              this.setState({ noofitemssucceeded, noofitemsdeleted });
              if (this.state.noofitemstodelete == noofitemsdeleted) {
                this.deleteRecords(entityName, entity, noofitemssucceeded, noofitemsdeleted, fields);
                this._cds.getItems(entityName, fields).then((items) => {
                  console.log(items);
                  this.setState({ items });
                });
              }
            });
          }
        });
      });
      return { noofitemssucceeded, noofitemsdeleted };
    }
    else alert('Bath number is missing');
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
      entities
    } = this.state;

    var entity = entities.find((item: IDropdownOption) => item.key == entityName);
    if (entity) {
      // @ts-ignore    
      Xrm.Page.getAttribute('sabs_tabledisplayname').setValue(entity.text);
      // @ts-ignore   
      Xrm.Page.getAttribute('sabs_tablelogicalname').setValue(entityName);
      var batch = 'SABS ' + getLocalDateAndTimeString(new Date);
      // @ts-ignore    
      Xrm.Page.getAttribute('sabs_name').setValue(batch);
      this.setState({ batch });

      let columns = getGridColumns(fields);
      this.setState({ process: "Add", columns });
      noofitemssucceeded = 0;
      noofitemsfailed = 0;
      if (data.length > 0 && fields.length > 0) {
        this.InsertRows(data, fields, choices, lookups, entityName, noofitemssucceeded, noofitems, noofitemsfailed, 0, 40, batch);
      }
    }
  }

  private InsertRows(data: any, fields: IField[], choices: IChoice[], lookups: ILookup[], entityName: string, noofitemssucceeded: number, noofitems: number, noofitemsfailed: number, startIndex: number, endIndex: number, batch: string) {
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
              value = getLookupFieldValue(lookups, fieldName, value, field.targets ? field.targets : []);
              fieldName = field.schemaname + "@odata.bind";
              if (field.targets && field.targets[0] == 'systemuser' && field.schemaname)
                fieldName = `${field.schemaname}@odata.bind`;
              break;
            case AttributeType.Customer.toString():
              value = getLookupFieldValue(lookups, fieldName, value, field.targets ? field.targets : []);
              if (value.indexOf('contacts') > 0)
                fieldName += "_contact@odata.bind";
              else
                fieldName += "_account@odata.bind";
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
      if (Object.keys(inputData).length > 0) {
        addPropertyToOobject(inputData, 'sabs_batch', batch)
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
              this._cds.getItems(entityName, fields, '?$top=40&$orderby=modifiedon desc').then((items) => {
                console.log(items);
                this.setState({ items });
              });

              if (data.length > len)
                this.InsertRows(data, fields, choices, lookups, entityName, noofitemssucceeded, noofitems, noofitemsfailed, len, len + 40, batch);
            }
          });
      }
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
            cdsFld.label && cdsFld.label.replace('/', ' ').toLowerCase().split(' ').join('_') == field.label
        );
        if (cdsField) {
          var newfield: IField = {
            id: id,
            name: cdsField.value,
            label: cdsField.label,
            csvfield: field.label,
            AttributeType: cdsField.AttributeType,
            targets: cdsField.Targets,
            schemaname: cdsField.SchemaName ? cdsField.SchemaName : ''
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

                if (cdsField.Targets.length > 0)
                  cdsField.Targets.map((entityname: string) => {
                    this.addLookup(entityname);
                  });
              }
              break;
          }
        }
      });
    }

    this.setState({ fields });
  }

  private addLookup(entityname: string) {
    let { lookups } = this.state;
    var lkup = lookups.find(
      (lookup) => lookup.key == entityname
    );
    if (!lkup) {
      this._dataProvider
        .retrieveMultipleRecords(entityname)
        .then((result: any) => {
          this._dataProvider
            .getEntityMetadata(entityname, [])
            .then((entity) => {
              var lkup = lookups.find(
                (lookup) => lookup.key == entityname
              );
              lookups.push({
                key: entityname,
                value: result,
                entity,
              });
            });
        });
    }
  }

  private addField() {
    let { fields } = this.state;
    var id = 1;
    fields.map((field) => {
      field.id = id;
      id++;
    });
    fields.push({ id: id, name: "", label: "", csvfield: "", targets: [], schemaname: '' });
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
            SchemaName: attribute.SchemaName,
            Targets: attribute.Targets,
          });
        });

        var sabsid = cdsFields.find((field) => field.label == "SABSID");
        if (!sabsid) {
          this._dataProvider
            .addAttribute(entity._entityDescriptor.Id.guid, {
              name: "sabs_sabsid",
              label: "SABSID",
              schemaname: ''
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

        var batch = cdsFields.find((field) => field.label == "BATCH");
        if (!batch) {
          this._dataProvider
            .addAttribute(entity._entityDescriptor.Id.guid, {
              name: "sabs_batch",
              label: "BATCH",
              schemaname: ''
            })
            .then((result: any) => {
              console.log(result);
            });
          this.setState({ cdsFields });
        }

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
      batch
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
            <td>&nbsp;&nbsp;&nbsp;</td>
            <td>
              <CSVReader
                cssClass="react-csv-input"
                // label="Choose file"
                onFileLoaded={this.handleForce}
                parserOptions={this.papaparseOptions}
              />
            </td>
            <td>&nbsp;&nbsp;</td>
            <td>
              <br />
              
                <PrimaryButton text="Import to CDS" onClick={this.importToCDS} allowDisabledFocus />&nbsp;&nbsp;
              {batch.length > 0 &&
                <PrimaryButton text="Clear Table" onClick={this.clearTable} allowDisabledFocus />
              }
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
            <th>Schema</th>
            <th>Targets</th>
            <th></th>
          </tr>
          <tr>
            <td>&nbsp;</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          {fields.map((field) => this._row(field))}
        </table>
        <br />
        <PrimaryButton text="Add Field" onClick={this.addField} allowDisabledFocus />
        <br />
        <br />
        <br />
        {/* <button onClick={this.getRelatedData}>Get Related Data</button> */}

        <br />
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
        <td style={{ textAlign: "center", width: "20%" }}>
          {field.schemaname}
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
  noofitemstodelete: number;
  noofitemsdeleted: number;
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
  batch: string;
}

export interface IField {
  id?: number;
  name: string;
  label: string;
  csvfield?: string;
  targets?: string[];
  choiceDataSet?: string;
  AttributeType?: string;
  schemaname: string;
}

export interface ISelectionOption {
  value: string;
  label: string;
  AttributeType?: string;
  SchemaName?: string;
  Targets?: string[];
}

export interface IEntity {
  _objectTypeCode?: number;
}

const dropdownStyles: Partial<IDropdownStyles> = {
  dropdown: { width: 300 },
};
