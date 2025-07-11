import ICDSDataProvider from "./DataProvider/ICDSDataProvider";

export function updateBudgetDatesUtil(dataProvider: ICDSDataProvider) {
    var entityName = 'sabs_budget';
    var options = '?$select=sabs_startdate&$filter=sabs_startdate%20eq%20null and sabs_plan/sabs_startdate ne null&$expand=sabs_plan($select=sabs_startdate,sabs_enddate)';
    if (entityName.length > 0) {
        dataProvider.retrieveMultipleRecords(entityName, options).then((response: any) => {

            response.map((budget: any) => {
                console.log(budget);
                if (localStorage.getItem('UPDATEBUDGETS'))
                    updateBudgetDate(dataProvider, budget);
            });

        });

    }
}

export function updateBudgetDate(dataProvider: ICDSDataProvider, budget: any) {
    var entityName = 'sabs_budget';
    if (budget && budget.sabs_plan && budget.sabs_plan.sabs_startdate && budget.sabs_plan.sabs_enddate) {
        dataProvider.updateRecord(entityName, budget.sabs_budgetid, { sabs_startdate: budget.sabs_plan.sabs_startdate, sabs_enddate: budget.sabs_plan.sabs_enddate }).then((response: any) => {

            console.log(budget.sabs_budgetid, 'got updated successfully');

        });

    }
}
