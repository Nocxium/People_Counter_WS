const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/api/query', async (req, res) => {
    try {
        let { datetime } = req.body;
        let userDate = new Date(datetime);
        userDate.setHours(0, 0, 0, 0);

        let startDateString = userDate.toISOString().slice(0, 19).replace('T', ' ');
        let endDateString = new Date(datetime).toISOString().slice(0, 19).replace('T', ' ');

        const con = await mysql.createConnection({
            host: 'xxx.xxx.xx.xxx',
            port: 3306,
            user: 'xxx',
            password: 'xxxxx',
            database: 'emqx_data'
        });

        const [rows] = await con.execute(`
            SELECT client_id, SUM(net_ins) AS total_net_ins FROM \`emqx_messeges\`
            WHERE timestamp >= ? AND timestamp <= ?
            AND client_id IN ('entrance', 'floor_-1', 'floor_2', 'floor_3', 'floor_3b')
            GROUP BY client_id`,
            [startDateString, endDateString]
        );

        const clientData = {
            'entrance': 0,
            'floor_-1': 0,
            'floor_2': 0,
            'floor_3': 0,
            'floor_3b': 0
        };

        rows.forEach(row => {
            clientData[row.client_id] += Number(row.total_net_ins);
        });

        const result = [
            { client_id: 'floor_-1', net_ins: clientData['floor_-1'] },
            {
                client_id: 'entrance', 
                net_ins: clientData['entrance'] - (clientData['floor_-1'] || 0) - (clientData['floor_2'] || 0)
            },
            {
                client_id: 'floor_2', 
                net_ins: clientData['floor_2'] - (clientData['floor_3'] || 0) - (clientData['floor_3b'] || 0)
            },
            {
                client_id: 'floor_3', 
                net_ins: clientData['floor_3'] + (clientData['floor_3b'] || 0)
            },
            { client_id: 'total', net_ins: clientData['entrance'] }
        ];

        res.json(result);
        await con.end();
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred');
    }
});

app.listen(3000);
