// utils/csvExport.utils.js
import { Parser } from "json2csv";

/**
 * Converts an array of plain JS objects to a CSV string.
 *
 * @param {Object[]} data      - Array of records to convert
 * @param {string[]} fields    - Ordered list of field names / paths to include
 * @returns {string}           - CSV string
 * @throws  {Error}            - If json2csv parsing fails
 */
const convertToCSV = (data, fields) => {
    if (!Array.isArray(data) || data.length === 0) {
        // Return an empty CSV with just the header row
        const emptyParser = new Parser({ fields });
        return emptyParser.parse([]);
    }

    const parser = new Parser({ fields });
    return parser.parse(data);
};

export default convertToCSV;
