const { google } = require("googleapis");
require('dotenv').config();
const sa_keys = require(process.env.SA_KEY_FILE);

// Or embed it directly
exports.main = async (event) => {
    try {
        const auth = new google.auth.GoogleAuth({
                keyFile: './monitoring-imigrasi.json', // Replace with the actual path
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Or .spreadsheets for write access
            });

        const sheets = google.sheets({ version: 'v4', auth:auth });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const range = process.env.RANGE;

        const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
          
    
        // const data = [];
        // const [startRow, startCol, endRow, endCol] = parseRange(response.data.range);
        // for (let i = startRow; i <= endRow; i++) {
        //     if (response.data.values[i])
        //         data.push(response.data.values[i].join(','));
        // }

        const csvContent = response.data.values.map(row => {
            row.map(cell => {
                    // Handle commas or newlines within cell data
                    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('\n'))) {
                    return `"${cell.replace(/"/g, '""')}"`; // Escape double quotes
                    }
                    return cell;
                }).join(',')
            }).join('\n');

        // console.log(csvContent);


        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Enable CORS if needed
            },
            body: JSON.stringify({
                success: true,
                data: csvContent
            })
        };

    }catch(err){

        console.error(err);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: err.message
            })
        };
    }
};

// Helper function to parse A1:D range notation
function parseRange(range) {
    const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (!match) throw new Error('Invalid range format');
    const startCol = columnToIndex(match[1]);
    const startRow = parseInt(match[2], 10) - 1;
    const endCol = columnToIndex(match[3]);
    const endRow = parseInt(match[4], 10) - 1;
    return [startRow, startCol, endRow, endCol];
}
// Convert column letter (e.g., 'A') to index (0-based)
function columnToIndex(col) {
    return col.split('').reduce((index, char) => index * 26 + (char.charCodeAt(0) - 64), 0) - 1;
}


if (process.argv[1].indexOf('test.js') !== -1) {
    exports.main({});
}
