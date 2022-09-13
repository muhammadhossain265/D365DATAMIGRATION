export const clients: client[] =
    [{
        url: "https://org5ca1ebc8.crm.dynamics.com",
        exmpiry: new Date(2022, 9, 10)
    }, {
        url: "https://uatewosa.crm6.dynamics.com",
        exmpiry: new Date(2022, 9, 10)
    }, {
        url: "https://ewosa01.crm6.dynamics.com",
        exmpiry: new Date(2022, 9, 10)
    }
    
    ];

interface client {
    url: string;
    exmpiry: Date;
}
