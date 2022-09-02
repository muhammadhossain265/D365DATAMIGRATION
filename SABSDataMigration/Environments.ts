export const clients: client[] =
    [{
        url: "https://org5ca1ebc8.crm.dynamics.com",
        exmpiry: new Date(2022, 8, 30)
    }, {
        url: "https://uatewosa.crm6.dynamics.com",
        exmpiry: new Date(2022, 8, 10)
    }
    ];

interface client {
    url: string;
    exmpiry: Date;
}
