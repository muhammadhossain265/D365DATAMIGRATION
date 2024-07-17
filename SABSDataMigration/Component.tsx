import React = require("react");
import CSVReader from "react-csv-reader";
import CDSDataProvider from "./DataProvider/CDSDataProvider";
import ICDSDataProvider from "./DataProvider/ICDSDataProvider";
import { IInputs } from "./generated/ManifestTypes";

import Select from "react-select";
import {
  addPropertyToOobject,
  enclosedInQuote,
  getAttributeValue,
  getBooleanFieldKey,
  getCleanString,
  getGridColumns,
  getLocalDateAndTimeString,
  getLookupFieldValue,
  getPicklistItemValue,
  getPropertyValue,
  getVirtualItemValue,
  isValidClient,
  setAttributeValue,
  setObjectProperty,
} from "./Utilities";
import { IAttribute, IChoice, IError, ILookup, ILookupEntity, IResponse } from "./interfaces";
import { AttributeType } from "./enums";
import {
  DetailsList,
  Dropdown,
  DropdownMenuItemType,
  getTheme,
  IColumn,
  IDropdownOption,
  IDropdownStyles,
  List,
  mergeStyleSets,
  normalize,
  PrimaryButton,
} from "@fluentui/react";
import ICDS from "./DataProvider/ICDSD";
import CDS from "./DataProvider/CDS";
//import { entities } from "./DataCTwo";
import { text } from "stream/consumers";
import { fail } from "assert";
import { exportExcelCS } from "./xlsxutilities";

