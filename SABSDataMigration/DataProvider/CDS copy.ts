// function paging(){

//   var query = “?$select=name”;
//   var allaccounts = null;
//   retrieveMultipleAccounts();
//   }
  
//   function retrieveMultipleAccounts() {
//   debugger;
  
//   var url = Xrm.Utility.getGlobalContext().getClientUrl()+ “/api/data/v9.0/accounts”;
//   Xrm.WebApi.retrieveMultipleRecords(“account”, query, 5000).then(
//   function success(result) {
//   var resultRetrieved = result;
//   allaccounts = resultRetrieved.entities.concat(allaccounts);
//   debugger;
//   if (result.nextLink != undefined) {
//   console.log(“Next page link: ” + result.nextLink);
//   query = result.nextLink;
//   //result.nextLink contains url, we need to remove the url and has to pass only query.
//   var splitValue = query.split(url);
//   query = splitValue[1];
//   retrieveMultipleAccounts();
//   }
  
//   },
//   function (error) {
//   console.log(error.message);
//   }
  
//   );
  
//   }