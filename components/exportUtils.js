import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data, fileName) => {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 20
    }));

    worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFADD8E6' } 
        };
        cell.font = { bold: true };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    data.forEach(item => {
        const rowData = {};
        headers.forEach(key => {
            let val = item[key];
            
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                val = val.split('T')[0]; 
            } else if (val instanceof Date) {
                val = val.toISOString().split('T')[0];
            }
            
            rowData[key] = (val === null || val === undefined || val === '') ? '-' : val;
        });
        
        const row = worksheet.addRow(rowData);
        
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};