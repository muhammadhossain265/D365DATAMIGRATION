export const clients: client[] =
    [{
        url: "https://org5ca1ebc8.crm.dynamics.com",
        exmpiry: new Date(2022, 10, 11)
    }, {
        url: "https://uatewosa.crm6.dynamics.com",
        exmpiry: new Date(2025, 10, 11)
    }, {
        url: "https://ewosa01.crm6.dynamics.com",
        exmpiry: new Date(2025, 10, 11)
    }, {
        url: "https://casemanagement.crm6.dynamics.com",
        exmpiry: new Date(2025, 10, 11)
    }, {
        url: "https://org28a26b9f.crm6.dynamics.com",
        exmpiry: new Date(2023, 10, 11)
    }, {
        url: "https://therapy.crm6.dynamics.com",
        exmpiry: new Date(2025, 12, 12)
    }, {
        url: "https://uathorizon.crm6.dynamics.com",
        exmpiry: new Date(2025, 12, 12)
    }, {
        url: "https://productionhorizon.crm6.dynamics.com/",
        exmpiry: new Date(2025, 12, 12)
    }, {
        url: "https://escosadev.crm6.dynamics.com/",
        exmpiry: new Date(2025, 12, 12)
    }, 
    {
        url: "https://org739ecc66.crm6.dynamics.com/",
        exmpiry: new Date(2025, 12, 12)
    }, 
    {
        url: "https://escosauat.crm6.dynamics.com/",
        exmpiry: new Date(2025, 12, 12)
    }, 
    {
        url: "https://escosaprod.crm6.dynamics.com/",
        exmpiry: new Date(2025, 12, 12)
    }
    ];

interface client {
    url: string;
    exmpiry: Date;
}
