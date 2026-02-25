import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
export function getTestData(filterObj:any,filePath:any){
    const actualRecords: Array<Record<string, string>> = parse(fs.readFileSync(path.join(filePath)),{
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        escape: '\\'
    });
   
    var records:any = [];
    for(const record of actualRecords){
        let goRecord = true;
        filterObj.forEach(function(value: string, key: string) {
            if(record[key]==value && goRecord==true){
                goRecord = true;
            }
            else {
                goRecord = false;                
            }
        })
        if(goRecord==true){
            records.push(record);
        }
    }
    return records;
}
export function getTotalRecords(filePath: any) {
        const actualRecords = parse(fs.readFileSync(path.join(filePath)), {
            columns: true,
            skip_empty_lines: true,
            delimiter: ',',
            escape: '\\',
            info: true
        });
        return actualRecords;
}
