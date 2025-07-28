const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async (event) => {
    try {
        const serviceAccountAuth = new JWT({
            email: process.env.CLIENT_EMAIL,
            key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Initialize the Google Spreadsheet client
        const doc = new GoogleSpreadsheet('1ilfh51A78xXq1-tN2yHXY5FC_JdcuFXm9aIaSVJs0Sw', serviceAccountAuth);

        // Load spreadsheet info
        await doc.loadInfo();

        // Get the first sheet (or specify a sheet by name or index)
        const sheet = doc.sheetsByTitle['data']; // Or use doc.sheetsByTitle['Sheet1']
        const range = 'A:J'; // Default range

        // Load specific range
        await sheet.loadCells(range);

        // Get cell values
        const rows = [];
        const [startRow, startCol, endRow, endCol] = parseRange(range);
        for (let i = startRow; i <= endRow; i++) {
            const row = [];
            for (let j = startCol; j <= endCol; j++) {
                const cell = sheet.getCell(i, j);
                row.push(cell.value || '');
            }
            rows.push(row);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Enable CORS if needed
            },
            body: JSON.stringify({
                success: true,
                data: rows
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message
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