const entities = require("./clients/horizon.json");

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
      entityId = Xrm.Page.data.entity.getId();
      // @ts-ignore
      batch = Xrm.Page.getAttribute('sabs_batch');
      if (batch)
        batch = batch.getValue() ? batch.getValue() : '';
      else batch = '';
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
    this._closeTable = this._closeTable.bind(this);
    this._clearQueue = this._clearQueue.bind(this);
    this._closecases = this._closecases.bind(this);
    this.test = this.test.bind(this);
    this._onTargetChanged = this._onTargetChanged.bind(this);
    this._updatecsvFieldLabels = this._updatecsvFieldLabels.bind(this);
    this._validate = this._validate.bind(this);
    this._exporterror = this._exporterror.bind(this);
    this._inactivate = this._inactivate.bind(this);
    this._inactivateRecord = this._inactivateRecord.bind(this);
    this._reactivateCases = this._reactivateCases.bind(this);
    this._deletequeitem = this._deletequeitem.bind(this);

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
      batch: batch,
      errors: [],
      faileditems: [],
      validationinprogress: false,
      validated: false
    };
  }

  private _dataProvider: ICDSDataProvider;
  private _cds: ICDS;

  private addError() {

  }

  private onChange(e: any, field: IField, fieldName: string) {
    let { fields, choices, entity } = this.state;
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
          this._dataProvider.getOptions(field.name, entity.ObjectTypeCode).then((result: any) => {
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
    let { fields, entity } = this.state;

    fields.map((field: IField) => {
      if (
        field.name &&
        field.name != "" &&
        field.csvfield &&
        field.csvfield != ""
      )
        this._dataProvider.getOptions(field.name, entity.ObjectTypeCode).then((result: any) => {
          console.log(result);
        });
    });
  }

  private resetAttributes() {
    setAttributeValue('sabs_totalnumberofitemssucceeded', 0);
    setAttributeValue('sabs_totalnumberofitemstoadd', 0);
    setAttributeValue('sabs_batch', '');
  }

  private test() {
    var entityname: string = '';
    var data: any;


    if (entityname != '') {
      var id: string = '',
        relationship: string = '',
        value: string = '';

      this._dataProvider.relaterow(entityname, id, relationship, value).then(result => {
        console.log(result);
      });
    }
    if (entityname.length > 0 && data) {
      this._dataProvider.createRecord(entityname, data).then((response: any) => {
        console.log(response);
      });
    }

    if (entityname.length > 0) {
      this._dataProvider.retrieveMultipleRecords(entityname).then((response: any) => {
        console.log(response);
      });
    }

    if (entityname.length > 0) {
      var id = '';
      this._dataProvider.retrieveRecord(entityname, id).then((response: any) => {
        console.log(response);
      });
    }
  }

  private _clearQueue() {
    let {
      entity,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      noofitemsdeleted,
      fields,
    } = this.state;

    //localStorage.setItem('QUEUESETTING', JSON.stringify({'queuename': 'Admin Tasks', 'caseids': 'abcd123,abcd354'}))

    var queuesetting = localStorage.getItem('QUEUESETTING');
    if (!queuesetting)
      alert('QUEUESETTING does not exist');
    else {
      var settingobj = JSON.parse(queuesetting);
      var excludedcases = settingobj.caseids.split(',');
      console.log(settingobj);
      this._dataProvider.retrieveMultipleRecords('queue', `?$filter=name eq '${settingobj.queuename}'`).then(result => {
        console.log(result);
        if (result && result.length > 0)
          this._dataProvider.retrieveMultipleRecords('queueitem', `?$filter=_queueid_value eq ${result[0].queueid}`).then(result => {
            console.log(result);
            if (result && result.length > 0) {
              var idx = 0;
              this._deletequeitem(result, idx, excludedcases);
            }
          });
      });
    }
  }

  private _deletequeitem(result: any, idx: number, excludedcases: any) {
    let { noofitemssucceeded } = this.state;
    var record = result[idx];
    this._dataProvider.retrieveRecord('incident', record._objectid_value).then(item => {
      if (item) {
        if (excludedcases.indexOf(item.ticketnumber) < 0) {
          console.log(item);
          this._dataProvider.deleteRecord('queueitem', record.queueitemid).then((deleted: any) => {
            noofitemssucceeded++;
            this.setState({ noofitemssucceeded });
            if (idx < result.length) {
              idx++;
              this._deletequeitem(result, idx, excludedcases);
            }
          });
        }
        else {
          console.log(item);
          if (idx < result.length) {
            idx++;
            this._deletequeitem(result, idx, excludedcases);
          }
        }
      }
    })
  }

  private clearTable() {
    let {
      entity,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      noofitemsdeleted,
      fields,
    } = this.state;

    var entityName = getAttributeValue('sabs_tablelogicalname');
    if (entityName && entityName.length > 0) {
      var noofitemssucceededpreviously = getAttributeValue('sabs_totalnumberofitemssucceeded');
      if (noofitemssucceededpreviously)
        this.setState({ noofitems: noofitemssucceededpreviously });
      noofitemssucceeded = 0;
      this.setState({ process: "Delete", noofitemssucceeded });

      this.deleteRecords(entityName, entity, noofitemssucceeded, noofitemsdeleted, fields, noofitemssucceededpreviously);
    }
    else {
      alert('Table name missing!!');
    }
  }

  private deleteRecords(entityName: string, entity: any, noofitemssucceeded: number, noofitemsdeleted: number, fields: IField[], noofitems: number) {
    let { batch, noofitemsfailed, errors, faileditems } = this.state;
    if (batch.length > 0) {
      noofitemsdeleted = 0;
      this._dataProvider.retrieveMultipleRecords(entityName, `?$filter=sabs_batch eq '${batch}'&$top=40&$orderby=modifiedon desc`).then((items) => {
        //this.setState({ noofitems: items.length });
        this.setState({ noofitemstodelete: items.length });
        items.map((item: any) => {
          if (item["sabs_batch"] && item["sabs_batch"].length > 0 && item["sabs_batch"] == batch) {
            setTimeout(() => {
              this._dataProvider
                .deleteRecord(entityName, item[entity._primaryIdAttribute])
                .then((result: IResponse) => {
                  if (result.errorCode) {
                    noofitemsfailed++;
                    var error = `SABSID: ${getPropertyValue(item, 'sabs_sabsid')} error: ${result.message}`;
                    errors.push(error);
                    faileditems.push({ SABSID: getPropertyValue(item, 'sabs_sabsid'), Error: result.message as string })
                    this.setState({ noofitemsfailed, errors, faileditems });
                  }
                  else {
                    noofitemssucceeded++;
                    noofitemsdeleted++;
                    this.setState({ noofitemssucceeded, noofitemsdeleted });
                    if (noofitems == noofitemssucceeded)
                      this.resetAttributes();

                    if (this.state.noofitemstodelete == noofitemsdeleted) {
                      this.deleteRecords(entityName, entity, noofitemssucceeded, noofitemsdeleted, fields, noofitems);
                      this._cds.getItems(entityName, fields).then((items) => {
                        console.log(items);
                        this.setState({ items });
                      });
                    }
                  }
                });
            }, 3000);
          }
        });
      });
      return { noofitemssucceeded, noofitemsdeleted };
    }
    else alert('Bath number is missing');
  }

  private _reactivateCases() {
    let {
      entity,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      noofitemsdeleted,
      fields,
    } = this.state;

    // var proceed = confirm('Do you want to continue with closing cases?');
    // if (proceed) {
    //   var noofitemssucceededpreviously = getAttributeValue('sabs_totalnumberofitemssucceeded');
    //   if (noofitemssucceededpreviously)
    //     this.setState({ noofitems: noofitemssucceededpreviously });
    //   noofitemssucceeded = 0;
    //   this.setState({ process: "Close", noofitemssucceeded });

    //   this._closecases('incident', noofitemssucceeded, noofitemsdeleted, fields, noofitemssucceededpreviously);
    // }

    var casetoreactivate = localStorage.getItem('CASE');
    if (casetoreactivate) {
      this._cds.reactivatecase(casetoreactivate).then(result => {
        alert('Case reactivated successfully.');
      });
    }
    else {
      console.log(`localStorage.setItem('CASE', 'e0133293-c33a-ed11-9db0-000d3a8d60ad')`);
      alert(`You are missing the following\nlocalStorage.setItem('CASE', 'e0133293-c33a-ed11-9db0-000d3a8d60ad')`);

    }
  }

  private _reactivatecases(entity: any, noofitemssucceeded: number, noofitemsdeleted: number, fields: IField[], noofitems: number) {
    let { noofitemsfailed, errors, faileditems } = this.state;
    noofitemsdeleted = 0;
    var numberinbatch = 40;
    this._cds.getactivecases(numberinbatch).then((items) => {
      this.setState({ noofitemstodelete: items.length });
      console.log('following cases got retrieved.');
      console.log(items);
      items.map((item: any) => {
        console.log('Case about to close is');
        console.log(item);
        if (item.ewosa_closeddate) {
          setTimeout(() => {
            this._cds.closecase(item)
              .then((result: IResponse) => {
                if (result.errorCode) {
                  noofitemsfailed++;
                  var error = `SABSID: ${getPropertyValue(item, 'sabs_sabsid')} error: ${result.message}`;
                  errors.push(error);
                  faileditems.push({ SABSID: getPropertyValue(item, 'sabs_sabsid'), Error: result.message as string })
                  this.setState({ noofitemsfailed, errors, faileditems });
                }
                else {
                  noofitemssucceeded++;
                  noofitemsdeleted++;
                  this.setState({ noofitemssucceeded, noofitemsdeleted });
                  if (noofitems == noofitemssucceeded)
                    this.resetAttributes();

                  if (this.state.noofitemstodelete == noofitemsdeleted) {
                    this._closecases(entity, noofitemssucceeded, noofitemsdeleted, fields, noofitems);
                    this._cds.getItems('incident', fields).then((items) => {
                      console.log(items);
                      if (items.length == 0)
                        alert('All active cases with Closed Date are now closed.');
                      else
                        this.setState({ items });

                    });
                  }
                }
              });
          }, 3000);
        }
      });
    });
    return { noofitemssucceeded, noofitemsdeleted };
  }

  private _closeTable() {
    let {
      entity,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      noofitemsdeleted,
      fields,
    } = this.state;

    var proceed = confirm('Do you want to continue with closing cases?');
    if (proceed) {
      var noofitemssucceededpreviously = getAttributeValue('sabs_totalnumberofitemssucceeded');
      if (noofitemssucceededpreviously)
        this.setState({ noofitems: noofitemssucceededpreviously });
      noofitemssucceeded = 0;
      this.setState({ process: "Close", noofitemssucceeded });

      this._closecases('incident', noofitemssucceeded, noofitemsdeleted, fields, noofitemssucceededpreviously);
    }

    // var casetoclose = localStorage.getItem('CASE');
    // if (casetoclose) {
    //   this._cds.closecase({ incidentid: casetoclose, ewosa_timespent: 0 }).then(result => {
    //     alert('Case closed successfully.');
    //   });
    // }
    // else {
    //   console.log(`localStorage.setItem('CASE', 'e0133293-c33a-ed11-9db0-000d3a8d60ad')`);
    //   alert(`You are missing the following\nlocalStorage.setItem('CASE', 'e0133293-c33a-ed11-9db0-000d3a8d60ad')`);

    // }
  }

  private _exporterror() {
    let { faileditems } = this.state;
    exportExcelCS(faileditems, 'Errors.csv');
  }

  private _closecases(entity: any, noofitemssucceeded: number, noofitemsdeleted: number, fields: IField[], noofitems: number) {
    let { noofitemsfailed, errors, faileditems } = this.state;
    noofitemsdeleted = 0;
    var numberinbatch = 40;
    this._cds.getactivecases(numberinbatch).then((items) => {
      this.setState({ noofitemstodelete: items.length });
      console.log('following cases got retrieved.');
      console.log(items);
      items.map((item: any) => {
        console.log('Case about to close is');
        console.log(item);
        if (item.ewosa_closeddate) {
          setTimeout(() => {
            this._cds.closecase(item)
              .then((result: IResponse) => {
                if (result.errorCode) {
                  noofitemsfailed++;
                  var error = `SABSID: ${getPropertyValue(item, 'sabs_sabsid')} error: ${result.message}`;
                  errors.push(error);
                  faileditems.push({ SABSID: getPropertyValue(item, 'sabs_sabsid'), Error: result.message as string })
                  this.setState({ noofitemsfailed, errors, faileditems });
                }
                else {
                  noofitemssucceeded++;
                  noofitemsdeleted++;
                  this.setState({ noofitemssucceeded, noofitemsdeleted });
                  if (noofitems == noofitemssucceeded)
                    this.resetAttributes();

                  if (this.state.noofitemstodelete == noofitemsdeleted) {
                    this._closecases(entity, noofitemssucceeded, noofitemsdeleted, fields, noofitems);
                    this._cds.getItems('incident', fields).then((items) => {
                      console.log(items);
                      if (items.length == 0)
                        alert('All active cases with Closed Date are now closed.');
                      else
                        this.setState({ items });

                    });
                  }
                }
              });
          }, 3000);
        }
      });
    });
    return { noofitemssucceeded, noofitemsdeleted };
  }

  private _validate() {
    let {
      data,
      fields,
      choices,
      lookups,
      entityName,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      entities,
      batch
    } = this.state;


    var entity = entities.find((item: IDropdownOption) => item.key == entityName);
    if (entity) {
      if (batch.length == 0) {
        let columns = getGridColumns(fields);
        this.setState({ process: "Add", columns });
        noofitemssucceeded = 0;
        noofitemsfailed = 0;
        if (data.length > 0 && fields.length > 0) {
          this.ValidateRows(data, fields, choices, lookups, entityName, noofitemssucceeded, noofitems, noofitemsfailed, 0, 40, batch);
        }
      }
    }
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
      entities,
      batch
    } = this.state;


    var entity = entities.find((item: IDropdownOption) => item.key == entityName);
    if (entity) {
      if (batch.length == 0) {
        // @ts-ignore    
        Xrm.Page.getAttribute('sabs_tabledisplayname').setValue(entity.text);
        // @ts-ignore   
        Xrm.Page.getAttribute('sabs_tablelogicalname').setValue(entityName);
        batch = 'SABS ' + getLocalDateAndTimeString(new Date);
        // @ts-ignore    
        Xrm.Page.getAttribute('sabs_batch').setValue(batch);

        // @ts-ignore
        Xrm.Page._data._entity.save();

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
  }

  private ValidateRows(data: any, fields: IField[], choices: IChoice[], lookups: ILookup[], entityName: string, noofitemssucceeded: number, noofitems: number, noofitemsfailed: number, startIndex: number, endIndex: number, batch: string) {
    var len = data.length;
    var validationfailed = 0

    data.map((item: any) => {
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
            case AttributeType.Virtual.toString():
              value = getVirtualItemValue(choices, fieldName, value);
              if (!value || value.length == 0)
                validationfailed += 1;
              break;
            case AttributeType.Picklist.toString():
              value = getPicklistItemValue(choices, fieldName, value);
              if (!value || value.length == 0)
                validationfailed += 1;
              break;
            case AttributeType.Lookup.toString():
            case AttributeType.Owner.toString():
              // if (field.AttributeType == AttributeType.Owner.toString())
              //   field.targets = ['systemuser'];
              value = getLookupFieldValue(lookups, fieldName, value, field.targets ? field.targets : []);
              if (!value || value.length == 0)
                validationfailed += 1;
              var schema = field.schemaname;
              if (field.targets && field.targets.length > 1 && value && value.length > 0) {
                var schma = field.targets.find(target => value.indexOf(target) > 0) as string;
                if (schma && schma.length > 0)
                  schema += `_${schma}`;
              }
              fieldName = `${schema}@odata.bind`;
              if (field.targets && field.targets[0] == 'systemuser' && field.schemaname)
                fieldName = `${field.schemaname}@odata.bind`;
              break;
            case AttributeType.Customer.toString():
              value = getLookupFieldValue(lookups, fieldName, value, field.targets ? field.targets : []);
              if (!value || value.length == 0)
                validationfailed += 1;
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
            case AttributeType.DateTime.toString():
              value = new Date(value);
              break;
          }
        }
      });
    });

    if (validationfailed == 0)
      this.setState({ validated: true });
  }

  private InsertRows(data: any, fields: IField[], choices: IChoice[], lookups: ILookup[], entityName: string, noofitemssucceeded: number, noofitems: number, noofitemsfailed: number, startIndex: number, endIndex: number, batch: string) {
    let { errors, faileditems } = this.state;
    var len = data.length > endIndex ? endIndex : data.length;
    for (let idx = startIndex; idx < len; idx++) {
      var item = data[idx]
      var inputData = {};
      fields.map((field: IField) => {
        if (field.name &&
          field.name != "" &&
          field.csvfield &&
          field.csvfield != "")
          if (item[field.csvfield]) {
            var value = item[field.csvfield];
            if (value) {
              if (enclosedInQuote(value))
                value = getCleanString(value);
              var fieldName = field.name;
              switch (field.AttributeType) {
                case AttributeType.Virtual.toString():
                  value = getVirtualItemValue(choices, fieldName, value);
                  break;
                case AttributeType.Picklist.toString():
                  value = getPicklistItemValue(choices, fieldName, value);
                  break;
                case AttributeType.Lookup.toString():
                case AttributeType.Owner.toString():
                  if (field.AttributeType == AttributeType.Owner.toString())
                    field.targets = ['systemuser'];
                  value = getLookupFieldValue(lookups, fieldName, value, field.targets ? field.targets : []);
                  var schema = field.schemaname;
                  if (field.targets && field.targets.length > 1 && value && value.length > 0) {
                    var schma = field.targets.find(target => value.indexOf(target) > 0) as string;
                    if (schma && schma.length > 0)
                      schema += `_${schma}`;
                  }
                  if (schema == "ParentCaseId")
                    schema = 'parentcaseid';
                  fieldName = `${schema}@odata.bind`;
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
                case AttributeType.DateTime.toString():
                  var dateonlyfields = ['Due Date', 'Date Completed'];
                  if (!dateonlyfields.find(fld => fld == field.label))
                    value = new Date(value);
                  break;
              }

              addPropertyToOobject(inputData, fieldName, value);
            }
          }
      });
      if (Object.keys(inputData).length > 0) {

        addPropertyToOobject(inputData, 'sabs_batch', batch)

        this._dataProvider
          .createRecord(entityName, inputData)
          .then((result: IResponse) => {
            if (result.errorCode) {
              var error = `SABSID: ${getPropertyValue(inputData, 'sabs_sabsid')} error: ${result.message}`;
              errors.push(error);
              faileditems.push({ SABSID: getPropertyValue(inputData, 'sabs_sabsid'), Error: result.message as string });
              noofitemsfailed++;
              this.setState({ noofitemsfailed, errors, faileditems });
            }
            else {
              noofitemssucceeded++;
              this.setState({ noofitemssucceeded });

              setAttributeValue('sabs_totalnumberofitemssucceeded', noofitemssucceeded);

              if (noofitemssucceeded == len) {
                this._cds.getItems(entityName, fields, '?$top=40&$orderby=modifiedon desc').then((items) => {
                  console.log(items);
                  this.setState({ items });
                });

                if (data.length > len)
                  setTimeout(() => {
                    this.InsertRows(data, fields, choices, lookups, entityName, noofitemssucceeded, noofitems, noofitemsfailed, len, len + 40, batch);
                  }, 3000);
              }
            }
          });
      }
    }
  }

  private _inactivate(deactivate?: boolean) {
    let {
      data,
      fields,
      choices,
      lookups,
      entityName,
      noofitems,
      noofitemssucceeded,
      noofitemsfailed,
      entities,
      batch
    } = this.state;


    var entity = entities.find((item: IDropdownOption) => item.key == entityName);
    if (entity) {
      if (batch.length == 0) {
        // @ts-ignore    
        Xrm.Page.getAttribute('sabs_tabledisplayname').setValue(entity.text);
        // @ts-ignore   
        Xrm.Page.getAttribute('sabs_tablelogicalname').setValue(entityName);
        batch = 'SABS ' + getLocalDateAndTimeString(new Date);
        // @ts-ignore    
        Xrm.Page.getAttribute('sabs_batch').setValue(batch);

        // @ts-ignore
        Xrm.Page._data._entity.save();

        this.setState({ batch });

        let columns = getGridColumns(fields);
        this.setState({ process: "Deactivate", columns });
        noofitemssucceeded = 0;
        noofitemsfailed = 0;
        if (data.length > 0 && fields.length > 0) {
          this._inactivateRecord(data, entityName, noofitemssucceeded, noofitems, noofitemsfailed, 0, deactivate);
        }
      }
    }
  }

  private _inactivateRecord(data: any, entityName: string, noofitemssucceeded: number, noofitems: number, noofitemsfailed: number, currentindex: number, deactivate?: boolean) {
    let { errors, faileditems } = this.state;
    var item = data[currentindex];
    this._cds.deactivateitem(entityName, getPropertyValue(item, 'sabsid'), deactivate)
      .then((result: IResponse) => {
        if (result.errorCode) {
          var error = `SABSID: ${getPropertyValue(item, 'sabsid')} error: ${result.message}`;
          errors.push(error);
          faileditems.push({ SABSID: getPropertyValue(item, 'sabsid'), Error: result.message as string });
          noofitemsfailed++;
          this.setState({ noofitemsfailed, errors, faileditems });
        }
        else {
          noofitemssucceeded++;
          this.setState({ noofitemssucceeded });
          setAttributeValue('sabs_totalnumberofitemssucceeded', noofitemssucceeded);
          this._inactivateRecord(data, entityName, noofitemssucceeded, noofitems, noofitemsfailed, currentindex + 1, deactivate);
        }
      });
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
    let { fields, cdsFields, csvFields, choices, lookups, entity } = this.state;
    var id = 1;
    fields = [];
    if (cdsFields.length > 0 && csvFields.length > 0) {
      csvFields.map((field) => {
        var cdsField = cdsFields.find(
          (cdsFld) =>
            cdsFld.label && cdsFld.label.replace('/', ' ').replace(':', ' ').replace('-', ' ').replace('?', ' ').toLowerCase().split(' ').join('_') == field.label
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

          if (newfield.name) {
            fields.push(newfield);
            if (newfield.name == 'ownerid') {
              newfield.targets = ['systemuser'];
              newfield.schemaname = 'ownerid';
            }
          }
          id++;


          switch (cdsField.AttributeType) {
            case AttributeType.Picklist.toString():
            case AttributeType.Virtual.toString():
              var ch = choices.find(
                choice => choice.key == newfield.name
              );
              if (!ch) {
                this._dataProvider
                  .getOptions(cdsField.value, entity.ObjectTypeCode)
                  .then((result: any) => {
                    choices.push({ key: newfield.name, value: result });
                  });
              }
              break;
            case AttributeType.Lookup.toString():
              if (cdsField.Targets && cdsField.Targets.length > 0) {

                if (cdsField.Targets.length > 0)
                  cdsField.Targets.map((entityname: string) => {
                    this.addLookup(entityname, newfield.name);
                  });
              }
              newfield.color = 'red';
              break;
            case AttributeType.Customer.toString():
              if (cdsField.Targets && cdsField.Targets.length > 0) {

                if (cdsField.Targets.length > 0)
                  cdsField.Targets.map((entityname: string) => {
                    this.addLookup(entityname, newfield.name);
                  });
              }
              newfield.color = 'red';
              break;
            case AttributeType.Owner.toString():
              this.addLookup('systemuser', 'ownerid');
              break;
          }
        }
      });
    }

    this.setState({ fields });
  }

  private setFieldColor(name: string, color: string, entityname: string) {
    let { fields, lookups } = this.state;
    var lookup = lookups.find(lkup => lkup.key == entityname)
    if (lookup)
      lookup.loaded = true;
    var field = fields.find(fld => fld.name == name);
    var targetloaded = true;
    this.setState({ lookups });
    if (field) {
      field.targets?.map(target => {
        var trgt = lookups.find(lkup => lkup.key == target);
        if (!trgt?.loaded)
          targetloaded = false;
      })
      if (targetloaded) {
        field.color = color;
        this.setState({ fields });
      }
    }
    else alert(`Field ${field} does not exist`);
  }

  private addLookup(entityname: string, fieldname: string) {
    this._dataProvider
      .retrieveMultipleRecords(entityname, 'paging')
      .then((result: any) => {
        this._dataProvider
          .getEntityMetadata(entityname, [])
          .then((entity) => {
            this.setLookupValue(entityname, result.entities, entity);
            if (result.nextLink)
              this.setPagingItems(result.nextLink, entityname, entity, fieldname);
            else
              this.setFieldColor(fieldname, 'green', entityname);
          });
      });
  }

  private setPagingItems(nextLink: string, entityname: string, entity: any, fieldname: string) {
    this._dataProvider.getPagingEntities(nextLink).then((result: any) => {
      this.setLookupValue(entityname, result.value, entity);

      var nextLink = result["@odata.nextLink"];
      if (nextLink)
        this.setPagingItems(nextLink, entityname, entity, fieldname);
      else
        this.setFieldColor(fieldname, 'green', entityname)


    });
  }

  private setLookupValue(entityname: string, items: any, entity: any) {
    let { lookups } = this.state;
    var lkup = lookups.find(
      (lookup) => lookup.key == entityname
    );
    var value: ILookupEntity[] = [];
    items.map((item: any) => {
      var lookupitm = { sabs_sabsid: item.sabs_sabsid, _primaryIdAttribute: item[entity.PrimaryIdAttribute] };
      if (entityname == 'systemuser' && item['domainname'])
        addPropertyToOobject(lookupitm, 'domainname', item['domainname']);
      value.push(lookupitm);
    });
    if (lkup) {
      value = [...value, ...lkup.value];
      lkup.value = value;
    }
    else {
      lookups.push({
        key: entityname,
        value,
        entity: entity,
        loaded: false
      });
    }

    this.setState({ lookups });
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

      //this._updatecsvFieldLabels();

      setAttributeValue('sabs_totalnumberofitemstoadd', data.length);

      this.addFields();
    }
    console.log(data, fileInfo);
  };

  private _updatecsvFieldLabels() {
    let { cdsFields, csvFields } = this.state;
    if (cdsFields.length > 0 && csvFields.length > 0) {
      csvFields.map(field => {
        var cdsField = cdsFields.find(cdsField => cdsField.value == field.value);
        if (cdsField)
          field.label = cdsField.label;
        return field;
      });

      this.setState({ cdsFields });
    }

  }

  papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header: any) => header.toLowerCase().replace(/\W/g, "_"),
  };

  private setAttributes() { }

  public _onTargetChanged(e: any, field: IField) {
    let { fields } = this.state;
    var fld = fields.find(fl => fl.name == field.name);
    if (fld)
      fld.targets = [e.key];
    this.setState({ fields });
    console.log(field);
    // if (fld) {
    //   fld.targets = 
    // }
  }

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

        //this._updatecsvFieldLabels();

        this.addFields();
      });
    });
  }

  onRenderCell = (item: any, index: number | any): JSX.Element => {
    return (
      <div data-is-focusable>
        <div className={styles.itemContent}>
          {index + 1} &nbsp; {item}
        </div>
      </div>
    );
  };

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
      batch,
      errors,
      validated,
      faileditems
    } = this.state;
    return (
      <>
        {isValidClient() &&
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
                  {batch.length == 0 && !validated && <PrimaryButton text="Validate" onClick={this._validate} allowDisabledFocus />}
                  &nbsp;&nbsp;
                  {batch.length == 0 && validated && <PrimaryButton text="Import to CDS" onClick={this.importToCDS} allowDisabledFocus />}
                  &nbsp;&nbsp;
                  {batch.length > 0 &&
                    <PrimaryButton text="Clear Table" onClick={this.clearTable} allowDisabledFocus />
                  } &nbsp;&nbsp;
                  {batch.length > 0 && faileditems.length > 0 &&
                    <PrimaryButton text="Export Error" onClick={this._exporterror} allowDisabledFocus />
                  } &nbsp;&nbsp;
                  {/* <PrimaryButton text="Close Active Cases" onClick={this._closeTable} allowDisabledFocus /> */}
                  <PrimaryButton text="Clear Queue" onClick={this._clearQueue} allowDisabledFocus />
                  &nbsp;&nbsp;
                  <PrimaryButton text="Reactivate Cases" onClick={this._reactivateCases} allowDisabledFocus />
                  &nbsp;&nbsp;
                  <PrimaryButton text="Inactivate" onClick={() => this._inactivate} allowDisabledFocus />
                  &nbsp;&nbsp;
                  <PrimaryButton text="Reactivate" onClick={() => this._inactivate(true)} allowDisabledFocus />
                  &nbsp;&nbsp;
                  <PrimaryButton text="Test" onClick={this.test} allowDisabledFocus />
                </td>
              </tr>
            </table>
            <br />
            <table width="100%">
              <tr>
                <th>CDS Field</th>
                <th>CSV Field</th>
                <th>Type</th>
                <th>Schema</th>
                <th>Targets</th>
                <th>Contact/Account</th>
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
            {/* <PrimaryButton text="Add Field" onClick={this.addField} allowDisabledFocus /> */}
            <br />
            {/* <br />
        <br /> */}
            {/* <button onClick={this.getRelatedData}>Get Related Data</button> */}

            <br />
            {
              errors.length > 0 &&
              <div style={{ color: 'red' }}>
                Errors
                <List items={errors} onRenderCell={this.onRenderCell} />
              </div>
            }
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
            App Last update: 17/07/2024
          </div>
        }
      </>
    );
  }

  private _row(field: IField) {
    let { cdsFields, csvFields } = this.state;

    var targets: any = [];
    if (field.targets && field.targets.length > 1) {
      field.targets.map(target => {
        targets.push({ key: target, text: target })
      });
    }
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
        <td style={{ textAlign: "center", width: "20%", color: `${field.color ? field.color : ''}` }}>
          {field.targets ? field.targets.join(",") : ""}
        </td>
        <td style={{ width: "10%" }}>
          <div>
            {targets.length > 1 &&
              <Dropdown
                multiSelect={true}
                defaultSelectedKeys={field.target ? field.targets : []}
                options={targets}
                disabled={false}
                styles={dropdownStyles}
                onChanged={e => this._onTargetChanged(e, field)}
              />
            }
          </div>
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
  errors: string[];
  faileditems: IError[];
  validationinprogress: boolean;
  validated: boolean;
}

export interface IField {
  id?: number;
  name: string;
  label: string;
  csvfield?: string;
  targets?: string[];
  target?: string;
  color?: string;
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

const theme = getTheme();
const styles = mergeStyleSets({
  container: {
    overflow: "auto",
    maxHeight: 400,
    border: "1px solid #CCC",
    margin: 20,
    selectors: {
      ".ms-List-cell:nth-child(odd)": {
        height: 50,
        lineHeight: 50,
        background: theme.palette.neutralLighter,
      },
      ".ms-List-cell:nth-child(even)": {
        height: 25,
        lineHeight: 25,
      },
    },
  },
  itemContent: [
    theme.fonts.medium,
    normalize,
    {
      position: "relative",
      boxSizing: "border-box",
      display: "block",
      borderLeft: "3px solid " + theme.palette.themePrimary,
      paddingLeft: 27,
    },
  ],
});