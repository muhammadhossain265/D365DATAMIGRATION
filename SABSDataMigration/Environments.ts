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
    }
    
    ];

interface client {
    url: string;
    exmpiry: Date;
}
