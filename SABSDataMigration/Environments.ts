export const clients: client[] =
    [{
        url: "https://org5ca1ebc8.crm.dynamics.com",
        exmpiry: new Date(2022, 10, 11)
    }, {
        url: "https://uatewosa.crm6.dynamics.com",
        exmpiry: new Date(2022, 10, 11)
    }, {
        url: "https://ewosa01.crm6.dynamics.com",
        exmpiry: new Date(2022, 10, 11)
    },{
        url: "https://casemanagement.crm6.dynamics.com",
        exmpiry: new Date(2022, 10, 11)
    },{
        url: "https://org28a26b9f.crm6.dynamics.com",
        exmpiry: new Date(2023, 10, 11)
    },{
        url: "https://uatcpm.crm6.dynamics.com",
        exmpiry: new Date(2023, 10, 11)
    ];

interface client {
    url: string;
    exmpiry: Date;
}
